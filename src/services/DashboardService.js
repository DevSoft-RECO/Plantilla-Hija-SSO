import api from '@/api/axios';

export default {
    /**
     * Get Dashboard Metrics with Filters
     * @param {Object} params - { category_id, agencia_id, date_start, date_end }
     */
    getMetrics(params = {}) {
        return api.get('/dashboard', { params });
    },

    /**
     * Get Agencies (Reuse existing endpoint or rely on cached store if available)
     * For the filter dropdown.
     */
    getAgencies() {
        return api.get('/agencias'); // Ensure this endpoint returns a list of agencies
    }
};
