<script setup>
import { ref, computed, watch } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import Swal from 'sweetalert2';
import { useSolicitudCache } from '@/composables/useSolicitudCache';

const props = defineProps({
    isOpen: Boolean,
    solicitudId: [Number, String]
});

const emit = defineEmits(['close', 'assigned']);

// Usar cache global
const {
    categorias,
    usuarios,
    puestos,
    loading,
    refreshing,
    loadData,
    refreshUsuariosYPuestos
} = useSolicitudCache();

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

// Cargar datos cuando se abre el modal
watch(() => props.isOpen, async (isOpen) => {
    if (isOpen) {
        try {
            await loadData(); // Usa el cache global
        } catch {
            Swal.fire('Error', 'No se pudieron cargar datos iniciales', 'error');
        }
    }
});

const usuariosFiltrados = computed(() => {
    if (!puestoFiltro.value) return usuarios.value;

    // Encontrar el nombre del puesto seleccionado basado en el ID
    const puestoSeleccionado = puestos.value.find(p => p.id === puestoFiltro.value);

    if (!puestoSeleccionado) return usuarios.value;

    const nombrePuesto = puestoSeleccionado.nombre;

    return usuarios.value.filter(u => {
        // La App Madre devuelve 'puesto' como string (ej: "Gerente de Agencia")
        // Ojo: Podría venir null o con diferente casing
        if (!u.puesto) return false;
        return u.puesto === nombrePuesto;
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
    <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 class="text-xl font-bold mb-4 text-gray-800">Asignar Solicitud</h2>

            <div v-if="loading" class="text-center py-4">Cargando datos...</div>

            <form v-else @submit.prevent="submit" class="space-y-4">
                <!-- Categoria -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select v-model="form.categoria_id" class="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option :value="null">Seleccione una categoría</option>
                        <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
                    </select>
                </div>

                <!-- Tipo Atención -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Atención</label>
                    <div class="flex gap-4 mt-2">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" v-model="form.tipo_atencion" value="interno" class="text-blue-600 focus:ring-blue-500">
                            Interna (Personal IT)
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="radio" v-model="form.tipo_atencion" value="externo" class="text-blue-600 focus:ring-blue-500">
                            Externa (Proveedor)
                        </label>
                    </div>
                </div>

                <!-- Responsable (Lista de Usuarios) -->
                <div>
                     <div class="flex items-center justify-between mb-2">
                        <label class="block text-sm font-medium text-gray-700">
                            {{ form.tipo_atencion === 'interno' ? 'Filtrar por Puesto' : 'Filtrar Proveedores' }}
                        </label>
                        <button
                            type="button"
                            @click="refreshUsuariosYPuestos"
                            :disabled="refreshing"
                            class="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded hover:bg-emerald-100 transition disabled:opacity-50 flex items-center gap-1"
                            title="Actualizar usuarios y puestos desde la aplicación madre"
                        >
                            <svg v-if="!refreshing" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {{ refreshing ? 'Actualizando...' : 'Actualizar datos' }}
                        </button>
                    </div>
                    <select v-model="puestoFiltro" class="w-full border border-gray-300 rounded p-2 mb-3 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50">
                        <option :value="null">Todos los puestos</option>
                        <option v-for="p in puestos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
                    </select>

                    <label class="block text-sm font-medium text-gray-700 mb-1">
                        {{ form.tipo_atencion === 'interno' ? 'Responsable Interno' : 'Proveedor Responsable' }}
                    </label>
                    <select v-model="form.responsable_id" class="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option :value="null">Seleccione...</option>
                        <option v-for="user in usuariosFiltrados" :key="user.id" :value="user.id">
                            {{ user.name || user.username }} {{ user.puesto ? `(${user.puesto.nombre || user.puesto})` : '' }}
                        </option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1">
                        Mostrando {{ usuariosFiltrados.length }} usuarios.
                    </p>
                </div>

                <!-- Buttons -->
                <div class="flex justify-end gap-2 mt-6">
                    <button type="button" @click="$emit('close')" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition">Cancelar</button>
                    <button type="submit" :disabled="submitting" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50">
                        {{ submitting ? 'Asignando...' : 'Confirmar Asignación' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
