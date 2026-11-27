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
  ADMIN_USER_OVERVIEW: (id) => `/api/admin/users/${id}/overview`,
  ADMIN_USER_COINS: (id) => `/api/admin/users/${id}/coins`,
  ADMIN_AUDIT_LOG: '/api/admin/audit-log',
  PLANS: '/api/plans',
  SETTINGS: '/api/settings',
  DONATIONS: {
    CATEGORIES: '/api/donations/categories',
    SUBMIT: '/api/donations/submit',
    MY: '/api/donations/my',
    MY_STATS: '/api/donations/my-stats',
    ADMIN_PENDING: '/api/donations/admin/pending',
    ADMIN_EXPORT: '/api/donations/admin/export',
    ADMIN_REVIEW: (id) => `/api/donations/admin/review/${id}`,
    ADMIN_ENTRY: '/api/donations/admin/entry',
    ADMIN_STATUE_NUMBERS: '/api/donations/admin/statue-numbers',
    ADMIN_UPDATE_STATUE_NUMBER: (id) => `/api/donations/admin/statue-number/${id}`,
    ADMIN_DATE_CHANGE_PREVIEW: (id) => `/api/donations/admin/${id}/date-change`,
    ADMIN_CHANGE_DATE: (id) => `/api/donations/admin/${id}/date`,
    ADMIN_REMOVE_PREVIEW: (id) => `/api/donations/admin/${id}/remove-preview`,
    ADMIN_REMOVE: (id) => `/api/donations/admin/${id}`,
  },
});
