<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SolicitudService from '@/services/SolicitudService';
import Swal from 'sweetalert2';
import AsignarSolicitudModal from './components/AsignarSolicitudModal.vue';

const route = useRoute();
const solicitud = ref(null);
const loading = ref(true);
const showAssignModal = ref(false);

const id = route.params.id;

onMounted(() => {
    cargarDetalle();
});

const cargarDetalle = async () => {
    loading.value = true;
    try {
        const response = await SolicitudService.getSolicitud(id);
        solicitud.value = response.data;
    } catch {
        Swal.fire('Error', 'No se pudo cargar el detalle', 'error');
    } finally {
        loading.value = false;
    }
};

const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString();
};

// Acciones
const tomarCaso = async () => {
    try {
        await SolicitudService.takeSolicitud(id);
        Swal.fire('Éxito', 'Has tomado el caso', 'success');
        cargarDetalle();
    } catch {
        Swal.fire('Error', 'No tienes permiso o ya está asignada', 'error');
    }
};

const asignarCaso = () => {
    showAssignModal.value = true;
};

const onAssigned = () => {
    cargarDetalle();
};

const agregarSeguimiento = async () => {
    const { value: text } = await Swal.fire({
        input: 'textarea',
        inputLabel: 'Comentario / Seguimiento',
        inputPlaceholder: 'Escribe aquí...',
        inputAttributes: {
            'aria-label': 'Escribe tu comentario'
        },
        showCancelButton: true
    });

    if (text) {
        try {
            await SolicitudService.addSeguimiento(id, {
                comentario: text,
                tipo_accion: 'comentario'
            });
            Swal.fire('Agregado', '', 'success');
            cargarDetalle();
        } catch {
            Swal.fire('Error', 'No se pudo agregar', 'error');
        }
    }
};

const validarSolicitud = async (accion) => {
    // accion: cerrar or reabrir
    const { value: text } = await Swal.fire({
        input: 'textarea',
        inputLabel: `Justificación para ${accion}`,
        inputPlaceholder: 'Escriba un motivo...',
        showCancelButton: true
    });

    if (text) {
        try {
             await SolicitudService.validateSolicitud(id, {
                accion: accion,
                comentario: text
            });
            Swal.fire('Procesado', `Solicitud ${accion === 'cerrar' ? 'cerrada' : 'reabierta'}`, 'success');
            cargarDetalle();
        } catch {
            Swal.fire('Error', 'Falló la validación', 'error');
        }
    }
};

</script>

<template>
    <div>
        <div v-if="loading" class="p-6 text-center">Cargando...</div>
        <div v-else class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Detalle Columna Izquierda -->
            <div class="md:col-span-2 space-y-6">
                <div class="bg-white p-6 rounded shadow">
                    <div class="flex justify-between items-start mb-4">
                        <h1 class="text-2xl font-bold text-gray-800">{{ solicitud.titulo }}</h1>
                        <span class="px-3 py-1 rounded text-sm font-bold bg-gray-200">{{ solicitud.estado }}</span>
                    </div>
                    <p class="text-gray-600 whitespace-pre-line mb-4">{{ solicitud.descripcion }}</p>
                    <div class="grid grid-cols-2 gap-4 text-sm text-gray-500">
                        <div>
                            <span class="block font-medium text-gray-700">Solicitante:</span>
                            {{ solicitud.creado_por_nombre }}
                        </div>
                        <div>
                            <span class="block font-medium text-gray-700">Agencia:</span>
                            {{ solicitud.agencia_id }}
                        </div>
                        <div>
                            <span class="block font-medium text-gray-700">Asignado a:</span>
                            {{ solicitud.responsable_nombre || 'Sin asignar' }}
                            <span v-if="solicitud.responsable_tipo" class="text-xs bg-gray-100 px-1 rounded">{{ solicitud.responsable_tipo }}</span>
                        </div>
                        <div>
                            <span class="block font-medium text-gray-700">Fecha Creación:</span>
                            {{ formatFecha(solicitud.created_at) }}
                        </div>
                    </div>
                </div>

                <!-- Timeline -->
                <div class="bg-white p-6 rounded shadow">
                    <h2 class="text-lg font-bold mb-4">Historia y Seguimiento</h2>
                    <div class="border-l-2 border-gray-200 ml-3 space-y-6">
                        <div v-for="seg in solicitud.seguimientos" :key="seg.id" class="relative pl-6">
                            <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                            <div class="text-sm font-semibold text-gray-800 flex justify-between">
                                <span>{{ seg.seguimiento_por_nombre }} ({{ seg.tipo_accion }})</span>
                                <span class="text-gray-400 font-normal text-xs">{{ formatFecha(seg.created_at) }}</span>
                            </div>
                            <p class="text-gray-600 text-sm mt-1">{{ seg.comentario }}</p>
                        </div>
                    </div>
                    <button @click="agregarSeguimiento" class="mt-4 text-blue-600 hover:underline text-sm font-medium">+ Agregar Comentario / Evidencia</button>
                </div>
            </div>

            <!-- Acciones Columna Derecha -->
            <div class="md:col-span-1">
                <div class="bg-white p-6 rounded shadow sticky top-6">
                    <h2 class="text-lg font-bold mb-4">Acciones</h2>
                    <div class="flex flex-col gap-2">
                        <button @click="tomarCaso" class="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">Tomar Caso</button>
                        <button @click="asignarCaso" class="bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 transition">Asignar Responsable</button>
                        <hr class="my-2">
                        <button v-if="solicitud.estado !== 'cerrada'" @click="validarSolicitud('cerrar')" class="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">Validar y Cerrar</button>
                        <button v-if="solicitud.estado === 'cerrada'" @click="validarSolicitud('reabrir')" class="bg-red-50 text-red-600 border border-red-200 py-2 rounded hover:bg-red-100 transition">Reabrir Caso</button>
                    </div>
                    <div class="mt-4 text-xs text-gray-400">
                        * Las acciones requieren permisos específicos.
                    </div>
                </div>
            </div>
        </div>
        <AsignarSolicitudModal
            v-if="solicitud"
            :isOpen="showAssignModal"
            :solicitudId="solicitud.id"
            @close="showAssignModal = false"
            @assigned="onAssigned"
        />
    </div>
</template>
