<script setup>
import { ref } from 'vue';
import AsignarSolicitudModal from '@/views/solicitudes/components/AsignarSolicitudModal.vue';

const props = defineProps({
    solicitudes: Array,
    selectedSolicitud: Object,
    solicitudDetalle: Object,
    loadingList: Boolean,
    loadingDetail: Boolean,
    pagination: Object,
    canFinalize: Boolean,
    filtros: Object
});

const emit = defineEmits(['seleccionar', 'cambiarPagina', 'verBackToList', 'confirmar-cierre', 'update-filtros', 'solicitud-reasignada', 'export-csv']);

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
        case 'reportada': return 'bg-red-500/20 text-red-200 border-red-500/30';
        case 'asignada': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
        case 'en_seguimiento': return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
        case 'pendiente_validacion': return 'bg-purple-500/20 text-purple-200 border-purple-500/30';
        case 'cerrada': return 'bg-green-500/20 text-green-200 border-green-500/30';
        default: return 'bg-white/10 text-white/80 border-white/20';
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

// Reasignar Modal State
const showReasignarModal = ref(false);

const onReasignado = () => {
    showReasignarModal.value = false;
    emit('solicitud-reasignada');
    emit('verBackToList'); // Cierra el detalle y regresa a la tabla
};

const handleCierreFileUpload = (event) => {
    cierreData.value.evidencias = event.target.files;
};

const submitCierre = () => {
    emit('confirmar-cierre', { ...cierreData.value });
    showFinalizarModal.value = false;
    cierreData.value = { comentario: '', evidencias: [] };
};



</script>

