<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import BandejaAdminRequestDetails from './components/BandejaAdminRequestDetails.vue';
import BandejaAdminEventHistory from './components/BandejaAdminEventHistory.vue';
import BandejaAdminAttachments from './components/BandejaAdminAttachments.vue';
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
    tipo: 2, // Locked to Administrativo (ID 2)
    estado: '',
    agencia: ''
});

const pagination = ref({
    current_page: 1,
    last_page: 1,
    total: 0
});



const isAssignee = computed(() => {
    return solicitudDetalle.value && authStore.user && authStore.user.id === solicitudDetalle.value.responsable_id;
});

const canFinalize = computed(() => {
    return isAssignee.value && ['asignada', 'en_seguimiento', 'reabierta'].includes(solicitudDetalle.value?.estado);
});

// Since the "validar solucion" feature was requested to be removed from BandejaRequestDetails in previous prompts,
// we'll keep the prop passing out of caution, but it evaluates to false or unused by the duplicated component.
const canValidate = computed(() => false);

// --- METHODS ---
const loadMyRequests = async (page = 1) => {
    loadingList.value = true;
    try {
        const response = await SolicitudService.getMiBandejaAdmin({
            page,
            estado: filtros.value.estado
        });
        
        // Match the structure returned by getMiBandejaAdmin (uses Pagination)
        solicitudes.value = response.data.data;
        pagination.value = {
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            total: response.data.total
        };
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron cargar las solicitudes administrativas', 'error');
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
    <div class="px-2 py-3 md:px-4 md:-mx-3 h-[calc(100vh-120px)] min-h-[600px] bg-[#f0f4f8] dark:bg-gray-900 border-none rounded-2xl relative overflow-hidden flex flex-col">
        <div class="w-full flex-1 custom-grid overflow-hidden">
            <!-- Left Panel: Request List & Details -->
            <BandejaAdminRequestDetails
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
            />

            <!-- Top Right: Interactive Chat/History -->
            <BandejaAdminEventHistory
                class="div3"
                :selectedSolicitud="selectedSolicitud"
                :solicitudDetalle="solicitudDetalle"
                :loadingDetail="loadingDetail"
                :saving="savingSeguimiento"
                @enviar-seguimiento="handleEnviarSeguimiento"
            />

            <!-- Bottom Right: Attachments -->
            <BandejaAdminAttachments
                class="div4"
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
    .custom-grid {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }
    .div2, .div3, .div4 {
        height: auto;
        flex: none;
    }
    .div2 { height: 600px; }
    .div3 { height: 400px; }
    .div4 { height: 200px; }
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
