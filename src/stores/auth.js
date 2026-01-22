import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import AuthService from '../services/AuthService'
import MotherAuthService from '../services/MotherAuthService'
import axiosInstance from '../api/axios'
import { getAvatarUrl } from '../utils/imageUtils'

export const useAuthStore = defineStore('auth', () => {
  // --- STATE ---
  const user = ref(null)
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
  async function login() {
    processingSSO.value = true
    await AuthService.login()
  }

  /**
   * Procesa el token que viene de la App Madre
   */
  async function handleDirectToken(incomingToken, userData = null) {
    processingSSO.value = true
    try {
      const data = AuthService.processDirectToken(incomingToken, userData)
      // data.access_token ya está en localStorage gracias al service
      // data.user también, si venía

      token.value = data.access_token

      // Si recibimos usuario, actualizamos state de una vez
      if (data.user) {
        user.value = data.user
      } else {
        // Si no vino usuario completo, lo pedimos
        await fetchUser()
      }

    } catch (error) {
      console.error('Error procesando token SSO:', error)
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

  /**
   * Verifica si el token es válido y carga el usuario desde la App Madre
   */
  async function fetchUser() {
    if (!token.value) {
      isReady.value = true
      return
    }

    try {
      // Cambio Importante: Solicitamos a la API LOCAL (/api/me)
      // Esto dispara el middleware ValidateSSO en el Backend Hija,
      // lo que a su vez sincroniza el usuario (JIT) en la base de datos local.
      // Usamos el servicio de Axios configurado (que inyecta el token Bearer)
      // No usamos MotherAuthService aqui para forzar el paso por el Backend Local.
      const { default: axios } = await import('../api/axios') // Dynamic import to avoid circular deps if any

      const response = await axios.get('/me')
      const userData = response.data

      user.value = userData
      // Guardamos respaldo básico en localStorage por si acaso
      localStorage.setItem('user_data', JSON.stringify(userData))
    } catch (error) {
      console.warn('Sesión expirada o inválida, o error al conectar con Api Local', error)
      // Si falla la validación del token, hacemos logout
      logout()
    } finally {
      isReady.value = true
    }
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
    handleDirectToken,
    logout,
    fetchUser,
    checkAuth,
    hasPermission,
    hasRole
  }
})
