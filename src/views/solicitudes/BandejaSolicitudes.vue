<script setup>
import { ref, onMounted } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import BandejaSolicitudesMobileCard from './components/BandejaSolicitudesMobileCard.vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Datos
const solicitudes = ref([]);
const loading = ref(true);
const pagination = ref({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20
});

// Filtros
const filtroEstado = ref('');
const estados = [
    { value: '', label: 'Todas' },
    { value: 'reportada', label: 'Reportadas' },
    { value: 'asignada', label: 'Asignadas' },
    { value: 'en_seguimiento', label: 'En Seguimiento' },
    { value: 'pendiente_validacion', label: 'Por Validar' },
    { value: 'cerrada', label: 'Cerradas' }
];

onMounted(() => {
    cargarSolicitudes();
});

const cargarSolicitudes = async (page = 1) => {
    loading.value = true;
    try {
        const params = {
            page: page,
            estado: filtroEstado.value,
            categoria_general_id: 1 // Solo mostrar solicitudes Tecnologicas
        };

        const response = await SolicitudService.getSolicitudes(params);

        // Laravel paginate response mapping
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
        loading.value = false;
    }
};

const cambiarPagina = (page) => {
    if (page >= 1 && page <= pagination.value.last_page) {
        cargarSolicitudes(page);
    }
};

const setFiltro = (estado) => {
    filtroEstado.value = estado;
    cargarSolicitudes(1); // Reset to page 1
};

const verDetalle = (id) => {
    router.push({ name: 'detalle-solicitud', params: { id } });
};

const getEstadoClass = (estado) => {
    switch (estado) {
        case 'reportada': return 'bg-red-500/20 text-red-200 border-red-500/30';
        case 'asignada': return 'bg-blue-500/20 text-blue-200 border-blue-500/30';
        case 'en_seguimiento': return 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';
        case 'pendiente_validacion': return 'bg-purple-500/20 text-purple-200 border-purple-500/30';
        case 'cerrada': return 'bg-green-500/20 text-green-200 border-green-500/30';
        default: return 'bg-white/10 text-white/80 border-white/20';
    }
};

const puedeEliminar = (sol) => {
    // Super Admin siempre puede
    if (authStore.hasRole('Super Admin')) return true;
    // Creador si aun está reportada
    if (authStore.user?.id === sol.creado_por_id && sol.estado === 'reportada') return true;
    return false;
};

const eliminarSolicitud = async (id) => {
    const { value: confirmacion } = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción eliminará permanentemente la solicitud y todos sus archivos. No se puede deshacer. Escribe 'eliminar' para confirmar.",
        input: 'text',
        inputPlaceholder: 'eliminar',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (value !== 'eliminar') {
                return 'Debes escribir "eliminar" para confirmar.';
            }
        }
    });

    if (confirmacion === 'eliminar') {
        try {
            await SolicitudService.deleteSolicitud(id);
            Swal.fire('Eliminado', 'La solicitud ha sido eliminada.', 'success');
            cargarSolicitudes(pagination.value.current_page);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo eliminar la solicitud.', 'error');
        }
    }
};
</script>

