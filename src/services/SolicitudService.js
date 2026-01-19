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
    takeSolicitud(id) {
        return axios.put(`/solicitudes/${id}/tomar`);
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
    getUsuarios() {
        return axios.get('/usuarios');
    },
    getPuestos() {
        return axios.get('/puestos');
    },
};
