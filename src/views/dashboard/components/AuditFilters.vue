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
    <div class="div1 px-0 py-0 shrink-0 bg-white dark:bg-gray-800 flex flex-col md:flex-row md:items-center rounded-2xl shadow-sm relative transition-shadow hover:shadow-md border border-gray-100 dark:border-gray-700">
        <!-- Institutional Header Block -->
        <div class="font-bold text-white shrink-0 text-sm flex items-center justify-center gap-2 px-6 shadow-[2px_0_8px_rgba(0,0,0,0.1)] z-10 self-stretch rounded-t-2xl md:rounded-t-none md:rounded-l-2xl" style="background-color: var(--color-azul-cope)">
            <i class="fas fa-filter text-white/80"></i>
        </div>
        <!-- Filter Controls Container -->
        <div class="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 min-w-0 py-3 px-5 overflow-x-auto custom-scrollbar md:items-center">

            <!-- Tipo Selector (Dropdown) -->
            <div class="relative shrink-0 min-w-[160px]">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <i class="fas fa-layer-group"></i>
                </div>
                <select v-model="localFiltros.tipo" class="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:outline-none pl-9 py-2 pr-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer" style="--tw-ring-color: var(--color-azul-cope)">
                    <option v-for="t in tipos" :key="t.value" :value="t.value" class="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">{{ t.label }}</option>
                </select>
            </div>

            <!-- Selectores con Iconos -->
            <div class="relative shrink-0 min-w-[160px]">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <i class="fas fa-tasks"></i>
                </div>
                <select v-model="localFiltros.estado" class="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:outline-none pl-9 py-2 pr-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer" style="--tw-ring-color: var(--color-azul-cope)">
                    <option v-for="est in estados" :key="est.value" :value="est.value" class="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">{{ est.label }}</option>
                </select>
            </div>

            <div class="relative flex-1 shrink-0 min-w-[200px] max-w-xs">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <i class="fas fa-building"></i>
                </div>
                <select v-model="localFiltros.agencia_id" class="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:outline-none pl-9 py-2 pr-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer" style="--tw-ring-color: var(--color-azul-cope)">
                    <option value="" class="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">Todas las Agencias</option>
                    <option v-for="ag in agencias" :key="ag.id" :value="ag.id" class="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">{{ ag.nombre }}</option>
                </select>
            </div>
        </div>

        <div class="px-5 py-3 md:py-0 shrink-0 self-stretch flex items-center border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700/50 justify-end">
            <button @click="$emit('limpiar')" class="shrink-0 text-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition flex items-center gap-2 hover:opacity-90 active:scale-95 w-full md:w-auto justify-center" style="background-color: var(--color-azul-cope)">
                <i class="fas fa-eraser"></i>Borrar
            </button>
        </div>
    </div>
</template>
