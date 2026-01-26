<template>
    <div class="space-y-6 animate-fade-in-up">

      <!-- Header & Filters -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <h2 class="text-2xl font-bold text-gray-800 dark:text-white">
                  Dashboard de Gestiones
              </h2>
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                  Resumen de operaciones y métricas clave
              </p>
          </div>

          <!-- Filters -->
          <div class="flex flex-col sm:flex-row gap-3">
              <!-- Category Filter -->
              <select
                  v-model="filters.category_id"
                  @change="fetchMetrics"
                  class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5"
              >
                  <option :value="null">Todas las Categorías</option>
                  <option :value="1">Tecnología</option>
                  <option :value="2">Administración</option>
              </select>

              <!-- Agency Filter (Admin Only) -->
              <div v-if="canViewGeneral && !isAgencyUser" class="relative">
                 <select
                      v-model="filters.agencia_id"
                      @change="fetchMetrics"
                      class="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 w-full sm:w-48"
                  >
                      <option :value="null">Todas las Agencias</option>
                      <option v-for="agency in agencies" :key="agency.id" :value="agency.id">
                          {{ agency.nombre }}
                      </option>
                  </select>
              </div>
              <div v-else class="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300">
                  <i class="fas fa-building mr-2"></i> {{ authStore.user?.agencia_id ? 'Mi Agencia' : 'Sin Agencia' }}
              </div>
          </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>

      <div v-else class="space-y-6">
          <!-- KPI Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Total -->
              <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Solicitudes</p>
                      <h3 class="text-3xl font-bold text-gray-800 dark:text-white mt-1">{{ metrics.kpi?.total || 0 }}</h3>
                  </div>
                  <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                      <i class="fas fa-clipboard-list text-xl"></i>
                  </div>
              </div>

              <!-- Open -->
              <div
                @click="canDrillDown ? navigateTo('abiertas') : null"
                :class="{'cursor-pointer hover:border-emerald-400 transition-colors': canDrillDown}"
                class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between"
              >
                  <div>
                      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Abiertas</p>
                      <h3 class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{{ metrics.kpi?.open || 0 }}</h3>
                  </div>
                  <div class="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <i class="fas fa-clock text-xl"></i>
                  </div>
              </div>

               <!-- Pending Validation -->
               <div
                 @click="canDrillDown ? navigateTo('validacion') : null"
                 :class="{'cursor-pointer hover:border-amber-400 transition-colors': canDrillDown}"
                 class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between"
               >
                  <div>
                      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Por Validar</p>
                      <h3 class="text-3xl font-bold text-amber-500 dark:text-amber-400 mt-1">{{ metrics.kpi?.validation || 0 }}</h3>
                  </div>
                  <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-500 dark:text-amber-400">
                      <i class="fas fa-check-circle text-xl"></i>
                  </div>
              </div>

               <!-- Closed -->
               <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Cerradas</p>
                      <h3 class="text-3xl font-bold text-gray-400 dark:text-gray-500 mt-1">{{ metrics.kpi?.closed || 0 }}</h3>
                  </div>
                  <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-gray-400 dark:text-gray-500">
                      <i class="fas fa-archive text-xl"></i>
                  </div>
              </div>
          </div>

          <!-- Charts Section -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

               <!-- Left Column: Subcategories & Status -->
              <div class="space-y-6 flex flex-col">
                  <!-- Subcategories Bar Chart -->
                  <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex-1">
                      <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Top Subcategorías</h3>
                      <div class="space-y-4">
                          <div v-for="(item, index) in metrics.charts?.subcategories" :key="index" class="space-y-1">
                              <div class="flex justify-between text-sm">
                                  <span class="text-gray-600 dark:text-gray-300">{{ item.nombre }}</span>
                                  <span class="font-medium text-gray-800 dark:text-white">{{ item.count }}</span>
                              </div>
                              <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                  <div
                                    class="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                                    :style="{ width: `${calculateGenericPercentage(item.count)}%` }"
                                  ></div>
                              </div>
                          </div>
                          <div v-if="!metrics.charts?.subcategories?.length" class="text-center text-gray-400 py-4">
                              Sin datos para mostrar
                          </div>
                      </div>
                  </div>

                  <!-- Status Distribution -->
                  <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex-1">
                      <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Estado de Solicitudes</h3>
                      <div class="space-y-4">
                           <div v-for="(item, index) in metrics.charts?.status" :key="index" class="space-y-1">
                              <div class="flex justify-between text-sm">
                                  <span class="text-gray-600 dark:text-gray-300 capitalize">{{ formatStatus(item.estado) }}</span>
                                  <span class="font-medium text-gray-800 dark:text-white">{{ item.count }}</span>
                              </div>
                              <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                  <div
                                    class="h-2.5 rounded-full transition-all duration-500"
                                    :class="getStatusColorClass(item.estado)"
                                    :style="{ width: `${calculateGenericPercentage(item.count)}%` }"
                                  ></div>
                              </div>
                          </div>
                          <div v-if="!metrics.charts?.status?.length" class="text-center text-gray-400 py-4">
                              Sin datos para mostrar
                          </div>
                      </div>
                  </div>
              </div>

               <!-- Right Column: Agency Volume (Vertical Bar Chart) -->
              <div v-if="canViewGeneral && !filters.agencia_id" class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full">
                  <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-6">Volumen por Agencia (Top 10)</h3>

                  <div v-if="metrics.charts?.agencies?.length" class="flex-1 flex items-stretch justify-between gap-2 min-h-[300px] pb-2">
                       <div
                        v-for="(item, index) in metrics.charts?.agencies"
                        :key="index"
                        class="group relative flex-1 flex flex-col justify-end items-center h-full"
                      >
                          <!-- Tooltip -->
                          <div class="absolute bottom-full mb-2 hidden group-hover:block z-20">
                              <div class="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                                  {{ item.nombre }}: {{ item.count }}
                              </div>
                          </div>

                          <!-- Bar -->
                          <div
                              class="w-full max-w-[40px] bg-indigo-500 hover:bg-indigo-400 rounded-t-lg transition-all duration-500 relative"
                              :style="{ height: `${calculateGenericPercentage(item.count, metrics.charts?.agencies[0]?.count)}%` }"
                          >
                            <span class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                {{ item.count }}
                            </span>
                          </div>

                          <!-- Label -->
                          <div class="mt-2 text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center px-0.5" :title="item.nombre">
                              {{ item.nombre.length > 8 ? item.nombre.substring(0,8)+'..' : item.nombre }}
                          </div>
                      </div>
                  </div>

                   <!-- Empty State -->
                  <div v-else class="flex-1 flex items-center justify-center text-gray-400">
                      Sin datos para mostrar
                  </div>
              </div>

              <!-- Placeholder if no agency chart (to keep left col 50% or full width?) -->
              <!-- If we assume grid-cols-2, this slot is empty. -->
          </div>


          <!-- Quick Actions Footer -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button
                  v-if="canCreateTech"
                  @click="openTechModal"
                  class="flex items-center justify-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 transition shadow-sm"
              >
                  <i class="fas fa-laptop-medical"></i>
                  Crear Solicitud Tecnológica
              </button>
               <button
                  v-if="canCreateAdmin"
                  @click="openAdminModal"
                  class="flex items-center justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition shadow-sm"
              >
                  <i class="fas fa-file-signature"></i>
                  Crear Solicitud Administrativa
              </button>
          </div>
      </div>

       <!-- Modal Crear Solicitud (Reused) -->
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
import { ref, onMounted, computed, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';
// import { useRouter } from 'vue-router'; // Unused
import DashboardService from '@/services/DashboardService';
import CrearSolicitudModal from '@/views/solicitudes/components/CrearSolicitudModal.vue';

const authStore = useAuthStore();
// const router = useRouter(); // Removed as unused for now, navigateTo uses console.log currently

// State
const loading = ref(true);
const metrics = ref({});
const agencies = ref([]);
const filters = reactive({
    category_id: null,
    agencia_id: null
});

// Create Modal State
const showCreateModal = ref(false);
const createTitle = ref('');
const createCatId = ref(null);

// Permissions & Scope
const canViewGeneral = computed(() => {
    return authStore.hasRole('Super Admin') || authStore.hasPermission('ver-dashboard-general');
});

const isAgencyUser = computed(() => {
    return authStore.hasPermission('ver-dashboard-agencia') && !canViewGeneral.value;
});

const canDrillDown = computed(() => {
    return metrics.value.permissions?.can_drill_down ?? true;
});

const canCreateTech = computed(() => authStore.hasRole('Super Admin') || authStore.hasPermission('crear-solicitudes-tech'));
const canCreateAdmin = computed(() => authStore.hasRole('Super Admin') || authStore.hasPermission('crear-solicitudes-admin'));

// Methods
const fetchMetrics = async () => {
    loading.value = true;
    try {
        const params = { ...filters };
        const response = await DashboardService.getMetrics(params);
        metrics.value = response.data;
    } catch (error) {
        console.error("Error fetching dashboard:", error);
    } finally {
        loading.value = false;
    }
};

const fetchAgencies = async () => {
    if (!canViewGeneral.value) return;
    try {
        const response = await DashboardService.getAgencies();
        agencies.value = response.data;
    } catch (error) {
        console.error("Error fetching agencies:", error);
    }
};

onMounted(async () => {
    await fetchAgencies();
    await fetchMetrics();
});

// Helper: Calculate width for bars
const calculateGenericPercentage = (val, max = null) => {
    if (!max) {
        // Find max in the current dataset if not provided, or assume a total?
        // For simplicity, let's use the KPI total or just 100% relative to the biggest item in list?
        // Using 100% scale relative to total requests might be small.
        // Let's return a relative percentage to the 'Total' count
        max = metrics.value.kpi?.total || 1;
    }
    if (max === 0) return 0;
    return Math.round((val / max) * 100);
};

const getStatusColorClass = (status) => {
    switch (status) {
        case 'reportada': return 'bg-gray-400';
        case 'asignada': return 'bg-blue-500';
        case 'en_seguimiento': return 'bg-emerald-500';
        case 'pendiente_validacion': return 'bg-amber-500';
        case 'cerrada': return 'bg-gray-800 dark:bg-gray-600';
        case 'reabierta': return 'bg-red-500';
        default: return 'bg-gray-300';
    }
};

const formatStatus = (s) => s.replace('_', ' ');

const navigateTo = (type) => {
    if (!canDrillDown.value) return;

    // Logic to navigate to Bandeja with filters pre-set?
    // User might strictly want to see the list.
    // We can assume 'BandejaSolicitudes' listens to query params?
    // If not, we just go to the list.
    // For now, let's just log or go to generic list.
    console.log("Navigate to", type);
    // router.push({ name: 'bandeja-solicitudes', query: { status: type } });
};

// Create Modal Logic
const openTechModal = () => { createTitle.value = 'Nueva Solicitud Tecnológica'; createCatId.value = 1; showCreateModal.value = true; };
const openAdminModal = () => { createTitle.value = 'Nueva Solicitud Administrativa'; createCatId.value = 2; showCreateModal.value = true; };
const handleSolicitudCreated = () => { fetchMetrics(); }; // Refresh data

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
