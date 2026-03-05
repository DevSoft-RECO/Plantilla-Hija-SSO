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
    <div class="div2 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden rounded-2xl shadow-md relative transition-shadow hover:shadow-lg">
        <div class="absolute top-0 left-0 w-full h-1.5 z-20" style="background-color: var(--color-azul-cope)"></div>

        <!-- VISTA DE LISTA -->
        <div v-if="!selectedSolicitud" class="flex flex-col h-full overflow-hidden mt-1.5">
            <div class="p-4 shrink-0 flex justify-between items-center bg-white dark:bg-gray-800 z-10 border-b border-gray-100 dark:border-gray-700">
                <h2 class="text-base font-bold text-gray-800 dark:text-gray-100 tracking-wide flex items-center gap-2">
                    <i class="fas fa-list-ul text-gray-400"></i> Lista de Solicitudes
                </h2>
                <span class="text-xs font-bold text-white px-3 py-1 rounded-full shadow-sm" style="background-color: var(--color-azul-cope)">
                    {{ pagination.total }} solicitudes
                </span>
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
                    No hay resultados con estos filtros
                </div>
                <div v-else class="space-y-4 px-1 py-1">
                    <div v-for="sol in solicitudes" :key="sol.id"
                         @click="$emit('seleccionar', sol)"
                         class="bg-white dark:bg-gray-800 rounded-xl p-4 cursor-pointer shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-300 group relative overflow-hidden flex flex-col gap-3">

                        <!-- Hover left border indicator -->
                        <div class="absolute left-0 top-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-100 transition-opacity" style="background-color: var(--color-verde-cope)"></div>

                        <!-- Header Row: ID + Status Pill -->
                        <div class="flex justify-between items-center pl-2">
                            <div class="flex items-center gap-2">
                                <div class="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                    <i class="fas fa-hashtag text-[10px] text-gray-400"></i>
                                </div>
                                <span class="font-bold text-xs text-gray-600 dark:text-gray-300 tracking-wider">{{ sol.id }}</span>
                            </div>
                            <span class="px-3 py-1 rounded-full text-[10px] font-bold border-none uppercase flex items-center gap-1.5 shadow-sm" :class="getEstadoClass(sol.estado)">
                                <i class="fas fa-circle text-[6px]"></i>
                                {{ sol.estado?.replace('_', ' ') }}
                            </span>
                        </div>

                        <!-- Title -->
                        <div class="pl-2">
                            <h3 class="font-bold text-[15px] text-gray-800 dark:text-gray-100 leading-tight group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-2" style="--tw-text-opacity: 1; color: var(--color-azul-cope);">
                                {{ sol.titulo }}
                            </h3>
                        </div>

                        <!-- Footer Info Row -->
                        <div class="flex justify-between items-center pt-2 mt-auto border-t border-gray-50 dark:border-gray-700/50 pl-2">
                            <div class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 max-w-[60%] truncate" title="Agencia">
                                <div class="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                    <i class="fas fa-building text-[9px] text-gray-400"></i>
                                </div>
                                <span class="truncate font-medium">{{ sol.agencia?.nombre || 'Sin Agencia' }}</span>
                            </div>
                            <div class="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-lg shrink-0">
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
        <div v-else class="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800 relative z-10 w-full mt-1.5">
             <div class="p-4 shrink-0 flex items-center justify-between bg-white dark:bg-gray-800 z-10 border-b border-gray-100 dark:border-gray-700">
                <button @click="$emit('verBackToList')" class="text-gray-500 hover:text-gray-800 dark:hover:text-white dark:text-gray-400 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition px-3 py-1.5 text-xs flex items-center gap-2 font-bold rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                    <i class="fas fa-arrow-left"></i> Volver a la Lista
                </button>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {{ selectedSolicitud.id }}</span>
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold border-none uppercase flex items-center gap-1.5 shadow-sm" :class="getEstadoClass(selectedSolicitud.estado)">
                        <i class="fas fa-circle text-[6px]"></i>
                        {{ selectedSolicitud.estado?.replace('_', ' ') }}
                    </span>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-5 custom-scrollbar relative">
                <div v-if="loadingDetail" class="space-y-6 animate-pulse p-2">
                    <div>
                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-gray-900/50 p-6 rounded-2xl shadow-inner">
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

                        <div class="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl shadow-inner border border-gray-100 dark:border-gray-800">
                            <div class="flex flex-col">
                                <span class="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1.5">
                                    <i class="fas fa-building text-gray-300"></i> Agencia
                                </span>
                                <span class="text-sm font-bold text-gray-700 dark:text-gray-200">{{ solicitudDetalle.agencia?.nombre || 'S/A' }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1.5">
                                    <i class="fas fa-tags text-gray-300"></i> Categoría
                                </span>
                                <span class="text-sm font-bold text-gray-700 dark:text-gray-200">{{ solicitudDetalle.categoria_general_id === 1 ? 'Tecnológico' : 'Administrativo' }}</span>
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
                            <div class="flex flex-col pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span class="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1.5">
                                    <i class="far fa-calendar-plus text-gray-300"></i> F. Creación
                                </span>
                                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ new Date(solicitudDetalle.created_at).toLocaleString() }}</span>
                            </div>
                            <div class="flex flex-col pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span class="text-[10px] text-gray-400 uppercase font-bold mb-1 flex items-center gap-1.5">
                                    <i class="far fa-edit text-gray-300"></i> F. Actualización
                                </span>
                                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ new Date(solicitudDetalle.updated_at).toLocaleString() }}</span>
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
    </div>
</template>
