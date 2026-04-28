<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SolicitudService from '@/services/SolicitudService';
import Swal from 'sweetalert2';
import AsignarSolicitudModal from './components/AsignarSolicitudModal.vue';
import TomarCasoModal from './components/TomarCasoModal.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
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

// Edición de Agencia
const isEditingAgencia = ref(false);
const agenciasList = ref([]);
const selectedAgenciaId = ref(null);

const startEditAgencia = async () => {
    if (agenciasList.value.length === 0) {
        try {
            const { data } = await SolicitudService.getAgencias();
            agenciasList.value = data;
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'No se pudieron cargar las agencias', 'error');
            return;
        }
    }
    selectedAgenciaId.value = solicitud.value.agencia_id;
    isEditingAgencia.value = true;
};

const cancelEditAgencia = () => {
    isEditingAgencia.value = false;
};

const saveAgencia = async () => {
    if (!selectedAgenciaId.value) return;
    try {
        await SolicitudService.updateAgencia(id, selectedAgenciaId.value);
        isEditingAgencia.value = false;
        cargarDetalle(true); // Recargar para ver nombre actualizado y log
        Swal.fire('Actualizado', 'Agencia reasignada correctamente', 'success');
    } catch (e) {
        console.error(e);
        Swal.fire('Error', 'No se pudo actualizar la agencia', 'error');
    }
};

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
const backToBandeja = () => {
    router.push({ name: 'bandeja-solicitudes' });
};
</script>

