<script setup>
import { ref, onMounted, watch } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import { useAuthStore } from '@/stores/auth';
import Swal from 'sweetalert2';

const authStore = useAuthStore();

// UI State
const loadingList = ref(false);
const loadingDetail = ref(false);

// Data
const solicitudes = ref([]);
const agencias = ref([]);
const selectedSolicitud = ref(null);
const solicitudDetalle = ref(null);

// Pagination
const pagination = ref({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 50
});

// Filters
const filtros = ref({
    tipo: '2', // Default to Administrativo (2) as it's common, or leave empty
    estado: 'reportada', // Default as requested
    agencia_id: ''
});

const estados = [
    { value: '', label: 'Todos' },
    { value: 'reportada', label: 'Reportadas' },
    { value: 'asignada', label: 'Asignadas' },
    { value: 'en_seguimiento', label: 'En Seguimiento' },
    { value: 'pendiente_validacion', label: 'Por Validar' },
    { value: 'cerrada', label: 'Cerradas' }
];

const tipos = [
    { value: '', label: 'Ambos' },
    { value: '1', label: 'Tecnológico' },
    { value: '2', label: 'Administrativo' }
];

onMounted(async () => {
    await cargarAgencias();
    await cargarSolicitudes();
});

// Watch for filter changes to auto-load
watch(filtros, () => {
    cargarSolicitudes(1);
}, { deep: true });


const cargarAgencias = async () => {
    try {
        const response = await SolicitudService.getAgencias();
        agencias.value = response.data;
    } catch (e) {
        console.error("Error cargando agencias", e);
    }
};

const cargarSolicitudes = async (page = 1) => {
    loadingList.value = true;
    selectedSolicitud.value = null; // Reset selection on new search
    solicitudDetalle.value = null;

    try {
        const params = {
            page: page,
            ...filtros.value
        };

        const response = await SolicitudService.getAuditSolicitudes(params);

        solicitudes.value = response.data.data;
        pagination.value = {
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            total: response.data.total,
            per_page: response.data.per_page,
            from: response.data.from,
            to: response.data.to
        };
    } catch (e) {
        console.error("Error cargando solicitudes", e);
    } finally {
        loadingList.value = false;
    }
};

const limpiarFiltros = () => {
    filtros.value = {
        tipo: '',
        estado: '',
        agencia_id: ''
    };
    // Watcher will automatically trigger cargarSolicitudes
};

const cambiarPagina = (page) => {
    if (page >= 1 && page <= pagination.value.last_page) {
        cargarSolicitudes(page);
    }
};

const seleccionarSolicitud = async (solicitud) => {
    selectedSolicitud.value = solicitud;
    loadingDetail.value = true;
    solicitudDetalle.value = null;

    try {
        const response = await SolicitudService.getAuditSolicitud(solicitud.id);
        solicitudDetalle.value = response.data;
    } catch (error) {
        console.error("Error cargando detalle de solicitud", error);
        Swal.fire('Error', 'No se pudo cargar el detalle de la solicitud', 'error');
        selectedSolicitud.value = null;
    } finally {
        loadingDetail.value = false;
    }
};

