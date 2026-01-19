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
               <button
                  @click="showCreateModal = true"
                  class="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 font-medium"
               >
                  <i class="fas fa-plus"></i> Nueva Solicitud
               </button>

              <a @click="returnToPortal" class="cursor-pointer text-sm font-medium text-emerald-600 hover:underline flex items-center gap-1 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition">
                  <i class="fas fa-arrow-left"></i>
                  Volver al Portal
              </a>
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
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import CrearSolicitudModal from '@/views/solicitudes/components/CrearSolicitudModal.vue';

const authStore = useAuthStore();
const showCreateModal = ref(false);

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
