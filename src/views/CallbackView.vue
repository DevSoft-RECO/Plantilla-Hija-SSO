<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const status = ref('Validando acceso institucional')
const subStatus = ref(
  'Estamos verificando tu identidad con los sistemas de la Cooperativa YAMAN KUTX.'
)

// Variable bloqueadora para evitar re-ejecuciones paralelas (doble montaje)
let isProcessingCallback = false;

onMounted(async () => {
  if (isProcessingCallback) {
      console.warn("Callback ya en proceso, ignorando peticiones repetidas.");
      return;
  }
  isProcessingCallback = true;

  // ADAPTACIÓN: Capturamos el code de autorización para PKCE
  const code = route.query.code

  if (!code) {
    status.value = 'Autenticación no válida'
    subStatus.value =
      'No se recibió el código de autorización necesario para validar la sesión.'
    return
  }

  // Limpiar URL para seguridad y estética
  window.history.replaceState({}, document.title, window.location.pathname)

  try {
    status.value = 'Intercambiando credenciales...'
    subStatus.value = 'Validando acceso con YAMAN KUTX.'

    // 2. Procesar el intercambio de código en el store
    await authStore.handlePKCECallback(code)

    status.value = 'Acceso autorizado'
    subStatus.value =
      'Bienvenido a los sistemas internos de la Cooperativa YAMAN KUTX.'

    setTimeout(() => {
      router.push({ name: 'dashboard' })
    }, 900)

  } catch (e) {
    console.error(e)
    status.value = 'Error de autenticación'
    subStatus.value =
      'No fue posible validar tu sesión. Por favor, intenta nuevamente.'
  }
})
</script>
<template>
  <div
    class="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gray-50 dark:bg-[#050B14]"
  >

    <!-- Glassmorphism Card -->
    <div
      class="relative z-10 w-full max-w-md rounded-3xl bg-white/70 dark:bg-gray-900/60
             backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/40 dark:border-gray-700/50
             p-10 text-center space-y-8 transition-all duration-500 hover:shadow-[0_8px_40px_rgba(31,175,139,0.15)]"
    >
      <!-- Marca con efecto Glow -->
      <div class="space-y-3 relative">
        <div class="absolute inset-0 bg-[#1FAF8B]/10 blur-xl rounded-full scale-110"></div>
        <div class="relative flex justify-center transform transition-transform duration-[2000ms] hover:scale-105">
          <img src="@/assets/logoyk.svg" alt="Logo Yaman Kutx" class="h-16 w-auto drop-shadow-md" />
        </div>

        <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0B3C5D] to-[#1FAF8B] dark:from-white dark:to-[#1FAF8B]">
          Cooperativa YAMAN KUTX
        </h1>
        <p class="text-xs tracking-widest uppercase text-gray-500 dark:text-gray-400 font-semibold">
          Plataforma Corporativa
        </p>
      </div>

      <!-- Loader Premium (Progressive Bar) -->
      <div class="flex justify-center py-6">
        <div class="loader"></div>
      </div>

      <!-- Estado Interactivo -->
      <div class="space-y-3">
        <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center justify-center gap-2">
          <span>{{ status }}</span>
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
          {{ subStatus }}
        </p>
      </div>

      <!-- Mensaje institucional mejorado -->
      <div
        class="text-xs text-gray-500 dark:text-gray-400
               border-t border-gray-200/50 dark:border-gray-700/50 pt-6"
      >
        <div class="flex items-center justify-center gap-2 mb-2">
          <svg class="w-4 h-4 text-[#1FAF8B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
          <span class="font-semibold uppercase tracking-wider text-[10px]">Conexión encriptada PKCE</span>
        </div>
        Asegurando tu identidad con
        <span class="font-bold text-[#0B3C5D] dark:text-[#1FAF8B]">
          estándares de grado bancario
        </span>.
      </div>
    </div>
  </div>
</template>

<style scoped>
.loader {
  width: 60px;
  height: 50px;
  --m: no-repeat linear-gradient(90deg, #000 70%, #0000 0);
  -webkit-mask:
    var(--m) calc(0 * 100% / 4) 100% / calc(100% / 5) calc(1 * 100% / 5),
    var(--m) calc(1 * 100% / 4) 100% / calc(100% / 5) calc(2 * 100% / 5),
    var(--m) calc(2 * 100% / 4) 100% / calc(100% / 5) calc(3 * 100% / 5),
    var(--m) calc(3 * 100% / 4) 100% / calc(100% / 5) calc(4 * 100% / 5),
    var(--m) calc(4 * 100% / 4) 100% / calc(100% / 5) calc(5 * 100% / 5);
  mask:
    var(--m) calc(0 * 100% / 4) 100% / calc(100% / 5) calc(1 * 100% / 5),
    var(--m) calc(1 * 100% / 4) 100% / calc(100% / 5) calc(2 * 100% / 5),
    var(--m) calc(2 * 100% / 4) 100% / calc(100% / 5) calc(3 * 100% / 5),
    var(--m) calc(3 * 100% / 4) 100% / calc(100% / 5) calc(4 * 100% / 5),
    var(--m) calc(4 * 100% / 4) 100% / calc(100% / 5) calc(5 * 100% / 5);
  background: linear-gradient(#1FAF8B 0 0) left/0% 100% no-repeat #ddd;
  animation: l14 2s infinite steps(6);
}

@keyframes l14 {
  100% {
    background-size: 120% 100%;
  }
}

/* Dark mode adjustment for the loader base */
:deep(.dark) .loader,
.dark .loader {
  background: linear-gradient(#1FAF8B 0 0) left/0% 100% no-repeat rgba(156, 163, 175, 0.3);
}
</style>
