<script setup>
import { ref, onMounted } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import { useRouter } from 'vue-router';
const requests = ref([]);
const loading = ref(true);
const router = useRouter();

const filtroEstado = ref('');
const estados = [
    { value: '', label: 'Todas' },
    { value: 'reportada', label: 'Reportadas' },
    // { value: 'asignada', label: 'Asignadas' }, // Removed as per request
    { value: 'en_seguimiento', label: 'En Seguimiento' },
    { value: 'pendiente_validacion', label: 'Por Validar' },
    { value: 'cerrada', label: 'Cerradas' }
];

onMounted(async () => {
    loadMyRequests();
});

const loadMyRequests = async () => {
    loading.value = true;
    try {
        // Enviar parametro mis_asignaciones=true para filtrar en backend
        const params = {
            mis_asignaciones: 'true',
            categoria_general_id: 1 // Solo Tecnologicas
        };
        if (filtroEstado.value) {
            params.estado = filtroEstado.value;
        }

        const response = await SolicitudService.getSolicitudes(params);
        requests.value = response.data.data;
    } catch (error) {
        console.error("Error cargando mis solicitudes", error);
    } finally {
        loading.value = false;
    }
};

const setFiltro = (estado) => {
    filtroEstado.value = estado;
    loadMyRequests();
};

const trabajarCaso = (id) => {
    router.push({ name: 'trabajar-solicitud', params: { id } });
};

const getStatusClass = (status) => {
    switch (status) {
        case 'reportada': return 'bg-red-100 text-red-800 border-red-200';
        case 'asignada': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'en_seguimiento': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'pendiente_validacion': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'cerrada': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};
</script>

<template>
    <div class="p-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mi Bandeja de Casos Tecnológicos</h1>
                <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Solicitudes asignadas a ti para gestión</p>
            </div>
            <button @click="loadMyRequests" class="text-blue-600 hover:text-blue-800 transition">
                <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i> Actualizar
            </button>
        </div>

        <!-- Tabs Filter -->
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

        <!-- Tabla -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold">
                    <tr>
                        <th class="p-4 border-b dark:border-gray-700">ID</th>
                        <th class="p-4 border-b dark:border-gray-700">Agencia</th>
                        <th class="p-4 border-b dark:border-gray-700">Título</th>
                        <th class="p-4 border-b dark:border-gray-700">Estado</th>
                        <th class="p-4 border-b dark:border-gray-700">Solicitante</th>
                        <th class="p-4 border-b dark:border-gray-700">Fecha Asignación</th>
                        <th class="p-4 border-b dark:border-gray-700 text-right">Acción</th>
                    </tr>
                </thead>
                <tbody class="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-if="loading">
                        <td colspan="7" class="p-8 text-center text-gray-500">
                            <i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br>Cargando tus casos...
                        </td>
                    </tr>
                    <tr v-else-if="requests.length === 0">
                        <td colspan="7" class="p-8 text-center text-gray-500">
                            <i class="fas fa-box-open text-4xl mb-3 text-gray-300"></i>
                            <p>No tienes casos asignados actualmente.</p>
                        </td>
                    </tr>
                    <tr v-else v-for="req in requests" :key="req.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td class="p-4 font-mono text-gray-500 dark:text-gray-400">#{{ req.id }}</td>
                        <td class="p-4 font-medium text-gray-700 dark:text-gray-300">{{ req.agencia_id || 'N/A' }}</td>
                        <td class="p-4 font-medium text-gray-900 dark:text-white">{{ req.titulo }}</td>
                        <td class="p-4">
                            <span class="px-2.5 py-1 rounded-full text-xs font-bold border" :class="getStatusClass(req.estado)">
                                {{ req.estado?.replace('_', ' ') }}
                            </span>
                        </td>
                        <td class="p-4 text-gray-600 dark:text-gray-300">
                            <div class="flex items-center gap-2">
                                <div class="bg-blue-100 text-blue-600 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                                    {{ req.creado_por?.name?.charAt(0) }}
                                </div>
                                {{ req.creado_por?.name }}
                            </div>
                        </td>
                        <td class="p-4 text-gray-500 dark:text-gray-400">
                            {{ req.fecha_asignacion ? new Date(req.fecha_asignacion).toLocaleDateString() : 'Reciente' }}
                        </td>
                        <td class="p-4 text-right">
                            <button
                                @click="trabajarCaso(req.id)"
                                class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg shadow-sm shadow-indigo-200 dark:shadow-none transition text-xs font-medium flex items-center gap-2 ml-auto"
                            >
                                <i class="fas fa-tools"></i> Trabajar Caso
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
