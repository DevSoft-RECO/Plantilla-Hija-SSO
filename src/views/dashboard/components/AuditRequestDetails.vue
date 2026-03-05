<script setup>
defineProps({
    solicitudes: Array,
    selectedSolicitud: Object,
    solicitudDetalle: Object,
    loadingList: Boolean,
    loadingDetail: Boolean,
    pagination: Object
});

defineEmits(['seleccionar', 'cambiarPagina', 'verBackToList']);

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

</script>

<template>
    <div class="div2 border dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden rounded-xl shadow-sm">

        <!-- VISTA DE LISTA -->
        <div v-if="!selectedSolicitud" class="flex flex-col h-full overflow-hidden">
            <div class="p-3 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 shrink-0 flex justify-between items-center">
                <h2 class="text-sm font-bold text-gray-700 dark:text-gray-200">Lista de Solicitudes</h2>
                <span class="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{{ pagination.total }}</span>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div v-if="loadingList" class="space-y-3 p-2">
                    <div v-for="i in 5" :key="i" class="p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse">
                        <div class="flex justify-between items-start mb-2">
                            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
                        </div>
                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                        <div class="flex justify-between items-end mt-2">
                            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                    </div>
                </div>
                <div v-else-if="solicitudes.length === 0" class="text-center p-8 text-gray-500 text-sm">
                    <i class="fas fa-inbox text-3xl mb-2 text-gray-300"></i><br>
                    No hay resultados con estos filtros
                </div>
                <div v-else class="space-y-2">
                    <div v-for="sol in solicitudes" :key="sol.id"
                         @click="$emit('seleccionar', sol)"
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
                     <button @click="$emit('cambiarPagina', pagination.current_page - 1)" :disabled="pagination.current_page === 1" class="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700">Ant</button>
                     <span class="text-xs py-1">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
                     <button @click="$emit('cambiarPagina', pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page" class="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700">Sig</button>
                 </div>
            </div>
        </div>

        <!-- VISTA DE DETALLE -->
        <div v-else class="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800 relative z-10 w-full">
             <div class="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0 flex items-center justify-between shadow-sm">
                <button @click="$emit('verBackToList')" class="text-gray-500 hover:text-verde-cope transition p-1 text-sm flex items-center gap-1 font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2">
                    <i class="fas fa-arrow-left"></i> Volver a la Lista
                </button>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold border" :class="getEstadoClass(selectedSolicitud.estado)">
                    {{ selectedSolicitud.estado?.replace('_', ' ').toUpperCase() }}
                </span>
            </div>
            <div class="flex-1 overflow-y-auto p-5 custom-scrollbar relative">
                <div v-if="loadingDetail" class="space-y-6 animate-pulse p-2">
                    <div>
                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                        <div v-for="i in 6" :key="i">
                            <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        </div>
                    </div>
                    <div>
                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
                        <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800 space-y-2">
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                        </div>
                    </div>
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
</template>
