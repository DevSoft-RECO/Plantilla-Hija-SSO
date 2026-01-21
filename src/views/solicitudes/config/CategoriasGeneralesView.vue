<script setup>
import { ref, onMounted } from 'vue';

import axios from '@/api/axios'; // Direct access for simpler new endpoints if service not fully updated
import Swal from 'sweetalert2';

// NOTE: Since we just updated the API but not the Service wrapper for *General* categories fully in the previous steps
// (Wait, did I update SolicitudService.js? No I didn't update SolicitudService.js yet for General Categories! I only updated the backend.)
// I need to update SolicitudService.js first or use axios directly. I will update SolicitudService.js as part of this.
// For now, I'll access via axios directly in this component or Update Service in parallel.
// Let's assume I'll update Service next. For now I'll use direct axios calls in the script to be safe or define them here.

const categorias = ref([]);
const loading = ref(true);

const apiBase = '/solicitudes/categorias-generales';

const getCategorias = () => axios.get(apiBase, { params: { solo_activas: false } });
const createCategoria = (data) => axios.post(apiBase, data);
const updateCategoria = (id, data) => axios.put(`${apiBase}/${id}`, data);
const deleteCategoria = (id) => axios.delete(`${apiBase}/${id}`);

onMounted(() => {
    cargarCategorias();
});

const cargarCategorias = async () => {
    loading.value = true;
    try {
        const response = await getCategorias();
        categorias.value = response.data;
    } catch {
        Swal.fire('Error', 'No se pudieron cargar las categorías generales', 'error');
    } finally {
        loading.value = false;
    }
};

const crearCategoria = async () => {
    const { value: formValues } = await Swal.fire({
        title: 'Nueva Categoría General',
        html:
            '<input id="swal-input1" class="swal2-input" placeholder="Nombre (Ej: Tecnológico)">' +
            '<input id="swal-input2" class="swal2-input" placeholder="Descripción">',
        focusConfirm: false,
        preConfirm: () => {
            return [
                document.getElementById('swal-input1').value,
                document.getElementById('swal-input2').value
            ];
        }
    });

    if (formValues) {
        if (!formValues[0]) return Swal.fire('Error', 'El nombre es obligatorio', 'error');
        try {
            await createCategoria({
                nombre: formValues[0],
                descripcion: formValues[1],
                activo: true
            });
            Swal.fire('Éxito', 'Categoría general creada', 'success');
            cargarCategorias();
        } catch {
            Swal.fire('Error', 'No se pudo crear', 'error');
        }
    }
};

const editarCategoria = async (cat) => {
    const { value: formValues } = await Swal.fire({
        title: 'Editar Categoría General',
        html:
            `<input id="swal-input1" class="swal2-input" placeholder="Nombre" value="${cat.nombre}">` +
            `<input id="swal-input2" class="swal2-input" placeholder="Descripción" value="${cat.descripcion || ''}">` +
            `<div class="mt-4"><label><input type="checkbox" id="swal-input3" ${cat.activo ? 'checked' : ''}> Activa</label></div>`,
        focusConfirm: false,
        preConfirm: () => {
            return [
                document.getElementById('swal-input1').value,
                document.getElementById('swal-input2').value,
                document.getElementById('swal-input3').checked
            ];
        }
    });

    if (formValues) {
         try {
            await updateCategoria(cat.id, {
                nombre: formValues[0],
                descripcion: formValues[1],
                activo: formValues[2]
            });
            Swal.fire('Éxito', 'Categoría actualizada', 'success');
            cargarCategorias();
        } catch {
            Swal.fire('Error', 'No se pudo actualizar', 'error');
        }
    }
};

const eliminarCategoria = async (id) => {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esto. Si tiene subcategorías asociadas, no se eliminará.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar!'
    });

    if (result.isConfirmed) {
        try {
            await deleteCategoria(id);
            Swal.fire('Eliminado!', 'La categoría ha sido eliminada.', 'success');
            cargarCategorias();
        } catch (error) {
            if (error.response && error.response.status === 409) {
                Swal.fire('Error', 'No se puede eliminar porque tiene subcategorías asociadas', 'warning');
            } else {
                Swal.fire('Error', 'No se pudo eliminar', 'error');
            }
        }
    }
};
</script>

<template>
    <div class="p-6">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Categorías Generales</h1>
            <button @click="crearCategoria" class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition shadow-lg">
                + Nueva Categoría General
            </button>
        </div>

        <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold">
                    <tr>
                        <th class="p-4 border-b dark:border-gray-700">ID</th>
                        <th class="p-4 border-b dark:border-gray-700">Nombre</th>
                        <th class="p-4 border-b dark:border-gray-700">Descripción</th>
                        <th class="p-4 border-b dark:border-gray-700">Estado</th>
                        <th class="p-4 border-b dark:border-gray-700 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody class="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-if="loading">
                        <td colspan="5" class="p-8 text-center text-gray-500 dark:text-gray-400">
                            <i class="fas fa-spinner fa-spin mr-2"></i> Cargando...
                        </td>
                    </tr>
                    <tr v-else v-for="cat in categorias" :key="cat.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td class="p-4 font-mono text-gray-500 dark:text-gray-500">{{ cat.id }}</td>
                        <td class="p-4 font-medium text-gray-800 dark:text-gray-200">{{ cat.nombre }}</td>
                        <td class="p-4 text-gray-600 dark:text-gray-400">{{ cat.descripcion || '-' }}</td>
                        <td class="p-4">
                            <span class="px-2.5 py-1 rounded-full text-xs font-bold"
                                :class="cat.activo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'">
                                {{ cat.activo ? 'Activa' : 'Inactiva' }}
                            </span>
                        </td>
                        <td class="p-4 text-center space-x-3">
                            <button @click="editarCategoria(cat)" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition font-medium">Editar</button>
                            <button @click="eliminarCategoria(cat.id)" class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition font-medium">Eliminar</button>
                        </td>
                    </tr>
                    <tr v-if="!loading && categorias.length === 0">
                        <td colspan="5" class="p-8 text-center text-gray-500 dark:text-gray-400">
                            No hay categorías generales registradas.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