<template>
    <div class="p-4 sm:p-6 h-[calc(100dvh-80px)] md:h-[calc(100vh-80px)] overflow-hidden flex flex-col">
        <div class="flex justify-between items-center mb-4 sm:mb-6 flex-shrink-0">
            <div>
                <h1 class="text-xl sm:text-2xl font-bold text-white">Bandeja de Solicitudes</h1>
                <p class="text-xs sm:text-sm text-white/70">Gestión centralizada de casos</p>
            </div>
        </div>

        <!-- Tabs Filter -->
        <!-- Desktop Filters -->
        <div class="hidden sm:flex gap-2 mb-6 overflow-x-auto pb-2 flex-shrink-0 custom-scrollbar">
            <button
                v-for="est in estados"
                :key="est.value"
                @click="setFiltro(est.value)"
                class="px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap border"
                :class="filtroEstado === est.value
                    ? 'bg-verde-cope text-white border-verde-cope/50 shadow-lg shadow-emerald-500/20 transform scale-105'
                    : 'bg-white/10 backdrop-blur-md text-white/80 border-white/20 hover:bg-white/20'"
            >
                {{ est.label }}
            </button>
        </div>

        <!-- Mobile Filters -->
        <div class="sm:hidden mb-4 flex-shrink-0">
            <select
                :value="filtroEstado"
                @change="setFiltro($event.target.value)"
                class="w-full text-sm font-bold text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-3 outline-none"
            >
                <option v-for="est in estados" :key="est.value" :value="est.value" class="bg-azul-cope">
                    {{ est.label }}
                </option>
            </select>
        </div>

        <!-- Desktop Table Container -->
        <div class="hidden sm:flex flex-1 bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-verde-cope/30 overflow-hidden flex-col">
            <div class="overflow-auto flex-1 custom-scrollbar">
                <table class="w-full text-left border-collapse min-w-[800px]">
                    <thead class="bg-white/10 text-white uppercase text-xs font-semibold sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th class="p-4 border-b border-white/10">ID</th>
                            <th class="p-4 border-b border-white/10">Agencia</th>
                            <th class="p-4 border-b border-white/10">Título</th>
                            <th class="p-4 border-b border-white/10">Estado</th>
                            <th class="p-4 border-b border-white/10">Solicitante</th>
                            <th class="p-4 border-b border-white/10">Responsable</th>
                            <th class="p-4 border-b border-white/10">Fecha</th>
                            <th class="p-4 border-b border-white/10 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm divide-y divide-gray-100 divide-white/10">
                        <tr v-if="loading">
                            <td colspan="8" class="p-8 text-center text-white/40">
                                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br>Cargando...
                            </td>
                        </tr>
                        <tr v-else-if="solicitudes.length === 0">
                            <td colspan="8" class="p-8 text-center text-white/40">
                                No se encontraron solicitudes.
                            </td>
                        </tr>
                        <tr v-else v-for="sol in solicitudes" :key="sol.id" class="hover:bg-white/5 transition border-b border-white/10">
                            <td class="p-4 font-mono text-white/40">#{{ sol.id }}</td>
                            <td class="p-4 font-medium text-white/80">{{ sol.agencia?.agencia_madre_id || 'N/A' }}</td>
                            <td class="p-4 font-medium text-white dark:text-white">{{ sol.titulo }}</td>
                            <td class="p-4">
                                <span class="px-2.5 py-1 rounded-full text-xs font-bold border" :class="getEstadoClass(sol.estado)">
                                    {{ sol.estado?.replace('_', ' ') }}
                                </span>
                            </td>
                            <td class="p-4 text-white/80">
                                <div class="text-xs font-bold">{{ sol.creado_por?.name || 'Desconocido' }}</div>
                                <div class="text-xs text-white/40">{{ sol.agencia?.nombre || 'S/A' }}</div>
                            </td>
                            <td class="p-4">
                                <div v-if="sol.responsable" class="flex items-center gap-2">
                                    <div class="bg-white/10 text-white h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/20">
                                        {{ sol.responsable.name.charAt(0) }}
                                    </div>
                                    <span class="text-white/80 text-xs font-medium">{{ sol.responsable.name }}</span>
                                </div>
                                <span v-else class="text-white/20 italic text-xs">--</span>
                            </td>
                            <td class="p-4 text-white/40">
                                {{ new Date(sol.created_at).toLocaleDateString() }}
                            </td>
                            <td class="p-4 text-center">
                                <div class="flex items-center justify-center gap-2">
                                <button @click="verDetalle(sol.id)" class="bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-white font-bold px-3 py-1.5 rounded-lg transition text-[10px] border border-emerald-500/30 uppercase tracking-wider">
                                    GESTIONAR
                                </button>
                                <button v-if="puedeEliminar(sol)" @click="eliminarSolicitud(sol.id)" class="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white font-medium px-2.5 py-1.5 rounded-lg transition text-xs border border-red-500/30" title="Eliminar Solicitud">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination Footer Desktop -->
            <div class="p-4 border-t border-white/10 flex justify-between items-center bg-white/5">
                <div class="text-sm text-white/40">
                    Mostrando {{ pagination.from || 0 }} - {{ pagination.to || 0 }} de {{ pagination.total }} resultados
                </div>

                <div class="flex items-center gap-2" v-if="pagination.total > 0">
                    <button
                        @click="cambiarPagina(pagination.current_page - 1)"
                        :disabled="pagination.current_page === 1"
                        class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white border border-white/10 disabled:opacity-30 hover:bg-white/20 transition"
                    >
                        <i class="fas fa-chevron-left text-xs"></i>
                    </button>

                    <span class="text-xs font-bold text-white/60 uppercase tracking-widest px-2">
                        Pág {{ pagination.current_page }} <span class="mx-0.5 font-normal text-white/20">/</span> {{ pagination.last_page }}
                    </span>

                    <button
                        @click="cambiarPagina(pagination.current_page + 1)"
                        :disabled="pagination.current_page === pagination.last_page"
                        class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white border border-white/10 disabled:opacity-30 hover:bg-white/20 transition"
                    >
                        <i class="fas fa-chevron-right text-xs"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mobile List Container -->
        <div class="sm:hidden flex-1 bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-verde-cope/30 overflow-hidden flex flex-col">
            <div class="overflow-y-auto flex-1 custom-scrollbar bg-gray-50 dark:bg-gray-900/50">
                <div v-if="loading" class="p-8 text-center text-gray-500">
                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br>Cargando...
                </div>
                <div v-else-if="solicitudes.length === 0" class="p-8 text-center text-gray-500 bg-white dark:bg-gray-800">
                    <i class="fas fa-inbox text-4xl mb-3 text-gray-300 dark:text-gray-600"></i><br>
                    No se encontraron solicitudes.
                </div>
                <div v-else class="flex flex-col">
                    <BandejaSolicitudesMobileCard 
                        v-for="sol in solicitudes" 
                        :key="`mob-${sol.id}`" 
                        :sol="sol"
                        :puede-eliminar="puedeEliminar(sol)"
                        @ver="verDetalle(sol.id)"
                        @eliminar="eliminarSolicitud(sol.id)"
                    />
                </div>
            </div>

            <!-- Pagination Mobile Footer -->
            <div class="p-3 border-t border-white/10 flex justify-between items-center bg-white/5 w-full shrink-0">
                <span class="text-xs font-bold text-white/40 uppercase tracking-tighter">
                    {{ pagination.from || 0 }}-{{ pagination.to || 0 }} / {{ pagination.total }}
                </span>
                <div class="flex items-center gap-1" v-if="pagination.total > 0">
                    <button
                        @click="cambiarPagina(pagination.current_page - 1)"
                        :disabled="pagination.current_page === 1"
                        class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white border border-white/10 disabled:opacity-30 hover:bg-white/20 transition"
                    >
                        <i class="fas fa-chevron-left text-xs"></i>
                    </button>
                    <button
                        @click="cambiarPagina(pagination.current_page + 1)"
                        :disabled="pagination.current_page === pagination.last_page"
                        class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white border border-white/10 disabled:opacity-30 hover:bg-white/20 transition"
                    >
                        <i class="fas fa-chevron-right text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    height: 4px;
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 4px;
}
</style>
