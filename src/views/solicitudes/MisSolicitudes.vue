<script setup>
import { ref, onMounted, computed } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import { useRouter } from 'vue-router';

const props = defineProps({
    categoriaGeneralId: Number
});

const solicitudes = ref([]);
const loading = ref(true);
const router = useRouter();
const filtroEstado = ref('');

const pageTitle = computed(() => {
    if (props.categoriaGeneralId === 1) return 'Mis Solicitudes Tecnológicas';
    if (props.categoriaGeneralId === 2) return 'Mis Solicitudes Administrativas';
    return 'Mis Solicitudes';
});

const cargarSolicitudes = async () => {
    loading.value = true;
    try {
        const params = {};
        if (filtroEstado.value) params.estado = filtroEstado.value;
        if (props.categoriaGeneralId) params.categoria_general_id = props.categoriaGeneralId;

        const response = await SolicitudService.getSolicitudes(params);
        solicitudes.value = response.data.data;
    } catch (e) {
        console.error("Error cargando mis solicitudes", e);
    } finally {
        loading.value = false;
    }
};

const estados = [
    { value: '', label: 'Todas' },
    { value: 'reportada', label: 'Reportadas' },
    { value: 'asignada', label: 'Asignadas' },
    { value: 'en_seguimiento', label: 'En Seguimiento' },
    { value: 'pendiente_validacion', label: 'Por Validar' },
    { value: 'cerrada', label: 'Cerradas' }
];

onMounted(async () => {
    cargarSolicitudes();
});

const setFiltro = (estado) => {
    filtroEstado.value = estado;
    cargarSolicitudes();
};

const getEstadoClass = (estado) => {
    switch (estado) {
        case 'reportada': return 'bg-red-100 text-red-800';
        case 'asignada': return 'bg-blue-100 text-blue-800';
        case 'en_seguimiento': return 'bg-yellow-100 text-yellow-800';
        case 'pendiente_validacion': return 'bg-purple-100 text-purple-800';
        case 'cerrada': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};
</script>

<template>
    <div class="p-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white">{{ pageTitle }}</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">Solicitudes realizadas por mi agencia</p>
            </div>
            <!-- Botón opcional para recargar -->
            <button @click="cargarSolicitudes" class="text-blue-600 hover:text-blue-800 transition">
                <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
            </button>
        </div>

        <!-- Filters -->
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2 flex-shrink-0 custom-scrollbar">
            <button
                v-for="est in estados"
                :key="est.value"
                @click="setFiltro(est.value)"
                class="px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap border"
                :class="filtroEstado === est.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'"
            >
                {{ est.label }}
            </button>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold">
                    <tr>
                        <th class="p-4 border-b dark:border-gray-700">ID</th>
                        <th class="p-4 border-b dark:border-gray-700">Título</th>
                        <th class="p-4 border-b dark:border-gray-700">Estado</th>
                        <th class="p-4 border-b dark:border-gray-700">Asignado A</th>
                        <th class="p-4 border-b dark:border-gray-700">Fecha Creación</th>
                        <th class="p-4 border-b dark:border-gray-700 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody class="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-if="loading">
                        <td colspan="6" class="p-8 text-center text-gray-500">
                            <i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br>Cargando solicitudes...
                        </td>
                    </tr>
                    <tr v-else-if="solicitudes.length === 0">
                        <td colspan="6" class="p-8 text-center text-gray-500">
                            <i class="fas fa-inbox text-4xl mb-3 text-gray-300"></i>
                            <p>No hay solicitudes registradas por tu agencia.</p>
                        </td>
                    </tr>
                    <tr v-else v-for="sol in solicitudes" :key="sol.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td class="p-4 font-mono text-gray-500 dark:text-gray-400">#{{ sol.id }}</td>
                        <td class="p-4 font-medium text-gray-900 dark:text-white">{{ sol.titulo }}</td>
                        <td class="p-4">
                            <span class="px-2.5 py-1 rounded-full text-xs font-bold border" :class="getEstadoClass(sol.estado)">
                                {{ sol.estado?.replace('_', ' ') }}
                            </span>
                        </td>
                        <td class="p-4 text-gray-600 dark:text-gray-300">
                            <div v-if="sol.responsable_nombre" class="flex items-center gap-2">
                                <div class="bg-indigo-100 text-indigo-600 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                                    {{ sol.responsable_nombre.charAt(0) }}
                                </div>
                                {{ sol.responsable_nombre }}
                            </div>
                            <span v-else class="text-gray-400 italic">Sin asignar</span>
                        </td>
                        <td class="p-4 text-gray-500 dark:text-gray-400">
                            {{ new Date(sol.created_at).toLocaleDateString() }}
                        </td>
                        <td class="p-4 text-center">
    <button
        @click="router.push({ name: 'trabajar-solicitud', params: { id: sol.id } })"
        class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg shadow-sm shadow-emerald-200 dark:shadow-none transition text-xs font-medium flex items-center gap-2 mx-auto"
    >
        <i class="fas fa-eye"></i> Ver Seguimiento
    </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
