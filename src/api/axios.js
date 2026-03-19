import axios from 'axios';

// Cliente para la App Hija (Local / Espejo)
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`, // Aseguramos que apunte a /api
  // withCredentials: true, // COMENTADO: Esto puede causar 401 si el backend no espera cookies
  headers: {
    'Accept': 'application/json'
  }
});

// --- INTERCEPTOR DE REQUEST (Salida) ---
// Antes de que salga la petición, le pegamos el token si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');

    console.log(`[Axios Local] Preparando petición a: ${config.url}`);

    if (token) {
      console.log("[Axios Local] Token encontrado en localStorage. Agregando header Authorization.");
      // Aseguramos que no haya doble Bearer por si acaso
      const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = authHeader;
    } else {
      console.warn("[Axios Local] ADVERTENCIA: No se encontró token en localStorage. La petición irá sin autenticación.");
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
      console.error('Sesión rechazada por Ecosistema.');
      
      // Destruir credenciales locales
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      sessionStorage.clear();
      
      // Mandarlo a la pantalla de Auth para renovarse (Renovación PKCE)
      // Como requiremos código PKCE asíncrono, usamos el AuthService.
      import('@/services/AuthService').then(module => {
           module.default.login();
      });
    }
    return Promise.reject(error);
  }
);

export default api;
