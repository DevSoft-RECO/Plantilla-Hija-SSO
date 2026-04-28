<template>
  <header
    class="sticky top-4 z-30 flex h-16 mx-4 mt-4 items-center justify-between px-6
           bg-azul-cope/95 dark:bg-gray-900/95 backdrop-blur-md
           border border-white/10 dark:border-gray-800
           shadow-2xl rounded-2xl transition-all duration-300 overflow-hidden"
  >
    <!-- Efecto de brillo verde (Verde Cope) para coherencia con el sidebar -->
    <div class="absolute -top-6 -right-10 w-40 h-40 bg-verde-cope/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-verde-cope/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="flex items-center gap-2 md:gap-4 min-w-0 flex-1">

      <!-- Mobile Sidebar Toggle -->
      <button
        @click="layoutStore.toggleSidebar"
        class="md:hidden p-2 rounded-lg text-white/80 hover:bg-white/10 transition shrink-0"
      >
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      <!-- Desktop Sidebar Toggle -->
      <button
        @click="layoutStore.toggleCollapse"
        class="hidden md:flex p-2 rounded-lg text-white/80 hover:bg-white/10 transition shrink-0"
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
        <h1 class="hidden sm:block text-lg font-black text-white uppercase tracking-tighter leading-tight truncate">
          {{ currentRouteTitle }}
        </h1>
        <!-- Mobile title (max 2 words) -->
        <h1 class="block sm:hidden text-[11px] font-black text-white uppercase tracking-tighter leading-tight truncate" :title="currentRouteTitle">
          {{ shortRouteTitle }}
        </h1>
        <div class="flex items-center gap-1.5 mt-0.5">
            <span class="w-2 h-2 rounded-full bg-verde-cope animate-pulse"></span>
            <span class="text-[9px] sm:text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] truncate">
              Sistema Centralizado
            </span>
        </div>
      </div>
    </div>

    <!-- Right Side Actions -->
    <div class="flex items-center gap-4">

       <!-- Theme Toggle -->
       <button
        @click="layoutStore.toggleTheme"
        class="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none border border-transparent hover:border-white/10"
        title="Cambiar Tema"
      >
        <svg v-if="layoutStore.isDark" class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.591zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.591 1.591zM12 18.75a.75.75 0 01.75.75V21.75a.75.75 0 01-1.5 0V19.5a.75.75 0 01.75-.75zM5.106 17.834a.75.75 0 001.06 1.06l1.591-1.59a.75.75 0 10-1.06-1.061l-1.591 1.591zM2.25 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zM6.166 5.106a.75.75 0 010 1.06l-1.591 1.591a.75.75 0 01-1.06-1.06l1.591-1.591a.75.75 0 011.06 0z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" />
        </svg>
      </button>

      <div class="flex items-center gap-3 pl-3 border-l border-white/10">
          <div class="hidden md:block text-right">
              <p class="text-sm font-bold text-white">
                  {{ userName }}
              </p>
              <p class="text-[10px] font-medium text-white/50 uppercase tracking-tighter">{{ userAgencia }}</p>
          </div>

          <div class="relative group cursor-pointer">
              <img
                  v-if="userPhoto"
                  :src="userPhoto"
                  class="h-9 w-9 rounded-full object-cover border-2 border-verde-cope/50 group-hover:border-verde-cope transition-colors"
                  alt="Avatar"
              >
              <div
                  v-else
                  class="h-9 w-9 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-sm border-2 border-verde-cope/50 group-hover:border-verde-cope transition-colors"
              >
                  {{ userInitials }}
              </div>
          </div>

          <!-- Botón Regresar al Portal -->
          <button
              @click="handleReturnToMother"
              class="ml-1 p-2 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-all duration-200 focus:outline-none border border-transparent hover:border-red-500/20"
              title="Regresar al portal"
          >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
