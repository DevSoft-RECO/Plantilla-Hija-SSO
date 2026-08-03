<script setup>
import { ref, onMounted } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import axios from '@/api/axios';
import Swal from 'sweetalert2';

const loading = ref(false);
const categorias = ref([]);
const estados = ref([
    { value: 'reportada', label: 'Reportada' },
    { value: 'asignada', label: 'Asignada' },
    { value: 'en_seguimiento', label: 'En Seguimiento' },
    { value: 'pendiente_validacion', label: 'Pendiente Validación' },
    { value: 'cerrada', label: 'Cerrada' },
    { value: 'reabierta', label: 'Reabierta' }
]);

const filters = ref({
    fecha_inicio: '',
    fecha_fin: '',
    categoria_general_id: '',
    estado: ''
});

const loadCategorias = async () => {
    try {
        const response = await axios.get('/solicitudes/categorias-generales');
        categorias.value = response.data || [];
    } catch (error) {
        console.error('Error cargando categorías generales:', error);
    }
};

const handleExport = async () => {
    loading.value = true;
    try {
        const params = {};
        if (filters.value.fecha_inicio) params.fecha_inicio = filters.value.fecha_inicio;
        if (filters.value.fecha_fin) params.fecha_fin = filters.value.fecha_fin;
        if (filters.value.categoria_general_id) params.categoria_general_id = filters.value.categoria_general_id;
        if (filters.value.estado) params.estado = filters.value.estado;

        const response = await SolicitudService.exportGeneralSolicitudes(params);

        // Crear el link de descarga
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Nombre de archivo con fecha y hora actual
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
        link.setAttribute('download', `reporte_general_solicitudes_${dateStr}_${timeStr}.csv`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        Swal.fire({
            icon: 'success',
            title: 'Reporte Generado',
            text: 'El reporte general de seguimiento se ha descargado correctamente.',
            confirmButtonColor: '#3085d6'
        });
    } catch (error) {
        console.error('Error exportando reporte general:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al intentar exportar el reporte general. Verifique sus permisos.',
            confirmButtonColor: '#d33'
        });
    } finally {
        loading.value = false;
    }
};

const cleanFilters = () => {
    filters.value = {
        fecha_inicio: '',
        fecha_fin: '',
        categoria_general_id: '',
        estado: ''
    };
};

onMounted(() => {
    loadCategorias();
});
</script>

<template>
    <div class="p-6 max-w-4xl mx-auto">
        <!-- Encabezado con estética premium -->
        <div class="mb-8 flex items-center justify-between">
            <div>
                <h1 class="text-3xl font-extrabold text-white dark:text-white tracking-tight">Reporte General del Sistema</h1>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Exporta un reporte CSV completo del seguimiento, tiempos de resolución y participantes de los tickets del sistema.</p>
            </div>
            <div class="bg-gradient-to-tr from-emerald-500 to-teal-600 text-white p-3 rounded-2xl shadow-xl shadow-teal-500/20">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
        </div>

        <!-- Panel de Filtros -->
        <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-2xl space-y-6">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <svg class="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z" />
                </svg>
                Filtros de Búsqueda
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Fecha Inicio -->
                <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha de Creación Desde</label>
                    <input
                        v-model="filters.fecha_inicio"
                        type="date"
                        class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                </div>

                <!-- Fecha Fin -->
                <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha de Creación Hasta</label>
                    <input
                        v-model="filters.fecha_fin"
                        type="date"
                        class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                </div>

                <!-- Categoría General -->
                <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoría General</label>
                    <select
                        v-model="filters.categoria_general_id"
                        class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all cursor-pointer"
                    >
                        <option value="" class="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">Todas las Categorías</option>
                        <option v-for="cat in categorias" :key="cat.id" :value="cat.id" class="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                            {{ cat.nombre }}
                        </option>
                    </select>
                </div>

                <!-- Estado -->
                <div class="flex flex-col gap-2">
                    <label class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado de Solicitud</label>
                    <select
                        v-model="filters.estado"
                        class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all cursor-pointer"
                    >
                        <option value="" class="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">Todos los Estados</option>
                        <option v-for="est in estados" :key="est.value" :value="est.value" class="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                            {{ est.label }}
                        </option>
                    </select>
                </div>
            </div>

            <!-- Botones de Acción -->
            <div class="pt-4 flex flex-col sm:flex-row gap-4 justify-end border-t border-gray-100 dark:border-gray-700">
                <button
                    @click="cleanFilters"
                    type="button"
                    class="px-6 py-3 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded-xl transition flex items-center justify-center gap-2"
                >
                    Limpiar Filtros
                </button>

                <button
                    @click="handleExport"
                    :disabled="loading"
                    class="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition flex items-center justify-center gap-2 min-w-[200px]"
                >
                    <svg v-if="loading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {{ loading ? 'Generando Reporte...' : 'Exportar a CSV' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Asegurar apariencia uniforme para inputs date en navegadores modernos */
input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
}
</style>
