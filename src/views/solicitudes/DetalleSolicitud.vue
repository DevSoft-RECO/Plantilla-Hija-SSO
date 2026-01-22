<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SolicitudService from '@/services/SolicitudService';
import Swal from 'sweetalert2';
import AsignarSolicitudModal from './components/AsignarSolicitudModal.vue';
import TomarCasoModal from './components/TomarCasoModal.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const authStore = useAuthStore();
const solicitud = ref(null);
const loading = ref(true);
const refreshing = ref(false);
const showAssignModal = ref(false);
const showTomarModal = ref(false);
const showValidarModal = ref(false);

const saving = ref(false);
const validarLoading = ref(false);

const isIntervenir = ref(false);

// Datos para validación/cierre
const validarData = ref({
    accion: 'cerrar', // cerrar | reabrir
    comentario: ''
});

const id = route.params.id;

const nuevoSeguimiento = ref({
    comentario: '',
    evidencias: []
});

const isChatLocked = computed(() => {
    // Bloqueado si NO he intervenido
    return !isIntervenir.value;
});

const activeTab = ref('chat');

const allAttachments = computed(() => {
    let files = [];
    if (!solicitud.value) return [];

    // Iniciales
    if (solicitud.value.evidencias_inicial_urls) {
        solicitud.value.evidencias_inicial_urls.forEach(url => {
             files.push({
                 url,
                 is_image: isImage(url),
                 source: 'Evidencia Inicial',
                 date: solicitud.value.created_at
             });
        });
    }

    // Seguimientos
    if (solicitud.value.seguimientos) {
        solicitud.value.seguimientos.forEach(seg => {
            if (seg.evidencias) {
                seg.evidencias.forEach(url => {
                    files.push({
                        url,
                        is_image: isImage(url),
                        source: 'Comentario de ' + seg.seguimiento_por_nombre,
                        date: seg.created_at
                    });
                });
            }
        });
    }

    // Ordenar más reciente primero
    return files.sort((a, b) => new Date(b.date) - new Date(a.date));
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
    } catch {
        Swal.fire('Error', 'No se pudo cargar el detalle', 'error');
        if (!background) loading.value = false; // Solo paramos loading si no era background (bug safety)
    } finally {
        loading.value = false;
        refreshing.value = false;
    }
};

const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString();
};

const isImage = (url) => {
    return url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i) != null;
};

// Acciones
const tomarCaso = () => {
    showTomarModal.value = true;
};

const onCaseTaken = () => {
    cargarDetalle();
};

const asignarCaso = () => {
    showAssignModal.value = true;
};

const onAssigned = () => {
    cargarDetalle();
};

const toggleIntervenir = () => {
    isIntervenir.value = !isIntervenir.value;
};

// Validación
const abrirValidarModal = () => {
    validarData.value.accion = 'cerrar';
    validarData.value.comentario = '';
    showValidarModal.value = true;
};

const confirmarValidacion = async () => {
    if (!validarData.value.comentario) {
        return Swal.fire('Atención', 'Escribe un comentario de validación', 'warning');
    }

    validarLoading.value = true;
    try {
        // Suponiendo endpoint validateValidation en service
         await SolicitudService.validateSolicitud(id, {
            accion: validarData.value.accion,
            comentario: validarData.value.comentario
         });

         Swal.fire('Procesado', 'La solicitud ha sido actualizada', 'success');
         showValidarModal.value = false;
         isIntervenir.value = false; // Reset intervención
         cargarDetalle();

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo validar el caso', 'error');
    } finally {
        validarLoading.value = false;
    }
};




