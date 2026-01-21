<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/api/axios';
import Swal from 'sweetalert2';

const subcategorias = ref([]); // List of subcategories
const categoriasGenerales = ref([]); // For dropdown
const loading = ref(true);

const apiBase = '/solicitudes/subcategorias'; // New endpoint
const apiGenerales = '/solicitudes/categorias-generales';

// API Wrappers (Direct axios for speed/compatibility with ongoing refactor)
const getSubcategorias = () => axios.get(apiBase, { params: { solo_activas: false } });
const getGenerales = () => axios.get(apiGenerales, { params: { solo_activas: true } });
const createSub = (data) => axios.post(apiBase, data);
const updateSub = (id, data) => axios.put(`${apiBase}/${id}`, data);
const deleteSub = (id) => axios.delete(`${apiBase}/${id}`);

onMounted(() => {
    loadData();
});

const loadData = async () => {
    loading.value = true;
    try {
        const [subRes, genRes] = await Promise.all([getSubcategorias(), getGenerales()]);
        subcategorias.value = subRes.data;
        categoriasGenerales.value = genRes.data;
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
    } finally {
        loading.value = false;
    }
};

const crearSubcategoria = async () => {
    // Build options for select
    let options = '<option value="">Seleccione Categoría General</option>';
    categoriasGenerales.value.forEach(g => {
        options += `<option value="${g.id}">${g.nombre}</option>`;
    });

    const { value: formValues } = await Swal.fire({
        title: 'Nueva Subcategoría',
        html:
            '<label class="block text-left text-sm mb-1 font-bold">Categoría General</label>' +
            `<select id="swal-input-gen" class="swal2-select w-full mb-4" style="margin: 0 0 1em;">${options}</select>` +
            '<input id="swal-input1" class="swal2-input" placeholder="Nombre Subcategoría">' +
            '<input id="swal-input2" class="swal2-input" placeholder="Descripción">',
        focusConfirm: false,
        preConfirm: () => {
            return {
                general_id: document.getElementById('swal-input-gen').value,
                nombre: document.getElementById('swal-input1').value,
                descripcion: document.getElementById('swal-input2').value
            };
        }
    });

    if (formValues) {
        if (!formValues.general_id) return Swal.fire('Error', 'Debe seleccionar una Categoría General', 'warning');
        if (!formValues.nombre) return Swal.fire('Error', 'El nombre es obligatorio', 'warning');

        try {
            await createSub({
                categoria_general_id: formValues.general_id,
                nombre: formValues.nombre,
                descripcion: formValues.descripcion,
                activa: true
            });
            Swal.fire('Éxito', 'Subcategoría creada', 'success');
            loadData(); // Reload all
        } catch {
            Swal.fire('Error', 'No se pudo crear', 'error');
        }
    }
};

const editarSubcategoria = async (cat) => {
    // Build options with selected
    let options = '<option value="">Seleccione Categoría General</option>';
    categoriasGenerales.value.forEach(g => {
        const selected = (cat.categoria_general_id === g.id) ? 'selected' : '';
        options += `<option value="${g.id}" ${selected}>${g.nombre}</option>`;
    });

    const { value: formValues } = await Swal.fire({
        title: 'Editar Subcategoría',
        html:
             '<label class="block text-left text-sm mb-1 font-bold">Categoría General</label>' +
            `<select id="swal-input-gen" class="swal2-select w-full mb-4" style="margin: 0 0 1em;">${options}</select>` +
            `<input id="swal-input1" class="swal2-input" placeholder="Nombre" value="${cat.nombre}">` +
            `<input id="swal-input2" class="swal2-input" placeholder="Descripción" value="${cat.descripcion || ''}">` +
            `<div class="mt-4"><label><input type="checkbox" id="swal-input3" ${cat.activa ? 'checked' : ''}> Activa</label></div>`,
        focusConfirm: false,
        preConfirm: () => {
             return {
                general_id: document.getElementById('swal-input-gen').value,
                nombre: document.getElementById('swal-input1').value,
                descripcion: document.getElementById('swal-input2').value,
                activa: document.getElementById('swal-input3').checked
            };
        }
    });

    if (formValues) {
         if (!formValues.general_id) return Swal.fire('Error', 'Debe seleccionar una Categoría General', 'warning');
         try {
            await updateSub(cat.id, {
                categoria_general_id: formValues.general_id,
                nombre: formValues.nombre,
                descripcion: formValues.descripcion,
                activa: formValues.activa
            });
            Swal.fire('Éxito', 'Subcategoría actualizada', 'success');
            loadData();
        } catch {
            Swal.fire('Error', 'No se pudo actualizar', 'error');
        }
    }
};

const eliminarSubcategoria = async (id) => {
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
            await deleteSub(id);
            Swal.fire('Eliminado!', 'La subcategoría ha sido eliminada.', 'success');
            loadData();
        } catch {
            Swal.fire('Error', 'No se pudo eliminar', 'error');
        }
    }
};
</script>

<template>
    <div class="p-6">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Gestión de Subcategorías</h1>
            <button @click="crearSubcategoria" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition shadow-lg">
                + Nueva Subcategoría
            </button>
        </div>

        <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 uppercase text-xs font-semibold">
                    <tr>
                        <th class="p-4 border-b dark:border-gray-700">ID</th>
                        <th class="p-4 border-b dark:border-gray-700">General</th>
                        <th class="p-4 border-b dark:border-gray-700">Nombre (Subcategoría)</th>
                        <th class="p-4 border-b dark:border-gray-700">Descripción</th>
                        <th class="p-4 border-b dark:border-gray-700">Estado</th>
                        <th class="p-4 border-b dark:border-gray-700 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody class="text-sm divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-if="loading">
                        <td colspan="6" class="p-8 text-center text-gray-500 dark:text-gray-400">
                            <i class="fas fa-spinner fa-spin mr-2"></i> Cargando...
                        </td>
                    </tr>
                    <tr v-else v-for="cat in subcategorias" :key="cat.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <td class="p-4 font-mono text-gray-500 dark:text-gray-500">{{ cat.id }}</td>
                        <td class="p-4 font-semibold text-emerald-600 dark:text-emerald-400">
                            {{ cat.categoria_general ? cat.categoria_general.nombre : '(Sin asignar)' }}
                        </td>
                        <td class="p-4 font-medium text-gray-800 dark:text-gray-200">{{ cat.nombre }}</td>
                        <td class="p-4 text-gray-600 dark:text-gray-400">{{ cat.descripcion || '-' }}</td>
                        <td class="p-4">
                            <span class="px-2.5 py-1 rounded-full text-xs font-bold"
                                :class="cat.activa ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'">
                                {{ cat.activa ? 'Activa' : 'Inactiva' }}
                            </span>
                        </td>
                        <td class="p-4 text-center space-x-3">
                            <button @click="editarSubcategoria(cat)" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition font-medium">Editar</button>
                            <button @click="eliminarSubcategoria(cat.id)" class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition font-medium">Eliminar</button>
                        </td>
                    </tr>
                    <tr v-if="!loading && subcategorias.length === 0">
                        <td colspan="6" class="p-8 text-center text-gray-500 dark:text-gray-400">
                            No hay subcategorías registradas.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
