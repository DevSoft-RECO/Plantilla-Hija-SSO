<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import Swal from 'sweetalert2';
import { useSolicitudCache } from '@/composables/useSolicitudCache';

const props = defineProps({
    isOpen: Boolean,
    solicitudId: [Number, String],
    categoriaGeneralId: Number
});

const emit = defineEmits(['close', 'assigned']);

// Usar cache global
const {
    categorias,
    usuarios,
    puestos,
    loading,
    loadData
} = useSolicitudCache();

const categoriasFiltradas = computed(() => {
    if (!props.categoriaGeneralId) return categorias.value;
    return categorias.value.filter(c => c.categoria_general_id == props.categoriaGeneralId);
});

const submitting = ref(false);

const form = ref({
    categoria_id: null,
    tipo_atencion: 'interno', // interno, externo
    responsable_id: null,
    responsable_nombre: '',
    responsable_cargo: '',
    proveedor_id: null
});

// Filtro local
const puestoFiltro = ref(null);

// Cargar datos DESPUÉS de que el modal se abre (para apertura instantánea)
watch(() => props.isOpen, async (isOpen) => {
    if (isOpen) {
        // Auto-select type based on category
        if (props.categoriaGeneralId === 1) {
            form.value.tipo_atencion = 'interno';
        } else if (props.categoriaGeneralId === 2) {
            form.value.tipo_atencion = 'externo';
        }

        // Esperar a que el modal se renderice primero
        await nextTick();

        // Luego cargar datos en segundo plano
        try {
            await loadData(); // Usa el cache global
        } catch {
            Swal.fire('Error', 'No se pudieron cargar datos iniciales', 'error');
        }
    }
});

const usuariosFiltrados = computed(() => {
    if (!puestoFiltro.value) return usuarios.value;

    // Filtro simplificado usando IDs locales
    return usuarios.value.filter(u => {
        // Validar primero si el usuario tiene puesto_id
        if (!u.puesto_id) return false;
        return u.puesto_id === puestoFiltro.value;
    });
});

const selectedUser = computed(() => {
    return usuarios.value.find(u => u.id === form.value.responsable_id);
});

const submit = async () => {
    if (!form.value.categoria_id) {
        return Swal.fire('Error', 'Debe seleccionar una categoría', 'warning');
    }
    if (!form.value.responsable_id) {
        return Swal.fire('Error', 'Debe seleccionar un responsable', 'warning');
    }

    submitting.value = true;
    try {
        // Prepare payload based on user selection
        const u = selectedUser.value;
        const payload = {
            categoria_id: form.value.categoria_id,
            responsable_tipo: form.value.tipo_atencion,
            responsable_id: form.value.responsable_id,
            responsable_nombre: u ? (u.name || u.username) : 'Desconocido',
            responsable_email: u ? u.email : null, // Email del usuario SSO
            responsable_telefono: u ? (u.telefono || u.celular || u.phone) : null, // Telefono del usuario
            responsable_cargo: u ? (u.puesto || u.cargo) : '', // Adjust based on Mother App user object
            proveedor_id: form.value.tipo_atencion === 'externo' ? form.value.responsable_id : null
        };

        await SolicitudService.assignSolicitud(props.solicitudId, payload);

        Swal.fire('Asignada', 'La solicitud ha sido asignada correctamente', 'success');
        emit('assigned');
        emit('close');
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'Falló la asignación', 'error');
    } finally {
        submitting.value = false;
    }
};
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 transition-all">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 border border-gray-100 dark:border-gray-700 max-h-[90vh] flex flex-col">

            <!-- Header -->
            <div class="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white flex justify-between items-center flex-shrink-0">
                <h3 class="text-lg font-bold flex items-center gap-2">
                    <i class="fas fa-user-check"></i> Asignar Solicitud
                </h3>
                <button @click="$emit('close')" class="text-white/80 hover:text-white transition p-1 rounded-full hover:bg-white/20">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 overflow-y-auto flex-1">
                <div v-if="loading" class="text-center py-8 text-gray-500">
                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>Cargando datos...</p>
                </div>

                <form v-else @submit.prevent="submit" class="space-y-5">
                    <!-- Categoria -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoría</label>
                        <select v-model="form.categoria_id" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition text-gray-700 dark:text-gray-200">
                            <option :value="null">Seleccione una categoría</option>
                            <option v-for="cat in categoriasFiltradas" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
                        </select>
                    </div>

                    <!-- Tipo Atención -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Atención</label>
                        <div class="flex gap-4 mt-2">
                            <label class="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition" :class="form.tipo_atencion === 'interno' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-300 hover:bg-gray-50'">
                                <input type="radio" v-model="form.tipo_atencion" value="interno" class="text-emerald-600 focus:ring-emerald-500">
                                Interna
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition" :class="form.tipo_atencion === 'externo' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-300 hover:bg-gray-50'">
                                <input type="radio" v-model="form.tipo_atencion" value="externo" class="text-emerald-600 focus:ring-emerald-500">
                                Externa
                            </label>
                        </div>
                    </div>

                    <!-- Responsable (Lista de Usuarios) -->
                    <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div class="mb-3">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {{ form.tipo_atencion === 'interno' ? 'Filtrar por Puesto' : 'Filtrar Proveedores' }}
                            </label>
                        </div>

                        <select v-model="puestoFiltro" class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 mb-3 focus:ring-2 focus:ring-emerald-500 outline-none transition text-gray-700 dark:text-gray-200">
                            <option :value="null">Todos los puestos</option>
                            <option v-for="p in puestos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
                        </select>

                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {{ form.tipo_atencion === 'interno' ? 'Responsable Interno' : 'Proveedor Responsable' }}
                        </label>
                        <select v-model="form.responsable_id" class="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition text-gray-700 dark:text-gray-200">
                            <option :value="null">Seleccione...</option>
                            <option v-for="user in usuariosFiltrados" :key="user.id" :value="user.id">
                                {{ user.name || user.username }} {{ user.puesto ? `(${user.puesto.nombre})` : '' }}
                            </option>
                        </select>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Mostrando {{ usuariosFiltrados.length }} usuarios.
                        </p>
                    </div>
                </form>
            </div>

            <!-- Footer -->
            <div class="bg-gray-50 dark:bg-gray-700/30 p-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
                <button
                    type="button"
                    @click="$emit('close')"
                    class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition text-sm font-medium"
                >
                    Cancelar
                </button>
                <button
                    @click="submit"
                    :disabled="submitting || loading"
                    class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-md shadow-md transition text-sm font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
                    {{ submitting ? 'Asignando...' : 'Confirmar Asignación' }}
                </button>
            </div>

        </div>
    </div>
</template>