const enviarSeguimiento = async () => {
    if (!nuevoSeguimiento.value.comentario) {
        return Swal.fire('Atención', 'Escribe un comentario', 'warning');
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

        await SolicitudService.addSeguimiento(id, formData);

        nuevoSeguimiento.value.comentario = '';
        nuevoSeguimiento.value.evidencias = [];
        await cargarDetalle();

        Swal.fire({
            icon: 'success',
            title: 'Enviado',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo enviar el comentario', 'error');
    } finally {
        saving.value = false;
    }
};
</script>

<template>
    <!-- Root para animaciones -->
    <div>
        <div v-if="loading" class="p-6 text-center">Cargando...</div>
        <div v-else class="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Columna Izquierda: Información -->
            <div class="lg:col-span-1 space-y-6">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div class="mb-4">
                        <span
                            class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                            :class="{
                                'bg-red-50 text-red-700': solicitud.estado === 'reportada',
                                'bg-blue-50 text-blue-700': solicitud.estado === 'asignada',
                                'bg-yellow-50 text-yellow-700': solicitud.estado === 'en_seguimiento',
                                'bg-purple-50 text-purple-700': solicitud.estado === 'pendiente_validacion',
                                'bg-green-50 text-green-700': solicitud.estado === 'cerrada',
                                'bg-orange-50 text-orange-700': solicitud.estado === 'reabierta'
                            }"
                        >
                            {{ solicitud.estado?.replace('_', ' ') }}
                        </span>
                        <h1 class="text-xl font-bold text-gray-800 dark:text-white mt-2">{{ solicitud.titulo }}</h1>
                    </div>

                    <div class="space-y-4">
                        <div>
                             <h3 class="text-xs font-semibold text-gray-400 uppercase mb-1">Descripción</h3>
                             <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{{ solicitud.descripcion }}</p>
                        </div>


                        <div v-if="solicitud.evidencias_inicial_urls?.length">

                        </div>

                        <!-- Info Contexto -->
                        <div class="pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
                            <div v-if="solicitud.agencia_id">
                                <span class="block text-xs font-semibold text-gray-400 uppercase">Agencia</span>
                                <div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ solicitud.agencia?.nombre }}</div>
                            </div>
                            <div v-if="solicitud.area">
                                <span class="block text-xs font-semibold text-gray-400 uppercase">Área/Ubicación</span>
                                <div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ solicitud.area }}</div>
                            </div>
                        </div>

                        <div class="pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 gap-4">
                             <div>
                                <span class="block text-xs font-semibold text-gray-400 uppercase">Solicitante</span>
                                <div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ solicitud.creado_por?.name || 'Desconocido' }}</div>
                             </div>
                             <div>
                                <span class="block text-xs font-semibold text-gray-400 uppercase">Responsable</span>
                                <div class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ solicitud.responsable?.name || 'Sin Asignar' }}</div>
                             </div>
                        </div>

                        <div class="pt-4 flex flex-col gap-2">
                            <!-- Botones solo para casos reportados (sin asignar) -->
                            <div v-if="solicitud.estado === 'reportada'" class="flex gap-2">
                                <button @click="asignarCaso" class="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold py-2 rounded transition">
                                    <i class="fas fa-user-plus mr-1"></i> Asignar
                                </button>
                                <button @click="tomarCaso" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded transition">
                                    <i class="fas fa-hand-holding-medical mr-1"></i> Tomar Caso
                                </button>
                            </div>

                            <!-- Botón de reasignación para casos ya asignados -->
                            <div v-else-if="['asignada', 'en_seguimiento', 'pendiente_validacion', 'reabierta'].includes(solicitud.estado)" class="flex gap-2">
                                <button @click="asignarCaso" class="w-full bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-bold py-2 rounded transition">
                                    <i class="fas fa-user-edit mr-1"></i> Reasignar Caso
                                </button>
                            </div>

                            <!-- Botón Validar (Solo si pendiente validación y NO es externo) -->
                            <button
                                v-if="solicitud.estado === 'pendiente_validacion' && authStore.user.tipo !== 'externo'"
                                @click="abrirValidarModal"
                                class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition flex items-center justify-center gap-2 mt-2"
                            >
                                <i class="fas fa-clipboard-check"></i> Validar Solución
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Columna Derecha: Chat / Seguimiento -->
            <div class="lg:col-span-2 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[600px]">
                <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <!-- Tabs Selector -->
                        <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                @click="activeTab = 'chat'"
                                class="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
                                :class="activeTab === 'chat' ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
                            >
                                Actividad
                            </button>
                            <button
                                @click="activeTab = 'files'"
                                class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2"
                                :class="activeTab === 'files' ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'"
                            >
                                Archivos
                                <span v-if="allAttachments.length" class="bg-indigo-100 text-indigo-700 px-1.5 rounded-full text-[10px]">{{ allAttachments.length }}</span>
                            </button>
                        </div>

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

                    <button
                        v-if="solicitud.estado !== 'cerrada'"
                        @click="toggleIntervenir"
                        class="text-xs px-3 py-1 rounded-full border transition-colors flex items-center gap-1"
                        :class="isIntervenir ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'"
                    >
                        <i class="fas" :class="isIntervenir ? 'fa-unlock' : 'fa-lock'"></i>
                        {{ isIntervenir ? 'Interviniendo' : 'Intervenir' }}
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50 dark:bg-transparent">

                    <!-- TAB: ARCHIVOS (Gallery) -->
                    <div v-if="activeTab === 'files'" class="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        <div v-if="!allAttachments.length" class="col-span-full text-center py-10 text-gray-400 italic">
                            No hay archivos adjuntos.
                        </div>
                        <a
                            v-for="(file, i) in allAttachments"
                            :key="i"
                            :href="file.url"
                            target="_blank"
                            class="group relative aspect-square bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                        >
                            <img v-if="file.is_image" :src="file.url" class="w-full h-full object-cover">
                            <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-red-500">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                                <span class="text-[10px] font-bold text-gray-500 uppercase">Archivo</span>
                            </div>
                            <!-- Metadata overlay on hover -->
                            <div class="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] p-1 truncate opacity-0 group-hover:opacity-100 transition">
                                {{ formatFecha(file.date) }}
                            </div>
                        </a>
                    </div>

                    <!-- TAB: CHAT (Existing) -->
                    <template v-else>
                     <div v-if="!solicitud.seguimientos?.length" class="text-center text-gray-400 py-10 italic">
                        No hay comentarios aún.
                     </div>

                     <div
                        v-for="seg in solicitud.seguimientos"
                        :key="seg.id"
                        class="flex gap-3"
                        :class="{ 'flex-row-reverse': seg.seguimiento_por_id === authStore.user.id }"
                     >
                        <div class="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                             :class="seg.seguimiento_por_id === authStore.user.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'">
                             {{ seg.seguimiento_por_nombre?.charAt(0) }}
                        </div>

                        <div class="max-w-[80%] rounded-2xl p-3 text-sm shadow-sm"
                             :class="[
                                seg.seguimiento_por_id === authStore.user.id
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-white border text-gray-700 rounded-tl-none'
                             ]">
                             <div class="flex justify-between items-center gap-4 mb-1 opacity-80 text-[10px] uppercase font-bold">
                                <span>{{ seg.seguimiento_por_nombre }}</span>
                                <span>{{ formatFecha(seg.created_at) }}</span>
                             </div>
                             <p class="whitespace-pre-wrap">{{ seg.comentario }}</p>

                             <div v-if="seg.evidencias?.length" class="mt-2 flex flex-wrap gap-2">
                                <a v-for="(ev, i) in seg.evidencias" :key="i" :href="ev" target="_blank" class="px-2 py-1 bg-black/10 rounded text-xs hover:bg-black/20 transition flex items-center gap-1">
                                    <i class="fas fa-paperclip"></i> Adjunto
                                </a>
                             </div>
                        </div>
                     </div>
                    </template>
                </div>

                <div v-if="solicitud.estado !== 'cerrada'" class="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                    <!-- Overlay de bloqueo -->
                    <div v-if="isChatLocked" class="text-center py-2">
                        <p class="text-sm text-gray-400 italic mb-2">El chat está en modo solo lectura.</p>
                        <button @click="toggleIntervenir" class="text-blue-600 text-xs hover:underline">Habilitar escritura</button>
                    </div>

                    <div v-else class="flex flex-col gap-2 transition-all">
                        <textarea v-model="nuevoSeguimiento.comentario" rows="2" class="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Escribe un comentario..."></textarea>
                        <div class="flex justify-end items-center">
                            <button @click="enviarSeguimiento" :disabled="saving" class="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2">
                                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                                <span>Enviar</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div v-else class="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 text-center">
                     <p class="text-sm text-gray-500 dark:text-gray-400 italic">
                        <i class="fas fa-lock mr-2"></i> Este caso está cerrado y en modo histórico.
                    </p>
                </div>
            </div>

        </div>

        <AsignarSolicitudModal
            v-if="solicitud"
            :isOpen="showAssignModal"
            :solicitudId="solicitud.id"
            :categoriaGeneralId="solicitud.categoria_general_id"
            @close="showAssignModal = false"
            @assigned="onAssigned"
        />
        <TomarCasoModal
            v-if="solicitud"
            :isOpen="showTomarModal"
            :solicitudId="solicitud.id"
            :categoriaGeneralId="solicitud.categoria_general_id"
            @close="showTomarModal = false"
            @taken="onCaseTaken"
        />

        <!-- Modal Validar -->
        <div v-if="showValidarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div class="bg-purple-600 p-4 text-white flex justify-between items-center">
                    <h3 class="font-bold text-lg"><i class="fas fa-clipboard-check mr-2"></i> Validar Solicitud</h3>
                    <button @click="showValidarModal = false" class="hover:bg-white/20 rounded-full p-1 transition"><i class="fas fa-times"></i></button>
                </div>

                <div class="p-6 space-y-4">
                     <p class="text-sm text-gray-600 dark:text-gray-300">
                        ¿Cómo deseas proceder con esta solicitud que está pendiente de validación?
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

                     <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentario de Validación <span class="text-red-500">*</span></label>
                        <textarea v-model="validarData.comentario" rows="3" class="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 resize-none" placeholder="Motivo de la aprobación o rechazo..."></textarea>
                     </div>
                </div>

                <div class="p-4 bg-gray-50 dark:bg-gray-700/30 flex justify-end gap-3 border-t">
                    <button @click="showValidarModal = false" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium">Cancelar</button>
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
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 20px; }
</style>
