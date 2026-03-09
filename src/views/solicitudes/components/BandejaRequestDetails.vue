<script setup>
import { ref } from 'vue';

const props = defineProps({
    solicitudes: Array,
    selectedSolicitud: Object,
    solicitudDetalle: Object,
    loadingList: Boolean,
    loadingDetail: Boolean,
    pagination: Object,
    canFinalize: Boolean,
    canValidate: Boolean,
    filtros: Object
});

const emit = defineEmits(['seleccionar', 'cambiarPagina', 'verBackToList', 'confirmar-cierre', 'confirmar-validacion', 'update-filtros']);

const statusTabs = [
    { label: 'Todas', value: '' },
    { label: 'Reportadas', value: 'reportada' },
    { label: 'En Seguimiento', value: 'en_seguimiento' },
    { label: 'Por Validar', value: 'pendiente_validacion' },
    { label: 'Cerradas', value: 'cerrada' }
];

const selectStatus = (status) => {
    emit('update-filtros', { ...props.filtros, estado: status });
};

const getEstadoClass = (estado) => {
    switch (estado) {
        case 'reportada': return 'bg-red-100 text-red-800 border-red-200';
        case 'asignada': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'en_seguimiento': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'pendiente_validacion': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'cerrada': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getEstadoIcon = (estado) => {
    switch (estado) {
        case 'reportada': return 'fas fa-exclamation-circle';
        case 'asignada': return 'fas fa-user-check';
        case 'en_seguimiento': return 'fas fa-sync fa-spin';
        case 'pendiente_validacion': return 'fas fa-clipboard-check';
        case 'cerrada': return 'fas fa-lock';
        default: return 'fas fa-info-circle';
    }
};

// Finalizar Modal State
const showFinalizarModal = ref(false);
const cierreData = ref({
    comentario: '',
    evidencias: []
});

const handleCierreFileUpload = (event) => {
    cierreData.value.evidencias = event.target.files;
};

const submitCierre = () => {
    emit('confirmar-cierre', { ...cierreData.value });
    showFinalizarModal.value = false;
    cierreData.value = { comentario: '', evidencias: [] };
};

// Validar Modal State
const showValidarModal = ref(false);
const validarData = ref({
    accion: 'cerrar',
    tipo_solucion: 'total',
    comentario: ''
});

const submitValidacion = () => {
    emit('confirmar-validacion', { ...validarData.value });
    showValidarModal.value = false;
};

</script>

<template>
    <div class="div2 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden rounded-2xl shadow-md relative transition-shadow hover:shadow-lg border border-gray-100 dark:border-gray-700">

        <!-- VISTA DE LISTA -->
        <div v-if="!selectedSolicitud" class="flex flex-col h-full overflow-hidden">
            <div class="shrink-0 flex flex-col z-10 shadow-sm" style="background-color: var(--color-azul-cope)">
                <!-- Header Part 1: Title & Stats -->
                <div class="p-2 px-4 flex justify-between items-center border-b border-white/10">
                    <h2 class="text-xs font-bold text-white tracking-wide flex items-center gap-2 uppercase">
                        <i class="fas fa-list-ul text-white/80 text-[10px]"></i> Mi Bandeja
                    </h2>
                    <span class="text-[10px] font-bold text-blue-900 dark:text-gray-100 bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full shadow-sm">
                        {{ pagination.total }} TOTAL
                    </span>
                </div>

                <!-- Header Part 2: Functional Filters -->
                <div class="px-2 py-1 flex gap-1 overflow-x-auto custom-scrollbar no-scrollbar">
                    <button
                        v-for="tab in statusTabs"
                        :key="tab.value"
                        @click="selectStatus(tab.value)"
                        class="px-2.5 py-1 rounded-md text-[9px] font-bold transition-all whitespace-nowrap uppercase tracking-wider"
                        :class="filtros.estado === tab.value
                            ? 'bg-white text-[var(--color-azul-cope)] shadow-sm'
                            : 'text-white/70 hover:text-white hover:bg-white/10'"
                    >
                        {{ tab.label }}
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div v-if="loadingList" class="space-y-3 p-2">
                    <div v-for="i in 5" :key="i" class="p-4 rounded-xl bg-gray-50 dark:bg-gray-700 animate-pulse">
                        <div class="flex justify-between items-start mb-2">
                            <div class="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
                            <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded-full w-20"></div>
                        </div>
                        <div class="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
                        <div class="flex justify-between items-end mt-2">
                            <div class="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                            <div class="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                        </div>
                    </div>
                </div>
                <div v-else-if="solicitudes.length === 0" class="text-center p-8 text-gray-500 text-sm">
                    <i class="fas fa-inbox text-3xl mb-2 text-gray-300"></i><br>
                    No tienes casos asignados actualmente.
                </div>
                <div v-else class="space-y-2 px-1 py-1">
                    <div v-for="sol in solicitudes" :key="sol.id"
                         @click="$emit('seleccionar', sol)"
                         class="bg-white dark:bg-gray-800 rounded-xl p-3 cursor-pointer shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-300 group relative overflow-hidden flex flex-col gap-1.5">

                        <div class="absolute left-0 top-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-100 transition-opacity" style="background-color: var(--color-verde-cope)"></div>

                        <div class="flex justify-between items-start pl-2">
                            <h3 class="font-bold text-sm text-[var(--color-azul-cope)] dark:text-gray-100 leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-1 pr-2">
                                <span class="text-xs text-gray-400 font-normal mr-1">#{{ sol.id }}</span>
                                {{ sol.titulo }}
                            </h3>
                            <span class="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase flex items-center gap-1 shrink-0 shadow-sm" :class="getEstadoClass(sol.estado)">
                                <i :class="getEstadoIcon(sol.estado)" class="text-[10px]"></i>
                                <span class="hidden sm:inline-block">{{ sol.estado?.replace('_', ' ') }}</span>
                            </span>
                        </div>

                        <div class="flex justify-between items-center pl-2 mt-1">
                            <div class="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 max-w-[65%] truncate" title="Agencia">
                                <i class="fas fa-building text-gray-400 text-[10px]"></i>
                                <span class="truncate font-medium">{{ sol.agencia?.nombre || 'Sin Agencia' }}</span>
                            </div>
                            <div class="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium shrink-0">
                                <i class="far fa-calendar-alt"></i>
                                {{ new Date(sol.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-4 shrink-0 flex justify-center bg-white dark:bg-gray-800 z-10 border-t border-gray-100 dark:border-gray-700">
                 <div class="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 p-1 rounded-xl border border-gray-200 dark:border-gray-600 shadow-inner inline-flex">
                     <button @click="$emit('cambiarPagina', pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg bg-white dark:bg-gray-600 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:shadow-none transition-all disabled:pointer-events-none">
                         <i class="fas fa-chevron-left"></i>
                     </button>
                     <span class="text-[11px] px-3 font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                         Pág {{ pagination.current_page }} <span class="mx-0.5 font-normal text-gray-300 dark:text-gray-600">/</span> {{ pagination.last_page }}
                     </span>
                     <button @click="$emit('cambiarPagina', pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg bg-white dark:bg-gray-600 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:shadow-none transition-all disabled:pointer-events-none">
                         <i class="fas fa-chevron-right"></i>
                     </button>
                 </div>
            </div>
        </div>

        <!-- VISTA DE DETALLE -->
        <div v-else class="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800 relative z-10 w-full">
             <div class="p-2 px-4 shrink-0 flex items-center justify-between z-10 shadow-sm" style="background-color: var(--color-azul-cope)">
                <button @click="$emit('verBackToList')" class="text-blue-900 dark:text-blue-100 hover:text-blue-950 dark:hover:text-white bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition px-2.5 py-1 text-[10px] flex items-center gap-2 font-bold rounded-md shadow-sm">
                    <i class="fas fa-arrow-left"></i> VOLVER
                </button>
                <div class="flex items-center gap-2">
                    <!-- Actions integrate directly here -->
                    <button v-if="canFinalize" @click="showFinalizarModal = true"
                            class="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg shadow-sm transition text-xs font-bold flex items-center gap-2">
                        <i class="fas fa-check-circle"></i> FINALIZAR CASO
                    </button>
                    <button v-if="canValidate" @click="showValidarModal = true"
                            class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg shadow-sm transition text-xs font-bold flex items-center gap-2">
                        <i class="fas fa-clipboard-check"></i> VALIDAR SOLUCIÓN
                    </button>
                    <span class="text-[10px] text-white/80 font-bold uppercase tracking-widest leading-none">ID: {{ selectedSolicitud.id }}</span>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-5 custom-scrollbar relative">
                <div v-if="loadingDetail" class="space-y-6 animate-pulse p-2">
                    <div>
                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                </div>
                <template v-else-if="solicitudDetalle">
                    <div class="space-y-6">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Título</div>
                                <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">{{ solicitudDetalle.titulo }}</h1>
                            </div>
                            <span class="px-3 py-1 rounded-full text-[10px] font-bold border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 uppercase flex items-center gap-1.5 shadow-sm ml-4 mt-5">
                                <i :class="getEstadoIcon(selectedSolicitud.estado)" class="text-[10px]"></i>
                                {{ selectedSolicitud.estado?.replace('_', ' ') }}
                            </span>
                        </div>

                        <div class="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl shadow-inner border border-gray-100 dark:border-gray-800">
                            <div class="flex flex-col">
                                <span class="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1.5">
                                    <i class="fas fa-building text-gray-300"></i> Agencia
                                </span>
                                <span class="text-sm font-bold text-gray-700 dark:text-gray-200">{{ solicitudDetalle.agencia?.nombre || 'S/A' }}</span>
                            </div>
                            <div class="flex flex-col pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span class="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1.5">
                                    <i class="fas fa-user text-gray-300"></i> Solicitante
                                </span>
                                <span class="text-sm font-bold text-gray-700 dark:text-gray-200">{{ solicitudDetalle.creado_por?.name || 'Sistema' }}</span>
                                <span class="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{{ solicitudDetalle.creado_por?.puesto?.nombre || 'Sin puesto' }}</span>
                            </div>
                            <div class="flex flex-col pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span class="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1.5">
                                    <i class="fas fa-user-check text-gray-300"></i> Responsable
                                </span>
                                <span class="text-sm font-bold text-gray-700 dark:text-gray-200">{{ solicitudDetalle.responsable?.name || 'No Asignado' }}</span>
                            </div>
                             <div v-if="solicitudDetalle.area" class="flex flex-col pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span class="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1.5">
                                    <i class="fas fa-map-marker-alt text-gray-300"></i> Área/Ubicación
                                </span>
                                <span class="text-sm font-bold text-gray-700 dark:text-gray-200">{{ solicitudDetalle.area }}</span>
                            </div>
                        </div>

                        <div>
                            <div class="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2 ml-1 flex items-center gap-2">
                                <i class="fas fa-align-left text-gray-400"></i> Descripción
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-900/60 p-5 rounded-2xl text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed shadow-inner border border-gray-100 dark:border-gray-800">
                                {{ solicitudDetalle.descripcion }}
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- MODALS -->
        <!-- Finalizar Caso -->
        <div v-if="showFinalizarModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div class="bg-green-600 p-4 text-white flex justify-between items-center">
                    <h3 class="font-bold text-lg"><i class="fas fa-check-circle mr-2"></i> Finalizar y Resolver Caso</h3>
                    <button @click="showFinalizarModal = false" class="hover:bg-white/20 rounded-full p-1 transition"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6 space-y-4">
                    <div class="bg-blue-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-gray-600">
                        Describe la solución aplicada y adjunta evidencias si es necesario.
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solución Applied <span class="text-red-500">*</span></label>
                        <textarea v-model="cierreData.comentario" rows="4" class="w-full border rounded-lg p-3 dark:bg-gray-700 dark:border-gray-600 resize-none focus:ring-2 focus:ring-green-500 dark:text-white" placeholder="Describe que se hizo..."></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Evidencias (Opcional)</label>
                        <input type="file" multiple @change="handleCierreFileUpload" class="w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 dark:text-gray-300">
                    </div>
                </div>
                <div class="p-4 bg-gray-50 dark:bg-gray-700/30 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                    <button @click="showFinalizarModal = false" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                    <button @click="submitCierre" :disabled="!cierreData.comentario" class="bg-green-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50">Confirmar Resolución</button>
                </div>
            </div>
        </div>

        <!-- Validar Solución -->
        <div v-if="showValidarModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div class="bg-purple-600 p-4 text-white flex justify-between items-center">
                    <h3 class="font-bold text-lg"><i class="fas fa-clipboard-check mr-2"></i> Validar Solución</h3>
                    <button @click="showValidarModal = false" class="hover:bg-white/20 rounded-full p-1 transition"><i class="fas fa-times"></i></button>
                </div>
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Acción</label>
                        <div class="grid grid-cols-2 gap-3">
                            <button @click="validarData.accion = 'cerrar'" :class="validarData.accion === 'cerrar' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-600'" class="p-3 border-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1">
                                <i class="fas fa-check-double text-lg"></i> Aceptar y Cerrar
                            </button>
                            <button @click="validarData.accion = 'reabrir'" :class="validarData.accion === 'reabrir' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'" class="p-3 border-2 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1">
                                <i class="fas fa-undo text-lg"></i> Reabrir (No resuelto)
                            </button>
                        </div>
                    </div>
                    <div v-if="validarData.accion === 'cerrar'">
                         <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Solución</label>
                         <select v-model="validarData.tipo_solucion" class="w-full border rounded-lg p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                             <option value="total">Solución Total</option>
                             <option value="parcial">Solución Parcial</option>
                         </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentario (Opcional si es cierre, obligatorio si es reabrir)</label>
                        <textarea v-model="validarData.comentario" rows="3" class="w-full border rounded-lg p-3 dark:bg-gray-700 dark:border-gray-600 resize-none dark:text-white" placeholder="Explica el motivo..."></textarea>
                    </div>
                </div>
                <div class="p-4 bg-gray-50 dark:bg-gray-700/30 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                    <button @click="showValidarModal = false" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancelar</button>
                    <button @click="submitValidacion" :disabled="validarData.accion === 'reabrir' && !validarData.comentario" class="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50">Procesar Validación</button>
                </div>
            </div>
        </div>
    </div>
</template>
