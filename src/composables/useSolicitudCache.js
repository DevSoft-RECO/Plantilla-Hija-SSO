import { ref } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import Swal from 'sweetalert2';

// Estado global compartido (singleton)
const categorias = ref([]);
const usuarios = ref([]);
const puestos = ref([]);
const dataLoaded = ref(false);
const loading = ref(false);

export function useSolicitudCache() {
    // Cargar datos iniciales
    const loadData = async () => {
        if (dataLoaded.value || loading.value) {
            return; // Ya cargado o cargando
        }

        loading.value = true;
        try {
            const [catRes, userRes, puestoRes] = await Promise.all([
                SolicitudService.getCategorias({ solo_activas: true }),
                SolicitudService.getUsuarios(false),
                SolicitudService.getPuestos(false)
            ]);
            categorias.value = catRes.data;
            usuarios.value = userRes.data;
            puestos.value = puestoRes.data;
            dataLoaded.value = true;
        } catch (error) {
            console.error("Error cargando datos de solicitud", error);
            throw error;
        } finally {
            loading.value = false;
        }
    };

    // Método de refresh eliminado por solicitud del usuario

    return {
        // Estado (readonly para componentes)
        categorias,
        usuarios,
        puestos,
        loading,
        // Métodos
        loadData
    };
}
