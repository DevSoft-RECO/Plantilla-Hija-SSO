<template>
    <div class="space-y-6 animate-fade-in-up">

      <!-- Access Denied Message -->
      <div v-if="accessDenied" class="flex flex-col items-center justify-center min-h-[60vh] bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div class="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <i class="fas fa-lock text-3xl text-red-600 dark:text-red-400"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Acceso Restringido</h2>
          <p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto">{{ errorMessage }}</p>
      </div>

      <!-- Dashboard Content -->
      <div v-else>
          <!-- Header & Filters -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 sm:mb-6">
              <div>
                  <h2 class="text-xl sm:text-2xl font-bold text-white">
                      Dashboard de TICKETS
                  </h2>
                  <p class="text-white/70 text-xs sm:text-sm">
                      Resumen de operaciones y métricas clave
                  </p>
              </div>


              <!-- Filters & Actions -->
              <div class="flex flex-col sm:flex-row-reverse gap-3 items-stretch sm:items-center w-full md:w-auto">

                   <!-- Action Buttons (Conditional on Permissions) -->
                   <div class="flex gap-2 w-full sm:w-auto">
                       <button
                          v-if="canCreateTech"
                          @click="openTechModal"
                          class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 transition text-sm font-medium shadow-sm"
                          title="Crear Solicitud Tecnológica"
                      >
                          <i class="fas fa-plus"></i> <span class="inline sm:hidden md:inline">Tecnológica</span>
                      </button>
                       <button
                          v-if="canCreateAdmin"
                          @click="openAdminModal"
                          class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 sm:py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition text-sm font-medium shadow-sm"
                          title="Crear Solicitud Administrativa"
                      >
                          <i class="fas fa-plus"></i> <span class="inline sm:hidden md:inline">Administrativa</span>
                      </button>
                   </div>

                   <!-- Existing Filters -->
                   <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <!-- Category Filter -->
                      <select
                          v-model="filters.category_id"
                          @change="fetchMetrics"
                          class="w-full sm:w-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block p-2.5"
                      >
                          <option :value="null">Todas las Categorías</option>
                          <option :value="1">Tecnología</option>
                          <option :value="2">Administración</option>
                      </select>

                      <!-- Agency Filter (Admin Only) -->
                      <div v-if="canViewGeneral && !isAgencyUser" class="relative w-full sm:w-auto">
                        <select
                              v-model="filters.agencia_id"
                              @change="fetchMetrics"
                              class="w-full sm:w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 block p-2.5"
                          >
                              <option :value="null">Todas las Agencias</option>
                              <option v-for="agency in agencies" :key="agency.id" :value="agency.id">
                                  {{ agency.nombre }}
                              </option>
                          </select>
                      </div>
                      <div v-else class="flex items-center px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 w-full justify-center sm:w-auto sm:justify-start">
                          <i class="fas fa-building mr-2"></i> {{ authStore.user?.agencia_id ? 'Mi Agencia' : 'Sin Agencia' }}
                      </div>
                   </div>
              </div>
          </div>

          <!-- Skeleton Loading State (Facebook style) -->
          <div v-if="loading" class="animate-pulse space-y-6">
              <!-- KPI Cards Skeleton -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div v-for="i in 4" :key="`sk-kpi-${i}`" class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 dark:border-gray-700/50 h-[140px] flex flex-col justify-between">
                      <div class="flex justify-between">
                           <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                           <div class="w-16 h-6 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
                      </div>
                      <div>
                          <div class="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-md mb-2"></div>
                          <div class="w-32 h-4 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
                      </div>
                  </div>
              </div>

              <!-- Resolution Cards Skeleton -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div v-for="i in 2" :key="`sk-res-${i}`" class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border-t-[6px] border-t-gray-200 dark:border-t-gray-700 border border-gray-100 dark:border-gray-700/50 h-[140px] flex justify-between items-center">
                       <div>
                           <div class="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded-md mb-3"></div>
                           <div class="w-12 h-10 bg-gray-300 dark:bg-gray-600 rounded-md mb-2"></div>
                           <div class="w-48 h-3 bg-gray-100 dark:bg-gray-700 rounded-md"></div>
                       </div>
                       <div class="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                   </div>
              </div>

              <!-- Charts Skeleton -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <!-- Left Col -->
                  <div class="space-y-6">
                      <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-gray-700/50 h-[280px]">
                          <div class="w-40 h-6 bg-gray-200 dark:bg-gray-700 rounded-md mb-8"></div>
                          <div class="space-y-5">
                              <div v-for="i in 4" :key="`sk-bar1-${i}`">
                                  <div class="flex justify-between mb-2">
                                      <div class="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                      <div class="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                  </div>
                                  <div class="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div class="w-1/2 h-full bg-gray-200 dark:bg-gray-700"></div></div>
                              </div>
                          </div>
                      </div>
                       <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-gray-700/50 h-[280px]">
                          <div class="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded-md mb-8"></div>
                          <div class="space-y-5">
                              <div v-for="i in 4" :key="`sk-bar2-${i}`">
                                  <div class="flex justify-between mb-2">
                                      <div class="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                      <div class="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                  </div>
                                  <div class="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div class="w-1/3 h-full bg-gray-200 dark:bg-gray-700"></div></div>
                              </div>
                          </div>
                      </div>
                  </div>
                  <!-- Right Col -->
                  <div class="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-gray-700/50 flex flex-col h-[584px]">
                      <div class="w-56 h-6 bg-gray-200 dark:bg-gray-700 rounded-md mb-8"></div>
                      <div class="flex-1 flex flex-col xl:flex-row items-center justify-center gap-10">
                           <div class="w-64 h-64 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-inner"></div>
                           <div class="flex-1 w-full xl:w-auto space-y-4">
                               <div v-for="i in 5" :key="`sk-leg-${i}`" class="flex items-center justify-between p-2">
                                   <div class="flex items-center gap-3">
                                       <div class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                       <div class="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                   </div>
                                   <div class="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                               </div>
                           </div>
                      </div>
                  </div>
              </div>
          </div>

          <div v-else class="space-y-6">
              <!-- KPI Cards -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <!-- Total -->
                  <div class="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-xl shadow-xl border border-white/20 flex items-center justify-between transition-all hover:bg-white/20">
                      <div>
                          <p class="text-xs sm:text-sm font-medium text-white/70">Total Solicitudes</p>
                          <h3 class="text-2xl sm:text-3xl font-bold text-white mt-1">{{ metrics.kpi?.total || 0 }}</h3>
                      </div>
                      <div class="p-3 bg-blue-500/20 rounded-lg text-white">
                          <i class="fas fa-clipboard-list text-xl"></i>
                      </div>
                  </div>

                  <!-- Open -->
                  <div
                    @click="canDrillDown ? navigateTo('abiertas') : null"
                    :class="{'cursor-pointer hover:bg-white/20 transition-all border-emerald-400/50': canDrillDown}"
                    class="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-xl shadow-xl border border-white/20 flex items-center justify-between"
                  >
                      <div>
                          <p class="text-xs sm:text-sm font-medium text-white/70">Abiertas</p>
                          <h3 class="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1">{{ metrics.kpi?.open || 0 }}</h3>
                      </div>
                      <div class="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
                          <i class="fas fa-clock text-xl"></i>
                      </div>
                  </div>

                   <!-- Pending Validation -->
                   <div
                     @click="canDrillDown ? navigateTo('validacion') : null"
                     :class="{'cursor-pointer hover:bg-white/20 transition-all border-amber-400/50': canDrillDown}"
                     class="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-xl shadow-xl border border-white/20 flex items-center justify-between"
                   >
                      <div>
                          <p class="text-xs sm:text-sm font-medium text-white/70">Por Validar</p>
                          <h3 class="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">{{ metrics.kpi?.validation || 0 }}</h3>
                      </div>
                      <div class="p-3 bg-amber-500/20 rounded-lg text-amber-400">
                          <i class="fas fa-check-circle text-xl"></i>
                      </div>
                  </div>

                   <!-- Closed -->
                   <div class="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-xl shadow-xl border border-white/20 flex items-center justify-between transition-all hover:bg-white/20">
                      <div>
                          <p class="text-xs sm:text-sm font-medium text-white/70">Cerradas</p>
                          <h3 class="text-2xl sm:text-3xl font-bold text-white/60 mt-1">{{ metrics.kpi?.closed || 0 }}</h3>
                      </div>
                      <div class="p-3 bg-white/10 rounded-lg text-white/60">
                          <i class="fas fa-archive text-xl"></i>
                      </div>
                  </div>
              </div>

              <!-- Resolution Stats (Total vs Partial) -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Total Resolution -->
                  <div
                    @click="canDrillDown && metrics.resolution?.total > 0 ? openResolutionModal('total') : null"
                    class="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-xl shadow-xl border border-l-4 border-l-emerald-500 border-y-white/10 border-r-white/10 transition-all group"
                    :class="{ 'cursor-pointer hover:bg-white/20': canDrillDown }"
                  >
                      <div class="flex items-center justify-between">
                         <div>
                             <p class="text-xs sm:text-sm font-bold text-emerald-400 mb-1 uppercase tracking-wider">Solución Total</p>
                             <h3 class="text-2xl sm:text-3xl font-bold text-white">{{ metrics.resolution?.total || 0 }}</h3>
                             <p class="text-xs text-white/60 mt-1">Solicitudes resueltas al 100%</p>
                         </div>
                         <div class="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl transition-transform" :class="{ 'group-hover:scale-110': canDrillDown }">
                             <i class="fas fa-check-double"></i>
                         </div>
                      </div>
                  </div>

                  <!-- Partial Resolution -->
                   <div
                    @click="canDrillDown && metrics.resolution?.parcial > 0 ? openResolutionModal('parcial') : null"
                    class="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-xl shadow-xl border border-l-4 border-l-blue-500 border-y-white/10 border-r-white/10 transition-all group"
                    :class="{ 'cursor-pointer hover:bg-white/20': canDrillDown }"
                  >
                       <div class="flex items-center justify-between">
                         <div>
                             <p class="text-xs sm:text-sm font-bold text-blue-400 mb-1 uppercase tracking-wider">Solución Parcial</p>
                             <h3 class="text-2xl sm:text-3xl font-bold text-white">{{ metrics.resolution?.parcial || 0 }}</h3>
                              <p class="text-xs text-white/60 mt-1">Solicitudes resueltas parcialmente</p>
                         </div>
                         <div class="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xl transition-transform" :class="{ 'group-hover:scale-110': canDrillDown }">
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
                      <div class="bg-white/10 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-xl border border-white/20 flex-1">
                          <h3 class="text-lg font-bold text-white mb-4">Top Subcategorías</h3>
                          <div class="space-y-4">
                              <div v-for="(item, index) in metrics.charts?.subcategories" :key="index" class="space-y-1">
                                  <div class="flex justify-between text-sm">
                                      <span class="text-white/80 dark:text-gray-300">{{ item.nombre }}</span>
                                      <span class="font-medium text-white dark:text-white">{{ item.count }}</span>
                                  </div>
                                  <div class="w-full bg-white/10 dark:bg-gray-700 rounded-full h-2.5">
                                      <div
                                        class="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                                        :style="{ width: `${calculateGenericPercentage(item.count)}%` }"
                                      ></div>
                                  </div>
                              </div>
                              <div v-if="!metrics.charts?.subcategories?.length" class="text-center text-white/40 py-4">
                                  Sin datos para mostrar
                              </div>
                          </div>
                      </div>

                      <!-- Status Distribution -->
                      <div class="bg-white/10 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-xl border border-white/20 flex-1">
                          <h3 class="text-lg font-bold text-white mb-4">Estado de Solicitudes</h3>
                          <div class="space-y-4">
                               <div v-for="(item, index) in metrics.charts?.status" :key="index" class="space-y-1">
                                  <div class="flex justify-between text-sm">
                                      <span class="text-white/80 dark:text-gray-300 capitalize">{{ formatStatus(item.estado) }}</span>
                                      <span class="font-medium text-white dark:text-white">{{ item.count }}</span>
                                  </div>
                                  <div class="w-full bg-white/10 dark:bg-gray-700 rounded-full h-2.5">
                                      <div
                                        class="h-2.5 rounded-full transition-all duration-500"
                                        :class="getStatusColorClass(item.estado)"
                                        :style="{ width: `${calculateGenericPercentage(item.count)}%` }"
                                      ></div>
                                  </div>
                              </div>
                              <div v-if="!metrics.charts?.status?.length" class="text-center text-white/40 py-4">
                                  Sin datos para mostrar
                              </div>
                          </div>
                      </div>
                  </div>

                   <!-- Right Column: Agency Volume (Vertical Bar Chart) -->
                  <div v-if="canViewGeneral && !filters.agencia_id" class="bg-white/10 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-xl border border-white/20 flex flex-col h-full">
                      <h3 class="text-lg font-bold text-white mb-6">Volumen por Agencia (Top 10)</h3>

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
                                   <li v-for="(item, index) in metrics.charts?.agencies" :key="index" class="flex items-center justify-between group hover:bg-white/5 dark:hover:bg-gray-700/50 p-1.5 rounded-lg transition-colors">
                                       <div class="flex items-center gap-2 truncate">
                                           <span class="w-3 h-3 rounded-full shrink-0 shadow-sm" :style="{ backgroundColor: pieColors[index % pieColors.length] }"></span>
                                           <span class="text-white/80 dark:text-gray-300 truncate w-[140px] xl:w-[180px]" :title="item.nombre">
                                               {{ item.nombre }}
                                           </span>
                                       </div>
                                       <span class="font-bold text-white dark:text-white bg-white/10 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs">
                                           {{ item.count }}
                                       </span>
                                   </li>
                               </ul>
                           </div>
                      </div>

                       <!-- Empty State -->
                      <div v-else class="flex-1 flex items-center justify-center text-white/40">
                          Sin datos para mostrar
                      </div>
                  </div>

                  <!-- Placeholder if no agency chart (to keep left col 50% or full width?) -->
                  <!-- If we assume grid-cols-2, this slot is empty. -->
              </div>

              <!-- Full Width Agency Bar Chart (Admin Only - All Agencies) -->
              <div v-if="canViewGeneral && !filters.agencia_id" class="bg-white/10 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-xl border border-white/20">
                  <h3 class="text-lg font-bold text-white mb-6">Total Solicitudes por todas las agencias</h3>
                  
                  <div class="space-y-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                      <div v-for="(item, index) in metrics.charts?.all_agencies || metrics.charts?.agencies" :key="index" class="space-y-1.5 block">
                          <div class="flex justify-between items-end text-xs sm:text-sm">
                              <span class="text-white/80 dark:text-gray-300 truncate pr-4" :title="item.nombre">{{ item.nombre }}</span>
                              <span class="font-bold text-white dark:text-white shrink-0">{{ item.count }}</span>
                          </div>
                          <div class="w-full bg-white/10 dark:bg-gray-700 rounded-full h-3">
                              <div
                                class="bg-blue-500 hover:bg-blue-400 h-3 rounded-full transition-all duration-500"
                                :style="{ width: `${calculateGenericPercentage(item.count, (metrics.charts?.all_agencies?.[0]?.count || metrics.charts?.agencies?.[0]?.count))}%` }"
                              ></div>
                          </div>
                      </div>
                      
                      <div v-if="!(metrics.charts?.all_agencies || metrics.charts?.agencies)?.length" class="text-center text-white/40 py-4">
                          Sin datos para mostrar
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

    </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import DashboardService from '@/services/DashboardService';
