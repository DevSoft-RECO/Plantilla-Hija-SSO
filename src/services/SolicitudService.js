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
    getFileUrl(id, type, index) {
        return axios.get(`/solicitudes/${id}/file-url`, {
            params: { type, index }
        });
    },
    // Gestión de evidencias sueltas
    addEvidence(id, formData) {
        return axios.post(`/solicitudes/${id}/evidence`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    deleteEvidence(id, path) {
        return axios.delete(`/solicitudes/${id}/evidence`, {
            data: { path } // Axios delete body
        });
    },
    // Categorias (ahora Subcategorias)
    getCategorias(params) {
        return axios.get('/solicitudes/subcategorias', { params });
    },
    createCategoria(data) {
        return axios.post('/solicitudes/subcategorias', data);
    },
    updateCategoria(id, data) {
        return axios.put(`/solicitudes/subcategorias/${id}`, data);
    },
    deleteCategoria(id) {
        return axios.delete(`/solicitudes/subcategorias/${id}`);
    },
    // Usuarios (Locales)
    getUsuarios() {
        return axios.get('/usuarios');
    },
    getPuestos() {
        return axios.get('/puestos');
    },
};