<template>
    <div class="div2 bg-white/10 backdrop-blur-md flex flex-col h-full overflow-hidden rounded-2xl shadow-2xl relative transition-all border border-verde-cope/30">

        <!-- VISTA DE LISTA -->
        <div v-if="!selectedSolicitud" class="flex flex-col h-full overflow-hidden w-full min-w-0">
            <div class="shrink-0 flex flex-col z-10 shadow-sm w-full min-w-0" style="background-color: var(--color-azul-cope)">
                <!-- Header Part 1: Title & Stats -->
                <div class="p-2 px-4 flex flex-wrap justify-between items-center border-b border-white/10 gap-2 w-full min-w-0">
                    <h2 class="text-xs font-bold text-white tracking-wide flex items-center gap-2 uppercase min-w-0">
                        <i class="fas fa-list-ul text-white/80 text-[10px] shrink-0"></i> <span class="truncate">Mi Bandeja Tecnologica</span>
                    </h2>
                    <div class="flex items-center gap-2 shrink-0">
                        <button 
                            @click="$emit('export-csv')"
                            class="text-[10px] font-extrabold text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg transition-all flex items-center gap-2 shadow-sm border border-white/10 hover:scale-105 active:scale-95"
                            title="Descargar Reporte en Excel/CSV"
                        >
                            <i class="fas fa-file-download text-xs"></i> <span>DESCARGAR REPORTES</span>
                        </button>
                        <span class="text-xs font-bold text-verde-cope bg-white px-3 py-1 rounded-full shadow-sm shrink-0 whitespace-nowrap">
                            {{ pagination.total }} TOTAL
                        </span>
                    </div>
                </div>

                <!-- Header Part 2: Functional Filters -->
                <!-- Desktop View (Buttons) -->
                <div class="hidden sm:flex px-2 py-1 gap-1 overflow-x-auto custom-scrollbar no-scrollbar w-full min-w-0">
                    <button
                        v-for="tab in statusTabs"
                        :key="tab.value"
                        @click="selectStatus(tab.value)"
                        class="px-2.5 py-1 rounded-md text-[9px] font-bold transition-all whitespace-nowrap uppercase tracking-wider shrink-0"
                        :class="filtros.estado === tab.value
                            ? 'bg-white text-[var(--color-verde-cope)] shadow-sm'
                            : 'text-white/70 hover:text-white hover:bg-white/10'"
                    >
                        {{ tab.label }}
                    </button>
                </div>

                <!-- Mobile View (Dropdown) -->
                <div class="sm:hidden px-2 py-1.5 w-full">
                    <select
                        :value="filtros.estado"
                        @change="selectStatus($event.target.value)"
                        class="w-full text-[11px] font-bold text-gray-700 uppercase tracking-widest bg-white/90 border-none rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50 px-2.5 py-1.5"
                    >
                        <option
                            v-for="tab in statusTabs"
                            :key="tab.value"
                            :value="tab.value"
                            class="text-gray-800 font-bold"
                        >
                            {{ tab.label }}
                        </option>
                    </select>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div v-if="loadingList" class="space-y-3 p-2">
                    <div v-for="i in 5" :key="i" class="p-4 rounded-xl bg-white/10 animate-pulse">
                        <div class="flex justify-between items-start mb-2">
                            <div class="h-3 bg-white/20 rounded w-12"></div>
                            <div class="h-4 bg-white/20 rounded-full w-20"></div>
                        </div>
                        <div class="h-4 bg-white/20 rounded w-3/4 mb-3"></div>
                        <div class="flex justify-between items-end mt-2">
                            <div class="h-3 bg-white/20 rounded w-1/3"></div>
                            <div class="h-3 bg-white/20 rounded w-16"></div>
                        </div>
                    </div>
                </div>
                <div v-else-if="solicitudes.length === 0" class="text-center p-8 text-white/40 text-sm">
                    <i class="fas fa-inbox text-3xl mb-2 text-white/20"></i><br>
                    No tienes casos asignados actualmente.
                </div>
                <div v-else class="space-y-2 px-1 py-1">
                    <div v-for="sol in solicitudes" :key="sol.id"
                         @click="$emit('seleccionar', sol)"
                         class="bg-white/5 rounded-xl p-3 cursor-pointer border border-white/10 hover:bg-white/10 hover:border-verde-cope/30 transition-all duration-300 group relative overflow-hidden flex flex-col gap-1.5">

                        <div class="absolute left-0 top-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-100 transition-opacity" style="background-color: var(--color-verde-cope)"></div>

                        <div class="flex justify-between items-start pl-2 gap-2">
                            <h3 class="font-bold text-sm text-white leading-tight group-hover:text-emerald-400 transition-colors line-clamp-1 min-w-0 flex-1 pr-2">
                                <span class="text-xs text-white/40 font-normal mr-1 shrink-0">#{{ sol.id }}</span>
                                <span class="break-all">{{ sol.titulo }}</span>
                            </h3>
                            <span class="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase flex items-center gap-1 shrink-0 shadow-sm" :class="getEstadoClass(sol.estado)">
                                <i :class="getEstadoIcon(sol.estado)" class="text-[10px]"></i>
                                <span class="hidden sm:inline-block">{{ sol.estado?.replace('_', ' ') }}</span>
                            </span>
                        </div>

                        <div class="flex justify-between items-center pl-2 mt-1">
                            <div class="flex items-center gap-1.5 text-[11px] text-white/60 max-w-[65%] truncate" title="Agencia">
                                <i class="fas fa-building text-white/30 text-[10px]"></i>
                                <span class="truncate font-medium">{{ sol.agencia?.nombre || 'Sin Agencia' }}</span>
                            </div>
                            <div class="flex items-center gap-1.5 text-[10px] text-white/40 font-medium shrink-0">
                                <i class="far fa-calendar-alt"></i>
                                {{ new Date(sol.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-4 shrink-0 flex justify-center bg-white/5 z-10 border-t border-white/10">
                 <div class="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10 shadow-inner inline-flex">
                     <button @click="$emit('cambiarPagina', pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg bg-white/10 text-white shadow-sm hover:bg-white/20 disabled:opacity-30 transition-all disabled:pointer-events-none">
                         <i class="fas fa-chevron-left"></i>
                     </button>
                     <span class="text-[11px] px-3 font-bold text-white/60 tracking-widest uppercase">
                         Pág {{ pagination.current_page }} <span class="mx-0.5 font-normal text-white/20">/</span> {{ pagination.last_page }}
                     </span>
                     <button @click="$emit('cambiarPagina', pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg bg-white/10 text-white shadow-sm hover:bg-white/20 disabled:opacity-30 transition-all disabled:pointer-events-none">
                         <i class="fas fa-chevron-right"></i>
                     </button>
                 </div>
            </div>
        </div>

        <!-- VISTA DE DETALLE -->
        <div v-else class="flex flex-col h-full overflow-hidden bg-transparent relative z-10 w-full">
             <div class="p-2 px-4 shrink-0 flex items-center justify-between z-10 shadow-sm" style="background-color: var(--color-azul-cope)">
                <button @click="$emit('verBackToList')" class="text-blue-900 dark:text-blue-100 hover:text-blue-950 dark:hover:text-white bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition px-2.5 py-1 text-[10px] flex items-center gap-2 font-bold rounded-md shadow-sm">
                    <i class="fas fa-arrow-left"></i> VOLVER
                </button>
                <div class="flex items-center gap-2">
                    <!-- Actions integrate directly here -->
                    <button v-if="selectedSolicitud && selectedSolicitud.estado !== 'cerrada'" @click="showReasignarModal = true"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg shadow-sm transition text-xs font-bold flex items-center gap-2">
                        <i class="fas fa-exchange-alt"></i> REASIGNAR
                    </button>
                    <button v-if="canFinalize" @click="showFinalizarModal = true"
                            class="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg shadow-sm transition text-xs font-bold flex items-center gap-2">
                        <i class="fas fa-check-circle"></i> FINALIZAR CASO
                    </button>

                    <span class="text-[10px] text-white/80 font-bold uppercase tracking-widest leading-none">ID: {{ selectedSolicitud.id }}</span>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-5 custom-scrollbar relative">
                <div v-if="loadingDetail" class="space-y-6 animate-pulse p-2">
                    <div>
                        <div class="h-3 bg-white/10 rounded w-24 mb-2"></div>
                        <div class="h-6 bg-white/10 rounded w-3/4"></div>
                    </div>
                </div>
                <template v-else-if="solicitudDetalle">
                    <div class="space-y-6">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="text-xs text-white/40 uppercase tracking-widest font-semibold mb-1">Título</div>
                                <h1 class="text-xl font-bold text-white">{{ solicitudDetalle.titulo }}</h1>
                            </div>
                            <span class="px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 bg-white/10 text-white uppercase flex items-center gap-1.5 shadow-sm ml-4 mt-5">
                                <i :class="getEstadoIcon(selectedSolicitud.estado)" class="text-[10px]"></i>
                                {{ selectedSolicitud.estado?.replace('_', ' ') }}
                            </span>
                        </div>

                        <div class="grid grid-cols-2 gap-4 bg-white/5 p-6 rounded-2xl shadow-inner border border-white/10">
                            <div class="flex flex-col">
                                <span class="text-[10px] text-white/40 uppercase font-bold mb-1 flex items-center gap-1.5">
                                    <i class="fas fa-building text-white/20"></i> Agencia
                                </span>
                                <span class="text-sm font-bold text-white/80">{{ solicitudDetalle.agencia?.nombre || 'S/A' }}</span>
                            </div>
                            <div class="flex flex-col pt-2 border-t border-white/10">
                                <span class="text-[10px] text-white/40 uppercase font-bold mb-1 flex items-center gap-1.5">
                                    <i class="fas fa-user text-white/20"></i> Solicitante
                                </span>
                                <span class="text-sm font-bold text-white/80">{{ solicitudDetalle.creado_por?.name || 'Sistema' }}</span>
                                <span class="text-[10px] text-white/60 line-clamp-1 mt-0.5">{{ solicitudDetalle.creado_por?.puesto?.nombre || 'Sin puesto' }}</span>
                            </div>
                            <div class="flex flex-col pt-2 border-t border-white/10">
                                <span class="text-[10px] text-white/40 uppercase font-bold mb-1 flex items-center gap-1.5">
                                    <i class="fas fa-user-check text-white/20"></i> Responsable
                                </span>
                                <span class="text-sm font-bold text-white/80">{{ solicitudDetalle.responsable?.name || 'No Asignado' }}</span>
                            </div>
                             <div v-if="solicitudDetalle.area" class="flex flex-col pt-2 border-t border-white/10">
                                <span class="text-[10px] text-white/40 uppercase font-bold mb-1 flex items-center gap-1.5">
                                    <i class="fas fa-map-marker-alt text-white/20"></i> Área/Ubicación
                                </span>
                                <span class="text-sm font-bold text-white/80">{{ solicitudDetalle.area }}</span>
                            </div>
                        </div>

                        <div>
                            <div class="text-xs text-white/40 uppercase tracking-widest font-bold mb-2 ml-1 flex items-center gap-2">
                                <i class="fas fa-align-left text-white/20"></i> Descripción
                            </div>
                            <div class="bg-white/5 p-5 rounded-2xl text-white/80 text-sm whitespace-pre-wrap leading-relaxed shadow-inner border border-white/10">
                                {{ solicitudDetalle.descripcion }}
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- MODALS -->
        <!-- Finalizar Caso -->
        <div v-if="showFinalizarModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
            <div class="bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-verde-cope/30 animate-fade-in-up">
                <div class="bg-verde-cope p-5 text-white flex justify-between items-center shadow-lg">
                    <h3 class="font-bold text-lg uppercase tracking-wider"><i class="fas fa-check-circle mr-2"></i> Finalizar Caso</h3>
                    <button @click="showFinalizarModal = false" class="hover:bg-white/20 rounded-full p-2 transition-colors"><i class="fas fa-times"></i></button>
                </div>

                <div class="p-6 space-y-6">
                    <div class="bg-white/5 p-4 rounded-xl text-sm text-white/80 border border-white/10">
                        <i class="fas fa-info-circle mr-2 text-verde-cope"></i>
                        Describe la solución aplicada y adjunta evidencias de la resolución.
                    </div>

                    <div>
                        <label class="block text-[10px] font-bold text-white/40 uppercase mb-2 tracking-widest">Solución Aplicada <span class="text-red-500">*</span></label>
                        <textarea
                            v-model="cierreData.comentario"
                            rows="4"
                            class="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-verde-cope resize-none transition-all text-white outline-none placeholder:text-white/20 shadow-inner"
                            placeholder="Ej: Se restableció la conexión..."
                        ></textarea>
                    </div>

                    <div>
                        <label class="block text-[10px] font-bold text-white/40 uppercase mb-2 tracking-widest">Evidencias de Solución</label>
                        <input
                            type="file"
                            multiple
                            @change="handleCierreFileUpload"
                            class="w-full text-xs text-white/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 transition cursor-pointer"
                        >
                    </div>
                </div>

                <div class="p-5 bg-white/5 flex justify-end gap-3 border-t border-white/10">
                    <button @click="showFinalizarModal = false" class="px-5 py-2 text-white/60 hover:text-white transition-colors font-bold text-[10px] uppercase tracking-widest">Cancelar</button>
                    <button
                        @click="submitCierre"
                        :disabled="!cierreData.comentario"
                        class="bg-verde-cope hover:opacity-90 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-900/20 transition font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                    >
                        Confirmar Resolución
                    </button>
                </div>
            </div>
        </div>
        <!-- Reasignar Caso Modal -->
        <AsignarSolicitudModal
            :isOpen="showReasignarModal"
            :solicitudId="selectedSolicitud?.id"
            :categoriaGeneralId="selectedSolicitud?.categoria_general_id"
            @close="showReasignarModal = false"
            @assigned="onReasignado"
        />


    </div>
</template>
