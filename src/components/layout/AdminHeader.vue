<template>
  <header
    class="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-6
           bg-white dark:bg-gray-800
           border-b-2 border-[var(--color-verde-cope)]
           shadow-sm transition-colors duration-300"
  >
    <div class="flex items-center gap-2 md:gap-4 min-w-0 flex-1">

      <!-- Mobile Sidebar Toggle -->
      <button
        @click="layoutStore.toggleSidebar"
        class="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
      >
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      <!-- Desktop Sidebar Toggle -->
      <button
        @click="layoutStore.toggleCollapse"
        class="hidden md:flex p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
      >
        <svg
            class="w-6 h-6 transition-transform duration-300"
            :class="layoutStore.isCollapsed ? 'rotate-180' : ''"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>

      <!-- Branding / Title -->
      <div class="flex flex-col ml-1 md:ml-2 min-w-0 flex-1">
        <!-- Desktop title -->
        <h1 class="hidden sm:block text-lg font-extrabold text-[var(--color-azul-cope)] dark:text-white uppercase tracking-tight leading-tight truncate">
          {{ currentRouteTitle }}
        </h1>
        <!-- Mobile title (max 2 words) -->
        <h1 class="block sm:hidden text-[11px] font-extrabold text-[var(--color-azul-cope)] dark:text-white uppercase tracking-tight leading-tight truncate" :title="currentRouteTitle">
          {{ shortRouteTitle }}
        </h1>
        <span class="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest truncate">
          Sistema Centralizado
        </span>
      </div>
    </div>

    <!-- Right Side Actions -->
    <div class="flex items-center gap-4">

       <!-- Theme Toggle -->
       <button
        @click="layoutStore.toggleTheme"
        class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition focus:outline-none"
        title="Cambiar Tema"
      >
        <svg v-if="layoutStore.isDark" class="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <div class="flex items-center gap-3">
          <div class="hidden md:block text-right">
              <p class="text-sm font-bold text-gray-700 dark:text-gray-200">
                  {{ userName }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ userAgencia }}</p>
          </div>

          <img
              v-if="userPhoto"
              :src="userPhoto"
              class="h-9 w-9 rounded-full object-cover border-2 border-[var(--color-verde-cope)]"
              alt="Avatar"
          >
          <div
              v-else
              class="h-9 w-9 rounded-full bg-[var(--color-azul-cope)] text-white flex items-center justify-center font-bold text-sm border-2 border-[var(--color-verde-cope)]"
          >
              {{ userInitials }}
          </div>

          <!-- Botón Regresar al Portal -->
          <button
              @click="handleReturnToMother"
              class="ml-1 p-2 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition focus:outline-none"
              title="Regresar al portal"
          >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
          </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted } from "vue"
import { useRoute } from "vue-router"
import { useLayoutStore } from "@/stores/layout"
import { useAuthStore } from "@/stores/auth"
import { getAvatarUrl } from "@/utils/imageUtils"
import AuthService from "@/services/AuthService"

const layoutStore = useLayoutStore()
const authStore = useAuthStore()
const route = useRoute()

// Datos del usuario (Protegidos contra null)
const userName = computed(() => authStore.user?.name || "Usuario")
const userAgencia = computed(() => authStore.user?.agencia?.nombre || "Sin Agencia")
const userPhoto = computed(() => getAvatarUrl(authStore.user?.avatar) || null)

// Título dinámico
const currentRouteTitle = computed(() => route.meta?.title || 'Panel')
const shortRouteTitle = computed(() => {
    const title = currentRouteTitle.value;
    if (!title) return '';
    const words = title.split(' ');
    // Toma máximo 2 palabras y agrega puntos si hay más
    return words.length > 2 ? words.slice(0, 2).join(' ') + '...' : title;
});

// Iniciales
const userInitials = computed(() => {
    return (userName.value || "U").substring(0, 2).toUpperCase()
})

const handleReturnToMother = () => {
    AuthService.logoutLocal() // Limpia tokens antes de irse
    // Redirigir a la App Madre (Dashboard principal)
    window.location.href = import.meta.env.VITE_MOTHER_APP_URL || 'http://localhost:5173'
}

// Asegurar que tenemos datos al cargar
onMounted(async () => {
    if (!authStore.user) {
        // Intentamos recuperar la sesión si existe token
        await authStore.checkAuth()
    }
})
</script>
