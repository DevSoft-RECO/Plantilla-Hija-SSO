// Importamos la instancia configurada para llamadas a la API propia (Hija)
// Importamos axios crudo para llamadas a la API de autenticación (Madre)
import axios from 'axios';

import { preparePKCE } from '@/utils/auth-crypto';

// Variables de entorno
const MOTHER_API_URL = import.meta.env.VITE_MOTHER_API_URL || 'http://localhost:8000';
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

export default {
  /**
   * 1. INICIAR LOGIN PKCE (Navegador)
   * Redirige al usuario al endpoint de autorización OAuth2 en la Madre.
   */
  async login() {
    const challenge = await preparePKCE();

    const authUrl = new URL(`${MOTHER_API_URL}/oauth/authorize`);
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', '*');
    authUrl.searchParams.append('code_challenge', challenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    // Timeout para asegurar que la I/O (guardado en sessionStorage)
    // finalice correctamente en Navegación de Incógnito antes de redirigir.
    setTimeout(() => {
        window.location.href = authUrl.toString();
    }, 150);
  },

  /**
   * 3. OBTENER USUARIO (API Madre)
   * Pedimos los datos del usuario a la Madre.
   */
  async getUser() {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error("No hay token disponible");

    // Usamos axios directo hacia la MADRE, inyectando el token manualmente.
    const response = await axios.get(`${MOTHER_API_URL}/api/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    return response.data;
  },

  logout() {
    this.logoutLocal();
    // Redirigir a la API de la MADRE para que ella mate la sesión y el token globalmente
    window.location.href = `${MOTHER_API_URL}/logout`;
  },

  logoutLocal() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    // Limpiamos cualquier rastro de verificación antigua si existiera
    localStorage.removeItem('pkce_verifier');
  }
};