import CrearSolicitudModal from '@/views/solicitudes/components/CrearSolicitudModal.vue';
import ResolutionDetailsModal from '@/views/solicitudes/components/ResolutionDetailsModal.vue';

const authStore = useAuthStore();
const router = useRouter();

// State
const loading = ref(true);
const metrics = ref({});
const agencies = ref([]);
const filters = reactive({
    category_id: null,
    agencia_id: null
});

// Access State
const accessDenied = ref(false);
const errorMessage = ref('');

// Create Modal State
const showCreateModal = ref(false);
const createTitle = ref('');
const createCatId = ref(null);

// Resolution Modal State
const showResolutionModal = ref(false);
const resolutionType = ref('');
const resolutionDetails = ref([]);
const resolutionLoading = ref(false);
const resolutionTitle = computed(() => {
    switch(resolutionType.value) {
        case 'total': return 'Solicitudes con Solución Total';
        case 'parcial': return 'Solicitudes con Solución Parcial';
        case 'abiertas': return 'Solicitudes Abiertas';
        case 'validacion': return 'Solicitudes por Validar';
        default: return 'Detalle de Solicitudes';
    }
});

// Permissions & Scope
const canViewGeneral = computed(() => {
    return authStore.hasRole('Super Admin') || authStore.hasPermission('ver-dashboard-general');
});

