<script setup>
import { computed } from 'vue';

const props = defineProps({
    sol: {
        type: Object,
        required: true
    },
    puedeEliminar: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['ver', 'eliminar']);

const getEstadoClass = (estado) => {
    switch (estado) {
        case 'reportada': return 'bg-red-100 text-red-800 border-red-200';
        case 'asignada': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'en_seguimiento': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'pendiente_validacion': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'cerrada': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getEstadoIcon = (estado) => {
    switch (estado) {
        case 'reportada': return 'fas fa-exclamation-circle';
        case 'asignada': return 'fas fa-user-check';
        case 'en_seguimiento': return 'fas fa-sync';
        case 'pendiente_validacion': return 'fas fa-clipboard-check';
        case 'cerrada': return 'fas fa-lock';
        default: return 'fas fa-info-circle';
    }
};

const avatarClass = computed(() => {
    const estado = props.sol.estado;
    switch (estado) {
        case 'reportada': return 'bg-red-500';
        case 'asignada': return 'bg-blue-500';
        case 'en_seguimiento': return 'bg-yellow-500';
        case 'pendiente_validacion': return 'bg-purple-500';
        case 'cerrada': return 'bg-green-500';
        default: return 'bg-gray-400';
    }
});
</script>

<template>
    <div class="px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition border-b border-white/10 bg-white/10 backdrop-blur-md cursor-pointer" @click="emit('ver')">
        <!-- Icon -->
        <div class="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white shadow-sm mt-0.5" :class="avatarClass">
            <i :class="getEstadoIcon(sol.estado) + (sol.estado === 'en_seguimiento' ? ' fa-spin' : '')" class="text-sm"></i>
        </div>
        
        <!-- Content -->
        <div class="flex-1 min-w-0">
            <h3 class="font-bold text-sm text-white line-clamp-2 leading-tight mb-2">
                <span class="text-xs text-white/40 font-mono font-normal mr-1">#{{ sol.id }}</span>
                {{ sol.titulo }}
            </h3>
            
            <div class="flex justify-between items-center gap-2">
                <span class="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border shadow-sm shrink-0" :class="getEstadoClass(sol.estado)">
                    {{ sol.estado?.replace('_', ' ') }}
                </span>
                <span class="text-[10px] text-gray-500 dark:text-white/40 font-medium whitespace-nowrap shrink-0">
                    {{ new Date(sol.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) }}
                </span>
            </div>
        </div>
        
        <!-- Actions -->
        <div class="shrink-0 flex flex-col items-end gap-1 justify-center pl-2 border-l border-white/10 ml-1">
            <button @click.stop="emit('ver')" class="text-emerald-500 hover:text-emerald-700 h-8 w-8 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition flex items-center justify-center">
                <i class="fas fa-chevron-right text-sm"></i>
            </button>
            <button v-if="puedeEliminar" @click.stop="emit('eliminar')" class="text-red-400 hover:text-red-600 h-8 w-8 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition flex items-center justify-center shadow-sm">
                <i class="fas fa-trash-alt text-xs"></i>
            </button>
        </div>
    </div>
</template>
