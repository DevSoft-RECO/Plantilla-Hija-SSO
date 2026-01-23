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
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <!-- Create Card -->
            <!-- Tech Request Card -->
            <div
                v-if="canCreateTech"
                @click="openTechModal"
                class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer group hover:shadow-md transition-all hover:border-emerald-300 dark:hover:border-emerald-700"
            >
                <div class="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                    </svg>
                </div>
                <h3 class="font-bold text-gray-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Solicitud Tecnológica</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Soporte técnico, equipos, internet, sistemas...</p>
            </div>

            <!-- Admin Request Card -->
            <div
                v-if="canCreateAdmin"
                @click="openAdminModal"
                class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer group hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-700"
            >
                <div class="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                </div>
                <h3 class="font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Solicitud Administrativa</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Recursos humanos, insumos, permisos, otros...</p>
            </div>
      </div>

      <!-- Modal Crear Solicitud -->
      <CrearSolicitudModal
        :isOpen="showCreateModal"
        :customTitle="createTitle"
        :categoriaGeneralId="createCatId"
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
const createTitle = ref(''); // Titulo del modal
const createCatId = ref(null); // ID Categoria General

const canCreateTech = computed(() => {
    return authStore.hasRole('Super Admin') || authStore.hasPermission('crear-solicitudes-tech');
});

const canCreateAdmin = computed(() => {
    return authStore.hasRole('Super Admin') || authStore.hasPermission('crear-solicitudes-admin');
});

const openTechModal = () => {
    createTitle.value = 'Nueva Solicitud Tecnológica';
    createCatId.value = 1; // 1 = Tecnologica
    showCreateModal.value = true;
};

const openAdminModal = () => {
    createTitle.value = 'Nueva Solicitud Administrativa';
    createCatId.value = 2; // 2 = Administrativa
    showCreateModal.value = true;
};

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
