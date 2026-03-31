/**
 * 🔐 GESTIÓN CENTRALIZADA DE CLAVES DE ALMACENAMIENTO (LocalStorage / SessionStorage)
 *
 * PARA EVITAR COLISIONES EN LOCALHOST/MISMO DOMINIO:
 * Cada App Hija debe tener un prefijo ÚNICO.
 */

const PREFIX = import.meta.env.VITE_STORAGE_PREFIX || 'default_app_'; 

export const AUTH_KEYS = {
  ACCESS_TOKEN: `${PREFIX}access_token`,
  USER_DATA: `${PREFIX}user_data`,
  PKCE_VERIFIER: `${PREFIX}pkce_verifier`,
  AUTH_REDIRECT: `${PREFIX}auth_redirect_to`,
  SSO_LOCK: `${PREFIX}is_redirecting_to_sso`,
  STORAGE_VERSION: `${PREFIX}storage_version`
};
