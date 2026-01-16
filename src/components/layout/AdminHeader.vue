<template>
  <header
    class="sticky top-0 z-30 flex h-16 w-full items-center justify-between px-6
           bg-white dark:bg-gray-800
           border-b-2 border-[var(--color-verde-cope)]
           shadow-sm transition-colors duration-300"
  >
    <div class="flex items-center gap-4">

      <!-- Mobile Sidebar Toggle -->
      <button
        @click="layoutStore.toggleSidebar"
        class="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      <!-- Desktop Sidebar Toggle -->
      <button
        @click="layoutStore.toggleCollapse"
        class="hidden md:flex p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
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
      <div class="flex flex-col ml-2">
        <h1 class="text-lg font-extrabold text-[var(--color-azul-cope)] dark:text-white uppercase tracking-tight leading-tight">
          {{ currentRouteTitle }}
        </h1>
        <span class="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest">
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

      <div class="relative">
        <button
          @click="isDropdownOpen = !isDropdownOpen"
          class="flex items-center gap-3 focus:outline-none group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition"
        >
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

            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
        </button>

        <!-- Dropdown Menu -->
        <div v-if="isDropdownOpen" @click="isDropdownOpen = false" class="fixed inset-0 z-40"></div>

        <transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
        >
            <div
                v-if="isDropdownOpen"
                class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 py-1"
            >
                <div class="block md:hidden px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p class="text-sm font-bold text-gray-800 dark:text-white">{{ userName }}</p>
                </div>

                <button
                    @click="handleLogout"
                    class="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Cerrar Sesión
                </button>
            </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useLayoutStore } from "@/stores/layout"
import { useAuthStore } from "@/stores/auth"
import { getAvatarUrl } from "@/utils/imageUtils"

const layoutStore = useLayoutStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const isDropdownOpen = ref(false)

// Datos del usuario (Protegidos contra null)
const userName = computed(() => authStore.user?.name || "Usuario")
const userAgencia = computed(() => authStore.user?.agencia?.nombre || "Sin Agencia")
const userPhoto = computed(() => getAvatarUrl(authStore.user?.avatar) || null)

// Título dinámico
const currentRouteTitle = computed(() => route.meta?.title || 'Panel')

// Iniciales
const userInitials = computed(() => {
    return (userName.value || "U").substring(0, 2).toUpperCase()
})

const handleLogout = async () => {
    isDropdownOpen.value = false
    await authStore.logout()
    router.replace({ name: 'login' })
}

// Asegurar que tenemos datos al cargar
onMounted(async () => {
    if (!authStore.user) {
        // Intentamos recuperar la sesión si existe token
        await authStore.checkAuth()
    }
})
</script>
