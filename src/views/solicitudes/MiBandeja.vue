<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import BandejaRequestDetails from './components/BandejaRequestDetails.vue';
import BandejaEventHistory from './components/BandejaEventHistory.vue';
import BandejaAttachments from './components/BandejaAttachments.vue';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// --- STATE ---
const solicitudes = ref([]);
const selectedSolicitud = ref(null);
const solicitudDetalle = ref(null);
const loadingList = ref(false);
const loadingDetail = ref(false);
const savingSeguimiento = ref(false);

const filtros = ref({
    tipo: 1, // Locked to Tecnológico (ID 1)
    estado: '',
    agencia: ''
});

const pagination = ref({
    current_page: 1,
    last_page: 1,
    total: 0
});

// --- COMPUTED ROLES ---
const isRequester = computed(() => {
    return solicitudDetalle.value && authStore.user && authStore.user.id === solicitudDetalle.value.creado_por_id;
});

const isAssignee = computed(() => {
    return solicitudDetalle.value && authStore.user && authStore.user.id === solicitudDetalle.value.responsable_id;
});

const canFinalize = computed(() => {
    return isAssignee.value && ['asignada', 'en_seguimiento', 'reabierta'].includes(solicitudDetalle.value?.estado);
});

const canValidate = computed(() => {
    return isRequester.value && solicitudDetalle.value?.estado === 'pendiente_validacion' && authStore.user.tipo !== 'externo';
});

// --- METHODS ---
const loadMyRequests = async (page = 1) => {
    loadingList.value = true;
    try {
        const response = await SolicitudService.getSolicitudes({
            page,
            mis_asignaciones: 'true',
            categoria_general_id: filtros.value.tipo,
            estado: filtros.value.estado,
            agencia_id: filtros.value.agencia
        });
        solicitudes.value = response.data.data;
        pagination.value = {
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            total: response.data.total
        };
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron cargar las solicitudes', 'error');
    } finally {
        loadingList.value = false;
    }
};

const handleSelect = async (sol) => {
    selectedSolicitud.value = sol;
    loadingDetail.value = true;
    try {
        const response = await SolicitudService.getSolicitud(sol.id);
        solicitudDetalle.value = response.data;
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo cargar el detalle', 'error');
    } finally {
        loadingDetail.value = false;
    }
};

const handleBackToList = () => {
    selectedSolicitud.value = null;
    solicitudDetalle.value = null;
};

const handleUpdateFiltros = (newFiltros) => {
    filtros.value = newFiltros;
};

