<script setup>
import { computed } from 'vue';

const props = defineProps({
    selectedSolicitud: Object,
    solicitudDetalle: Object,
    loadingDetail: Boolean
});

const openFileUrl = async (url) => {
   if (url) {
       window.open(url, '_blank');
   }
};

const isImage = (filename) => {
    if (!filename) return false;
    const ext = filename.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
};

const allFiles = computed(() => {
    if (!props.solicitudDetalle) return [];

    let files = [];

    // Evidencias Iniciales
    if (props.solicitudDetalle.evidencias_inicial_urls) {
        props.solicitudDetalle.evidencias_inicial_urls.forEach((url, index) => {
            if(url) {
                const parts = props.solicitudDetalle.evidencias_inicial[index].split('/');
                files.push({ group: 'Inicial', url: url, name: parts[parts.length - 1] || `Archivo ${index+1}` });
            }
        });
    }

    // Evidencias Finales
    if (props.solicitudDetalle.evidencias_final_urls) {
        props.solicitudDetalle.evidencias_final_urls.forEach((url, index) => {
            if(url) {
                const parts = props.solicitudDetalle.evidencias_final[index].split('/');
                files.push({ group: 'Final', url: url, name: parts[parts.length - 1] || `Archivo ${index+1}` });
            }
        });
    }

    // Seguimientos
    if (props.solicitudDetalle.seguimientos) {
        props.solicitudDetalle.seguimientos.forEach(seg => {
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
    <div class="div4 bg-white/10 backdrop-blur-md flex flex-col overflow-hidden rounded-2xl shadow-2xl relative transition-all border border-verde-cope/30">
        <div class="p-1.5 px-3 shrink-0 flex items-center justify-between shadow-sm z-10" style="background-color: var(--color-azul-cope)">
            <h2 class="text-[10px] font-bold text-white tracking-wide flex items-center gap-1.5 uppercase">
                <i class="fas fa-paperclip text-white/80 text-[9px]"></i> Adjuntos
            </h2>
        </div>

        <div class="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
            <div v-if="!selectedSolicitud" class="h-full flex flex-col justify-center items-center text-white/40 p-2 text-center">
                <i class="fas fa-folder-open text-xl mb-1 opacity-20"></i>
                <p class="text-[9px] font-medium">Vacío</p>
            </div>
            <div v-else-if="loadingDetail" class="flex gap-2">
                <div v-for="i in 3" :key="i" class="bg-white/5 border border-white/10 rounded-lg p-1.5 flex flex-col items-center justify-center animate-pulse h-18 w-20">
                    <div class="h-6 w-6 bg-white/10 rounded mb-1"></div>
                    <div class="h-1.5 w-10 bg-white/10 rounded"></div>
                </div>
            </div>
            <div v-else-if="allFiles.length === 0" class="h-full flex flex-col justify-center items-center text-white/40 italic text-[10px]">
                Sin archivos
            </div>
            <div v-else class="flex flex-row overflow-x-auto custom-scrollbar gap-3 pb-1 pt-0.5 px-0.5">
                <div v-for="(file, idx) in allFiles" :key="idx"
                     @click="openFileUrl(file.url)"
                     class="shrink-0 w-20 bg-white/5 rounded-lg flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group h-18 relative overflow-hidden border border-white/10">

                    <!-- Top Label: Group name shown on hover -->
                    <div class="absolute top-0 left-0 w-full z-20 text-[8px] font-bold text-white py-1 px-1 uppercase tracking-wider truncate opacity-0 group-hover:opacity-100 transition-opacity bg-opacity-90 backdrop-blur-sm shadow-sm" style="background-color: var(--color-verde-cope)">
                        {{ file.group }}
                    </div>

                    <!-- Generic File Icon -->
                    <div v-if="!isImage(file.name)" class="w-full h-full bg-white/5 flex items-center justify-center transition-transform group-hover:scale-105" style="color: var(--color-azul-cope)">
                        <div class="w-10 h-10 rounded-full bg-white/10 shadow-sm flex items-center justify-center border border-white/10">
                             <i class="fas fa-file-alt text-xl text-white/80"></i>
                        </div>
                    </div>

                    <!-- Image Thumbnail -->
                    <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
                        <img :src="file.url" alt="Thumbnail" class="w-full h-full object-cover">
                    </div>

                    <!-- Bottom Label: File name shown on hover -->
                    <div class="absolute bottom-0 left-0 w-full z-20 text-[10px] font-bold text-white py-2 px-2 truncate opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md bg-black/60 shadow-inner">
                        {{ file.name }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
