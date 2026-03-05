<script setup>
defineProps({
    selectedSolicitud: Object,
    solicitudDetalle: Object,
    loadingDetail: Boolean
});
</script>

<template>
    <div class="div3 bg-white dark:bg-gray-800 flex flex-col overflow-hidden rounded-2xl shadow-md relative transition-shadow hover:shadow-lg border border-gray-100 dark:border-gray-700">
        <div class="p-4 shrink-0 flex items-center justify-between shadow-sm z-10" style="background-color: var(--color-verde-cope)">
            <h2 class="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <i class="fas fa-history text-white/80"></i>Historial de Eventos
            </h2>
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
            <div v-else class="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:rounded-full before:bg-gray-200 dark:before:bg-gray-700 pt-2">

                <div v-for="seg in solicitudDetalle.seguimientos" :key="seg.id" class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8">

                    <div class="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white dark:border-gray-800 bg-gray-50 dark:bg-gray-700 shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-sm transition-transform group-hover:scale-110" style="color: var(--color-verde-cope)">
                        <i v-if="seg.tipo_accion === 'visita'" class="fas fa-walking"></i>
                        <i v-else-if="seg.tipo_accion === 'evidencia'" class="fas fa-paperclip"></i>
                        <i v-else-if="seg.tipo_accion === 'validacion'" class="fas fa-check-circle" style="color: var(--color-verde-cope)"></i>
                        <i v-else-if="seg.tipo_accion === 'reapertura'" class="fas fa-undo" style="color: var(--color-azul-cope)"></i>
                        <i v-else class="fas fa-comment"></i>
                    </div>

                    <div class="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative">
                        <div class="flex items-center justify-between mb-3 border-b border-gray-50 dark:border-gray-700/50 pb-2">
                            <div class="font-bold text-white px-3 py-1 rounded-full text-[11px] shadow-sm uppercase tracking-wider" style="background-color: var(--color-azul-cope)">
                                {{ seg.seguimiento_por_nombre }}
                            </div>
                            <time class="text-[11px] text-gray-400 font-bold tracking-widest flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md">
                                <i class="far fa-clock"></i> {{ new Date(seg.created_at).toLocaleString() }}
                            </time>
                        </div>
                        <div class="text-[11px] text-gray-400 font-medium mb-3 truncate flex items-center gap-1.5 uppercase tracking-wider">
                            <i class="fas fa-id-badge"></i> {{ seg.seguimiento_por_cargo || 'Sin cargo' }}
                        </div>
                        <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl shadow-inner border border-gray-100 dark:border-gray-700/50" v-html="seg.comentario">
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>
