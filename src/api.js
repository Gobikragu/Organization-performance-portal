// ============================================================
// src/api.js - Full API service for PerformOS
// ============================================================

const BASE_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('performos_token');
const setToken = (t) => localStorage.setItem('performos_token', t);
const clearToken = () => { localStorage.removeItem('performos_token'); localStorage.removeItem('performos_user'); };
const setUser = (u) => localStorage.setItem('performos_user', JSON.stringify(u));
export const getUser = () => { try { return JSON.parse(localStorage.getItem('performos_user')); } catch { return null; } };

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const authAPI = {
  login: async (email, password) => {
    const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(data.token);
    setUser(data.user);
    return data;
  },
  getMe: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
  logout: () => clearToken(),
};

export const employeeAPI = {
  getAll: (params = {}) => { const q = new URLSearchParams(params).toString(); return request(`/employees?${q}`); },
  getById: (id) => request(`/employees/${id}`),
  create: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
  updatePerformance: (id, performance) => request(`/employees/${id}/performance`, { method: 'PUT', body: JSON.stringify({ performance }) }),
};

export const taskAPI = {
  getAll: (params = {}) => { const q = new URLSearchParams(params).toString(); return request(`/tasks?${q}`); },
  getById: (id) => request(`/tasks/${id}`),
  create: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  getStats: () => request('/tasks/stats/summary'),
};

export const attendanceAPI = {
  checkIn: () => request('/attendance/checkin', { method: 'POST' }),
  checkOut: () => request('/attendance/checkout', { method: 'POST' }),
  getMy: (month, year) => request(`/attendance/my?month=${month}&year=${year}`),
  getAll: (params = {}) => { const q = new URLSearchParams(params).toString(); return request(`/attendance/all?${q}`); },
  mark: (data) => request('/attendance/mark', { method: 'POST', body: JSON.stringify(data) }),
};

export const dashboardAPI = {
  adminStats: () => request('/dashboard/admin'),
  employeeStats: () => request('/dashboard/employee'),
};