import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import AuthService from '../services/AuthService'

import axios from 'axios'
import { getAvatarUrl } from '../utils/imageUtils'

export const useAuthStore = defineStore('auth', () => {
  // --- MIGRACIÓN Y LIMPIEZA DE CACHÉ (Anti-Old-Data) ---
  const STORAGE_VERSION = 'v3_clean_pkce'; 
  if (localStorage.getItem('yk_storage_version') !== STORAGE_VERSION) {
    const keysToRemove = ['access_token', 'user_data', 'pkce_verifier'];
    keysToRemove.forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    localStorage.setItem('yk_storage_version', STORAGE_VERSION);
  }

  // --- STATE ---
  const user = ref(JSON.parse(sessionStorage.getItem('user_data') || 'null'))
  const token = ref(localStorage.getItem('access_token') || null)
  const processingSSO = ref(false)
  const isReady = ref(false)

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
      sessionStorage.setItem('auth_redirect_to', redirectTo)
    }
    await AuthService.login()
  }

  /**
   * Intercambia el código de autorización por el token Access
   */
  async function handlePKCECallback(code) {
    processingSSO.value = true
    try {
      const verifier = sessionStorage.getItem('pkce_verifier')
      if (!verifier) {
        throw new Error('No se encontró el verifier para la validación PKCE')
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
      localStorage.setItem('access_token', access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      // Limpiamos el verifier de un solo uso
      sessionStorage.removeItem('pkce_verifier')

      // Pedimos datos de usuario (forzamos petición ignorando caché para refrescar rol/permisos ok)
      await fetchUser(true)

      // Si teníamos una redirección pendiente, avisamos al llamador (o manejamos aquí)
      const savedRedirect = sessionStorage.getItem('auth_redirect_to')
      if (savedRedirect) {
        sessionStorage.removeItem('auth_redirect_to')
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
        sessionStorage.setItem('user_data', JSON.stringify(userData))
        // Respaldo en localStorage por si acaso
        localStorage.setItem('user_data', JSON.stringify(userData))
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
    hasRole
  }
})
