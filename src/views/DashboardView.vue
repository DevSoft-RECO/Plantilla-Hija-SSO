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


          <!-- Filters & Actions -->
          <div class="flex flex-col-reverse sm:flex-row gap-3 items-end sm:items-center">

               <!-- Action Buttons (Moved) -->
               <div class="flex gap-2">
                   <button
                      v-if="canCreateTech"
                      @click="openTechModal"
                      class="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 transition text-sm font-medium"
                      title="Crear Solicitud Tecnológica"
                  >
                      <i class="fas fa-plus"></i> <span class="hidden md:inline">Tecnológica</span>
                  </button>
                   <button
                      v-if="canCreateAdmin"
                      @click="openAdminModal"
                      class="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition text-sm font-medium"
                      title="Crear Solicitud Administrativa"
                  >
                      <i class="fas fa-plus"></i> <span class="hidden md:inline">Administrativa</span>
                  </button>
               </div>

               <!-- Existing Filters -->
               <div class="flex gap-3">
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

          <!-- Resolution Stats (Total vs Partial) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Total Resolution -->
              <div
                @click="metrics.resolution?.total > 0 ? openResolutionModal('total') : null"
                class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-l-4 border-l-emerald-500 border-y-gray-200 border-r-gray-200 dark:border-y-gray-700 dark:border-r-gray-700 cursor-pointer hover:shadow-md transition-all group"
              >
                  <div class="flex items-center justify-between">
                     <div>
                         <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-1 uppercase tracking-wider">Solución Total</p>
                         <h3 class="text-3xl font-bold text-gray-800 dark:text-white">{{ metrics.resolution?.total || 0 }}</h3>
                         <p class="text-xs text-gray-500 mt-1">Solicitudes resueltas al 100%</p>
                     </div>
                     <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl group-hover:scale-110 transition-transform">
                         <i class="fas fa-check-double"></i>
                     </div>
                  </div>
              </div>

              <!-- Partial Resolution -->
               <div
                @click="metrics.resolution?.parcial > 0 ? openResolutionModal('parcial') : null"
                class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-l-4 border-l-blue-500 border-y-gray-200 border-r-gray-200 dark:border-y-gray-700 dark:border-r-gray-700 cursor-pointer hover:shadow-md transition-all group"
              >
                   <div class="flex items-center justify-between">
                     <div>
                         <p class="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">Solución Parcial</p>
                         <h3 class="text-3xl font-bold text-gray-800 dark:text-white">{{ metrics.resolution?.parcial || 0 }}</h3>
                          <p class="text-xs text-gray-500 mt-1">Solicitudes resueltas parcialmente</p>
                     </div>
                     <div class="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl group-hover:scale-110 transition-transform">
                         <i class="fas fa-check"></i>
                     </div>
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

                  <div v-if="metrics.charts?.agencies?.length" class="flex-1 flex flex-col xl:flex-row items-center justify-center gap-8 min-h-[300px]">
                       <!-- Pie Chart -->
                       <div
                            class="relative w-56 h-56 rounded-full shadow-lg border-4 border-gray-100 dark:border-gray-700 transition-transform hover:scale-105"
                            :style="pieChartStyle"
                       >
                           <!-- Optional: Tooltip overlay could be tricky with conic, so simple chart for now -->
                       </div>

                       <!-- Legend -->
                       <div class="flex-1 w-full xl:w-auto">
                           <ul class="space-y-2 text-sm max-h-[300px] overflow-y-auto pr-2">
                               <li v-for="(item, index) in metrics.charts?.agencies" :key="index" class="flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1.5 rounded-lg transition-colors">
                                   <div class="flex items-center gap-2 truncate">
                                       <span class="w-3 h-3 rounded-full shrink-0 shadow-sm" :style="{ backgroundColor: pieColors[index % pieColors.length] }"></span>
                                       <span class="text-gray-600 dark:text-gray-300 truncate w-[140px] xl:w-[180px]" :title="item.nombre">
                                           {{ item.nombre }}
                                       </span>
                                   </div>
                                   <span class="font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs">
                                       {{ item.count }}
                                   </span>
                               </li>
                           </ul>
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

          <!-- Full Width Agency Bar Chart (Admin Only - All Agencies) -->
          <div v-if="canViewGeneral && !filters.agencia_id" class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-6">Total Solicitudes por todas las agencias</h3>
              <div class="overflow-x-auto pb-6">
                  <div class="flex items-end gap-3 min-h-[250px] min-w-max px-2 pt-8">
                       <div
                          v-for="(item, index) in metrics.charts?.all_agencies || metrics.charts?.agencies"
                          :key="index"
                          class="group relative flex flex-col justify-end items-center h-[250px] w-8 hover:bg-gray-50 dark:hover:bg-gray-700/20 rounded"
                      >
                           <!-- Tooltip -->
                           <div class="absolute bottom-full mb-2 hidden group-hover:block z-20 left-1/2 transform -translate-x-1/2">
                              <div class="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                                  {{ item.nombre }}: {{ item.count }}
                              </div>
                          </div>
                           <!-- Bar -->
                          <div
                              class="w-full bg-blue-500 hover:bg-blue-400 rounded-t-sm transition-all duration-300 relative"
                              :style="{ height: `${calculateGenericPercentage(item.count, (metrics.charts?.all_agencies?.[0]?.count || metrics.charts?.agencies?.[0]?.count))}%` }"
                          >
                               <span class="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[10px] font-bold text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {{ item.count }}
                              </span>
                          </div>
                      </div>
                  </div>
                  <!-- Axis Labels container (scrolls with bars) -->
                  <div class="flex gap-3 min-w-max px-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                      <div
                          v-for="(item, index) in metrics.charts?.all_agencies || metrics.charts?.agencies"
                          :key="index"
                          class="w-8 text-[9px] text-gray-500 dark:text-gray-400 text-center truncate transform -rotate-45 origin-top-left translate-y-2"
                          :title="item.nombre"
                      >
                          {{ item.nombre }}
                      </div>
                  </div>
              </div>
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

       <!-- Modal Resolution Details -->
       <ResolutionDetailsModal
        :isOpen="showResolutionModal"
        :title="resolutionTitle"
        :type="resolutionType"
        :solicitudes="resolutionDetails"
        :loading="resolutionLoading"
        @close="showResolutionModal = false"
       />

    </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';
