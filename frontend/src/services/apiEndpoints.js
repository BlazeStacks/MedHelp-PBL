import { api } from './api';
/**
 * One function per backend endpoint, grouped by area.
 *
 * Pages call these instead of touching axios directly, so URLs and payload
 * shapes live in exactly one place.
 */
export const authApi = {
    register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
    login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
    logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
};
export const patientApi = {
    me: () => api.get('/patient/me').then((r) => r.data),
    update: (payload) => api.put('/patient/me', payload).then((r) => r.data),
    dashboard: () => api.get('/patient/dashboard').then((r) => r.data),
};
export const doctorApi = {
    me: () => api.get('/doctor/me').then((r) => r.data),
    update: (payload) => api.put('/doctor/me', payload).then((r) => r.data),
    dashboard: () => api.get('/doctor/dashboard').then((r) => r.data),
    searchPatients: (query, limit = 10) => api
        .get('/doctor/patients/search', { params: { q: query, limit } })
        .then((r) => r.data),
};
export const recordsApi = {
    list: (params = {}) => api.get('/records', { params }).then((r) => r.data),
    timeline: (params = {}) => api.get('/records/timeline', { params }).then((r) => r.data),
    stats: () => api.get('/records/stats').then((r) => r.data),
    get: (id) => api.get(`/records/${id}`).then((r) => r.data),
    create: (payload) => api.post('/records', payload).then((r) => r.data),
    update: (id, payload) => api.put(`/records/${id}`, payload).then((r) => r.data),
    remove: (id) => api.delete(`/records/${id}`),
    uploadDocument: (recordId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        // Let the browser set the multipart boundary.
        return api
            .post(`/records/${recordId}/documents`, formData, {
            headers: { 'Content-Type': undefined },
        })
            .then((r) => r.data);
    },
    listDocuments: (recordId) => api.get(`/records/${recordId}/documents`).then((r) => r.data),
};
export const accessApi = {
    request: (payload) => api.post('/access/request', payload).then((r) => r.data),
    requests: () => api.get('/access/requests').then((r) => r.data),
    pending: () => api.get('/access/requests/pending').then((r) => r.data),
    activeGrants: () => api.get('/access/grants').then((r) => r.data),
    effective: (patientId) => api.get(`/access/effective/${patientId}`).then((r) => r.data),
    approve: (id, payload) => api.post(`/access/${id}/approve`, payload).then((r) => r.data),
    deny: (id, reason) => api.post(`/access/${id}/deny`, { reason }).then((r) => r.data),
    revoke: (id, reason) => api.post(`/access/${id}/revoke`, { reason }).then((r) => r.data),
};
export const notificationsApi = {
    list: () => api.get('/notifications').then((r) => r.data),
    markRead: (id) => api.post(`/notifications/${id}/read`),
    markAllRead: () => api.post('/notifications/read-all'),
};
export const auditApi = {
    history: (limit = 100) => api.get('/audit', { params: { limit } }).then((r) => r.data),
};
