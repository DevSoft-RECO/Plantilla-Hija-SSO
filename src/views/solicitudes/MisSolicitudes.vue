<script setup>
import { ref, onMounted } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import { useRouter } from 'vue-router';

const solicitudes = ref([]);
const loading = ref(true);
const router = useRouter();
const filtroEstado = ref('');

onMounted(async () => {
    cargarSolicitudes();
});

const cargarSolicitudes = async () => {
    loading.value = true;
    try {
        const params = {
            mis_asignaciones: true
        };
        if (filtroEstado.value) params.estado = filtroEstado.value;

        const response = await SolicitudService.getSolicitudes(params);
        solicitudes.value = response.data.data;
    } catch (e) {
        console.error("Error cargando mis solicitudes", e);
    } finally {
        loading.value = false;
    }
};

const verDetalle = (id) => {
    router.push({ name: 'detalle-solicitud', params: { id } });
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
            <h1 class="text-2xl font-bold text-gray-800">Mis Asignaciones</h1>
            <!-- No botón de crear aquí, es solo bandeja de trabajo -->
        </div>

        <div class="mb-4">
            <select v-model="filtroEstado" @change="cargarSolicitudes" class="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Todos los estados</option>
                <option value="asignada">Asignada</option>
                <option value="en_seguimiento">En Seguimiento</option>
                <option value="pendiente_validacion">Pendiente Validación</option>
                <option value="cerrada">Cerrada</option>
            </select>
        </div>

        <div class="overflow-x-auto bg-white rounded shadow">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                    <tr>
                        <th class="p-3 border-b">ID</th>
                        <th class="p-3 border-b">Título</th>
                        <th class="p-3 border-b">Estado</th>
                        <th class="p-3 border-b">Solicitante</th>
                        <th class="p-3 border-b">Fecha Asignación</th>
                        <th class="p-3 border-b text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody class="text-sm">
                    <tr v-if="loading">
                        <td colspan="6" class="p-4 text-center">Cargando mis asignaciones...</td>
                    </tr>
                    <tr v-else-if="solicitudes.length === 0">
                        <td colspan="6" class="p-4 text-center text-gray-500">No tienes solicitudes asignadas.</td>
                    </tr>
                    <tr v-else v-for="sol in solicitudes" :key="sol.id" class="border-b hover:bg-gray-50 transition">
                        <td class="p-3 font-mono text-gray-500">{{ sol.id }}</td>
                        <td class="p-3 font-medium">{{ sol.titulo }}</td>
                        <td class="p-3">
                            <span class="px-2 py-1 rounded-full text-xs font-bold" :class="getEstadoClass(sol.estado)">
                                {{ sol.estado }}
                            </span>
                        </td>
                        <td class="p-3">{{ sol.creado_por_nombre }}</td>
                        <td class="p-3 text-gray-500">{{ sol.fecha_asignacion ? new Date(sol.fecha_asignacion).toLocaleDateString() : '-' }}</td>
                        <td class="p-3 text-center">
                            <button @click="verDetalle(sol.id)" class="text-blue-600 hover:text-blue-800 font-medium">Trabajar Caso</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