// import { useRouter } from 'vue-router'; // Unused
import DashboardService from '@/services/DashboardService';
import CrearSolicitudModal from '@/views/solicitudes/components/CrearSolicitudModal.vue';
import ResolutionDetailsModal from '@/views/solicitudes/components/ResolutionDetailsModal.vue';

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

// Resolution Modal State
const showResolutionModal = ref(false);
const resolutionType = ref('');
const resolutionDetails = ref([]);
const resolutionLoading = ref(false);
const resolutionTitle = computed(() => resolutionType.value === 'total' ? 'Solicitudes con Solución Total' : 'Solicitudes con Solución Parcial');

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
        max = metrics.value.kpi?.total || 1;
    }
    if (max === 0) return 0;
    return Math.round((val / max) * 100);
};

// Pie Chart Logic
const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#64748b'];

const pieChartStyle = computed(() => {
    const data = metrics.value.charts?.agencies || [];
    if (!data.length) return {};

    const total = data.reduce((sum, item) => sum + item.count, 0);
    let currentDeg = 0;
    let gradient = [];

    data.forEach((item, index) => {
        const percent = item.count / total;
        const deg = percent * 360;
        const color = pieColors[index % pieColors.length];

        gradient.push(`${color} ${currentDeg}deg ${currentDeg + deg}deg`);
        currentDeg += deg;
    });

    return {
        background: `conic-gradient(${gradient.join(', ')})`,
        borderRadius: '50%'
    };
});


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

// Resolution Modal Logic
const openResolutionModal = async (type) => {
    resolutionType.value = type;
    showResolutionModal.value = true;
    resolutionLoading.value = true;
    resolutionDetails.value = [];
    try {
        const params = { type, ...filters };
        const response = await DashboardService.getResolutionDetails(params);
        resolutionDetails.value = response.data;
    } catch (e) {
        console.error("Error fetching resolution details:", e);
    } finally {
        resolutionLoading.value = false;
    }
};

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
