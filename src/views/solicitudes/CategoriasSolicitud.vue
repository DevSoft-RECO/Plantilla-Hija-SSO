<script setup>
import { ref, onMounted } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import Swal from 'sweetalert2';

const categorias = ref([]);
const loading = ref(true);

onMounted(() => {
    cargarCategorias();
});

const cargarCategorias = async () => {
    loading.value = true;
    try {
        const response = await SolicitudService.getCategorias({ solo_activas: false });
        categorias.value = response.data;
    } catch {
        Swal.fire('Error', 'No se pudieron cargar las categorías', 'error');
    } finally {
        loading.value = false;
    }
};

const crearCategoria = async () => {
    const { value: formValues } = await Swal.fire({
        title: 'Nueva Categoría',
        html:
            '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
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
            await SolicitudService.createCategoria({
                nombre: formValues[0],
                descripcion: formValues[1],
                activa: true
            });
            Swal.fire('Éxito', 'Categoría creada', 'success');
            cargarCategorias();
        } catch {
            Swal.fire('Error', 'No se pudo crear', 'error');
        }
    }
};

const editarCategoria = async (cat) => {
    const { value: formValues } = await Swal.fire({
        title: 'Editar Categoría',
        html:
            `<input id="swal-input1" class="swal2-input" placeholder="Nombre" value="${cat.nombre}">` +
            `<input id="swal-input2" class="swal2-input" placeholder="Descripción" value="${cat.descripcion || ''}">` +
            `<div class="mt-4"><label><input type="checkbox" id="swal-input3" ${cat.activa ? 'checked' : ''}> Activa</label></div>`,
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
            await SolicitudService.updateCategoria(cat.id, {
                nombre: formValues[0],
                descripcion: formValues[1],
                activa: formValues[2]
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
        text: "No podrás revertir esto!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar!'
    });

    if (result.isConfirmed) {
        try {
            await SolicitudService.deleteCategoria(id);
            Swal.fire('Eliminado!', 'La categoría ha sido eliminada.', 'success');
            cargarCategorias();
        } catch {
            Swal.fire('Error', 'No se pudo eliminar', 'error');
        }
    }
};
</script>

<template>
    <div class="p-6">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-800">Gestión de Categorías</h1>
            <button @click="crearCategoria" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                + Nueva Categoría
            </button>
        </div>

        <div class="overflow-x-auto bg-white rounded shadow">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                    <tr>
                        <th class="p-3 border-b">ID</th>
                        <th class="p-3 border-b">Nombre</th>
                        <th class="p-3 border-b">Descripción</th>
                        <th class="p-3 border-b">Estado</th>
                        <th class="p-3 border-b text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody class="text-sm">
                    <tr v-if="loading">
                        <td colspan="5" class="p-4 text-center">Cargando...</td>
                    </tr>
                    <tr v-else v-for="cat in categorias" :key="cat.id" class="border-b hover:bg-gray-50 transition">
                        <td class="p-3 font-mono text-gray-500">{{ cat.id }}</td>
                        <td class="p-3 font-medium">{{ cat.nombre }}</td>
                        <td class="p-3 text-gray-600">{{ cat.descripcion || '-' }}</td>
                        <td class="p-3">
                            <span class="px-2 py-1 rounded-full text-xs font-bold"
                                :class="cat.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                                {{ cat.activa ? 'Activa' : 'Inactiva' }}
                            </span>
                        </td>
                        <td class="p-3 text-center space-x-2">
                            <button @click="editarCategoria(cat)" class="text-blue-600 hover:text-blue-800 transition">Editar</button>
                            <button @click="eliminarCategoria(cat.id)" class="text-red-600 hover:text-red-800 transition">Eliminar</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
