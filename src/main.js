import './assets/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

// 1. Importamos el Store
import { useLayoutStore } from '@/stores/layout';

const app = createApp(App);
const pinia = createPinia(); // Creamos la instancia explícitamente

import { startSessionGuards } from './utils/sessionGuards';

app.use(pinia);
app.use(router);

// 3. AHORA podemos usar el Store (porque Pinia ya está activo)
// Esto ejecutará la lógica de hora/sistema inmediatamente antes de montar
const layoutStore = useLayoutStore();
layoutStore.initTheme();

// 4. (Opcional) Detectar cambios del sistema en tiempo real
// Si la PC cambia de día a noche mientras la app está abierta, actualizamos
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    // Solo reaccionamos si el usuario no tiene una preferencia manual guardada
    if (!localStorage.getItem('theme')) {
        layoutStore.initTheme();
    }
});

// Iniciamos los guardianes de fin de jornada y heartbeat
startSessionGuards();

app.mount('#app');