// --- CASE ACTIONS ---
const handleEnviarSeguimiento = async (formDataRaw) => {
    if (!selectedSolicitud.value) return;
    savingSeguimiento.value = true;
    try {
        const formData = new FormData();
        formData.append('comentario', formDataRaw.comentario);
        formData.append('tipo_accion', 'comentario');
        if (formDataRaw.evidencias) {
            for (let i = 0; i < formDataRaw.evidencias.length; i++) {
                formData.append('evidencias[]', formDataRaw.evidencias[i]);
            }
        }

        await SolicitudService.addSeguimiento(selectedSolicitud.value.id, formData);

        // Refresh detail to show new message
        const response = await SolicitudService.getSolicitud(selectedSolicitud.value.id);
        solicitudDetalle.value = response.data;

        Swal.fire({ icon: 'success', title: 'Actualizado', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo enviar la actualización', 'error');
    } finally {
        savingSeguimiento.value = false;
    }
};

const handleConfirmarCierre = async (cierreData) => {
    if (!selectedSolicitud.value) return;
    try {
        const formData = new FormData();
        formData.append('comentario', 'Resolución: ' + cierreData.comentario);
        formData.append('tipo_accion', 'evidencia'); // Dispara pendiente_validacion

        if (cierreData.evidencias) {
            for (let i = 0; i < cierreData.evidencias.length; i++) {
                formData.append('evidencias[]', cierreData.evidencias[i]);
            }
        }

        await SolicitudService.addSeguimiento(selectedSolicitud.value.id, formData);
        Swal.fire('¡Finalizado!', 'El caso ha sido marcado como solucionado.', 'success');

        // Refresh list and detail
        await loadMyRequests(pagination.value.current_page);
        handleSelect(selectedSolicitud.value);
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo finalizar el caso', 'error');
    }
};

const handleConfirmarValidacion = async (validarData) => {
    if (!selectedSolicitud.value) return;
    try {
        await SolicitudService.validateSolicitud(selectedSolicitud.value.id, {
            accion: validarData.accion,
            tipo_solucion: validarData.tipo_solucion,
            comentario: validarData.comentario
        });

        Swal.fire('Procesado', 'La solicitud ha sido actualizada', 'success');

        // Refresh list and detail
        await loadMyRequests(pagination.value.current_page);
        handleSelect(selectedSolicitud.value);
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo validar el caso', 'error');
    }
};

const handleExportCSV = async () => {
    try {
        Swal.fire({
            title: 'Generando Reporte',
            text: 'Por favor espere...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await SolicitudService.exportSolicitudes({
            mis_asignaciones: 'true',
            categoria_general_id: filtros.value.tipo,
            estado: filtros.value.estado,
            agencia_id: filtros.value.agencia
        });

        // Crear un link para descargar el blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte_solicitudes_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        Swal.close();
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo generar el reporte', 'error');
    }
};

// --- WATCHERS ---
watch(filtros, () => {
    pagination.value.current_page = 1;
    loadMyRequests();
}, { deep: true });

onMounted(() => {
    loadMyRequests();
});
</script>

<template>
    <div class="px-2 py-3 md:px-4 md:-mx-3 h-[calc(100dvh-120px)] md:h-[calc(100vh-120px)] min-h-[480px] md:min-h-[600px] bg-transparent border-none rounded-2xl relative overflow-hidden flex flex-col">
        <div class="w-full flex-1 custom-grid overflow-hidden">
            <!-- Left Panel: Request List & Details -->
            <BandejaRequestDetails
                class="div2"
                :solicitudes="solicitudes"
                :selectedSolicitud="selectedSolicitud"
                :solicitudDetalle="solicitudDetalle"
                :loadingList="loadingList"
                :loadingDetail="loadingDetail"
                :pagination="pagination"
                :canFinalize="canFinalize"
                :canValidate="canValidate"
                :filtros="filtros"
                @seleccionar="handleSelect"
                @cambiarPagina="loadMyRequests"
                @verBackToList="handleBackToList"
                @confirmar-cierre="handleConfirmarCierre"
                @confirmar-validacion="handleConfirmarValidacion"
                @update-filtros="handleUpdateFiltros"
                @export-csv="handleExportCSV"
            />

            <!-- Top Right: Interactive Chat/History -->
            <BandejaEventHistory
                class="div3"
                :class="{ 'hide-on-mobile': !selectedSolicitud }"
                :selectedSolicitud="selectedSolicitud"
                :solicitudDetalle="solicitudDetalle"
                :loadingDetail="loadingDetail"
                :saving="savingSeguimiento"
                @enviar-seguimiento="handleEnviarSeguimiento"
            />

            <!-- Bottom Right: Attachments -->
            <BandejaAttachments
                class="div4"
                :class="{ 'hide-on-mobile': !selectedSolicitud }"
                :selectedSolicitud="selectedSolicitud"
                :solicitudDetalle="solicitudDetalle"
                :loadingDetail="loadingDetail"
            />
        </div>
    </div>
</template>

<style scoped>
.custom-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    grid-template-rows: auto minmax(0, 1fr) minmax(0, 1fr) auto;
    gap: 1rem;
}

.div2 { grid-area: 1 / 1 / 5 / 4; }
.div3 { grid-area: 1 / 4 / 4 / 6; }
.div4 { grid-area: 4 / 4 / 5 / 6; }

/* Responsive adjustments */
@media (max-width: 1024px) {
    .hide-on-mobile {
        display: none !important;
    }
    .custom-grid {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }
    .div2, .div3, .div4 {
        height: auto;
        flex: none;
    }
    .div2 { height: calc(100dvh - 150px); min-height: 480px; }
    .div3 { height: 450px; }
    .div4 { height: 250px; }
}

@media (max-width: 640px) {
    .div2 { height: calc(100dvh - 140px); min-height: 400px; }
    .div3 { height: 450px; }
    .div4 { height: 250px; }
}

.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155;
}
</style>