<template>
    <!-- Root para animaciones -->
    <div>
        <div v-if="loading" class="p-6 text-center">Cargando...</div>
        <div v-else class="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Columna Izquierda: Información -->
            <div class="lg:col-span-1 space-y-6">
                <div class="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-verde-cope/30">
                    <button @click="backToBandeja" class="text-white/40 hover:text-white mb-6 flex items-center gap-2 text-sm transition-colors">
                        <i class="fas fa-arrow-left"></i> Volver a la Bandeja
                    </button>

                    <div class="mb-4">
                        <span
                            class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
                            :class="{
                                'bg-red-500/20 text-red-200 border-red-500/30': solicitud.estado === 'reportada',
                                'bg-blue-500/20 text-blue-200 border-blue-500/30': solicitud.estado === 'asignada',
                                'bg-yellow-500/20 text-yellow-200 border-yellow-500/30': solicitud.estado === 'en_seguimiento',
                                'bg-purple-500/20 text-purple-200 border-purple-500/30': solicitud.estado === 'pendiente_validacion',
                                'bg-green-500/20 text-green-200 border-green-500/30': solicitud.estado === 'cerrada',
                                'bg-orange-500/20 text-orange-200 border-orange-500/30': solicitud.estado === 'reabierta'
                            }"
                        >
                            {{ solicitud.estado?.replace('_', ' ') }}
                        </span>
                        <h1 class="text-xl font-bold text-white mt-2">{{ solicitud.titulo }}</h1>
                    </div>

                    <div class="space-y-4">
                        <div>
                             <h3 class="text-xs font-semibold text-white/40 uppercase mb-1">Descripción</h3>
                             <p class="text-sm text-white/80 whitespace-pre-line">{{ solicitud.descripcion }}</p>
                        </div>


                        <div v-if="solicitud.evidencias_inicial_urls?.length">

                        </div>

                        <!-- Info Contexto -->
                        <div class="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                            <div class="relative group">
                                <div class="flex items-center justify-between mb-1">
                                    <span class="block text-xs font-semibold text-white/40 uppercase">Agencia</span>
                                    <button
                                        v-if="solicitud.estado === 'reportada' && !isEditingAgencia"
                                        @click="startEditAgencia"
                                        class="text-xs text-blue-600 font-bold hover:underline"
                                    >
                                        [Cambiar]
                                    </button>
                                </div>

                                <div v-if="!isEditingAgencia" class="text-sm font-medium text-white">
                                    {{ solicitud.agencia?.nombre || 'Sin Agencia Asignada' }}
                                </div>
                                <div v-else class="flex flex-col gap-2 mt-1">
                                    <select v-model="selectedAgenciaId" class="text-sm border rounded p-1.5 w-full dark:bg-gray-700 dark:text-white dark:border-gray-600">
                                        <option :value="null">-- Seleccionar Agencia --</option>
                                        <option v-for="ag in agenciasList" :key="ag.id" :value="ag.id">
                                            {{ ag.nombre }}
                                        </option>
                                    </select>
                                    <div class="flex items-center gap-2">
                                        <button @click="saveAgencia" class="bg-verde-cope text-white px-2 py-1 rounded text-xs font-bold hover:opacity-90">Guardar</button>
                                        <button @click="cancelEditAgencia" class="bg-white/10 text-white/60 px-2 py-1 rounded text-xs font-bold hover:bg-white/20">Cancelar</button>
                                    </div>
                                </div>
                            </div>
                            <div v-if="solicitud.area">
                                <span class="block text-xs font-semibold text-white/40 uppercase">Área/Ubicación</span>
                                <div class="text-sm font-medium text-white">{{ solicitud.area }}</div>
                            </div>
                        </div>

                        <div class="pt-4 border-t border-white/10 grid grid-cols-1 gap-4">
                             <div>
                                <span class="block text-xs font-semibold text-white/40 uppercase">Solicitante</span>
                                <div class="text-sm font-medium text-white">{{ solicitud.creado_por?.name || 'Desconocido' }}</div>
                             </div>
                             <div>
                                <span class="block text-xs font-semibold text-white/40 uppercase">Responsable</span>
                                <div class="text-sm font-medium text-white">{{ solicitud.responsable?.name || 'Sin Asignar' }}</div>
                             </div>
                        </div>

                        <div class="pt-4 flex flex-col gap-2">
                            <!-- Botones solo para casos reportados (sin asignar) -->
                            <div v-if="solicitud.estado === 'reportada'" class="flex gap-3">
                                <button @click="asignarCaso" class="flex-1 bg-white/5 border border-verde-cope/30 hover:bg-verde-cope/10 text-white text-[10px] font-bold py-2.5 rounded-lg transition uppercase tracking-wider">
                                    <i class="fas fa-user-plus mr-1"></i> Asignar
                                </button>
                                <button @click="tomarCaso" class="flex-1 bg-verde-cope hover:opacity-90 text-white text-[10px] font-bold py-2.5 rounded-lg transition uppercase tracking-widest shadow-lg shadow-emerald-900/20">
                                    <i class="fas fa-hand-holding-medical mr-1"></i> Tomar Caso
                                </button>
                            </div>

                            <!-- Botón de reasignación para casos ya asignados -->
                            <div v-else-if="['asignada', 'en_seguimiento', 'pendiente_validacion', 'reabierta'].includes(solicitud.estado)" class="flex gap-2">
                                <button @click="asignarCaso" class="w-full bg-orange-500/20 border border-orange-500/30 hover:bg-orange-500/30 text-orange-200 text-[10px] font-bold py-2.5 rounded-lg transition uppercase tracking-widest">
                                    <i class="fas fa-user-edit mr-1"></i> Reasignar Caso
                                </button>
                            </div>

                            <!-- Botón Validar (Solo si pendiente validación y NO es externo) -->
                            <button
                                v-if="solicitud.estado === 'pendiente_validacion' && authStore.user.tipo !== 'externo'"
                                @click="abrirValidarModal"
                                class="w-full bg-purple-600/40 border border-purple-500/30 hover:bg-purple-600/60 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2 mt-2 text-[10px] uppercase tracking-widest"
                            >
                                <i class="fas fa-clipboard-check"></i> Validar Solución
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Columna Derecha: Chat / Seguimiento -->
            <div class="lg:col-span-2 flex flex-col bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-verde-cope/30 h-[600px] overflow-hidden">
                <div class="p-4 border-b border-white/10 flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <!-- Tabs Selector -->
                        <div class="flex bg-white/5 border border-white/10 rounded-lg p-1">
                            <button
                                @click="activeTab = 'chat'"
                                class="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
                                :class="activeTab === 'chat' ? 'bg-white text-[var(--color-verde-cope)] shadow-sm' : 'text-white/40 hover:text-white'"
                            >
                                Actividad
                            </button>
                            <button
                                @click="activeTab = 'files'"
                                class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2"
                                :class="activeTab === 'files' ? 'bg-white text-[var(--color-verde-cope)] shadow-sm' : 'text-white/40 hover:text-white'"
                            >
                                Archivos
                                <span v-if="allAttachments.length" class="bg-verde-cope text-white px-1.5 rounded-full text-[10px]">{{ allAttachments.length }}</span>
                            </button>
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

                    <button
                        v-if="solicitud.estado !== 'cerrada'"
                        @click="toggleIntervenir"
                        class="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg border transition-all"
                        :class="isIntervenir ? 'bg-orange-500/20 text-orange-200 border-orange-500/30' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'"
                    >
                        <i class="fas mr-1.5" :class="isIntervenir ? 'fa-unlock' : 'fa-lock'"></i>
                        {{ isIntervenir ? 'Interviniendo' : 'Intervenir' }}
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-transparent">

                    <!-- TAB: ARCHIVOS (Gallery) -->
                    <div v-if="activeTab === 'files'" class="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        <div v-if="!allAttachments.length" class="col-span-full text-center py-10 text-white/40 italic">
                            No hay archivos adjuntos.
                        </div>
                        <a
                            v-for="(file, i) in allAttachments"
                            :key="i"
                            :href="file.url"
                            target="_blank"
                            class="group relative aspect-square bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
                        >
                            <img v-if="file.is_image" :src="file.url" class="w-full h-full object-cover">
                            <div v-else class="w-full h-full flex flex-col items-center justify-center bg-white/5 group-hover:bg-white/10 transition gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-white/40">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                                <span class="text-[10px] font-bold text-white/40 uppercase">Archivo</span>
                            </div>
                            <!-- Metadata overlay on hover -->
                            <div class="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] font-bold p-1 truncate opacity-0 group-hover:opacity-100 transition tracking-tighter uppercase">
                                {{ formatFecha(file.date) }}
                            </div>
                        </a>
                    </div>

                    <!-- TAB: CHAT (Existing) -->
                    <template v-else>
                     <div v-if="!solicitud.seguimientos?.length" class="text-center text-white/40 py-10 italic">
                        No hay comentarios aún.
                     </div>

                     <div
                        v-for="seg in solicitud.seguimientos"
                        :key="seg.id"
                        class="flex gap-3"
                        :class="{ 'flex-row-reverse': seg.seguimiento_por_id === authStore.user.id }"
                     >
                        <div class="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm border border-white/20"
                             :class="seg.seguimiento_por_id === authStore.user.id ? 'bg-white/10 text-white' : 'bg-orange-500/20 text-orange-200'">
                             {{ seg.seguimiento_por_nombre?.charAt(0) }}
                        </div>

                        <div class="max-w-[80%] rounded-2xl p-4 text-sm shadow-sm border"
                             :class="[
                                seg.seguimiento_por_id === authStore.user.id
                                    ? 'bg-blue-600/40 text-white border-blue-500/30 rounded-tr-none'
                                    : 'bg-white/5 border-white/10 text-white/90 rounded-tl-none'
                             ]">
                             <div class="flex justify-between items-center gap-4 mb-2 opacity-50 text-[9px] uppercase font-bold tracking-widest">
                                <span>{{ seg.seguimiento_por_nombre }}</span>
                                <span>{{ formatFecha(seg.created_at) }}</span>
                             </div>
                             <p class="whitespace-pre-wrap leading-relaxed">{{ seg.comentario }}</p>

                             <div v-if="seg.evidencias?.length" class="mt-3 flex flex-wrap gap-2">
                                <a v-for="(ev, i) in seg.evidencias" :key="i" :href="ev" target="_blank" class="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-tighter hover:bg-white/10 transition flex items-center gap-2">
                                    <i class="fas fa-paperclip text-white/40"></i> Adjunto
                                </a>
                             </div>
                        </div>
                     </div>
                    </template>
                </div>

                <div v-if="solicitud.estado !== 'cerrada'" class="p-4 bg-white/5 border-t border-white/10">
                    <!-- Overlay de bloqueo -->
                    <div v-if="isChatLocked" class="text-center py-4 bg-orange-500/10 rounded-xl border border-orange-500/20 mb-2">
                        <p class="text-xs text-orange-200/60 font-bold uppercase tracking-widest mb-2">Modo Solo Lectura</p>
                        <button @click="toggleIntervenir" class="text-orange-500 text-[10px] uppercase font-black hover:underline tracking-widest">Habilitar Escritura</button>
                    </div>

                    <div v-else class="flex flex-col gap-3 transition-all">
                        <textarea v-model="nuevoSeguimiento.comentario" rows="2" class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 resize-none text-white outline-none placeholder:text-white/20 shadow-inner" placeholder="Escribe un comentario..."></textarea>
                        <div class="flex justify-end items-center">
                            <button @click="enviarSeguimiento" :disabled="saving" class="bg-[var(--color-azul-cope)] hover:opacity-90 text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition flex items-center gap-2 disabled:opacity-50 shadow-lg">
                                <i v-if="saving" class="fas fa-spinner fa-spin"></i>
                                <span>Enviar <i class="fas fa-paper-plane ml-1"></i></span>
                            </button>
                        </div>
                    </div>
                </div>
                <div v-else class="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-white/10 text-center">
                     <p class="text-sm text-gray-500 dark:text-white/40 italic">
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
            @taken="onCaseTaken"
        />

        <!-- Modal Validar -->
        <div v-if="showValidarModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
            <div class="bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-purple-500/30 animate-fade-in-up">
                <div class="bg-purple-600 p-5 text-white flex justify-between items-center shadow-lg">
                    <h3 class="font-bold text-lg uppercase tracking-wider"><i class="fas fa-clipboard-check mr-2"></i> Validar Solicitud</h3>
                    <button @click="showValidarModal = false" class="hover:bg-white/20 rounded-full p-2 transition-colors"><i class="fas fa-times"></i></button>
                </div>

                <div class="p-6 space-y-6">
                     <p class="text-sm text-white/80">
                        ¿Cómo deseas proceder con esta solicitud que está pendiente de validación?
                     </p>

                     <div class="flex gap-4">
                        <label class="flex-1 border p-4 rounded-xl cursor-pointer transition-all duration-300 group" :class="validarData.accion === 'cerrar' ? 'bg-verde-cope/20 border-verde-cope shadow-lg shadow-emerald-900/20' : 'bg-white/5 border-white/10 hover:bg-white/10'">
                            <input type="radio" v-model="validarData.accion" value="cerrar" class="hidden">
                            <div class="text-center">
                                <i class="fas fa-check-circle text-3xl mb-2 transition-transform group-hover:scale-110" :class="validarData.accion === 'cerrar' ? 'text-verde-cope' : 'text-white/20'"></i>
                                <div class="font-bold text-[10px] uppercase tracking-widest" :class="validarData.accion === 'cerrar' ? 'text-white' : 'text-white/40'">Aprobar y Cerrar</div>
                            </div>
                        </label>

                         <label class="flex-1 border p-4 rounded-xl cursor-pointer transition-all duration-300 group" :class="validarData.accion === 'reabrir' ? 'bg-orange-500/20 border-orange-500 shadow-lg shadow-orange-900/20' : 'bg-white/5 border-white/10 hover:bg-white/10'">
                            <input type="radio" v-model="validarData.accion" value="reabrir" class="hidden">
                            <div class="text-center">
                                <i class="fas fa-undo text-3xl mb-2 transition-transform group-hover:scale-110" :class="validarData.accion === 'reabrir' ? 'text-orange-500' : 'text-white/20'"></i>
                                <div class="font-bold text-[10px] uppercase tracking-widest" :class="validarData.accion === 'reabrir' ? 'text-white' : 'text-white/40'">Rechazar</div>
                            </div>
                        </label>
                     </div>

                     <div>
                        <label class="block text-[10px] font-bold text-white/40 uppercase mb-2 tracking-widest">Comentario de Validación <span class="text-red-500">*</span></label>
                        <textarea v-model="validarData.comentario" rows="3" class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 resize-none text-white outline-none placeholder:text-white/20" placeholder="Motivo de la aprobación o rechazo..."></textarea>
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
