<script setup>
import { ref, onMounted } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import { useRouter } from 'vue-router';

const router = useRouter();

// Datos
const solicitudes = ref([]);
const loading = ref(true);
const pagination = ref({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20
});

// Filtros
const filtroEstado = ref('');
const estados = [
    { value: '', label: 'Todas' },
    { value: 'reportada', label: 'Reportadas' },
    { value: 'asignada', label: 'Asignadas' },
    { value: 'en_seguimiento', label: 'En Seguimiento' },
    { value: 'pendiente_validacion', label: 'Por Validar' },
    { value: 'cerrada', label: 'Cerradas' }
];

onMounted(() => {
    cargarSolicitudes();
});

const cargarSolicitudes = async (page = 1) => {
    loading.value = true;
    try {
        const params = {
            page: page,
            estado: filtroEstado.value,
            categoria_general_id: 2 // Solo mostrar solicitudes Administrativas
        };

        const response = await SolicitudService.getSolicitudes(params);

        // Laravel paginate response mapping
        solicitudes.value = response.data.data;
        pagination.value = {
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            total: response.data.total,
            per_page: response.data.per_page,
            from: response.data.from,
            to: response.data.to
        };

    } catch (e) {
        console.error("Error cargando solicitudes", e);
    } finally {
        loading.value = false;
    }
};

const cambiarPagina = (page) => {
    if (page >= 1 && page <= pagination.value.last_page) {
        cargarSolicitudes(page);
    }
};

const setFiltro = (estado) => {
    filtroEstado.value = estado;
    cargarSolicitudes(1); // Reset to page 1
};

const verDetalle = (id) => {
    router.push({ name: 'detalle-solicitud', params: { id } });
};

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
</script>

<template>
    <div class="p-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
        <div class="flex justify-between items-center mb-6 flex-shrink-0">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-white">Bandeja de Solicitudes Administrativas</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">Gestión de casos administrativos</p>
            </div>
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

        <!-- Table Container -->
        <div class="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
            <div class="overflow-y-auto flex-1 custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold sticky top-0 backdrop-blur-sm z-10">
                        <tr>
                            <th class="p-4 border-b dark:border-gray-700">ID</th>
                            <th class="p-4 border-b dark:border-gray-700">Agencia</th>
                            <th class="p-4 border-b dark:border-gray-700">Título</th>
                            <th class="p-4 border-b dark:border-gray-700">Estado</th>
                            <th class="p-4 border-b dark:border-gray-700">Solicitante</th>
                            <th class="p-4 border-b dark:border-gray-700">Responsable</th>
                            <th class="p-4 border-b dark:border-gray-700">Fecha</th>
                            <th class="p-4 border-b dark:border-gray-700 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                        <tr v-if="loading">
                            <td colspan="8" class="p-8 text-center text-gray-500">
                                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br>Cargando...
                            </td>
                        </tr>
                        <tr v-else-if="solicitudes.length === 0">
                            <td colspan="8" class="p-8 text-center text-gray-500">
                                No se encontraron solicitudes.
                            </td>
                        </tr>
                        <tr v-else v-for="sol in solicitudes" :key="sol.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <td class="p-4 font-mono text-gray-500 dark:text-gray-400">#{{ sol.id }}</td>
                            <td class="p-4 font-medium text-gray-700 dark:text-gray-300">{{ sol.agencia_id || 'N/A' }}</td>
                            <td class="p-4 font-medium text-gray-900 dark:text-white">{{ sol.titulo }}</td>
                            <td class="p-4">
                                <span class="px-2.5 py-1 rounded-full text-xs font-bold border" :class="getEstadoClass(sol.estado)">
                                    {{ sol.estado?.replace('_', ' ') }}
                                </span>
                            </td>
                            <td class="p-4 text-gray-600 dark:text-gray-300">
                                <div class="text-xs font-bold">{{ sol.creadoPor?.name || 'Desconocido' }}</div>
                                <div class="text-xs opacity-75">{{ sol.agencia?.nombre || 'S/A' }}</div>
                            </td>
                            <td class="p-4 text-gray-600 dark:text-gray-300">
                                <div v-if="sol.responsable" class="flex items-center gap-2">
                                    <div class="bg-indigo-100 text-indigo-600 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                                        {{ sol.responsable.name.charAt(0) }}
                                    </div>
                                    {{ sol.responsable.name }}
                                </div>
                                <span v-else class="text-gray-400 italic">--</span>
                            </td>
                            <td class="p-4 text-gray-500 dark:text-gray-400">
                                {{ new Date(sol.created_at).toLocaleDateString() }}
                            </td>
                            <td class="p-4 text-center">
                                <button @click="verDetalle(sol.id)" class="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-medium px-3 py-1.5 rounded-lg transition text-xs border border-emerald-200">
                                    Asignar / Ver
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination Footer -->
            <div class="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <div class="text-sm text-gray-500 dark:text-gray-400">
                    Mostrando {{ pagination.from || 0 }} - {{ pagination.to || 0 }} de {{ pagination.total }} resultados
                </div>

                <div class="flex items-center gap-2" v-if="pagination.total > 0">
                    <button
                        @click="cambiarPagina(pagination.current_page - 1)"
                        :disabled="pagination.current_page === 1"
                        class="p-2 rounded-lg border dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <i class="fas fa-chevron-left text-xs"></i>
                    </button>

                    <span class="text-sm font-medium px-2">
                        Página {{ pagination.current_page }} de {{ pagination.last_page }}
                    </span>

                    <button
                        @click="cambiarPagina(pagination.current_page + 1)"
                        :disabled="pagination.current_page === pagination.last_page"
                        class="p-2 rounded-lg border dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <i class="fas fa-chevron-right text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    height: 4px;
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 4px;
}
</style>
