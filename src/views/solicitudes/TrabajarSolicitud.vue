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

const backRouteName = computed(() => {
    // 2 is Administrative, everything else (or 1) is Technology/Default
    if (solicitud.value?.categoria_general_id === 2) {
        return 'mis-asignaciones-admin';
    }
    return 'mis-asignaciones';
});

const misSolicitudesRoute = computed(() => {
    // 2 is Administrative, everything else (or 1) is Technology/Default
    if (solicitud.value?.categoria_general_id === 2) {
        return 'mis-solicitudes-admin';
    }
    return 'mis-solicitudes-tec';
});

// TABS Logic
const activeTab = ref('chat');

const fileInput = ref(null);

const allAttachments = computed(() => {
    let files = [];
    if (!solicitud.value) return [];

    // Set to track unique paths/urls to avoid duplication
    // We use the URL without query params (signature) as a key, since paths might be hidden in some views
    const seenFiles = new Set();
    const cleanUrl = (url) => {
        if (!url) return '';
        return url.split('?')[0]; // Remove signature Query Params
    };

    // 1. Iniciales (Subidos por Creador)
    if (solicitud.value.evidencias_inicial_urls) {
        solicitud.value.evidencias_inicial_urls.forEach((url, index) => {
             let base = cleanUrl(url);
             if (seenFiles.has(base)) return;
             seenFiles.add(base);

             let originalPath = solicitud.value.evidencias_inicial ? solicitud.value.evidencias_inicial[index] : null;

             files.push({
                 url,
                 path: originalPath,
                 is_image: isImage(url),
                 source: 'Evidencia Inicial',
                 uploader_id: solicitud.value.creado_por_id,
                 date: solicitud.value.created_at,
                 can_delete: (isRequester.value || authStore.hasRole('Super Admin')) && solicitud.value.estado !== 'cerrada'
             });
        });
    }

    // 2. Finales (Subidos por Responsable)
    if (solicitud.value.evidencias_final_urls) {
        solicitud.value.evidencias_final_urls.forEach((url, index) => {
             let base = cleanUrl(url);
             if (seenFiles.has(base)) return; // Should not overlap with initial usually, but safety check
             seenFiles.add(base);

             let originalPath = solicitud.value.evidencias_final ? solicitud.value.evidencias_final[index] : null;

             files.push({
                 url,
                 path: originalPath,
                 is_image: isImage(url),
                 source: 'Evidencia Final',
                 uploader_id: solicitud.value.responsable_id,
                 date: solicitud.value.updated_at,
                 can_delete: (isAssignee.value || authStore.hasRole('Super Admin')) && solicitud.value.estado !== 'cerrada'
             });
        });
    }

    // 3. Seguimientos (Adjuntos en comentarios - Historial)
    if (solicitud.value.seguimientos) {
        solicitud.value.seguimientos.forEach(seg => {
            if (seg.evidencias) {
                seg.evidencias.forEach((url) => {
                     let base = cleanUrl(url);
                     // deduplicate: if this file is already in Initial or Final, SKIP IT
                     if (seenFiles.has(base)) return;

                     // --- FIX: Filter out "Phantom" deleted files ---
                     // If it looks like a managed file (/inicial/ or /final/) but wasn't in the lists above (seenFiles),
                     // it means it was DELETED from the main columns. We must NOT show it.
                     const isManaged = base.includes('/inicial/') || base.includes('/final/');
                     if (isManaged) return;

                     seenFiles.add(base);

                     files.push({
                        url,
                        is_image: isImage(url),
                        source: 'Adjunto en comentario',
                        uploader_id: seg.seguimiento_por_id,
                        date: seg.created_at,
                        can_delete: false
                    });
                });
            }
        });
    }

    // Ordenar (Recientes primero)
    return files.sort((a, b) => new Date(b.date) - new Date(a.date));
});

// File Management (Via Chat now)
const triggerUpload = () => {
    fileInput.value.click();
};

