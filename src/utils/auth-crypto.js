/**
 * Utilidades criptográficas para el flujo PKCE.
 * Implementación compatible con Vanilla JavaScript (Web Crypto API).
 */

// Genera una cadena aleatoria
export function generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const randomValues = window.crypto.getRandomValues(new Uint8Array(length));
    let result = '';
    for (let i = 0; i < randomValues.length; i++) {
        result += charset[randomValues[i] % charset.length];
    }
    return result;
}

// Genera un hash SHA-256
export async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
}

// Convierte un ArrayBuffer a String en formato base64url
export function base64urlencode(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

import { AUTH_KEYS } from './auth-keys';

/**
 * Prepara el flujo PKCE.
 * Genera el verifier, lo guarda en sessionStorage y retorna el challenge.
 */
export async function preparePKCE() {
    const verifier = generateRandomString(128);
    const challengeBuffer = await sha256(verifier);
    const challenge = base64urlencode(challengeBuffer);

    // BLINDAJE V5 (Dual-Storage): Guardado doble para supervivencia en saltos de dominio
    localStorage.setItem(AUTH_KEYS.PKCE_VERIFIER, verifier);
    sessionStorage.setItem(AUTH_KEYS.PKCE_VERIFIER, verifier);

    return challenge;
}
