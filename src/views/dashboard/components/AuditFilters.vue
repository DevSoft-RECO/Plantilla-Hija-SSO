<script setup>
import { computed } from 'vue';

const props = defineProps({
    filtros: Object,
    tipos: Array,
    estados: Array,
    agencias: Array
});

const emit = defineEmits(['update:filtros', 'limpiar']);

// Compute bindings for the parent's v-model object properties
const localFiltros = computed({
    get: () => props.filtros,
    set: (val) => emit('update:filtros', val)
});

</script>

<template>
    <div class="div1 border dark:border-gray-700 p-4 shrink-0 bg-white dark:bg-gray-800 flex items-center gap-4 overflow-x-auto custom-scrollbar rounded-xl shadow-sm">
        <div class="font-bold text-gray-700 dark:text-gray-200 shrink-0 text-sm">
            <i class="fas fa-filter mr-2"></i>Filtros:
        </div>

        <div class="flex-1 flex gap-3 min-w-0">
            <select v-model="localFiltros.tipo" class="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-verde-cope focus:border-verde-cope py-1.5 px-3">
                <option v-for="t in tipos" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>

            <select v-model="localFiltros.estado" class="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-verde-cope focus:border-verde-cope py-1.5 px-3">
                <option v-for="est in estados" :key="est.value" :value="est.value">{{ est.label }}</option>
            </select>

            <select v-model="localFiltros.agencia_id" class="text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-verde-cope focus:border-verde-cope py-1.5 px-3 flex-1 min-w-[150px] max-w-xs">
                <option value="">Todas las Agencias</option>
                <option v-for="ag in agencias" :key="ag.id" :value="ag.id">{{ ag.nombre }}</option>
            </select>
        </div>

        <button @click="$emit('limpiar')" class="shrink-0 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm font-medium transition flex items-center gap-2">
            <i class="fas fa-sync-alt"></i> Limpiar Filtros
        </button>
    </div>
</template>