const handleChatFileUpload = (event) => {
    const files = event.target.files;
    if (!files.length) return;

    // Convert FileList to Array and add to nuevoSeguimiento
    if (!nuevoSeguimiento.value.evidencias) nuevoSeguimiento.value.evidencias = [];

    // We store the RAW FILES for FormData, not URLs yet
    for(let i=0; i<files.length; i++) {
        nuevoSeguimiento.value.evidencias.push(files[i]);
    }

    // Reset inputs
    event.target.value = '';
};

const removeAttachedFile = (index) => {
    nuevoSeguimiento.value.evidencias.splice(index, 1);
};

const deleteFile = async (file) => {
    if (!file.path) return; // Si es de comentario antiguo no tiene path "suelto" facil

    const result = await Swal.fire({
        title: '¿Eliminar archivo?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await SolicitudService.deleteEvidence(id, file.path);
            Swal.fire('Eliminado', 'El archivo ha sido eliminado.', 'success');
            await cargarDetalle(true);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo eliminar', 'error');
        }
    }
};

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
        if (!background) router.push({ name: backRouteName.value });
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
        await cargarDetalle(true); // Restaurado para actualizar listas de evidencias (evitar falso 'Eliminado')

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

        // showFinalizarModal.value = false; // Se cierra solo al cambiar de pagina, o si nos quedamos:
        showFinalizarModal.value = false;
        router.push({ name: backRouteName.value });

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
         router.push({ name: misSolicitudesRoute.value }); // Volver a lista

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo validar el caso', 'error');
    } finally {
        validarLoading.value = false;
    }
};

const formatFecha = (fecha) => new Date(fecha).toLocaleString();
const isImage = (url) => url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) != null;

const isDeletedFile = (url) => {
    if (!url) return true;
    const clean = url.split('?')[0];

    // 1. Identify if it belongs to managed folders
    const isManaged = clean.includes('/inicial/') || clean.includes('/final/');
    if (!isManaged) return false;

    // 2. Check strictly against the ACTIVE lists (evidencias_inicial_urls, evidencias_final_urls)
    // Create a Set of all active cleansed URLs for performance
    const activeFiles = new Set();

    if (solicitud.value.evidencias_inicial_urls) {
        solicitud.value.evidencias_inicial_urls.forEach(u => activeFiles.add(u.split('?')[0]));
    }
    if (solicitud.value.evidencias_final_urls) {
        solicitud.value.evidencias_final_urls.forEach(u => activeFiles.add(u.split('?')[0]));
    }

    // If it's managed but NOT in activeFiles, it's deleted.
    return !activeFiles.has(clean);
};

</script>

