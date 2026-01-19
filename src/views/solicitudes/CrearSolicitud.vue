<script setup>
import { ref, onMounted } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const titulo = ref('');
const descripcion = ref('');
const categoria_id = ref(null);
const categorias = ref([]);
const router = useRouter();

onMounted(async () => {
    try {
        const response = await SolicitudService.getCategorias({ solo_activas: true });
        categorias.value = response.data;
    } catch {
        console.error("Error cargando categorías");
    }
});

const submit = async () => {
    try {
        await SolicitudService.createSolicitud({
            titulo: titulo.value,
            descripcion: descripcion.value,
            categoria_id: categoria_id.value
        });
        Swal.fire('Éxito', 'Solicitud creada con éxito', 'success');
        router.push('/solicitudes/bandeja'); // Assuming route
    } catch {
        Swal.fire('Error', 'No se pudo crear la solicitud', 'error');
    }
};
</script>

<template>
    <div class="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
        <h1 class="text-2xl font-bold mb-6 text-gray-800">Nueva Solicitud</h1>
        <form @submit.prevent="submit" class="space-y-6">
            <div>
                <label class="block mb-2 font-medium text-gray-700">Título</label>
                <input v-model="titulo" type="text" class="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" required placeholder="Resumen del problema" />
            </div>
            <div>
                <label class="block mb-2 font-medium text-gray-700">Descripción</label>
                <textarea v-model="descripcion" class="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" rows="5" required placeholder="Detalles de la solicitud"></textarea>
            </div>
             <div>
                <label class="block mb-2 font-medium text-gray-700">Categoría</label>
                <select v-model="categoria_id" class="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                    <option :value="null">Seleccione una categoría (Opcional)</option>
                    <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
                </select>
            </div>
            <div class="flex justify-end gap-2">
                <button type="button" @click="$router.back()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">Crear Solicitud</button>
            </div>
        </form>
    </div>
</template>
