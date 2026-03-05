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

                <div v-for="seg in solicitudDetalle.seguimientos" :key="seg.id"
                     class="relative flex items-center justify-between md:justify-normal group is-active mb-8"
                     :class="seg.seguimiento_por_id === solicitudDetalle.user_id ? 'md:flex-row' : 'md:flex-row-reverse'">

                    <div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-gray-50 dark:bg-gray-700 shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-xs transition-transform group-hover:scale-110"
                         :style="{ color: seg.seguimiento_por_id === solicitudDetalle.user_id ? 'var(--color-azul-cope)' : 'var(--color-verde-cope)' }">
                        <i v-if="seg.tipo_accion === 'visita'" class="fas fa-walking"></i>
                        <i v-else-if="seg.tipo_accion === 'evidencia'" class="fas fa-paperclip"></i>
                        <i v-else-if="seg.tipo_accion === 'validacion'" class="fas fa-check-circle" style="color: var(--color-verde-cope)"></i>
                        <i v-else-if="seg.tipo_accion === 'reapertura'" class="fas fa-undo"></i>
                        <i v-else class="fas fa-comment"></i>
                    </div>

                    <div class="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-white dark:bg-gray-800 border p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative"
                         :class="seg.seguimiento_por_id === solicitudDetalle.user_id ? 'border-blue-100 dark:border-blue-900/50' : 'border-green-100 dark:border-green-900/50'">

                        <div class="flex items-center justify-between mb-2 pb-2 border-b"
                             :class="seg.seguimiento_por_id === solicitudDetalle.user_id ? 'border-blue-50 dark:border-gray-700/50' : 'border-green-50 dark:border-gray-700/50'">

                            <div class="flex flex-col gap-0.5">
                                <div class="font-bold text-white px-2 py-0.5 rounded-md text-[10px] shadow-sm tracking-wider w-fit"
                                     :style="{ backgroundColor: seg.seguimiento_por_id === solicitudDetalle.user_id ? 'var(--color-azul-cope)' : 'var(--color-verde-cope)' }">
                                    <i class="fas fa-user mr-1 text-white/80"></i>
                                    {{ seg.seguimiento_por_nombre.split(' ').slice(0, 2).join(' ') }}
                                </div>
                                <div class="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1 pl-0.5">
                                    <i class="fas fa-id-badge text-[8px]"></i>
                                    {{ seg.seguimiento_por_cargo || 'Usuario' }}
                                </div>
                            </div>

                            <time class="text-[10px] text-gray-400 font-bold tracking-widest flex items-center gap-1 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md shrink-0">
                                <i class="far fa-clock"></i> {{ new Date(seg.created_at).toLocaleString() }}
                            </time>
                        </div>

                        <div class="text-[13px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed p-3 rounded-xl shadow-inner border"
                             :class="seg.seguimiento_por_id === solicitudDetalle.user_id ? 'bg-blue-50/30 border-blue-50 dark:bg-gray-700/30 dark:border-gray-600/50' : 'bg-green-50/30 border-green-50 dark:bg-gray-700/30 dark:border-gray-600/50'"
                             v-html="seg.comentario">
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>