<template>
    <!-- Root Div for Transition Support -->
    <div class="h-full">
        <div v-if="loading" class="p-8 text-center text-gray-500">
            <i class="fas fa-spinner fa-spin text-2xl"></i> Cargando espacio de trabajo...
        </div>

        <div v-else class="p-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]">

            <!-- Columna Izquierda: Detalles del Caso -->
            <div class="lg:col-span-1 bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-verde-cope/30 p-6 overflow-y-auto custom-scrollbar">
                <button @click="router.push({ name: backRouteName })" class="text-white/40 hover:text-white mb-4 flex items-center gap-2 text-sm transition-colors">
                    <i class="fas fa-arrow-left"></i> Volver a Mi Bandeja
                </button>

                <h1 class="text-xl font-bold text-white mb-2 leading-tight">{{ solicitud.titulo }}</h1>
                <span
                    class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block mb-6 border"
                    :class="{
                        'bg-red-500/20 text-red-200 border-red-500/30': solicitud.estado === 'reportada',
                        'bg-blue-500/20 text-blue-200 border-blue-500/30': solicitud.estado === 'asignada',
                        'bg-yellow-500/20 text-yellow-200 border-yellow-500/30': solicitud.estado === 'en_seguimiento',
                        'bg-purple-500/20 text-purple-200 border-purple-500/30': solicitud.estado === 'pendiente_validacion',
                        'bg-green-500/20 text-green-200 border-green-500/30': solicitud.estado === 'cerrada'
                    }"
                >
                    {{ solicitud.estado?.replace('_', ' ') }}
                </span>

                <div class="mb-6">
                    <h3 class="text-xs font-semibold text-white/40 uppercase mb-2">Solicitante</h3>
                    <div class="flex items-center gap-3">
                        <div class="bg-white/10 h-8 w-8 rounded-full flex items-center justify-center text-white border border-white/20 font-bold text-xs shadow-sm">
                            {{ (solicitud.creado_por?.name || '?').charAt(0) }}
                        </div>
                        <div>
                            <p class="text-sm font-medium text-white">{{ solicitud.creado_por?.name || 'Usuario desconocido' }}</p>
                            <p class="text-xs text-white/40">{{ solicitud.creado_por?.puesto?.nombre || 'Sin Cargo' }}</p>
                        </div>
                    </div>
                </div>

                <div class="mb-6">
                    <h3 class="text-xs font-semibold text-white/40 uppercase mb-2">Descripción</h3>
                    <p class="text-sm text-white/80 whitespace-pre-line leading-relaxed">{{ solicitud.descripcion }}</p>
                </div>

                <div v-if="solicitud.evidencias_inicial_urls?.length">
                    <!-- Removed: Now in Archivos tab -->
                </div>

                <!-- Info Contexto -->
                <div class="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                    <div v-if="solicitud.agencia_id">
                        <span class="block text-xs font-semibold text-white/40 uppercase">Agencia</span>
                        <div class="text-sm font-medium text-white">{{ solicitud.agencia?.nombre }}</div>
                    </div>
                    <div v-if="solicitud.area">
                        <span class="block text-xs font-semibold text-white/40 uppercase">Área/Ubicación</span>
                        <div class="text-sm font-medium text-white">{{ solicitud.area }}</div>
                    </div>
                </div>

                <div v-if="solicitud.estado !== 'cerrada'" class="pt-6 border-t border-white/10 space-y-3">
                    <button
                        v-if="canFinalize"
                        @click="finalizarCaso"
                        class="w-full bg-verde-cope hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-emerald-900/20 transition flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                    >
                        <i class="fas fa-check-circle"></i>
                        Finalizar Caso
                    </button>

                    <button
                        v-if="canValidate"
                        @click="abrirValidarModal"
                        class="w-full bg-purple-600/40 hover:bg-purple-600 text-white font-bold py-2.5 rounded-lg border border-purple-500/30 transition flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                    >
                        <i class="fas fa-clipboard-check"></i>
                        Validar Solución
                    </button>

                    <p v-if="!canFinalize && !canValidate && solicitud.estado !== 'cerrada'" class="text-xs text-center text-white/40 italic">
                        Esperando acción del {{ isRequester ? 'técnico' : 'solicitante' }}...
                    </p>
                </div>
            </div>

            <!-- Columna Derecha: Chat / Seguimiento -->
            <div class="lg:col-span-2 flex flex-col bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-verde-cope/30 h-full overflow-hidden">
                <div class="p-4 border-b border-white/10 flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <!-- Tabs Selector -->
                        <div class="flex bg-white/10 rounded-lg p-1">
                            <button
                                @click="activeTab = 'chat'"
                                class="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
                                :class="activeTab === 'chat' ? 'bg-white text-[var(--color-verde-cope)] shadow-sm' : 'text-white/60 hover:text-white'"
                            >
                                Actividad
                            </button>
                            <button
                                @click="activeTab = 'files'"
                                class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2"
                                :class="activeTab === 'files' ? 'bg-white text-[var(--color-verde-cope)] shadow-sm' : 'text-white/60 hover:text-white'"
                            >
                                Archivos
                                <span v-if="allAttachments.length" class="bg-verde-cope text-white px-1.5 rounded-full text-[10px]">{{ allAttachments.length }}</span>
                            </button>
                        </div>
                    </div>

                    <button
                        @click="cargarDetalle(true)"
                        class="text-white/40 hover:text-white transition p-1.5 rounded-full hover:bg-white/10"
                        title="Actualizar conversación"
                        :disabled="refreshing"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5" :class="{ 'animate-spin': refreshing }">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/30 dark:bg-transparent">

                    <!-- TAB: ARCHIVOS (Gallery + Upload) -->
                    <div v-if="activeTab === 'files'">
                         <!-- Upload Zone removed as per request (Chat centric) -->

                         <!-- Grid -->

                         <!-- Grid -->
                         <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div v-if="!allAttachments.length" class="col-span-full text-center py-10 text-white/40 italic">
                                No hay archivos adjuntos.
                            </div>

                            <div
                                v-for="(file, i) in allAttachments"
                                :key="i"
                                class="group relative aspect-square bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                            >
                                <a :href="file.url" target="_blank" class="block w-full h-full">
                                    <img v-if="file.is_image" :src="file.url" class="w-full h-full object-cover">
                                    <div v-else class="w-full h-full flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-white/40">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                        </svg>
                                        <span class="text-[10px] font-bold text-white/40 uppercase">Archivo</span>
                                    </div>
                                </a>

                                <!-- Delete Button (Only owner) -->
                                <button
                                    v-if="file.can_delete"
                                    @click.prevent="deleteFile(file)"
                                    class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow hover:bg-red-600 transition opacity-0 group-hover:opacity-100 z-10"
                                    title="Eliminar archivo"
                                >
                                    <i class="fas fa-times text-xs"></i>
                                </button>

                                <!-- Metadata Label -->
                                <div class="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] p-1 truncate opacity-0 group-hover:opacity-100 transition pointer-events-none">
                                    {{ file.source }}
                                </div>
                            </div>
                         </div>
                    </div>

                    <!-- TAB: CHAT -->
                    <template v-else>
                     <div v-if="solicitud.seguimientos.length === 0" class="text-center text-white/40 py-10 italic">
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
                            class="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border border-white/20"
                            :class="seg.seguimiento_por_id == authStore.user.id ? 'bg-white/10 text-white' : 'bg-orange-500/20 text-orange-200'"
                        >
                            {{ seg.seguimiento_por_nombre?.charAt(0) }}
                        </div>

                        <!-- Bubble -->
                        <div
                            class="max-w-[80%] rounded-2xl p-4 text-sm shadow-sm border"
                            :class="[
                                seg.seguimiento_por_id == authStore.user.id
                                    ? 'bg-blue-600/40 text-white border-blue-500/30 rounded-tr-none'
                                    : 'bg-white/5 border-white/10 text-white/90 rounded-tl-none'
                            ]"
                        >
                            <div class="flex justify-between items-center gap-4 mb-2 opacity-80 text-xs">
                                <span class="font-semibold">{{ seg.seguimiento_por_nombre }}</span>
                                <span>{{ formatFecha(seg.created_at) }}</span>
                            </div>

                            <p v-if="seg.comentario" class="whitespace-pre-wrap mb-2">{{ seg.comentario }}</p>

                            <div v-if="seg.evidencias && seg.evidencias.length" class="flex flex-wrap gap-2">
                                <template v-for="(ev, idx) in seg.evidencias" :key="idx">
                                    <a
                                        v-if="!isDeletedFile(ev)"
                                        :href="ev"
                                        target="_blank"
                                        class="group relative w-32 h-32 aspect-square rounded overflow-hidden border border-gray-200/50 hover:shadow-md transition"
                                    >
                                        <img v-if="isImage(ev)" :src="ev" class="w-full h-full object-cover">
                                        <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 gap-2 p-2 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition">
                                            <i v-if="ev.toLowerCase().includes('.pdf')" class="fas fa-file-pdf text-red-500 text-3xl drop-shadow-sm"></i>
                                            <i v-else-if="ev.toLowerCase().includes('.doc') || ev.toLowerCase().includes('.docx')" class="fas fa-file-word text-blue-600 text-3xl drop-shadow-sm"></i>
                                            <i v-else-if="ev.toLowerCase().includes('.xls') || ev.toLowerCase().includes('.xlsx')" class="fas fa-file-excel text-green-600 text-3xl drop-shadow-sm"></i>
                                            <i v-else class="fas fa-file-alt text-white/40 text-3xl"></i>

                                            <span class="text-[10px] font-medium text-gray-600 dark:text-white/40 uppercase truncate w-full text-center">
                                                {{ ev.split('/').pop().split('?')[0].replace(/^\d+_/, '') }}
                                            </span>
                                        </div>
                                        <!-- Hover overlay -->
                                        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <i class="fas fa-external-link-alt text-white drop-shadow-md"></i>
                                        </div>
                                    </a>
                                    <!-- Deleted Placeholder -->
                                    <div v-else class="w-32 h-32 aspect-square rounded overflow-hidden border border-white/10 bg-white/5 flex flex-col items-center justify-center opacity-60">
                                         <i class="fas fa-trash text-white/20 text-2xl mb-1"></i>
                                         <span class="text-[10px] text-white/40 font-medium">Eliminado</span>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </div>
                </template>
                </div>

                <div v-if="solicitud.estado !== 'cerrada'" class="p-4 bg-white/5 border-t border-white/10">
                    <div v-if="canComment" class="flex flex-col gap-3">
                        <div class="relative">
                            <textarea
                                v-model="nuevoSeguimiento.comentario"
                                rows="3"
                                placeholder="Escribe un mensaje..."
                                class="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 resize-none text-sm transition-all text-white outline-none placeholder:text-white/20 shadow-inner"
                            ></textarea>


                        </div>

                        <!-- Toolbar -->
                        <div class="flex items-center justify-between">
                             <button
                                @click="triggerUpload"
                                class="text-gray-500 hover:text-indigo-600 dark:text-white/40 dark:hover:text-indigo-400 text-sm font-medium flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                                <i class="fas fa-paperclip text-lg"></i>
                                <span>Adjuntar archivos</span>
                            </button>
                            <!-- Hidden Input -->
                            <input
                                type="file"
                                ref="fileInput"
                                multiple
                                class="hidden"
                                @change="handleChatFileUpload"
                            >
                        </div>

                        <!-- File Previews -->
                        <div v-if="nuevoSeguimiento.evidencias.length" class="flex flex-wrap gap-2">
                             <div
                                v-for="(file, idx) in nuevoSeguimiento.evidencias"
                                :key="idx"
                                class="relative bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-xs flex items-center gap-2 border border-gray-200 dark:border-gray-600"
                             >
                                <i class="fas fa-file text-indigo-500"></i>
                                <span class="max-w-[150px] truncate text-gray-600 dark:text-gray-300">{{ file.name }}</span>
                                <button @click="removeAttachedFile(idx)" class="text-white/40 hover:text-red-500 transition">
                                    <i class="fas fa-times"></i>
                                </button>
                             </div>
                        </div>

                        <div class="flex justify-end">
                            <button
                                @click="enviarSeguimiento"
                                :disabled="saving || (!nuevoSeguimiento.comentario && !nuevoSeguimiento.evidencias.length)"
                                class="bg-[var(--color-azul-cope)] hover:opacity-90 text-white px-6 py-2 rounded-lg font-bold text-xs transition shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                            >
                                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                                <span v-else>Enviar Mensaje <i class="fas fa-paper-plane ml-1"></i></span>
                            </button>
                        </div>
                    </div>
                    <div v-else class="text-center py-4 bg-yellow-50 dark:bg-gray-700/50 rounded-lg border border-yellow-100 dark:border-gray-600">
                        <i class="fas fa-user-clock text-yellow-500 mb-2 text-xl"></i>
                        <p class="text-gray-600 dark:text-gray-300 text-sm font-medium">
                            Esperando inicio de soporte...
                        </p>
                        <p class="text-xs text-gray-500 dark:text-white/40 mt-1">
                            Podrás interactuar cuando el agente comience a trabajar en tu caso.
                        </p>
                    </div>
                </div>
                <div v-else class="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 text-center">
                     <p class="text-sm text-gray-500 dark:text-white/40 italic">
                        <i class="fas fa-lock mr-2"></i> Este caso está cerrado y en modo histórico.
                    </p>
                </div>
            </div>
        </div>

        <!-- Modal Finalizar Caso -->
        <div v-if="showFinalizarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
            <div class="bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-verde-cope/30 animate-fade-in-up">
                <div class="bg-verde-cope p-5 text-white flex justify-between items-center shadow-lg">
                    <h3 class="font-bold text-lg uppercase tracking-wider"><i class="fas fa-check-circle mr-2"></i> Finalizar Caso</h3>
                    <button @click="showFinalizarModal = false" class="hover:bg-white/20 rounded-full p-2 transition-colors"><i class="fas fa-times"></i></button>
                </div>

                <div class="p-6 space-y-6">
                    <div class="bg-white/5 p-4 rounded-xl text-sm text-white/80 border border-white/10">
                        <i class="fas fa-info-circle mr-2 text-verde-cope"></i>
                        Describe la solución aplicada y adjunta evidencias de la resolución.
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-white/40 uppercase mb-2">Solución / Comentario de Cierre <span class="text-red-500">*</span></label>
                        <textarea
                            v-model="cierreData.comentario"
                            rows="4"
                            class="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-verde-cope resize-none transition-all text-white outline-none placeholder:text-white/20"
                            placeholder="Ej: Se reinició el servicio y se verificó conexión..."
                        ></textarea>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-white/40 uppercase mb-2">Evidencias de Solución</label>
                        <input
                            type="file"
                            multiple
                            @change="handleCierreFileUpload"
                            class="w-full text-xs text-white/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 transition cursor-pointer"
                        >
                        <p class="text-[10px] text-verde-cope font-bold mt-2 uppercase tracking-widest" v-if="cierreData.evidencias.length">
                            {{ cierreData.evidencias.length }} archivo(s) seleccionado(s)
                        </p>
                    </div>
                </div>

                <div class="p-5 bg-white/5 flex justify-end gap-3 border-t border-white/10">
                    <button @click="showFinalizarModal = false" class="px-5 py-2 text-white/60 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">Cancelar</button>
                    <button
                        @click="confirmarCierre"
                        :disabled="finalizarLoading"
                        class="px-6 py-2.5 bg-verde-cope hover:opacity-90 text-white rounded-xl shadow-lg shadow-emerald-900/20 transition font-bold text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                    >
                        <i v-if="finalizarLoading" class="fas fa-spinner fa-spin"></i>
                        {{ finalizarLoading ? 'Procesando...' : 'Confirmar Resolución' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Validar -->
        <div v-if="showValidarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
            <div class="bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-purple-500/30 animate-fade-in-up">
                <div class="bg-purple-600 p-5 text-white flex justify-between items-center shadow-lg">
                    <h3 class="font-bold text-lg uppercase tracking-wider"><i class="fas fa-clipboard-check mr-2"></i> Validar Solicitud</h3>
                    <button @click="showValidarModal = false" class="hover:bg-white/20 rounded-full p-2 transition-colors"><i class="fas fa-times"></i></button>
                </div>

                <div class="p-6 space-y-6">
                     <p class="text-sm text-white/80">
                        ¿Cómo deseas proceder con esta solicitud?
                     </p>

                     <div class="flex gap-4">
                        <label class="flex-1 border p-4 rounded-xl cursor-pointer transition-all duration-300 group" :class="validarData.accion === 'cerrar' ? 'bg-verde-cope/20 border-verde-cope shadow-lg shadow-emerald-900/20' : 'bg-white/5 border-white/10 hover:bg-white/10'">
                            <input type="radio" v-model="validarData.accion" value="cerrar" class="hidden">
                            <div class="text-center">
                                <i class="fas fa-check-circle text-3xl mb-2 transition-transform group-hover:scale-110" :class="validarData.accion === 'cerrar' ? 'text-verde-cope' : 'text-white/20'"></i>
                                <div class="font-bold text-xs uppercase tracking-widest" :class="validarData.accion === 'cerrar' ? 'text-white' : 'text-white/40'">Aprobar y Cerrar</div>
                            </div>
                        </label>

                         <label class="flex-1 border p-4 rounded-xl cursor-pointer transition-all duration-300 group" :class="validarData.accion === 'reabrir' ? 'bg-orange-500/20 border-orange-500 shadow-lg shadow-orange-900/20' : 'bg-white/5 border-white/10 hover:bg-white/10'">
                            <input type="radio" v-model="validarData.accion" value="reabrir" class="hidden">
                            <div class="text-center">
                                <i class="fas fa-undo text-3xl mb-2 transition-transform group-hover:scale-110" :class="validarData.accion === 'reabrir' ? 'text-orange-500' : 'text-white/20'"></i>
                                <div class="font-bold text-xs uppercase tracking-widest" :class="validarData.accion === 'reabrir' ? 'text-white' : 'text-white/40'">Rechazar</div>
                            </div>
                        </label>
                     </div>

                     <div v-if="validarData.accion === 'cerrar'" class="bg-white/5 p-4 rounded-xl border border-white/10">
                        <p class="text-[10px] font-bold text-white/40 uppercase mb-3 tracking-widest">Alcance de la Solución:</p>
                        <div class="flex gap-6">
                             <label class="flex items-center gap-2 cursor-pointer group">
                                 <input type="radio" v-model="validarData.tipo_solucion" value="total" class="w-4 h-4 text-verde-cope bg-white/10 border-white/20 focus:ring-verde-cope">
                                 <span class="text-sm font-medium transition-colors group-hover:text-white" :class="validarData.tipo_solucion === 'total' ? 'text-white' : 'text-white/40'">Total</span>
                             </label>
                             <label class="flex items-center gap-2 cursor-pointer group">
                                 <input type="radio" v-model="validarData.tipo_solucion" value="parcial" class="w-4 h-4 text-yellow-500 bg-white/10 border-white/20 focus:ring-yellow-500">
                                 <span class="text-sm font-medium transition-colors group-hover:text-white" :class="validarData.tipo_solucion === 'parcial' ? 'text-white' : 'text-white/40'">Parcial</span>
                             </label>
                        </div>
                     </div>

                     <div>
                        <label class="block text-[10px] font-bold text-white/40 uppercase mb-2 tracking-widest">
                            Comentario Adicional
                            <span v-if="validarData.accion === 'reabrir'" class="text-red-500 ml-1">*</span>
                        </label>
                        <textarea v-model="validarData.comentario" rows="3" class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 resize-none text-white outline-none placeholder:text-white/20" :placeholder="validarData.accion === 'reabrir' ? 'Describe el motivo del rechazo...' : 'Observaciones (opcional)...'"></textarea>
                     </div>
                </div>

                <div class="p-5 bg-white/5 flex justify-end gap-3 border-t border-white/10">
                    <button @click="showValidarModal = false" class="px-5 py-2 text-white/60 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest">Cancelar</button>
                    <button
                        @click="confirmarValidacion"
                        :disabled="validarLoading"
                        class="px-6 py-2.5 bg-purple-600 hover:opacity-90 text-white rounded-xl shadow-lg shadow-purple-900/20 transition font-bold text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                    >
                        <i v-if="validarLoading" class="fas fa-spinner fa-spin"></i>
                        Confirmar Acción
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    border: 2px solid transparent;
    background-clip: content-box;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-verde-cope);
}
</style>
