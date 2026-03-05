<script setup>
import { ref, onMounted, watch } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import Swal from 'sweetalert2';

// Child Components
import AuditFilters from './components/AuditFilters.vue';
import AuditRequestDetails from './components/AuditRequestDetails.vue';
import AuditEventHistory from './components/AuditEventHistory.vue';
import AuditAttachments from './components/AuditAttachments.vue';

// UI State
const loadingList = ref(false);
const loadingDetail = ref(false);

// Data
const solicitudes = ref([]);
const agencias = ref([]);
const selectedSolicitud = ref(null);
const solicitudDetalle = ref(null);

// Pagination
const pagination = ref({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 50
});

// Filters
const filtros = ref({
    tipo: '2', // Default to Administrativo (2)
    estado: 'reportada', // Default
    agencia_id: ''
});

const estados = [
    { value: '', label: 'Todos' },
    { value: 'reportada', label: 'Reportadas' },
    { value: 'asignada', label: 'Asignadas' },
    { value: 'en_seguimiento', label: 'En Seguimiento' },
    { value: 'pendiente_validacion', label: 'Por Validar' },
    { value: 'cerrada', label: 'Cerradas' }
];

const tipos = [
    { value: '', label: 'Ambos' },
    { value: '1', label: 'Tecnológico' },
    { value: '2', label: 'Administrativo' }
];

onMounted(async () => {
    await cargarAgencias();
    await cargarSolicitudes();
});

// Watch for filter changes to auto-load
watch(filtros, () => {
    cargarSolicitudes(1);
}, { deep: true });

const cargarAgencias = async () => {
    try {
        const response = await SolicitudService.getAgencias();
        agencias.value = response.data;
    } catch (e) {
        console.error("Error cargando agencias", e);
    }
};

const cargarSolicitudes = async (page = 1) => {
    loadingList.value = true;
    selectedSolicitud.value = null; // Reset selection on new search
    solicitudDetalle.value = null;

    try {
        const params = {
            page: page,
            ...filtros.value
        };

        const response = await SolicitudService.getAuditSolicitudes(params);

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
        loadingList.value = false;
    }
};

const limpiarFiltros = () => {
    filtros.value = {
        tipo: '',
        estado: '',
        agencia_id: ''
    };
};

const cambiarPagina = (page) => {
    if (page >= 1 && page <= pagination.value.last_page) {
        cargarSolicitudes(page);
    }
};

const seleccionarSolicitud = async (solicitud) => {
    selectedSolicitud.value = solicitud;
    loadingDetail.value = true;
    solicitudDetalle.value = null;

    try {
        const response = await SolicitudService.getAuditSolicitud(solicitud.id);
        solicitudDetalle.value = response.data;
    } catch (error) {
        console.error("Error cargando detalle de solicitud", error);
        Swal.fire('Error', 'No se pudo cargar el detalle de la solicitud', 'error');
        selectedSolicitud.value = null;
    } finally {
        loadingDetail.value = false;
    }
};

const verBackToList = () => {
    selectedSolicitud.value = null;
    solicitudDetalle.value = null;
};
</script>

<template>
    <div class="p-4 h-[calc(100vh-80px)] overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl relative">
        <div class="h-full w-full custom-grid gap-4 overflow-hidden">

            <AuditFilters
                v-model:filtros="filtros"
                :tipos="tipos"
                :estados="estados"
                :agencias="agencias"
                @limpiar="limpiarFiltros"
            />

            <AuditRequestDetails
                :solicitudes="solicitudes"
                :selectedSolicitud="selectedSolicitud"
                :solicitudDetalle="solicitudDetalle"
                :loadingList="loadingList"
                :loadingDetail="loadingDetail"
                :pagination="pagination"
                @seleccionar="seleccionarSolicitud"
                @cambiarPagina="cambiarPagina"
                @verBackToList="verBackToList"
            />

            <AuditEventHistory
                :selectedSolicitud="selectedSolicitud"
                :solicitudDetalle="solicitudDetalle"
                :loadingDetail="loadingDetail"
            />

            <AuditAttachments
                :selectedSolicitud="selectedSolicitud"
                :solicitudDetalle="solicitudDetalle"
                :loadingDetail="loadingDetail"
            />

        </div>
    </div>
</template>

<style>
/* Los estilos del scroll o globales requeridos por los componentes
   pueden mantenerse aqui, pero hicimos scoped los grid layouts.
   Nota: como custom-grid afecta al contenedor padre, lo dejamos sin scoped
   o usamos :deep() si un componente hijo depende de ellos. En este caso
   AuditDashboardView.vue controla el custom-grid. */

.custom-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: 60px 1fr 1fr 1fr 200px;
}

.div1 { grid-area: 1 / 1 / 2 / 4; }
.div2 { grid-area: 2 / 1 / 6 / 4; }
.div3 { grid-area: 1 / 4 / 5 / 6; }
.div4 { grid-area: 5 / 4 / 6 / 6; }

@media (max-width: 1024px) {
    .custom-grid {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }
    .div1, .div2, .div3, .div4 {
        height: auto;
        flex: none;
    }
    .div2 {
        height: 600px;
    }
    .div3 {
        height: 400px;
    }
    .div4 {
        height: 300px;
    }
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 9999px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #475569;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
}
</style>
