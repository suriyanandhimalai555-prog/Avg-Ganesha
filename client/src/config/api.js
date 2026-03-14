/**
 * API configuration - single place for endpoints and base URL.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const API_ROUTES = Object.freeze({
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
  },
  INVITES: '/api/invites',
  KYC: '/api/kyc',
  ADMIN: '/api/admin',
  PLANS: '/api/plans',
  SETTINGS: '/api/settings',
  DONATIONS: {
    CATEGORIES: '/api/donations/categories',
    SUBMIT: '/api/donations/submit',
    MY: '/api/donations/my',
    MY_STATS: '/api/donations/my-stats',
    ADMIN_PENDING: '/api/donations/admin/pending',
    ADMIN_REVIEW: (id) => `/api/donations/admin/review/${id}`,
  },
});
