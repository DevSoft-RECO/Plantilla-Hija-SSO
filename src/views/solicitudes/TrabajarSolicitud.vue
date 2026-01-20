<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SolicitudService from '@/services/SolicitudService';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const id = route.params.id;

const solicitud = ref(null);
const loading = ref(true);
const refreshing = ref(false); // Nuevo estado para recarga silenciosa
const saving = ref(false); // Para comentarios normales
const finalizarLoading = ref(false); // Para el cierre

// Estado para el Modal de Finalización
const showFinalizarModal = ref(false);
const cierreData = ref({
    comentario: '',
    evidencias: []
});

const nuevoSeguimiento = ref({
    comentario: '',
    evidencias: []
});

// Validación
const showValidarModal = ref(false);
const validarLoading = ref(false);
const validarData = ref({
    accion: 'cerrar',
    tipo_solucion: 'total',
    comentario: ''
});

// Computed Roles
const isRequester = computed(() => {
    return solicitud.value && authStore.user && authStore.user.id === solicitud.value.creado_por_id;
});

const isAssignee = computed(() => {
    return solicitud.value && authStore.user && authStore.user.id === solicitud.value.responsable_id;
});

const canValidate = computed(() => {
    // Solo si es creador, status pendiente_validacion y NO es externo
    return isRequester.value &&
           solicitud.value?.estado === 'pendiente_validacion' &&
           authStore.user.tipo !== 'externo';
});

const canFinalize = computed(() => {
    // Solo si es responsable y status asignada/en_seguimiento/reabierta
    return isAssignee.value &&
           ['asignada', 'en_seguimiento', 'reabierta'].includes(solicitud.value?.estado);
});

const canComment = computed(() => {
    // Si soy admin o asignado: SIEMPRE (salvo cerrada)
    if (authStore.hasRole('Super Admin') || isAssignee.value) return true;

    // Si soy solicitante: SOLO si está en seguimiento, validación O reabierta
    // (Bloqueado en reportada y asignada)
    if (isRequester.value) {
        return ['en_seguimiento', 'pendiente_validacion', 'reabierta'].includes(solicitud.value?.estado);
    }

    // Otros (auditor, jefe): pueden comentar si no está cerrada
    return true;
});

onMounted(() => {
    cargarDetalle();
});

const cargarDetalle = async (background = false) => {
    if (!background) loading.value = true;
    else refreshing.value = true;

    try {
        const response = await SolicitudService.getSolicitud(id);
        solicitud.value = response.data;

        // Scroll al fondo si es recarga manual y estamos abajo (opcional, por ahora solo actualizamos datos)
        // if (background) {
        //      setTimeout(() => {
        //         const container = document.querySelector('.custom-scrollbar.flex-1');
        //          // Solo scroll si el usuario quiere? Por ahora no forzamos scroll en refresh para no molestar si está leyendo arriba
        //     }, 100);
        // }

    } catch {
        Swal.fire('Error', 'No se pudo cargar el caso', 'error');
        if (!background) router.push({ name: 'mi-bandeja' });
    } finally {
        loading.value = false;
        refreshing.value = false;
    }
};



