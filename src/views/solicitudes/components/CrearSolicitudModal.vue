<script setup>
import { ref } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import Swal from 'sweetalert2';

const props = defineProps({
    isOpen: Boolean,
    categoriaGeneralId: Number,
    customTitle: String
}); // Removed destructuring to access props easily in script if needed, though destructuring is fine if we use props.categoriaGeneralId

const emit = defineEmits(['close', 'created']);

const titulo = ref('');
const descripcion = ref('');
const area = ref(''); // Nuevo campo
const files = ref([]);
const isSubmitting = ref(false);
const fileInput = ref(null);

const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);
    files.value = [...files.value, ...selectedFiles];
};

const removeFile = (index) => {
    files.value.splice(index, 1);
};

const closeModal = () => {
    emit('close');
    // Reset form properly if needed, usually better to destroy component or reset vars
    titulo.value = '';
    descripcion.value = '';
    area.value = ''; // Reset area
    files.value = [];
};

const submit = async () => {
    if (!titulo.value || !descripcion.value) {
        Swal.fire('Atención', 'Por favor completa título y descripción', 'warning');
        return;
    }

    isSubmitting.value = true;
    try {
        const formData = new FormData();
        formData.append('titulo', titulo.value);
        formData.append('descripcion', descripcion.value);
        if (area.value) {
            formData.append('area', area.value);
        }

        // Asignar categoría general si viene en props
        if (props.categoriaGeneralId) {
            formData.append('categoria_general_id', props.categoriaGeneralId);
        }

        files.value.forEach((file) => {
            formData.append('evidencias[]', file);
        });

        await SolicitudService.createSolicitud(formData);

        Swal.fire({
            title: '¡Solicitud Creada!',
            text: 'Tu solicitud ha sido registrada exitosamente.',
            icon: 'success',
            confirmButtonColor: '#10B981' // Emerald-500
        });

        emit('created');
        closeModal();
    } catch (error) {
        console.error(error);
        const errorMsg = error.response?.data?.message || 'No se pudo crear la solicitud';
        Swal.fire('Error', errorMsg, 'error');
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30 transition-all duration-300">
        <!-- Modal Content -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 ring-1 ring-gray-200 dark:ring-gray-700">

            <!-- Header -->
            <div class="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-plus-circle"></i> {{ customTitle || 'Nueva Solicitud' }}
                    </h3>
                    <p class="text-emerald-100 text-sm mt-1">Describe tu problema o requerimiento</p>
                </div>
                <button @click="closeModal" class="text-white/80 hover:text-white transition cursor-pointer p-1">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 space-y-5">
                <!-- Titulo -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asunto</label>
                    <input
                        v-model="titulo"
                        type="text"
                        class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-gray-800 dark:text-gray-100 placeholder-gray-400"
                        placeholder="Ej: Error en impresora de recepción"
                    />
                </div>

                <!-- Area / Ubicación -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area/ubicacion (Opcional)</label>
                    <input
                        v-model="area"
                        type="text"
                        class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-gray-800 dark:text-gray-100 placeholder-gray-400"
                        placeholder="Ej: Recursos Humanos, Bodega..."
                    />
                </div>

                <!-- Descripcion -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detalle</label>
                    <textarea
                        v-model="descripcion"
                        rows="4"
                        class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-gray-800 dark:text-gray-100 placeholder-gray-400 resize-none"
                        placeholder="Describe detalladamente qué sucede..."
                    ></textarea>
                </div>

                <!-- Evidencia Upload -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adjuntar Evidencia (Opcional)</label>

                    <!-- Dropzone visual -->
                    <div
                        class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-5 text-center hover:bg-emerald-50 dark:hover:bg-gray-700/50 hover:border-emerald-400 transition cursor-pointer group"
                        @click="$refs.fileInput.click()"
                    >
                        <input ref="fileInput" type="file" multiple class="hidden" @change="handleFileUpload" accept="image/*,.pdf" />

                        <div v-if="files.length === 0" class="text-gray-400 group-hover:text-emerald-500 transition">
                            <i class="fas fa-cloud-upload-alt text-3xl mb-2"></i>
                            <p class="text-sm">Click para subir Fotos o PDF</p>
                        </div>

                        <!-- Files Preview List -->
                        <div v-else class="text-left space-y-2">
                            <div v-for="(file, index) in files" :key="index" class="flex justify-between items-center bg-white dark:bg-gray-600 p-2 rounded border border-gray-200 dark:border-gray-500 shadow-sm text-sm">
                                <span class="truncate max-w-[80%] text-gray-700 dark:text-gray-200">
                                    <i class="far fa-file mr-1 text-emerald-500"></i> {{ file.name }}
                                </span>
                                <button @click.stop="removeFile(index)" class="text-red-400 hover:text-red-600 transition p-1">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="text-center mt-2">
                                <span class="text-xs text-blue-500 hover:underline">Agregar más archivos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="bg-gray-50 dark:bg-gray-700/30 p-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                    @click="closeModal"
                    class="px-5 py-2.5 rounded-lg text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                    Cancelar
                </button>
                <button
                    @click="submit"
                    :disabled="isSubmitting"
                    class="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:shadow-lg hover:from-emerald-600 hover:to-teal-600 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
                    {{ isSubmitting ? 'Enviando...' : 'Crear Solicitud' }}
                </button>
            </div>
        </div>
    </div>
</template>
