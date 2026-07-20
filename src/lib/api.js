// ========== Ada Fashion API Data Layer ==========
// Wraps all backend API calls with localStorage fallback for seeding

import { notify } from './notifications.js';

const normalizeApiBaseUrl = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return withoutTrailingSlash.endsWith('/api') ? withoutTrailingSlash : `${withoutTrailingSlash}/api`;
};

export const getApiBaseUrl = () => {
  const envUrl = normalizeApiBaseUrl(import.meta?.env?.VITE_API_URL);
  if (envUrl) return envUrl;

  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:4000/api`;
  }

  return 'http://localhost:4000/api';
};

const API_BASE = getApiBaseUrl();

const getSuccessMessage = (method, endpoint) => {
  const base = endpoint.replace('/api', '').replace(/^\//, '') || 'recurso';
  if (method === 'POST') return `Item criado com sucesso em ${base}`;
  if (method === 'PUT') return `Item atualizado com sucesso em ${base}`;
  if (method === 'DELETE') return `Item removido com sucesso em ${base}`;
  return 'Operação realizada com sucesso';
};

const getErrorMessage = (method, endpoint, fallback = 'Falha ao executar a operação.') => {
  const base = endpoint.replace('/api', '').replace(/^\//, '') || 'recurso';
  if (method === 'POST') return `Falha ao criar ${base}.`;
  if (method === 'PUT') return `Falha ao atualizar ${base}.`;
  if (method === 'DELETE') return `Falha ao remover ${base}.`;
  return fallback;
};

const parseResponse = async (response) => {
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
};

const apiCall = async (method, endpoint, data = null) => {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const payload = await parseResponse(response);

    if (!response.ok) {
      console.error(`API error: ${response.statusText}`, { method, endpoint, data, payload });
      if (method !== 'GET' && endpoint !== '/activity-logs') {
        notify(getErrorMessage(method, endpoint), 'error', 4000);
      }
      return null;
    }

    if (method !== 'GET' && endpoint !== '/activity-logs') {
      notify(getSuccessMessage(method, endpoint), 'success', 3200);
    }

    return payload;
  } catch (error) {
    console.error('API call failed', { method, endpoint, error });
    if (method !== 'GET' && endpoint !== '/activity-logs') {
      notify('Falha de conexão com o servidor.', 'error', 4000);
    }
    return null;
  }
};

export const api = {
  // PRODUCTS
  async getAllProducts() {
    return await apiCall('GET', '/products') || [];
  },

  async getProductById(id) {
    return await apiCall('GET', `/products/${id}`);
  },

  async getProduct(id) {
    return await this.getProductById(id);
  },

  async createProduct(data) {
    const result = await apiCall('POST', '/products', data);
    return result || { id: `temp-${Date.now()}`, ...data };
  },

  async updateProduct(id, data) {
    return await apiCall('PUT', `/products/${id}`, data);
  },

  async deleteProduct(id) {
    return await apiCall('DELETE', `/products/${id}`);
  },

  // ORDERS
  async getAllOrders() {
    return await apiCall('GET', '/orders') || [];
  },

  async getOrderById(id) {
    return await apiCall('GET', `/orders/${id}`);
  },

  async createOrder(data) {
    const result = await apiCall('POST', '/orders', data);
    return result || { id: `temp-${Date.now()}`, ...data };
  },

  async updateOrder(id, data) {
    return await apiCall('PUT', `/orders/${id}`, data);
  },

  async deleteOrder(id) {
    return await apiCall('DELETE', `/orders/${id}`);
  },

  // PROMOTIONS
  async getAllPromotions() {
    return await apiCall('GET', '/promotions') || [];
  },

  async createPromotion(data) {
    const result = await apiCall('POST', '/promotions', data);
    return result || { id: `temp-${Date.now()}`, ...data };
  },

  async updatePromotion(id, data) {
    return await apiCall('PUT', `/promotions/${id}`, data);
  },

  async deletePromotion(id) {
    return await apiCall('DELETE', `/promotions/${id}`);
  },

  // NEWS
  async getAllNews() {
    return await apiCall('GET', '/news') || [];
  },

  async createNews(data) {
    const result = await apiCall('POST', '/news', data);
    return result || { id: `temp-${Date.now()}`, ...data };
  },

  async updateNews(id, data) {
    return await apiCall('PUT', `/news/${id}`, data);
  },

  async deleteNews(id) {
    return await apiCall('DELETE', `/news/${id}`);
  },

  // VIDEOS
  async getAllVideos() {
    return await apiCall('GET', '/videos') || [];
  },

  async createVideo(data) {
    const result = await apiCall('POST', '/videos', data);
    return result || { id: `temp-${Date.now()}`, ...data };
  },

  async updateVideo(id, data) {
    return await apiCall('PUT', `/videos/${id}`, data);
  },

  async deleteVideo(id) {
    return await apiCall('DELETE', `/videos/${id}`);
  },

  // CAROUSEL PHOTOS
  async getAllCarouselPhotos() {
    return await apiCall('GET', '/carousel-photos') || [];
  },

  async createCarouselPhoto(data) {
    const result = await apiCall('POST', '/carousel-photos', data);
    return result || { id: `temp-${Date.now()}`, ...data };
  },

  async updateCarouselPhoto(id, data) {
    return await apiCall('PUT', `/carousel-photos/${id}`, data);
  },

  async deleteCarouselPhoto(id) {
    return await apiCall('DELETE', `/carousel-photos/${id}`);
  },

  // STORE SETTINGS
  async getStoreSettings() {
    const result = await apiCall('GET', '/store-settings');
    return result || { store_name: 'Ada Fashion', language: 'pt-BR', currency: 'XOF' };
  },

  async getAllStoreSettings() {
    const result = await this.getStoreSettings();
    return result ? [result] : [];
  },

  async createStoreSettings(data) {
    return await apiCall('POST', '/store-settings', data);
  },

  async updateStoreSettings(id, data) {
    return await apiCall('POST', '/store-settings', data);
  },

  async saveStoreSettings(data) {
    return await apiCall('POST', '/store-settings', data);
  },

  // USERS
  async getAllUsers() {
    return await apiCall('GET', '/users') || [];
  },

  async createUser(data) {
    const result = await apiCall('POST', '/users', data);
    return result || { id: `temp-${Date.now()}`, ...data };
  },

  async updateUser(id, data) {
    return await apiCall('PUT', `/users/${id}`, data);
  },

  async deleteUser(id) {
    return await apiCall('DELETE', `/users/${id}`);
  },

  // ACTIVITY LOGS
  async getAllActivityLogs() {
    return await apiCall('GET', '/activity-logs') || [];
  },

  async createActivityLog(data) {
    return await apiCall('POST', '/activity-logs', data);
  },

  async deleteAllActivityLogs() {
    return await apiCall('DELETE', '/activity-logs');
  },

  // RESERVATIONS
  async createReservation(data) {
    return await apiCall('POST', '/reservations', data);
  },
};

export default api;
