<template>
    <div class="space-y-6 animate-fade-in-up">

      <!-- Welcome Card + Create Button -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
              <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
                  Hola, <span class="text-emerald-500">{{ authStore.user?.name }}</span>
              </h2>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                  Bienvenido a la App de Gestiones
              </p>
          </div>
          <div class="flex items-center gap-3">
              <a @click="returnToPortal" class="cursor-pointer text-sm font-medium text-emerald-600 hover:underline flex items-center gap-1 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition">
                  <i class="fas fa-arrow-left"></i>
                  Volver al Portal
              </a>
          </div>
      </div>

      <!-- Quick Actions Grid -->
      <div v-if="canCreate" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <!-- Create Card -->
            <div
                @click="showCreateModal = true"
                class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer group hover:shadow-md transition-all hover:border-emerald-300 dark:hover:border-emerald-700"
            >
                <div class="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 class="font-bold text-gray-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Nueva Solicitud</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Crea un nuevo ticket de soporte o gestión para tu agencia.</p>
            </div>
      </div>

      <!-- Modal Crear Solicitud -->
      <CrearSolicitudModal
        :isOpen="showCreateModal"
        @close="showCreateModal = false"
        @created="handleSolicitudCreated"
      />

    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import CrearSolicitudModal from '@/views/solicitudes/components/CrearSolicitudModal.vue';

const authStore = useAuthStore();
const showCreateModal = ref(false);

const canCreate = computed(() => {
    return authStore.hasRole('Super Admin') ||
           authStore.hasRole('Jefes de Agencia') ||
           authStore.hasPermission('crear_gestiones');
});

const handleSolicitudCreated = () => {
    // Podríamos recargar una lista de solicitudes recientes aquí si la tuviéramos
    // O mostrar confirmacion extra
    console.log("Solicitud creada desde dashboard");
};

// === LÓGICA DE RETORNO ===
const returnToPortal = () => {
    // Obtenemos la URL de la madre desde el .env
    const motherAppUrl = import.meta.env.VITE_MOTHER_APP_URL || 'http://localhost:5173';

    // Redirigimos al Dashboard de la Madre
    window.location.href = `${motherAppUrl}/admin/dashboard`;
}

</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