const isAgencyUser = computed(() => {
    return authStore.hasPermission('ver-dashboard-agencia') && !canViewGeneral.value;
});

const canInteract = computed(() => {
    // Backend now returns this flag, simplify frontend
    return metrics.value.permissions?.can_interact ?? false;
});

const canDrillDown = computed(() => {
    return canInteract.value && (metrics.value.permissions?.can_drill_down ?? true);
});
const canCreateTech = computed(() => authStore.hasRole('Super Admin') || authStore.hasPermission('crear-solicitudes-tech'));
const canCreateAdmin = computed(() => authStore.hasRole('Super Admin') || authStore.hasPermission('crear-solicitudes-admin'));

// Methods
const fetchMetrics = async () => {
    loading.value = true;
    accessDenied.value = false;
    errorMessage.value = '';
    try {
        const params = { ...filters };
        const response = await DashboardService.getMetrics(params);
        metrics.value = response.data;
    } catch (error) {
        if (error.response && error.response.status === 403) {

            // --- Intelligent Redirect Logic ---
            console.warn("⛔ Dashboard Access Denied. Attempting redirect based on permissions...");

            // 1. Tech Creator -> Mis Solicitudes (Tech)
            if (authStore.hasPermission('crear-solicitudes-tech')) {
                return router.push({ name: 'mis-solicitudes-tec' });
            }

            // 2. Admin Creator -> Mis Solicitudes (Admin)
            if (authStore.hasPermission('crear-solicitudes-admin')) {
                return router.push({ name: 'mis-solicitudes-admin' });
            }

            // 3. Tech Assignee -> Mis Asignaciones (Tec)
            // Note: Router meta uses 'solicitudes-tecnologicas-externas', double check permission name validity
            if (authStore.hasPermission('solicitudes-tecnologicas-externas')) {
                return router.push({ name: 'mis-asignaciones' });
            }

            // 4. Admin Assignee -> Mis Asignaciones (Admin)
            if (authStore.hasPermission('seguimiento_solicitudes-administrativas')) {
                return router.push({ name: 'mis-asignaciones-admin' });
            }

            // 5. App Launcher Only -> Mother App
            if (authStore.hasPermission('ver-solo-apps')) {
                 const motherAppUrl = import.meta.env.VITE_MOTHER_APP_URL || 'http://localhost:5173';
                 window.location.href = `${motherAppUrl}/apps`;
                 return;
            }

            // Fallback: Show Access Denied Message
            accessDenied.value = true;
            errorMessage.value = error.response.data.message || 'No tiene permiso para ver el dashboard.';
        } else {
            console.error("Error fetching dashboard:", error);
        }
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
    // Optimistic: we don't know permissions until headers applied in requests or authStore checked,
    // but authStore is usually ready. We can just try fetching.
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
    openResolutionModal(type);
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
.custom-scrollbar::-webkit-scrollbar {
    height: 4px;
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 4px;
}
</style>
