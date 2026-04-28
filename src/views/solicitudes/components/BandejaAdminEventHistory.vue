<script setup>
import { ref } from 'vue';

defineProps({
    selectedSolicitud: Object,
    solicitudDetalle: Object,
    loadingDetail: Boolean,
    saving: Boolean
});

const emit = defineEmits(['enviar-seguimiento']);

const form = ref({
    comentario: '',
    evidencias: []
});

const fileInput = ref(null);

const triggerUpload = () => {
    fileInput.value.click();
};

const handleFileUpload = (event) => {
    const files = event.target.files;
    if (!files.length) return;
    for(let i=0; i<files.length; i++) {
        form.value.evidencias.push(files[i]);
    }
    event.target.value = '';
};

const removeFile = (idx) => {
    form.value.evidencias.splice(idx, 1);
};

const submit = () => {
    if (!form.value.comentario && !form.value.evidencias.length) return;
    emit('enviar-seguimiento', { ...form.value });
    // Reset form
    form.value.comentario = '';
    form.value.evidencias = [];
};

</script>

<template>
    <div class="div3 bg-white/10 backdrop-blur-md flex flex-col overflow-hidden rounded-2xl shadow-2xl relative transition-all border border-verde-cope/30">
        <div class="p-2 px-4 shrink-0 flex items-center justify-between shadow-sm z-10" style="background-color: var(--color-azul-cope)">
            <h2 class="text-xs font-bold text-white tracking-wide flex items-center gap-2 uppercase">
                <i class="fas fa-history text-white/80 text-[10px]"></i> Historial de Interacción
            </h2>
        </div>

        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/30 dark:bg-transparent">
            <div v-if="!selectedSolicitud" class="h-full flex flex-col justify-center items-center text-white/40 p-6 text-center">
                <i class="fas fa-mouse-pointer text-4xl mb-3 opacity-20"></i>
                <p class="text-sm font-medium">Seleccione un caso para interactuar</p>
            </div>
            <div v-else-if="loadingDetail" class="flex gap-2">
                <div v-for="i in 3" :key="i" class="bg-white/5 border border-white/10 rounded-lg p-1.5 flex flex-col items-center justify-center animate-pulse h-18 w-20">
                    <div class="h-6 w-6 bg-white/10 rounded mb-1"></div>
                    <div class="h-1.5 w-10 bg-white/10 rounded"></div>
                </div>
            </div>
            <div v-else-if="solicitudDetalle?.seguimientos?.length === 0" class="h-full flex flex-col justify-center items-center text-white/40 italic text-sm">
                Sin seguimiento del caso. ¡Inicia la conversación!
            </div>
            <div v-else class="flex flex-col pt-2 pb-4 space-y-6">

                <div v-for="seg in solicitudDetalle.seguimientos" :key="seg.id"
                     class="flex items-end gap-2 w-full max-w-[95%]"
                     :class="seg.seguimiento_por_id === (solicitudDetalle.user_id || solicitudDetalle.creado_por?.id) ? 'self-end flex-row-reverse' : 'self-start'">

                    <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-sm shrink-0 z-10 text-[10px] text-white"
                         :style="{ backgroundColor: seg.seguimiento_por_id === (solicitudDetalle.user_id || solicitudDetalle.creado_por?.id) ? 'var(--color-azul-cope)' : '#f97316' }">
                        <i v-if="seg.tipo_accion === 'visita'" class="fas fa-walking"></i>
                        <i v-else-if="seg.tipo_accion === 'evidencia'" class="fas fa-paperclip"></i>
                        <i v-else-if="seg.tipo_accion === 'validacion'" class="fas fa-check-circle"></i>
                        <i v-else-if="seg.tipo_accion === 'reapertura'" class="fas fa-undo"></i>
                        <i v-else class="fas fa-comment"></i>
                    </div>

                    <div class="flex flex-col w-full min-w-0 font-sans" :class="seg.seguimiento_por_id === (solicitudDetalle.user_id || solicitudDetalle.creado_por?.id) ? 'items-end' : 'items-start'">

                        <div class="flex items-baseline gap-2 mb-1 px-1" :class="seg.seguimiento_por_id === (solicitudDetalle.user_id || solicitudDetalle.creado_por?.id) ? 'flex-row-reverse' : 'flex-row'">
                            <span class="text-[11px] font-bold text-white/80">
                                {{ seg.seguimiento_por_nombre.split(' ').slice(0, 2).join(' ') }}
                            </span>
                            <span class="text-[9px] text-white/40 font-medium tracking-wide">
                                {{ seg.seguimiento_por_cargo || 'Usuario' }}
                            </span>
                        </div>

                        <div class="p-3 shadow-sm border text-[13px] text-white/80 whitespace-pre-wrap leading-relaxed relative"
                             :class="seg.seguimiento_por_id === (solicitudDetalle.user_id || solicitudDetalle.creado_por?.id)
                                ? 'bg-white/10 border-white/20 rounded-2xl rounded-br-sm'
                                : 'bg-orange-500/20 border-orange-500/30 text-white/90 rounded-2xl rounded-bl-sm'">
                            <div v-html="seg.comentario"></div>

                            <div v-if="seg.evidencias && seg.evidencias.length" class="mt-3 flex flex-wrap gap-2">
                                <a v-for="(ev, idx) in seg.evidencias" :key="idx" :href="ev" target="_blank"
                                   class="w-16 h-16 rounded overflow-hidden border border-white/10 hover:opacity-80 transition shadow-sm">
                                    <img v-if="ev.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i)" :src="ev" class="w-full h-full object-cover">
                                    <div v-else class="w-full h-full flex items-center justify-center bg-white/5 text-[10px]">
                                        <i class="fas fa-file-alt text-white/40"></i>
                                    </div>
                                </a>
                            </div>

                            <div class="mt-2 text-[10px] text-white/40 font-bold tracking-widest flex items-center gap-1 opacity-80 justify-end">
                                <i class="far fa-clock"></i> {{ new Date(seg.created_at).toLocaleString([], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' }) }}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- Interactive Area -->
        <div v-if="selectedSolicitud && solicitudDetalle?.estado !== 'cerrada'" class="p-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <div class="flex flex-col gap-1.5">
                <!-- Textarea -->
                <textarea
                    v-model="form.comentario"
                    rows="2"
                    placeholder="Escribe una actualización..."
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[13px] focus:ring-2 focus:ring-blue-500 transition-all resize-none text-white outline-none shadow-inner placeholder:text-white/20"
                    @keyup.ctrl.enter="submit"
                ></textarea>

                <!-- Footer with Integrated Buttons -->
                <div class="flex items-center justify-between">
                    <!-- File Tags Area -->
                    <div class="flex flex-wrap gap-1 overflow-x-auto pb-0.5 max-w-[60%] custom-scrollbar no-scrollbar items-center">
                         <div v-for="(file, idx) in form.evidencias" :key="idx"
                              class="bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-md text-[9px] flex items-center gap-1 border border-blue-100 dark:border-blue-900/50 shadow-sm">
                             <span class="max-w-[70px] truncate">{{ file.name }}</span>
                             <button @click="removeFile(idx)" class="hover:text-red-500 transition text-[8px]"><i class="fas fa-times"></i></button>
                         </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex items-center gap-1.5 shrink-0">
                         <input type="file" ref="fileInput" multiple class="hidden" @change="handleFileUpload">
                         <button @click="triggerUpload" title="Adjuntar archivos"
                                 class="w-7 h-7 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition flex items-center justify-center border border-white/10">
                             <i class="fas fa-paperclip text-xs"></i>
                         </button>

                         <button
                            @click="submit"
                            :disabled="saving || (!form.comentario && !form.evidencias.length)"
                            class="bg-[var(--color-azul-cope)] hover:opacity-90 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                         >
                            <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                            <template v-else>
                                <span>ENVIAR</span>
                                <i class="fas fa-paper-plane text-[9px]"></i>
                            </template>
                         </button>
                    </div>
                </div>
            </div>
        </div>
        <div v-else-if="solicitudDetalle?.estado === 'cerrada'" class="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 text-center">
             <p class="text-[11px] text-gray-500 dark:text-gray-400 italic font-medium">
                <i class="fas fa-lock mr-2"></i> Este caso está cerrado.
            </p>
        </div>
    </div>
</template>
