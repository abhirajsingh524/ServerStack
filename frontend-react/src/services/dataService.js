import api from './api';

export const dataService = {
  async uploadData({ title, description, jsonData, accessLevel, tags, file }) {
    const fd = new FormData();
    fd.append('title', title);
    if (description) fd.append('description', description);
    if (jsonData)    fd.append('jsonData', typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData));
    fd.append('accessLevel', accessLevel || 'private');
    if (tags?.length) tags.forEach(t => fd.append('tags[]', t));
    if (file)         fd.append('file', file);

    const { data } = await api.post('/data', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  async fetchData(params = {}) {
    const { data } = await api.get('/data', { params });
    return data.data; // { records, pagination }
  },

  async fetchById(id) {
    const { data } = await api.get(`/data/${id}`);
    return data.data;
  },

  async updateData(id, updates) {
    const { data } = await api.put(`/data/${id}`, updates);
    return data.data;
  },

  async deleteData(id) {
    const { data } = await api.delete(`/data/${id}`);
    return data;
  },
};

export const adminService = {
  async getUsers() {
    const { data } = await api.get('/admin/users');
    return data.data;
  },
  async deactivateUser(id) {
    const { data } = await api.patch(`/admin/users/${id}/deactivate`);
    return data.data;
  },
  async activateUser(id) {
    const { data } = await api.patch(`/admin/users/${id}/activate`);
    return data.data;
  },
};

export const logService = {
  async getLogs(params = {}) {
    const { data } = await api.get('/logs', { params });
    return data.data; // { logs, pagination }
  },
};
