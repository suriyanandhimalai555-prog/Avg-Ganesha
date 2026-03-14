/**
 * HTTP client - attaches token from auth storage, handles 401 via events.
 * Decoupled from Redux; uses authStorage for token.
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getToken } from '../services/authStorage';
import { emitSessionExpired } from '../lib/authEvents';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// REQUEST: attach token from auth storage
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE: on 401, emit event (App handles logout + redirect)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest =
      error.config?.url?.includes('/login') || error.config?.url?.includes('/register');
    if (error.response?.status === 401 && !isAuthRequest) {
      emitSessionExpired();
    }
    return Promise.reject(error);
  }
);

export default api;
