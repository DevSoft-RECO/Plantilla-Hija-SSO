import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import AuthService from '../services/AuthService'
import { AUTH_KEYS } from '@/utils/auth-keys'

import axios from 'axios'
import { getAvatarUrl } from '../utils/imageUtils'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

export const useAuthStore = defineStore('auth', () => {
  // --- MIGRACIÓN Y LIMPIEZA DE CACHÉ (Anti-Old-Data) ---
  const STORAGE_VERSION = 'v4_prefixed_keys';

  // Si la versión guardada es distinta, limpiamos TODO lo relacionado a esta app
  if (localStorage.getItem(AUTH_KEYS.STORAGE_VERSION) !== STORAGE_VERSION) {
    AuthService.logoutLocal();
    localStorage.setItem(AUTH_KEYS.STORAGE_VERSION, STORAGE_VERSION);
  }

  // --- STATE ---
  const user = ref(JSON.parse(sessionStorage.getItem(AUTH_KEYS.USER_DATA) || 'null'))
  const token = ref(sessionStorage.getItem(AUTH_KEYS.ACCESS_TOKEN) || null)
  const processingSSO = ref(false)
  const isReady = ref(false)

  // --- VARIABLES REACTIVAS DE SOCKETS Y CONTROL DE INACTIVIDAD ---
  const echoInstance = ref(null)
  const showInactivityModal = ref(false)
  const inactivitySessionId = ref(null)
  const inactivityCountdown = ref(300)
  const isHeartbeatLoading = ref(false)
  let countdownTimerId = null

  // --- GETTERS ---
  const userAvatar = computed(() => {
    return getAvatarUrl(user.value?.avatar)
  })

  // --- ACTIONS ---

  /**
   * Inicia el flujo de redirección a Microsoft/Laravel
   */
  /**
   * Inicia el flujo de redirección a Microsoft/Laravel
   * @param {String} redirectTo URL a la que volver tras el login (opcional)
   */
  async function login(redirectTo = null) {
    processingSSO.value = true
    if (redirectTo) {
      sessionStorage.setItem(AUTH_KEYS.REDIRECT_TO, redirectTo)
    }
    await AuthService.login()
  }

  /**
   * Intercambia el código de autorización por el token Access
   */
  async function handlePKCECallback(code) {
    processingSSO.value = true
    try {
      // --- BLINDAJE V5: TOLERANCIA TOTAL A NOMBRES (Anti-Cache) ---
      // Buscamos el verifier en 4 variantes posibles para máxima compatibilidad
      const localPrefixed = localStorage.getItem(AUTH_KEYS.PKCE_VERIFIER);
      const sessionPrefixed = sessionStorage.getItem(AUTH_KEYS.PKCE_VERIFIER);
      const sessionLegacy = sessionStorage.getItem('pkce_verifier'); // Variante sin prefijo
      const localLegacy = localStorage.getItem('pkce_verifier');

      const verifier = localPrefixed || sessionPrefixed || sessionLegacy || localLegacy;

      if (!verifier) {
        throw new Error('No se encontró el verifier para la validación PKCE en ninguna variante (Local/Session/Legacy)')
      }

      const client_id = import.meta.env.VITE_CLIENT_ID
      const redirect_uri = import.meta.env.VITE_REDIRECT_URI
      const mother_api_url = import.meta.env.VITE_MOTHER_API_URL || 'http://localhost:8000'

      // Intercambio de code por token
      const response = await axios.post(`${mother_api_url}/oauth/token`, {
        grant_type: 'authorization_code',
        client_id: client_id,
        redirect_uri: redirect_uri,
        code_verifier: verifier,
        code: code
      })

      const access_token = response.data.access_token

      // Guardamos en memoria rápida local
      token.value = access_token
      sessionStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      // BLINDAJE V5: Limpieza nuclear de verifiers (todas las variantes)
      localStorage.removeItem(AUTH_KEYS.PKCE_VERIFIER)
      sessionStorage.removeItem(AUTH_KEYS.PKCE_VERIFIER)
      sessionStorage.removeItem('pkce_verifier')
      localStorage.removeItem('pkce_verifier')

      sessionStorage.removeItem(AUTH_KEYS.SSO_LOCK) // Limpiar el flag de bloqueo
      processingSSO.value = false

      // Pedimos datos de usuario (forzamos petición ignorando caché para refrescar rol/permisos ok)
      await fetchUser(true)
      
      // CRÍTICO: Inicializar WebSockets de inmediato tras obtener el token
      // (ya que App.vue omite este paso durante la ruta /callback)
      initSessionSocket()

      // Si teníamos una redirección pendiente, avisamos al llamador (o manejamos aquí)
      const savedRedirect = sessionStorage.getItem(AUTH_KEYS.REDIRECT_TO)
      if (savedRedirect) {
        sessionStorage.removeItem(AUTH_KEYS.REDIRECT_TO)
        // El CallbackView se encargará de la redirección final si este valor existe
      }

    } catch (error) {
      console.error('Error procesando callback PKCE:', error)
      throw error
    } finally {
      processingSSO.value = false
    }
  }

  /**
   * Cierra sesión local y redirige al backend
   */
  function logout() {
    disconnectSessionSocket()
    user.value = null
    token.value = null
    isReady.value = false
    AuthService.logout()
  }

  let fetchUserPromise = null;

  /**
   * Verifica si el token es válido y carga el usuario desde la App Madre
   */
  async function fetchUser(force = false) {
    if (!token.value) {
      isReady.value = true
      return
    }

    // Si ya tenemos el usuario cargado, no volvemos a pedirlo a menos que se fuerce
    if (!force && user.value) {
      isReady.value = true
      return
    }

    // Si ya hay una petición en curso, retornamos la misma promesa para no duplicar
    if (fetchUserPromise) {
      return fetchUserPromise
    }

    fetchUserPromise = (async () => {
      try {
        // Cambio Importante: Solicitamos a la API LOCAL (/api/me)
        // Esto dispara el middleware ValidateSSO en el Backend Hija,
        // lo que a su vez sincroniza el usuario (JIT) en la base de datos local.
        // Usamos el servicio de Axios configurado (que inyecta el token Bearer)
        // No usamos MotherAuthService aqui para forzar el paso por el Backend Local.
        const { default: axiosInstance } = await import('../api/axios') // Dynamic import to avoid circular deps if any

        const response = await axiosInstance.get('/me')
        const userData = response.data

        user.value = userData
        // Caché de rendimiento en sessionStorage
        sessionStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(userData))
        // Respaldo en localStorage por si acaso
        localStorage.setItem(AUTH_KEYS.USER_DATA, JSON.stringify(userData))
      } catch (error) {
        console.warn('Sesión expirada o inválida en Api Local', error)
        // Ya no hacemos logout() aquí automáticamente para permitir que el Router
        // intente una recuperación silenciosa vía PKCE si es posible.
        // Solo limpiamos el usuario actual para disparar el re-fetch si es necesario.
        user.value = null
        isReady.value = true // Marcamos como listo pero sin usuario para que el router actúe
        throw error
      } finally {
        fetchUserPromise = null // Limpiamos la promesa en curso al terminar
      }
    })()

    return fetchUserPromise
  }

  /**
   * Helper para verificar permisos en la App Hija
   */
  function hasPermission(permission) {
    if (!user.value) return false

    // Super Admin siempre puede todo
    if (user.value.roles && user.value.roles.includes('Super Admin')) return true

    // Verificar lista de permisos (si existe)
    // Backend puede enviar 'permissions' o 'permisos'
    const userPerms = user.value.permissions || user.value.permisos || []
    if (Array.isArray(userPerms)) {
      return userPerms.includes(permission)
    }

    return false
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  function hasRole(role) {
    if (!user.value) return false

    // Check if role is an array (multiple allowed roles)
    if (Array.isArray(role)) {
      return role.some(r => user.value.roles && user.value.roles.includes(r))
    }

    return user.value.roles && user.value.roles.includes(role)
  }

  // Verificar autenticación al arrancar (si hay token)
  async function checkAuth() {
    await fetchUser()
  }

  // --- MÉTODOS DE SOCKETS Y CIERRE ---
  function initSessionSocket() {
    if (!token.value || !user.value) return
    if (echoInstance.value) return // Evitar conexiones duplicadas

    window.Pusher = Pusher

    echoInstance.value = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
      wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
      wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${import.meta.env.VITE_MOTHER_API_URL}/api/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token.value}`,
          Accept: 'application/json'
        }
      }
    })

    // Escuchar canal privado del usuario centralizado
    echoInstance.value.private(`user.${user.value.id}`)
      .listen('.InactivityExpiringSoon', (e) => {
        inactivitySessionId.value = e.sessionId
        inactivityCountdown.value = Math.round(e.remainingSeconds) || 300
        showInactivityModal.value = true
        startLocalCountdown()
      })
      .listen('.SessionRenewed', (e) => {
        // Si otra pestaña/app renovó esta misma sesión, cerramos el modal aquí de forma síncrona
        if (inactivitySessionId.value === e.sessionId) {
          showInactivityModal.value = false
          stopLocalCountdown()
        }
      })
      .listen('.SessionForceClosed', () => {
        stopLocalCountdown()
        disconnectSessionSocket()
        AuthService.logoutLocal()
        const motherAppUrl = import.meta.env.VITE_MOTHER_APP_URL || 'http://localhost:5173'
        window.location.href = `${motherAppUrl}/login?session_expired=true`
      })
      .error((error) => {
        console.warn('Error de autorización en canal de sockets:', error)
        // Si la suscripción falla por token expirado/revocado (401 o 403) tras suspender la PC
        if (error && (error.status === 401 || error.status === 403)) {
          stopLocalCountdown()
          disconnectSessionSocket()
          AuthService.logoutLocal()
          const motherAppUrl = import.meta.env.VITE_MOTHER_APP_URL || 'http://localhost:5173'
          window.location.href = `${motherAppUrl}/login?session_expired=true`
        }
      })
  }

  function disconnectSessionSocket() {
    if (echoInstance.value) {
      echoInstance.value.disconnect()
      echoInstance.value = null
    }
    showInactivityModal.value = false
    inactivitySessionId.value = null
    stopLocalCountdown()
  }

  function startLocalCountdown() {
    if (countdownTimerId) clearInterval(countdownTimerId)
    countdownTimerId = setInterval(() => {
      if (inactivityCountdown.value > 0) {
        inactivityCountdown.value--
      } else {
        clearInterval(countdownTimerId)
        AuthService.logoutLocal()
        const motherAppUrl = import.meta.env.VITE_MOTHER_APP_URL || 'http://localhost:5173'
        window.location.href = `${motherAppUrl}/login?session_expired=true`
      }
    }, 1000)
  }

  function stopLocalCountdown() {
    if (countdownTimerId) {
      clearInterval(countdownTimerId)
      countdownTimerId = null
    }
  }

  async function sendHeartbeatPing() {
    if (!inactivitySessionId.value || isHeartbeatLoading.value) return
    isHeartbeatLoading.value = true
    try {
      const motherApiUrl = import.meta.env.VITE_MOTHER_API_URL || 'http://localhost:8000'
      await axios.post(`${motherApiUrl}/api/sso/heartbeat`, {
        session_id: inactivitySessionId.value
      }, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      showInactivityModal.value = false
      stopLocalCountdown()
    } catch (err) {
      console.error('Error al enviar ping de heartbeat a la Madre:', err)
      // Si la sesión ya murió en la central, forzamos el logout nuclear
      logout()
    } finally {
      isHeartbeatLoading.value = false
    }
  }

  return {
    user,
    token,
    processingSSO,
    isReady,
    userAvatar, // Exported getter
    login,
    handlePKCECallback,
    logout,
    fetchUser,
    checkAuth,
    hasPermission,
    hasRole,
    // Sockets e Inactividad
    echoInstance,
    showInactivityModal,
    inactivitySessionId,
    inactivityCountdown,
    isHeartbeatLoading,
    initSessionSocket,
    disconnectSessionSocket,
    sendHeartbeatPing
  }
})
