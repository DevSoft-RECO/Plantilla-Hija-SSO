import axios from '@/api/axios';

export default {
    getSolicitudes(params) {
        return axios.get('/solicitudes', { params });
    },
    getSolicitud(id) {
        return axios.get(`/solicitudes/${id}`);
    },
    createSolicitud(data) {
        return axios.post('/solicitudes', data);
    },
    assignSolicitud(id, data) {
        return axios.put(`/solicitudes/${id}/asignar`, data);
    },
    takeSolicitud(id, data = {}) {
        return axios.put(`/solicitudes/${id}/tomar`, data);
    },
    addSeguimiento(id, data) {
        return axios.post(`/solicitudes/${id}/seguimiento`, data);
    },
    validateSolicitud(id, data) {
        return axios.post(`/solicitudes/${id}/validar`, data);
    },
    // Categorias
    getCategorias(params) {
        return axios.get('/solicitudes/categorias', { params });
    },
    createCategoria(data) {
        return axios.post('/solicitudes/categorias', data);
    },
    updateCategoria(id, data) {
        return axios.put(`/solicitudes/categorias/${id}`, data);
    },
    deleteCategoria(id) {
        return axios.delete(`/solicitudes/categorias/${id}`);
    },
    // Usuarios (Proxy)
    getUsuarios(refresh = false) {
        return axios.get('/usuarios', { params: { refresh: refresh ? 'true' : 'false' } });
    },
    getPuestos(refresh = false) {
        return axios.get('/puestos', { params: { refresh: refresh ? 'true' : 'false' } });
    },
};
