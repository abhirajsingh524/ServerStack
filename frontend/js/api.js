/**
 * CogniVault API Client
 * Handles all HTTP requests to the backend
 */
const API_BASE = 'http://localhost:5000/api';

const api = {
  // ── Token Management ──────────────────────────────────────────────────
  getToken() { return localStorage.getItem('accessToken'); },
  getRefreshToken() { return localStorage.getItem('refreshToken'); },
  setTokens(access, refresh) {
    localStorage.setItem('accessToken', access);
    if (refresh) localStorage.setItem('refreshToken', refresh);
  },
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  },
  getUser() {
    const u = localStorage.getItem('currentUser');
    return u ? JSON.parse(u) : null;
  },
  setUser(user) { localStorage.setItem('currentUser', JSON.stringify(user)); },

  // ── Core Request ──────────────────────────────────────────────────────
  async request(method, path, body = null, isFormData = false) {
    const headers = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const opts = { method, headers };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);

    let res = await fetch(`${API_BASE}${path}`, opts);

    // Auto-refresh token on 401
    if (res.status === 401 && this.getRefreshToken()) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getToken()}`;
        res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
      } else {
        this.clearTokens();
        window.router.navigate('login');
        return null;
      }
    }

    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  // ── Auth ──────────────────────────────────────────────────────────────
  async register(payload) { return this.request('POST', '/auth/register', payload); },
  async login(payload)    { return this.request('POST', '/auth/login', payload); },
  async logout()          { return this.request('POST', '/auth/logout'); },
  async getMe()           { return this.request('GET',  '/auth/me'); },
  async refreshTokens() {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.getRefreshToken() }),
      });
      const data = await res.json();
      if (res.ok) { this.setTokens(data.data.accessToken, data.data.refreshToken); return true; }
      return false;
    } catch { return false; }
  },

  // ── Data ──────────────────────────────────────────────────────────────
  async createData(formData) { return this.request('POST', '/data', formData, true); },
  async getAllData()          { return this.request('GET',  '/data'); },
  async getDataById(id)      { return this.request('GET',  `/data/${id}`); },
  async updateData(id, body) { return this.request('PUT',  `/data/${id}`, body); },
  async deleteData(id)       { return this.request('DELETE', `/data/${id}`); },

  // ── Admin ─────────────────────────────────────────────────────────────
  async getUsers()              { return this.request('GET',   '/admin/users'); },
  async deactivateUser(id)      { return this.request('PATCH', `/admin/users/${id}/deactivate`); },
  async activateUser(id)        { return this.request('PATCH', `/admin/users/${id}/activate`); },

  // ── Logs ──────────────────────────────────────────────────────────────
  async getLogs(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request('GET', `/logs${q ? '?' + q : ''}`);
  },
};
