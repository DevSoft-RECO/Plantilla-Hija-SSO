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
            <div v-else class="flex flex-col pt-2 pb-4 space-y-6">

                <div v-for="seg in solicitudDetalle.seguimientos" :key="seg.id"
                     class="flex items-end gap-2 w-full max-w-[95%] md:max-w-[85%]"
                     :class="seg.seguimiento_por_id === solicitudDetalle.user_id ? 'self-start' : 'self-end flex-row-reverse'">

                    <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-sm shrink-0 z-10 text-[10px] text-white"
                         :style="{ backgroundColor: seg.seguimiento_por_id === solicitudDetalle.user_id ? 'var(--color-azul-cope)' : 'var(--color-verde-cope)' }">
                        <i v-if="seg.tipo_accion === 'visita'" class="fas fa-walking"></i>
                        <i v-else-if="seg.tipo_accion === 'evidencia'" class="fas fa-paperclip"></i>
                        <i v-else-if="seg.tipo_accion === 'validacion'" class="fas fa-check-circle"></i>
                        <i v-else-if="seg.tipo_accion === 'reapertura'" class="fas fa-undo"></i>
                        <i v-else class="fas fa-comment"></i>
                    </div>

                    <div class="flex flex-col w-full min-w-0 font-sans" :class="seg.seguimiento_por_id === solicitudDetalle.user_id ? 'items-start' : 'items-end'">

                        <div class="flex items-baseline gap-2 mb-1 px-1" :class="seg.seguimiento_por_id === solicitudDetalle.user_id ? 'flex-row' : 'flex-row-reverse'">
                            <span class="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                                {{ seg.seguimiento_por_nombre.split(' ').slice(0, 2).join(' ') }}
                            </span>
                            <span class="text-[9px] text-gray-400 font-medium tracking-wide">
                                {{ seg.seguimiento_por_cargo || 'Usuario' }}
                            </span>
                        </div>

                        <div class="p-3 shadow-sm border text-[13px] text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed relative"
                             :class="seg.seguimiento_por_id === solicitudDetalle.user_id
                                ? 'bg-white dark:bg-gray-800 border-blue-100 dark:border-blue-900/50 rounded-2xl rounded-bl-sm'
                                : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800/50 rounded-2xl rounded-br-sm'">
                            <div v-html="seg.comentario"></div>

                            <div class="mt-2 text-[10px] text-gray-400 font-bold tracking-widest flex items-center gap-1 opacity-80"
                                 :class="seg.seguimiento_por_id === solicitudDetalle.user_id ? 'justify-end' : 'justify-start'">
                                <i class="far fa-clock"></i> {{ new Date(seg.created_at).toLocaleString([], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' }) }}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>
