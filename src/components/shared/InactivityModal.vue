<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const formattedTime = computed(() => {
  const minutes = Math.floor(authStore.inactivityCountdown / 60)
  const seconds = authStore.inactivityCountdown % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})
</script>

<template>
  <Transition name="fade">
    <div v-if="authStore.showInactivityModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div class="w-full max-w-md p-8 overflow-hidden transition-all transform shadow-2xl rounded-2xl bg-slate-900 border border-slate-800 text-center">
        <div class="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/10 text-amber-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8 animate-pulse">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        
        <h3 class="text-xl font-bold text-slate-100 mb-2">¡Tu sesión está por caducar!</h3>
        <p class="text-slate-400 text-sm mb-6 leading-relaxed">
          Hemos detectado inactividad. Para proteger tus datos, tu sesión se cerrará de forma segura en:
        </p>

        <div class="text-5xl font-mono font-extrabold text-amber-400 mb-8 tracking-wider drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]">
          {{ formattedTime }}
        </div>

        <div class="flex flex-col gap-3">
          <button 
            @click="authStore.sendHeartbeatPing" 
            :disabled="authStore.isHeartbeatLoading"
            class="w-full py-3 px-4 font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-amber-400/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <svg v-if="authStore.isHeartbeatLoading" class="animate-spin h-5 w-5 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ authStore.isHeartbeatLoading ? 'Renovando...' : 'Continuar trabajando' }}</span>
          </button>
          <button 
            @click="authStore.logout" 
            :disabled="authStore.isHeartbeatLoading"
            class="w-full py-3 px-4 font-medium text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition duration-200 cursor-pointer"
          >
            Cerrar sesión ahora
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
