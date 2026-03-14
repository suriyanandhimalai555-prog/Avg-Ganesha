/**
 * Auth service - all auth-related API calls.
 * Single place for auth API logic; components use this via thunks.
 */
import api from '../api/axios';
import { API_ROUTES } from '../config/api';

export async function login(email, password) {
  const { data } = await api.post(API_ROUTES.AUTH.LOGIN, { email, password });
  return data;
}

export async function register(payload) {
  const { data } = await api.post(API_ROUTES.AUTH.REGISTER, payload);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get(API_ROUTES.AUTH.ME);
  return data;
}
