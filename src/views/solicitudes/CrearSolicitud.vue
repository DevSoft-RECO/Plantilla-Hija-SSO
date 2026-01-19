<script setup>
import { ref, onMounted } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

const titulo = ref('');
const descripcion = ref('');
const categoria_id = ref(null);
const categorias = ref([]);
const files = ref([]);
const isSubmitting = ref(false);
const router = useRouter();

onMounted(async () => {
    try {
        const response = await SolicitudService.getCategorias({ solo_activas: true });
        categorias.value = response.data;
    } catch {
        console.error("Error cargando categorías");
    }
});

const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);
    files.value = [...files.value, ...selectedFiles];
};

const submit = async () => {
    isSubmitting.value = true;
    try {
        const formData = new FormData();
        formData.append('titulo', titulo.value);
        formData.append('descripcion', descripcion.value);
        if (categoria_id.value) {
            formData.append('categoria_id', categoria_id.value);
        }

        files.value.forEach((file) => {
            formData.append('evidencias[]', file);
        });

        await SolicitudService.createSolicitud(formData);

        Swal.fire('Éxito', 'Solicitud creada con éxito', 'success');
        router.push('/admin/solicitudes/bandeja');
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo crear la solicitud', 'error');
    } finally {
        isSubmitting.value = false;
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

            <div>
                <label class="block mb-2 font-medium text-gray-700">Evidencia Inicial (Opcional)</label>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer" @click="$refs.fileInput.click()">
                    <input ref="fileInput" type="file" multiple class="hidden" @change="handleFileUpload" accept="image/*,.pdf" />
                    <div v-if="files.length === 0" class="text-gray-500">
                        <i class="fas fa-cloud-upload-alt text-3xl mb-2"></i>
                        <p>Haz clic para subir imágenes o PDF</p>
                    </div>
                    <div v-else class="text-left">
                        <p class="font-semibold mb-2 text-green-600">Archivos seleccionados:</p>
                        <ul class="list-disc list-inside text-sm text-gray-600">
                            <li v-for="file in files" :key="file.name">{{ file.name }} ({{ (file.size / 1024).toFixed(1) }} KB)</li>
                        </ul>
                        <button type="button" @click.stop="files = []" class="text-red-500 text-xs mt-2 underline">Limpiar</button>
                    </div>
                </div>
            </div>

            <div class="flex justify-end gap-2">
                <button type="button" @click="$router.back()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition" :disabled="isSubmitting">
                    {{ isSubmitting ? 'Enviando...' : 'Crear Solicitud' }}
                </button>
            </div>
        </form>
    </div>
</template>
