import api from './api';

export const authService = {
  async register({ name, email, password, role }) {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    return data;
  },

  async login({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  async getMe() {
    const { data } = await api.get('/auth/me');
    return data.data;
  },

  getStoredUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },
};
