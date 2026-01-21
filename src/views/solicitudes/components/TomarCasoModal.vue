<script setup>
import { ref, onMounted, computed } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
    isOpen: Boolean,
    solicitudId: [Number, String],
    categoriaGeneralId: Number
});

const emit = defineEmits(['close', 'taken']);

const authStore = useAuthStore();
const categorias = ref([]);
const loading = ref(false);
const submitting = ref(false);
const categoria_id = ref(null);

const categoriasFiltradas = computed(() => {
    if (!props.categoriaGeneralId) return categorias.value;
    return categorias.value.filter(c => c.categoria_general_id == props.categoriaGeneralId);
});

onMounted(async () => {
    loading.value = true;
    try {
        const response = await SolicitudService.getCategorias({ solo_activas: true });
        categorias.value = response.data;
    } catch (error) {
        console.error("Error cargando categorías", error);
        Swal.fire('Error', 'No se pudieron cargar las categorías', 'error');
    } finally {
        loading.value = false;
    }
});

const submit = async () => {
    if (!categoria_id.value) {
        return Swal.fire('Atención', 'Selecciona una categoría para clasificar el caso', 'warning');
    }

    submitting.value = true;
    try {
        // Enviar solo categoria_id, el backend ya toma al Auth::user() como responsable
        await SolicitudService.takeSolicitud(props.solicitudId, {
            categoria_id: categoria_id.value
        });

        Swal.fire({
            title: '¡Caso Tomado!',
            text: 'Te has asignado este caso correctamente.',
            icon: 'success',
            confirmButtonColor: '#10B981'
        });

        emit('taken');
        emit('close');
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No pudiste tomar el caso', 'error');
    } finally {
        submitting.value = false;
    }
};
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 transition-all">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-gray-100 dark:border-gray-700">

            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex justify-between items-center">
                <h3 class="text-lg font-bold flex items-center gap-2">
                    <i class="fas fa-hand-holding-medical"></i> Tomar Caso
                </h3>
                <button @click="$emit('close')" class="text-white/80 hover:text-white transition p-1 rounded-full hover:bg-white/20">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Body -->
            <div class="p-6">

                <!-- Info Usuario que toma el caso -->
                <div class="bg-blue-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6 border border-blue-100 dark:border-gray-600 flex items-center gap-3">
                    <div class="bg-blue-200 dark:bg-gray-600 h-10 w-10 rounded-full flex items-center justify-center text-blue-700 dark:text-gray-200 font-bold">
                        {{ authStore.user?.name?.charAt(0) || 'U' }}
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Te asignarás como responsable:</p>
                        <p class="text-gray-800 dark:text-white font-medium">{{ authStore.user?.name }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ authStore.user?.cargo || authStore.user?.puesto?.nombre || authStore.user?.puesto || 'Sin Cargo' }}</p>
                    </div>
                </div>

                <div v-if="loading" class="text-center py-4 text-gray-500">
                    <i class="fas fa-spinner fa-spin mr-2"></i> Cargando categorías...
                </div>

                <div v-else>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Clasifica este caso</label>
                    <select
                        v-model="categoria_id"
                        class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-700 dark:text-gray-200"
                    >
                        <option :value="null">Selecciona una categoría...</option>
                        <option v-for="cat in categoriasFiltradas" :key="cat.id" :value="cat.id">
                            {{ cat.nombre }}
                        </option>
                    </select>
                </div>

            </div>

            <!-- Footer -->
            <div class="bg-gray-50 dark:bg-gray-700/30 p-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                    @click="$emit('close')"
                    class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition text-sm font-medium"
                >
                    Cancelar
                </button>
                <button
                    @click="submit"
                    :disabled="submitting"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md shadow-md transition text-sm font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
                    {{ submitting ? 'Asignando...' : 'Confirmar' }}
                </button>
            </div>

        </div>
    </div>
</template>
