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
    <div class="div4 bg-white dark:bg-gray-800 flex flex-col overflow-hidden rounded-2xl shadow-md relative transition-shadow hover:shadow-lg">
        <div class="absolute top-0 left-0 w-full h-1.5 z-20" style="background-color: var(--color-azul-cope)"></div>
        <div class="p-4 shrink-0 flex items-center justify-between mt-1.5 border-b border-gray-100 dark:border-gray-700">
            <h2 class="text-base font-bold text-gray-800 dark:text-gray-100 tracking-wide flex items-center gap-2">
                <i class="fas fa-paperclip text-gray-400"></i>Archivos Adjuntos
            </h2>
        </div>

        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div v-if="!selectedSolicitud" class="h-full flex flex-col justify-center items-center text-gray-400 dark:text-gray-600 p-4 text-center">
                <i class="fas fa-folder-open text-3xl mb-2 opacity-50"></i>
                <p class="text-xs font-medium">Archivos aparecerán aquí</p>
            </div>
            <div v-else-if="loadingDetail" class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <div v-for="i in 4" :key="i" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col items-center justify-center animate-pulse h-24">
                    <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div class="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
            <div v-else-if="allFiles.length === 0" class="h-full flex flex-col justify-center items-center text-gray-400 italic text-sm">
                No hay archivos adjuntos
            </div>
            <div v-else class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div v-for="(file, idx) in allFiles" :key="idx"
                     @click="openFileUrl(file.url)"
                     class="bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group h-28 relative overflow-hidden border border-gray-100 dark:border-gray-700">

                    <div class="absolute top-0 left-0 w-full text-[9px] font-bold text-white py-1.5 px-1 uppercase tracking-wider truncate opacity-0 group-hover:opacity-100 transition-opacity bg-opacity-90 backdrop-blur-sm" style="background-color: var(--color-verde-cope)">
                        {{ file.group }}
                    </div>

                    <div class="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-inner border border-gray-100 dark:border-gray-600" style="color: var(--color-azul-cope)">
                        <i class="fas fa-file-alt text-2xl"></i>
                    </div>

                    <span class="text-[11px] font-bold text-gray-600 dark:text-gray-300 truncate w-full px-1" :title="file.name">
                        {{ file.name }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>
