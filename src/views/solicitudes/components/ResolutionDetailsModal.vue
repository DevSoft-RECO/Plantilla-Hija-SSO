<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col mx-4 transform transition-all">

      <!-- Header -->
      <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
             <div class="p-2 rounded-lg" :class="headerColorClass">
                 <i class="fas" :class="headerIconClass"></i>
             </div>
             <h3 class="text-xl font-bold text-gray-800 dark:text-white">{{ title }}</h3>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <!-- Content -->
      <div class="p-0 overflow-hidden flex-1 flex flex-col">
        <div class="overflow-y-auto custom-scrollbar flex-1 p-5">
            <div v-if="loading" class="flex flex-col items-center justify-center py-12 space-y-3">
                 <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                 <span class="text-sm text-gray-500">Cargando solicitudes...</span>
            </div>

            <table v-else-if="solicitudes.length" class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                 <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                     <tr>
                         <th class="px-4 py-3 rounded-tl-lg">ID</th>
                         <th class="px-4 py-3">Título</th>
                         <th v-if="showResponsable" class="px-4 py-3">Responsable</th>
                         <th class="px-4 py-3 rounded-tr-lg">Fecha</th>
                     </tr>
                 </thead>
                 <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                     <tr v-for="sol in solicitudes" :key="sol.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                         <td class="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">#{{ sol.id }}</td>
                         <td class="px-4 py-3 font-medium text-gray-900 dark:text-white truncate max-w-[250px]" :title="sol.titulo">{{ sol.titulo }}</td>
                         <td v-if="showResponsable" class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <span class="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                                    {{ (sol.responsable?.name || '?')[0] }}
                                </span>
                                <span class="truncate max-w-[120px]">{{ sol.responsable?.name || 'Sin asignar' }}</span>
                            </div>
                         </td>
                         <td class="px-4 py-3 whitespace-nowrap">{{ formatDate(sol.created_at) }}</td>
                     </tr>
                 </tbody>
            </table>

            <div v-else class="flex flex-col items-center justify-center py-12 text-gray-400">
                <i class="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                <p>No se encontraron solicitudes con este criterio.</p>
            </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
        <button @click="$emit('close')" class="px-5 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition text-sm font-medium shadow-sm">
          Cerrar Lista
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  title: String,
  type: String, // 'total', 'parcial', 'abiertas', 'validacion'
  solicitudes: { type: Array, default: () => [] },
  loading: Boolean
});

defineEmits(['close']);

const showResponsable = computed(() => !['abiertas', 'validacion'].includes(props.type));

const headerColorClass = computed(() => {
    switch(props.type) {
        case 'total': return 'bg-emerald-100 text-emerald-600';
        case 'parcial': return 'bg-blue-100 text-blue-600';
        case 'abiertas': return 'bg-indigo-100 text-indigo-600';
        case 'validacion': return 'bg-amber-100 text-amber-600';
        default: return 'bg-gray-100 text-gray-600';
    }
});

const headerIconClass = computed(() => {
    switch(props.type) {
        case 'total': return 'fa-check-double';
        case 'parcial': return 'fa-check';
        case 'abiertas': return 'fa-clock';
        case 'validacion': return 'fa-exclamation-circle'; // changed icon for variety
        default: return 'fa-list';
    }
});

const formatDate = (date) => {
    if(!date) return '';
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(107, 114, 128, 0.8);
}
</style>
