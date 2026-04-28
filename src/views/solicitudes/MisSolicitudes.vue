<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import { useRouter } from 'vue-router';

const props = defineProps({
    categoriaGeneralId: Number
});

const solicitudes = ref([]);
const loading = ref(true);
const router = useRouter();
const filtroEstado = ref('');
const currentPage = ref(1);
const lastPage = ref(1);

const pageTitle = computed(() => {
    if (props.categoriaGeneralId === 1) return 'Mis Solicitudes Tecnológicas';
    if (props.categoriaGeneralId === 2) return 'Mis Solicitudes Administrativas';
    return 'Mis Solicitudes';
});

const cargarSolicitudes = async (page = 1) => {
    loading.value = true;
    try {
        const params = { page };
        if (filtroEstado.value) params.estado = filtroEstado.value;
        if (props.categoriaGeneralId) params.categoria_general_id = props.categoriaGeneralId;

        const response = await SolicitudService.getMisSolicitudes(params);
        solicitudes.value = response.data.data;
        currentPage.value = response.data.current_page;
        lastPage.value = response.data.last_page;
    } catch (e) {
        console.error("Error cargando mis solicitudes", e);
    } finally {
        loading.value = false;
    }
};

const estados = [
    { value: '', label: 'Todas' },
    { value: 'reportada', label: 'Reportadas' },
    { value: 'asignada', label: 'Asignadas' },
    { value: 'en_seguimiento', label: 'En Seguimiento' },
    { value: 'pendiente_validacion', label: 'Por Validar' },
    { value: 'cerrada', label: 'Cerradas' }
];

onMounted(async () => {
    cargarSolicitudes();
});

watch(() => props.categoriaGeneralId, () => {
    cargarSolicitudes();
});

const setFiltro = (estado) => {
    filtroEstado.value = estado;
    cargarSolicitudes(1);
};

const cambiarPagina = (page) => {
    if (page >= 1 && page <= lastPage.value) {
        cargarSolicitudes(page);
    }
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
</script>

<template>
    <div class="p-6">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h1 class="text-2xl font-bold text-white">{{ pageTitle }}</h1>
                <p class="text-sm text-white/70">Solicitudes reportadas por mí</p>
            </div>
            <!-- Botón opcional para recargar -->
            <button @click="cargarSolicitudes" class="text-blue-600 hover:text-blue-800 transition">
                <i class="fas fa-sync-alt" :class="{ 'fa-spin': loading }"></i>
            </button>
        </div>

        <!-- Filters -->
        <div class="flex gap-2 mb-6 overflow-x-auto pb-2 flex-shrink-0 custom-scrollbar">
            <button
                v-for="est in estados"
                :key="est.value"
                @click="setFiltro(est.value)"
                class="px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap border"
                :class="filtroEstado === est.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105'
                    : 'bg-white/10 backdrop-blur-md text-white/80 border-white/20 hover:bg-white/20'"
            >
                {{ est.label }}
            </button>
        </div>

        <div class="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-white/10 text-white uppercase text-xs font-semibold">
                    <tr>
                        <th class="p-4 border-b border-white/10">ID</th>
                        <th class="p-4 border-b border-white/10">Título</th>
                        <th class="p-4 border-b border-white/10">Solicitante / Agencia</th>
                        <th class="p-4 border-b border-white/10">Estado</th>
                        <th class="p-4 border-b border-white/10">Asignado A</th>
                        <th class="p-4 border-b border-white/10">Fecha Creación</th>
                        <th class="p-4 border-b border-white/10 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody class="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-if="loading">
                        <td colspan="7" class="p-8 text-center text-white/40">
                            <i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br>Cargando solicitudes...
                        </td>
                    </tr>
                    <tr v-else-if="solicitudes.length === 0">
                        <td colspan="7" class="p-8 text-center text-white/40">
                            <i class="fas fa-inbox text-4xl mb-3 text-white/20"></i>
                            <p>No has registrado ninguna solicitud aún.</p>
                        </td>
                    </tr>
                    <tr v-else v-for="sol in solicitudes" :key="sol.id" class="hover:bg-white/5 transition divide-y divide-white/10">
                        <td class="p-4 font-mono text-white/40">#{{ sol.id }}</td>
                        <td class="p-4 font-medium text-white">{{ sol.titulo }}</td>
                        <td class="p-4">
                            <div class="flex flex-col">
                                <span class="font-medium text-white">{{ sol.creado_por?.name || 'Desconocido' }}</span>
                                <span class="text-xs text-white/40 mt-0.5"><i class="fas fa-building mr-1"></i>{{ sol.agencia?.nombre || 'Sin Agencia' }}</span>
                            </div>
                        </td>
                        <td class="p-4">
                            <span class="inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-bold border text-center" :class="getEstadoClass(sol.estado)">
                                {{ sol.estado?.replace('_', ' ') }}
                            </span>
                        </td>
                        <td class="p-4 text-white/80">
                            <div v-if="sol.responsable" class="flex items-center gap-2">
                                <div class="bg-indigo-500/30 text-indigo-100 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                                    {{ sol.responsable.name.charAt(0) }}
                                </div>
                                {{ sol.responsable.name }}
                            </div>
                            <span v-else class="text-white/20 italic">Sin asignar</span>
                        </td>
                        <td class="p-4 text-white/40">
                            {{ new Date(sol.created_at).toLocaleDateString() }}
                        </td>
                        <td class="p-4 text-center">
    <button
        @click="router.push({ name: 'trabajar-solicitud', params: { id: sol.id } })"
        class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg shadow-sm shadow-emerald-200 dark:shadow-none transition text-xs font-medium flex items-center gap-2 mx-auto"
    >
        <i class="fas fa-eye"></i> Ver Seguimiento
    </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination Controls -->
        <div v-if="lastPage > 1" class="flex justify-between items-center mt-6">
            <span class="text-sm text-white/70">
                Página <span class="font-bold text-white">{{ currentPage }}</span> de <span class="font-bold text-white">{{ lastPage }}</span>
            </span>
            <div class="flex gap-2">
                <button
                    @click="cambiarPagina(currentPage - 1)"
                    :disabled="currentPage === 1"
                    class="px-4 py-2 border border-white/20 rounded-lg text-sm font-medium transition bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none"
                >
                    <i class="fas fa-chevron-left mr-1"></i> Anterior
                </button>
                <button
                    @click="cambiarPagina(currentPage + 1)"
                    :disabled="currentPage === lastPage"
                    class="px-4 py-2 border border-white/20 rounded-lg text-sm font-medium transition bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none"
                >
                    Siguiente <i class="fas fa-chevron-right ml-1"></i>
                </button>
            </div>
        </div>
    </div>
</template>
