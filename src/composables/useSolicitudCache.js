import { ref } from 'vue';
import SolicitudService from '@/services/SolicitudService';
import Swal from 'sweetalert2';

// Estado global compartido (singleton)
const categorias = ref([]);
const usuarios = ref([]);
const puestos = ref([]);
const dataLoaded = ref(false);
const loading = ref(false);
const refreshing = ref(false);

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

    // Refrescar usuarios y puestos manualmente
    const refreshUsuariosYPuestos = async () => {
        refreshing.value = true;
        try {
            const [userRes, puestoRes] = await Promise.all([
                SolicitudService.getUsuarios(true), // Forzar refresh
                SolicitudService.getPuestos(true)
            ]);
            usuarios.value = userRes.data;
            puestos.value = puestoRes.data;

            Swal.fire({
                icon: 'success',
                title: 'Datos actualizados',
                text: `${usuarios.value.length} usuarios y ${puestos.value.length} puestos cargados`,
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error refrescando usuarios y puestos", error);
            Swal.fire('Error', 'No se pudieron actualizar los datos', 'error');
        } finally {
            refreshing.value = false;
        }
    };

    return {
        // Estado (readonly para componentes)
        categorias,
        usuarios,
        puestos,
        loading,
        refreshing,
        dataLoaded,

        // Métodos
        loadData,
        refreshUsuariosYPuestos
    };
}
