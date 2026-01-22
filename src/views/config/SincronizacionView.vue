<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/api/axios';
import Swal from 'sweetalert2';

const agenciasCount = ref(0);
const puestosCount = ref(0);
const loadingAgencias = ref(false);
const loadingPuestos = ref(false);

const cargarDatos = async () => {
    try {
        const [agenciasRes, puestosRes] = await Promise.all([
            axios.get('/agencias'),
            axios.get('/puestos')
        ]);
        agenciasCount.value = agenciasRes.data.length || 0;
        puestosCount.value = puestosRes.data.length || 0;
    } catch (error) {
        console.error("Error cargando contadores:", error);
    }
};

const sincronizarAgencias = async () => {
    loadingAgencias.value = true;
    try {
        const response = await axios.post('/sincronizar-agencias');
        Swal.fire('Éxito', response.data.message || 'Sincronización completada', 'success');
        cargarDatos();
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo sincronizar agencias', 'error');
    } finally {
        loadingAgencias.value = false;
    }
};

const sincronizarPuestos = async () => {
    loadingPuestos.value = true;
    try {
        const response = await axios.post('/sincronizar-puestos');
        Swal.fire('Éxito', response.data.message || 'Sincronización completada', 'success');
        cargarDatos();
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo sincronizar puestos', 'error');
    } finally {
        loadingPuestos.value = false;
    }
};

onMounted(() => {
    cargarDatos();
});
</script>

<template>
    <div class="p-6 max-w-4xl mx-auto">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white mb-6">Sincronización de Datos</h1>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Card Agencias -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="bg-blue-100 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center text-xl">
                            <i class="fas fa-building"></i>
                        </div>
                        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Agencias</h2>
                    </div>
                </div>

                <div class="text-center py-6">
                    <p class="text-gray-500 dark:text-gray-400 text-sm uppercase font-bold tracking-wider mb-2">Total Sincronizadas</p>
                    <p class="text-4xl font-extrabold text-blue-600 dark:text-blue-400">{{ agenciasCount }}</p>
                </div>

                <div class="mt-4">
                    <button
                        @click="sincronizarAgencias"
                        :disabled="loadingAgencias"
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingAgencias }"></i>
                        {{ loadingAgencias ? 'Sincronizando...' : 'Sincronizar Agencias' }}
                    </button>
                    <p class="text-xs text-gray-400 text-center mt-2">Descarga datos recientes desde App Madre</p>
                </div>
            </div>

            <!-- Card Puestos -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                 <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="bg-purple-100 text-purple-600 w-10 h-10 rounded-full flex items-center justify-center text-xl">
                            <i class="fas fa-briefcase"></i>
                        </div>
                        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Puestos</h2>
                    </div>
                </div>

                <div class="text-center py-6">
                    <p class="text-gray-500 dark:text-gray-400 text-sm uppercase font-bold tracking-wider mb-2">Total Sincronizados</p>
                    <p class="text-4xl font-extrabold text-purple-600 dark:text-purple-400">{{ puestosCount }}</p>
                </div>

                <div class="mt-4">
                     <button
                        @click="sincronizarPuestos"
                        :disabled="loadingPuestos"
                        class="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg transition shadow-lg shadow-purple-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingPuestos }"></i>
                         {{ loadingPuestos ? 'Sincronizando...' : 'Sincronizar Puestos' }}
                    </button>
                    <p class="text-xs text-gray-400 text-center mt-2">Descarga datos recientes desde App Madre</p>
                </div>
            </div>
        </div>
    </div>
</template>
