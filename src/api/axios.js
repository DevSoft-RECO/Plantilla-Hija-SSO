import axios from 'axios';

// Cliente para la App Hija (Local / Espejo)
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`, // Aseguramos que apunte a /api
  // withCredentials: true, // COMENTADO: Esto puede causar 401 si el backend no espera cookies
  headers: {
    'Accept': 'application/json'
  }
});

import { AUTH_KEYS } from '@/utils/auth-keys';

// --- INTERCEPTOR DE REQUEST (Salida) ---
// Antes de que salga la petición, le pegamos el token si existe
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);

    console.log(`[Axios Local] Preparando petición a: ${config.url}`);

    if (token) {
      console.log("[Axios Local] Token encontrado en sessionStorage. Agregando header Authorization.");
      // Aseguramos que no haya doble Bearer por si acaso
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = authHeader;
    } else {
      console.warn("[Axios Local] ADVERTENCIA: No se encontró token en sessionStorage. La petición irá sin autenticación.");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --- INTERCEPTOR DE RESPONSE (Llegada) ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
        // Evitar que múltiples peticiones 401 disparen múltiples redirecciones al mismo tiempo
        if (!sessionStorage.getItem(AUTH_KEYS.SSO_LOCK)) {
            sessionStorage.setItem(AUTH_KEYS.SSO_LOCK, 'true');
            console.warn('Sesión expirada (401). Iniciando redirección a SSO Madre...');
            
            // Limpieza básica de sesión antes de irse (usando claves prefijadas)
            sessionStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
            sessionStorage.removeItem(AUTH_KEYS.USER_DATA);
            
            import('@/services/AuthService').then(module => {
                 module.default.login();
            });
        }
    }
    return Promise.reject(error);
  }
);

export default api;
