<script setup>
defineProps({
    selectedSolicitud: Object,
    solicitudDetalle: Object,
    loadingDetail: Boolean
});
</script>

<template>
    <div class="div3 border dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col overflow-hidden rounded-xl shadow-sm">
        <div class="p-3 border-b dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-between">
            <h2 class="text-sm font-bold text-gray-700 dark:text-gray-200"><i class="fas fa-history mr-2 text-gray-400"></i>Historial de Eventos</h2>
        </div>

        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div v-if="!selectedSolicitud" class="h-full flex flex-col justify-center items-center text-gray-400 dark:text-gray-600 p-6 text-center">
                <i class="fas fa-mouse-pointer text-4xl mb-3 opacity-50"></i>
                <p class="text-sm font-medium">Seleccione una solicitud para ver su historial</p>
            </div>
            <div v-else-if="loadingDetail" class="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
                <div v-for="i in 3" :key="i" class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-pulse">
                    <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"></div>
                    <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm relative">
                        <div class="flex items-center justify-between mb-2">
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
                        <div class="space-y-2 mt-2">
                            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
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
</template>