const verBackToList = () => {
    selectedSolicitud.value = null;
    solicitudDetalle.value = null;
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

const openFileUrl = async (url) => {
   if (url) {
       window.open(url, '_blank');
   }
};

// Compute all files for div4
import { computed } from 'vue';
const allFiles = computed(() => {
    if (!solicitudDetalle.value) return [];

    let files = [];

    // Evidencias Iniciales
    if (solicitudDetalle.value.evidencias_inicial_urls) {
        solicitudDetalle.value.evidencias_inicial_urls.forEach((url, index) => {
            if(url) {
                const parts = solicitudDetalle.value.evidencias_inicial[index].split('/');
                files.push({ group: 'Inicial', url: url, name: parts[parts.length - 1] || `Archivo ${index+1}` });
            }
        });
    }

    // Evidencias Finales
    if (solicitudDetalle.value.evidencias_final_urls) {
        solicitudDetalle.value.evidencias_final_urls.forEach((url, index) => {
            if(url) {
                const parts = solicitudDetalle.value.evidencias_final[index].split('/');
                files.push({ group: 'Final', url: url, name: parts[parts.length - 1] || `Archivo ${index+1}` });
            }
        });
    }

    // Seguimientos
    if (solicitudDetalle.value.seguimientos) {
        solicitudDetalle.value.seguimientos.forEach(seg => {
            if (seg.evidencias && seg.evidencias.length > 0) {
                seg.evidencias.forEach((url, i) => {
                    if(url) {
                        files.push({ group: `Seguimiento #${seg.id}`, url: url, name: `Adjunto ${i+1}` });
                    }
                });
            }
        });
    }

    return files;
});

</script>

<template>
    <div class="p-4 h-[calc(100vh-80px)] overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl relative">
        <div class="h-full w-full custom-grid overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm">

            <!-- DIV 1: Filtros -->
            <div class="div1 border-b border-r dark:border-gray-700 p-4 shrink-0 bg-gray-50 dark:bg-gray-800 flex items-center gap-4 overflow-x-auto custom-scrollbar">
                <div class="font-bold text-gray-700 dark:text-gray-200 shrink-0 text-sm">
                    <i class="fas fa-filter mr-2"></i>Filtros:
                </div>

                <div class="flex-1 flex gap-3 min-w-0">
                    <select v-model="filtros.tipo" class="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-verde-cope focus:border-verde-cope py-1.5 px-3">
                        <option v-for="t in tipos" :key="t.value" :value="t.value">{{ t.label }}</option>
                    </select>

                    <select v-model="filtros.estado" class="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-verde-cope focus:border-verde-cope py-1.5 px-3">
                        <option v-for="est in estados" :key="est.value" :value="est.value">{{ est.label }}</option>
                    </select>

                    <select v-model="filtros.agencia_id" class="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-verde-cope focus:border-verde-cope py-1.5 px-3 flex-1 min-w-[150px] max-w-xs">
                        <option value="">Todas las Agencias</option>
                        <option v-for="ag in agencias" :key="ag.id" :value="ag.id">{{ ag.nombre }}</option>
                    </select>
                </div>

                <button @click="limpiarFiltros" class="shrink-0 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm font-medium transition flex items-center gap-2">
                    <i class="fas fa-sync-alt"></i> Limpiar Filtros
                </button>
            </div>

            <!-- DIV 2: Lista / Detalle -->
            <div class="div2 border-r dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden">
                <!-- VISTA DE LISTA -->
                <div v-if="!selectedSolicitud" class="flex flex-col h-full overflow-hidden">
                    <div class="p-3 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 shrink-0 flex justify-between items-center">
                        <h2 class="text-sm font-bold text-gray-700 dark:text-gray-200">Lista de Solicitudes</h2>
                        <span class="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{{ pagination.total }}</span>
                    </div>

                    <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
                        <div v-if="loadingList" class="flex justify-center items-center h-32">
                            <i class="fas fa-spinner fa-spin text-2xl text-verde-cope"></i>
                        </div>
                        <div v-else-if="solicitudes.length === 0" class="text-center p-8 text-gray-500 text-sm">
                            <i class="fas fa-inbox text-3xl mb-2 text-gray-300"></i><br>
                            No hay resultados con estos filtros
                        </div>
                        <div v-else class="space-y-2">
                            <div v-for="sol in solicitudes" :key="sol.id"
                                 @click="seleccionarSolicitud(sol)"
                                 class="p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-verde-cope/50 hover:bg-verde-cope/5 dark:hover:bg-verde-cope/10 cursor-pointer transition-all duration-200 group">
                                <div class="flex justify-between items-start mb-1">
                                    <span class="text-xs font-mono text-gray-500">#{{ sol.id }}</span>
                                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border" :class="getEstadoClass(sol.estado)">
                                        {{ sol.estado?.replace('_', ' ').toUpperCase() }}
                                    </span>
                                </div>
                                <h3 class="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1 group-hover:text-verde-cope transition-colors">
                                    {{ sol.titulo }}
                                </h3>
                                <div class="flex justify-between items-end mt-2">
                                    <div class="text-[11px] text-gray-500 dark:text-gray-400">
                                        <i class="fas fa-building mr-1"></i>{{ sol.agencia?.nombre || 'S/A' }}
                                    </div>
                                    <div class="text-[11px] text-gray-400 font-medium">
                                        {{ new Date(sol.created_at).toLocaleDateString() }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="p-2 border-t dark:border-gray-700 shrink-0 bg-gray-50/50 dark:bg-gray-800 flex justify-center py-2">
                         <div class="flex gap-2">
                             <button @click="cambiarPagina(pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700">Ant</button>
                             <span class="text-xs py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
                             <button @click="cambiarPagina(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700">Sig</button>
                         </div>
                    </div>
                </div>

                <!-- VISTA DE DETALLE -->
                <div v-else class="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800 relative z-10 w-full">
                     <div class="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0 flex items-center justify-between shadow-sm">
                        <button @click="verBackToList" class="text-gray-500 hover:text-verde-cope transition p-1 text-sm flex items-center gap-1 font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2">
                            <i class="fas fa-arrow-left"></i> Volver a la Lista
                        </button>
                        <span class="px-2.5 py-1 rounded-full text-xs font-bold border" :class="getEstadoClass(selectedSolicitud.estado)">
                            {{ selectedSolicitud.estado?.replace('_', ' ').toUpperCase() }}
                        </span>
                    </div>
                    <div class="flex-1 overflow-y-auto p-5 custom-scrollbar relative">
                        <div v-if="loadingDetail" class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex justify-center items-center z-20 backdrop-blur-sm">
                            <i class="fas fa-spinner fa-spin text-3xl text-verde-cope"></i>
                        </div>
                        <template v-else-if="solicitudDetalle">
                            <div class="space-y-6">
                                <div>
                                    <div class="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Título</div>
                                    <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">{{ solicitudDetalle.titulo }}</h1>
                                </div>

                                <div class="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <div>
                                        <div class="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Agencia</div>
                                        <div class="text-sm font-medium dark:text-gray-300">{{ solicitudDetalle.agencia?.nombre || 'S/A' }}</div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Categoría</div>
                                        <div class="text-sm font-medium dark:text-gray-300">{{ solicitudDetalle.categoria_general_id === 1 ? 'Tecnológico' : 'Administrativo' }}</div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Solicitante</div>
                                        <div class="text-sm font-medium dark:text-gray-300">{{ solicitudDetalle.creado_por?.name || 'Sistema' }}</div>
                                        <div class="text-xs text-gray-500">{{ solicitudDetalle.creado_por?.puesto?.nombre || '' }}</div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Responsable</div>
                                        <div class="text-sm font-medium dark:text-gray-300">{{ solicitudDetalle.responsable?.name || 'No Asignado' }}</div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] text-gray-400 uppercase font-bold mb-0.5">F. Creación</div>
                                        <div class="text-sm font-medium dark:text-gray-300">{{ new Date(solicitudDetalle.created_at).toLocaleString() }}</div>
                                    </div>
                                    <div>
                                        <div class="text-[10px] text-gray-400 uppercase font-bold mb-0.5">F. Actualización</div>
                                        <div class="text-sm font-medium dark:text-gray-300">{{ new Date(solicitudDetalle.updated_at).toLocaleString() }}</div>
                                    </div>
                                </div>

                                <div>
                                    <div class="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Descripción</div>
                                    <div class="bg-blue-50/50 dark:bg-gray-900/50 p-4 rounded-lg border border-blue-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                                        {{ solicitudDetalle.descripcion }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <!-- DIV 3: Historial de Conversaciones -->
            <div class="div3 border-b dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900 flex flex-col overflow-hidden">
                <div class="p-3 border-b dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-between">
                    <h2 class="text-sm font-bold text-gray-700 dark:text-gray-200"><i class="fas fa-history mr-2 text-gray-400"></i>Historial de Eventos</h2>
                </div>

                <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div v-if="!selectedSolicitud" class="h-full flex flex-col justify-center items-center text-gray-400 dark:text-gray-600 p-6 text-center">
                        <i class="fas fa-mouse-pointer text-4xl mb-3 opacity-50"></i>
                        <p class="text-sm font-medium">Seleccione una solicitud para ver su historial</p>
                    </div>
                    <div v-else-if="loadingDetail" class="flex justify-center items-center h-full">
                        <i class="fas fa-spinner fa-spin text-verde-cope text-2xl"></i>
                    </div>
                    <div v-else-if="solicitudDetalle?.seguimientos?.length === 0" class="h-full flex flex-col justify-center items-center text-gray-400 italic text-sm">
                        No hay eventos registrados
                    </div>
                    <div v-else class="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-700 before:to-transparent">

                        <div v-for="seg in solicitudDetalle.seguimientos" :key="seg.id" class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                            <div class="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-gray-900 bg-white dark:bg-gray-800 text-gray-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-sm">
                                <i v-if="seg.tipo_accion === 'visita'" class="fas fa-walking text-blue-500"></i>
                                <i v-else-if="seg.tipo_accion === 'evidencia'" class="fas fa-paperclip text-orange-500"></i>
                                <i v-else-if="seg.tipo_accion === 'validacion'" class="fas fa-check-circle text-green-500"></i>
                                <i v-else-if="seg.tipo_accion === 'reapertura'" class="fas fa-undo text-red-500"></i>
                                <i v-else class="fas fa-comment text-emerald-500"></i>
                            </div>

                            <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative">
                                <div class="flex items-center justify-between mb-1">
                                    <div class="font-bold text-gray-900 dark:text-gray-100 px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 w-max">
                                        {{ seg.seguimiento_por_nombre }}
                                    </div>
                                    <time class="text-[10px] text-gray-500 font-mono">{{ new Date(seg.created_at).toLocaleString() }}</time>
                                </div>
                                <div class="text-xs text-gray-400 mb-2 truncate">
                                    {{ seg.seguimiento_por_cargo || 'Sin cargo' }}
                                </div>
                                <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed" v-html="seg.comentario">
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <!-- DIV 4: Archivos Adjuntos -->
            <div class="div4 bg-gray-50/50 dark:bg-gray-900 flex flex-col overflow-hidden">
                <div class="p-3 border-b dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-between">
                    <h2 class="text-sm font-bold text-gray-700 dark:text-gray-200"><i class="fas fa-paperclip mr-2 text-gray-400"></i>Archivos Adjuntos</h2>
                </div>

                <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div v-if="!selectedSolicitud" class="h-full flex flex-col justify-center items-center text-gray-400 dark:text-gray-600 p-4 text-center">
                        <i class="fas fa-folder-open text-3xl mb-2 opacity-50"></i>
                        <p class="text-xs font-medium">Archivos aparecerán aquí</p>
                    </div>
                    <div v-else-if="loadingDetail" class="flex justify-center items-center h-full">
                        <i class="fas fa-spinner fa-spin text-verde-cope text-xl"></i>
                    </div>
                    <div v-else-if="allFiles.length === 0" class="h-full flex flex-col justify-center items-center text-gray-400 italic text-sm">
                        No hay archivos adjuntos
                    </div>
                    <div v-else class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        <div v-for="(file, idx) in allFiles" :key="idx"
                             @click="openFileUrl(file.url)"
                             class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:border-verde-cope hover:shadow-md transition-all group h-24 relative overflow-hidden">

                            <div class="absolute top-0 left-0 w-full bg-gray-100 dark:bg-gray-700 text-[9px] font-bold text-gray-500 py-0.5 px-1 uppercase truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                {{ file.group }}
                            </div>

                            <i class="fas fa-file-alt text-2xl text-blue-400 mb-2 mt-2 group-hover:scale-110 transition-transform"></i>
                            <span class="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate w-full px-1" :title="file.name">
                                {{ file.name }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
/* Estilos para el Grid solicitado por el usuario */
.custom-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(5, 1fr); /* Div 1: row 1, Div 2: row 2-5. So 1+4 = 5 rows total is enough, but wait */
    /* Modifying grid rows appropriately for layout: Div 1 is filters (small), Div 2 list (large row 2-5), Div 3 detail history (middle heights), Div 4 files (bottom) */
    /* Let's adjust rows so Div 1 isn't 1/5th. We use standard CSS Grid but with custom row tracks for better UX */
    grid-template-rows: 60px 1fr 1fr 1fr 200px;
}

.div1 { grid-area: 1 / 1 / 2 / 4; }
.div2 { grid-area: 2 / 1 / 6 / 4; }
.div3 { grid-area: 1 / 4 / 5 / 6; }
.div4 { grid-area: 5 / 4 / 6 / 6; }

/* Responsive Grid for mobile */
@media (max-width: 1024px) {
    .custom-grid {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }
    .div1, .div2, .div3, .div4 {
        height: auto;
        flex: none;
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
    }
    .div2 {
        height: 600px; /* fixed height for list/detail on mobile before scroll */
    }
    .div3 {
        height: 400px;
    }
    .div4 {
        height: 300px;
    }
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 9999px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #475569;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
}
</style>