const enviarSeguimiento = async () => {
    if (!nuevoSeguimiento.value.comentario) {
        return Swal.fire('Atención', 'Escribe un comentario o actualización', 'warning');
    }

    saving.value = true;
    try {
        const formData = new FormData();
        formData.append('comentario', nuevoSeguimiento.value.comentario);
        formData.append('tipo_accion', 'comentario');

        if (nuevoSeguimiento.value.evidencias) {
            for (let i = 0; i < nuevoSeguimiento.value.evidencias.length; i++) {
                formData.append('evidencias[]', nuevoSeguimiento.value.evidencias[i]);
            }
        }

        const response = await SolicitudService.addSeguimiento(id, formData);

        // Optimización: Agregar el nuevo seguimiento a la lista local sin recargar todo
        if (solicitud.value && response.data) {
            // Aseguramos que evidencias sea array si viene null
            const newSeg = response.data;
            if (!newSeg.evidencias) newSeg.evidencias = [];

            // Agregamos al final (orden cronológico)
            solicitud.value.seguimientos.push(newSeg);

            // Si cambio el estado (ej: asignada -> en_seguimiento), actualizarlo
            if (solicitud.value.estado === 'asignada' && newSeg.tipo_accion === 'comentario') {
                solicitud.value.estado = 'en_seguimiento';
            }

            // Scroll al fondo
            setTimeout(() => {
                const container = document.querySelector('.custom-scrollbar.flex-1');
                if (container) container.scrollTop = container.scrollHeight;
            }, 100);
        }

        // Limpiar form
        nuevoSeguimiento.value.comentario = '';
        nuevoSeguimiento.value.evidencias = [];

        // await cargarDetalle(); // Eliminado para eficiencia

        Swal.fire({
            icon: 'success',
            title: 'Actualizado',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo enviar la actualización', 'error');
    } finally {
        saving.value = false;
    }
};

// --- Lógica de Finalización ---
const finalizarCaso = () => {
    // Abrir modal
    showFinalizarModal.value = true;
};

const handleCierreFileUpload = (event) => {
    cierreData.value.evidencias = event.target.files;
};

const confirmarCierre = async () => {
    if (!cierreData.value.comentario) {
        return Swal.fire('Atención', 'Debes describir la solución para finalizar.', 'warning');
    }

    finalizarLoading.value = true;
    try {
        const formData = new FormData();
        formData.append('comentario', 'Resolución: ' + cierreData.value.comentario);
        formData.append('tipo_accion', 'evidencia'); // Dispara pendiente_validacion

        if (cierreData.value.evidencias) {
            for (let i = 0; i < cierreData.value.evidencias.length; i++) {
                formData.append('evidencias[]', cierreData.value.evidencias[i]);
            }
        }

        await SolicitudService.addSeguimiento(id, formData);

        Swal.fire({
            title: '¡Finalizado!',
            text: 'El caso ha sido marcado como solucionado y pasará a validación.',
            icon: 'success'
        });

        showFinalizarModal.value = false;
        router.push({ name: 'mi-bandeja' });

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo finalizar el caso', 'error');
    } finally {
        finalizarLoading.value = false;
    }
};


// --- Lógica de Validación (Requester) ---
const abrirValidarModal = () => {
    validarData.value.accion = 'cerrar';
    validarData.value.tipo_solucion = 'total';
    validarData.value.comentario = '';
    showValidarModal.value = true;
};

const confirmarValidacion = async () => {
    if (validarData.value.accion === 'reabrir' && !validarData.value.comentario) {
        return Swal.fire('Atención', 'El motivo de rechazo es obligatorio.', 'warning');
    }

    validarLoading.value = true;
    try {
         await SolicitudService.validateSolicitud(id, {
            accion: validarData.value.accion,
            tipo_solucion: validarData.value.tipo_solucion,
            comentario: validarData.value.comentario
         });

         Swal.fire('Procesado', 'La solicitud ha sido actualizada', 'success');
         showValidarModal.value = false;
         router.push({ name: 'mis-solicitudes' }); // Volver a lista

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo validar el caso', 'error');
    } finally {
        validarLoading.value = false;
    }
};

const formatFecha = (fecha) => new Date(fecha).toLocaleString();
const isImage = (url) => url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) != null;

</script>

<template>
    <!-- Root Div for Transition Support -->
    <div class="h-full">
        <div v-if="loading" class="p-8 text-center text-gray-500">
            <i class="fas fa-spinner fa-spin text-2xl"></i> Cargando espacio de trabajo...
        </div>

        <div v-else class="p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">

            <!-- Columna Izquierda: Detalles del Caso -->
            <div class="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 overflow-y-auto custom-scrollbar">
                <button @click="router.push({ name: 'mi-bandeja' })" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 mb-4 flex items-center gap-2 text-sm">
                    <i class="fas fa-arrow-left"></i> Volver a Mi Bandeja
                </button>

                <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">{{ solicitud.titulo }}</h1>
                <span
                    class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-6"
                    :class="{
                        'bg-red-50 text-red-700': solicitud.estado === 'reportada',
                        'bg-blue-50 text-blue-700': solicitud.estado === 'asignada',
                        'bg-yellow-50 text-yellow-700': solicitud.estado === 'en_seguimiento',
                        'bg-purple-50 text-purple-700': solicitud.estado === 'pendiente_validacion',
                        'bg-green-50 text-green-700': solicitud.estado === 'cerrada'
                    }"
                >
                    {{ solicitud.estado?.replace('_', ' ') }}
                </span>

                <div class="mb-6">
                    <h3 class="text-xs font-semibold text-gray-400 uppercase mb-2">Solicitante</h3>
                    <div class="flex items-center gap-3">
                        <div class="bg-blue-100 dark:bg-gray-700 h-8 w-8 rounded-full flex items-center justify-center text-blue-600 dark:text-gray-200 font-bold text-xs">
                            {{ solicitud.creado_por_nombre?.charAt(0) }}
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ solicitud.creado_por_nombre }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{{ solicitud.creado_por_cargo || 'Sin Cargo' }}</p>
                        </div>
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-xs font-semibold text-gray-400 uppercase mb-2">Descripción</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">{{ solicitud.descripcion }}</p>
                </div>

                <div v-if="solicitud.evidencias_inicial_urls?.length" class="mb-6">
                    <h3 class="text-xs font-semibold text-gray-400 uppercase mb-2">Evidencias Iniciales</h3>
                    <div class="grid grid-cols-3 gap-2">
                        <a
                            v-for="(url, idx) in solicitud.evidencias_inicial_urls"
                            :key="idx"
                            :href="url"
                            target="_blank"
                            class="aspect-square rounded-lg border border-gray-200 overflow-hidden hover:opacity-75 transition"
                        >
                            <img v-if="isImage(url)" :src="url" class="w-full h-full object-cover">
                            <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-red-500">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                                <span class="text-[10px] font-bold text-gray-500 uppercase">Archivo</span>
                            </div>
                        </a>
                    </div>
                    <p class="text-xs text-gray-400 mt-2 italic">
                        <i class="fas fa-clock"></i> Enlaces válidos por 20 minutos
                    </p>
                </div>

                <div v-if="solicitud.estado !== 'cerrada'" class="pt-6 border-t border-gray-100 dark:border-gray-700 space-y-3">
                    <button
                        v-if="canFinalize"
                        @click="finalizarCaso"
                        class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-green-200 dark:shadow-none transition flex items-center justify-center gap-2"
                    >
                        <i class="fas fa-check-circle"></i>
                        Finalizar Caso
                    </button>

                    <button
                        v-if="canValidate"
                        @click="abrirValidarModal"
                        class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg shadow-lg shadow-purple-200 dark:shadow-none transition flex items-center justify-center gap-2"
                    >
                        <i class="fas fa-clipboard-check"></i>
                        Validar Solución
                    </button>

                    <p v-if="!canFinalize && !canValidate && solicitud.estado !== 'cerrada'" class="text-xs text-center text-gray-400 italic">
                        Esperando acción del {{ isRequester ? 'técnico' : 'solicitante' }}...
                    </p>
                </div>
            </div>

            <!-- Columna Derecha: Área de Trabajo / Chat -->
            <div class="lg:col-span-2 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div class="bg-gray-50 dark:bg-gray-700/50 p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 class="font-bold text-gray-700 dark:text-gray-200">Historial de Seguimiento</h3>
                    <button
                        @click="cargarDetalle(true)"
                        class="text-gray-500 hover:text-indigo-600 transition p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Actualizar conversación"
                        :disabled="refreshing"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" :class="{ 'animate-spin': refreshing }">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/30 dark:bg-transparent">
                    <div v-if="solicitud.seguimientos.length === 0" class="text-center text-gray-400 py-10 italic">
                        No hay actualizaciones aún.
                    </div>

                    <div
                        v-for="seg in solicitud.seguimientos"
                        :key="seg.id"
                        class="flex gap-4"
                        :class="{ 'flex-row-reverse': seg.seguimiento_por_id == authStore.user.id }"
                    >
                        <!-- Avatar -->
                        <div
                            class="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                            :class="seg.seguimiento_por_id == authStore.user.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'"
                        >
                            {{ seg.seguimiento_por_nombre?.charAt(0) }}
                        </div>

                        <!-- Bubble -->
                        <div
                            class="max-w-[80%] rounded-2xl p-4 text-sm shadow-sm"
                            :class="[
                                seg.seguimiento_por_id == authStore.user.id
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'
                            ]"
                        >
                            <div class="flex justify-between items-center gap-4 mb-1 opacity-80 text-xs">
                                <span class="font-semibold">{{ seg.seguimiento_por_nombre }}</span>
                                <span>{{ formatFecha(seg.created_at) }}</span>
                            </div>

                            <p class="whitespace-pre-wrap">{{ seg.comentario }}</p>

                            <div v-if="seg.evidencias && seg.evidencias.length" class="mt-3 flex flex-wrap gap-2">
                                <a
                                    v-for="(ev, idx) in seg.evidencias"
                                    :key="idx"
                                    :href="ev"
                                    target="_blank"
                                    class="text-xs flex items-center gap-1 bg-black/10 px-2 py-1 rounded hover:bg-black/20 transition"
                                >
                                    <i class="fas fa-paperclip"></i> Adjunto {{ idx + 1 }}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="solicitud.estado !== 'cerrada'" class="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                    <div v-if="canComment" class="flex flex-col gap-3">
                        <textarea
                            v-model="nuevoSeguimiento.comentario"
                            rows="3"
                            placeholder="Escribe una actualización o nota interna..."
                            class="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                        ></textarea>

                        <div class="flex justify-end">
                            <button
                                @click="enviarSeguimiento"
                                :disabled="saving"
                                class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition shadow-md flex items-center gap-2 disabled:opacity-50"
                            >
                                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                                <span v-else>Enviar <i class="fas fa-paper-plane ml-1"></i></span>
                            </button>
                        </div>
                    </div>
                    <div v-else class="text-center py-4 bg-yellow-50 dark:bg-gray-700/50 rounded-lg border border-yellow-100 dark:border-gray-600">
                        <i class="fas fa-user-clock text-yellow-500 mb-2 text-xl"></i>
                        <p class="text-gray-600 dark:text-gray-300 text-sm font-medium">
                            Esperando inicio de soporte...
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Podrás interactuar cuando el agente comience a trabajar en tu caso.
                        </p>
                    </div>
                </div>
                <div v-else class="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 text-center">
                     <p class="text-sm text-gray-500 dark:text-gray-400 italic">
                        <i class="fas fa-lock mr-2"></i> Este caso está cerrado y en modo histórico.
                    </p>
                </div>
            </div>
        </div>

        <!-- Modal Finalizar Caso -->
        <div v-if="showFinalizarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                <div class="bg-green-600 p-4 text-white flex justify-between items-center">
                    <h3 class="font-bold text-lg"><i class="fas fa-check-circle mr-2"></i> Finalizar y Resolver Caso</h3>
                    <button @click="showFinalizarModal = false" class="hover:bg-white/20 rounded-full p-1 transition"><i class="fas fa-times"></i></button>
                </div>

                <div class="p-6 space-y-4">
                    <div class="bg-blue-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-gray-600">
                        <i class="fas fa-info-circle mr-1"></i>
                        Describe la solución aplicada. Puedes adjuntar evidencias (capturas, documentos) que comprueben la resolución.
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Solución / Comentario de Cierre <span class="text-red-500">*</span></label>
                        <textarea
                            v-model="cierreData.comentario"
                            rows="4"
                            class="w-full border rounded-lg p-3 dark:bg-gray-700 dark:border-gray-600 resize-none focus:ring-2 focus:ring-green-500 text-gray-700 dark:text-gray-200"
                            placeholder="Ej: Se reinició el servicio y se verificó conexión..."
                        ></textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Evidencias de Solución (Opcional)</label>
                        <input
                            type="file"
                            multiple
                            @change="handleCierreFileUpload"
                            class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:text-gray-300"
                        >
                        <p class="text-xs text-gray-500 mt-1" v-if="cierreData.evidencias.length">
                            {{ cierreData.evidencias.length }} archivo(s) seleccionado(s)
                        </p>
                    </div>
                </div>

                <div class="p-4 bg-gray-50 dark:bg-gray-700/30 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                    <button @click="showFinalizarModal = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                    <button
                        @click="confirmarCierre"
                        :disabled="finalizarLoading"
                        class="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition font-medium flex items-center gap-2 disabled:opacity-70"
                    >
                        <i v-if="finalizarLoading" class="fas fa-spinner fa-spin"></i>
                        {{ finalizarLoading ? 'Enviando...' : 'Confirmar Solución' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Validar -->
        <div v-if="showValidarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div class="bg-purple-600 p-4 text-white flex justify-between items-center">
                    <h3 class="font-bold text-lg"><i class="fas fa-clipboard-check mr-2"></i> Validar Solicitud</h3>
                    <button @click="showValidarModal = false" class="hover:bg-white/20 rounded-full p-1 transition"><i class="fas fa-times"></i></button>
                </div>

                <div class="p-6 space-y-4">
                     <p class="text-sm text-gray-600 dark:text-gray-300">
                        ¿Cómo deseas proceder con esta solicitud?
                     </p>

                     <div class="flex gap-4">
                        <label class="flex-1 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition" :class="validarData.accion === 'cerrar' ? 'ring-2 ring-green-500 border-green-500 bg-green-50' : 'border-gray-200'">
                            <input type="radio" v-model="validarData.accion" value="cerrar" class="hidden">
                            <div class="text-center">
                                <i class="fas fa-check-circle text-2xl text-green-500 mb-2"></i>
                                <div class="font-bold text-sm text-gray-800">Aprobar y Cerrar</div>
                            </div>
                        </label>

                         <label class="flex-1 border p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition" :class="validarData.accion === 'reabrir' ? 'ring-2 ring-orange-500 border-orange-500 bg-orange-50' : 'border-gray-200'">
                            <input type="radio" v-model="validarData.accion" value="reabrir" class="hidden">
                            <div class="text-center">
                                <i class="fas fa-undo text-2xl text-orange-500 mb-2"></i>
                                <div class="font-bold text-sm text-gray-800">Rechazar / Devolver</div>
                            </div>
                        </label>
                     </div>

                     <div v-if="validarData.accion === 'cerrar'" class="bg-blue-50 dark:bg-gray-700/30 p-3 rounded-lg border border-blue-100 dark:border-gray-600">
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alcance de la Solución:</p>
                        <div class="flex gap-4">
                             <label class="flex items-center gap-2 cursor-pointer">
                                 <input type="radio" v-model="validarData.tipo_solucion" value="total" class="text-green-600 focus:ring-green-500">
                                 <span class="text-sm text-gray-600 dark:text-gray-400">Total</span>
                             </label>
                             <label class="flex items-center gap-2 cursor-pointer">
                                 <input type="radio" v-model="validarData.tipo_solucion" value="parcial" class="text-yellow-600 focus:ring-yellow-500">
                                 <span class="text-sm text-gray-600 dark:text-gray-400">Parcial</span>
                             </label>
                        </div>
                     </div>

                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Comentario
                            <span v-if="validarData.accion === 'reabrir'" class="text-red-500">*</span>
                            <span v-else class="text-gray-400 font-normal">(Opcional)</span>
                        </label>
                        <textarea v-model="validarData.comentario" rows="3" class="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 resize-none" :placeholder="validarData.accion === 'reabrir' ? 'Motivo del rechazo...' : 'Observaciones adicionales...'"></textarea>
                     </div>
                </div>

                <div class="p-4 bg-gray-50 dark:bg-gray-700/30 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                    <button @click="showValidarModal = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                    <button
                        @click="confirmarValidacion"
                        :disabled="validarLoading"
                        class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md transition font-medium flex items-center gap-2 disabled:opacity-70"
                    >
                        <i v-if="validarLoading" class="fas fa-spinner fa-spin"></i>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 20px;
}
</style>
