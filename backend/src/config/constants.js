/**
 * Application constants - keep magic strings/numbers in one place.
 */

export const AUTH_ERRORS = Object.freeze({
  USER_EXISTS: 'User already exists',
  INVALID_INVITE: 'Invalid invite code',
  INVALID_CREDENTIALS: 'Invalid credentials',
  SERVER_CONFIG: 'Server Configuration Error',
  LOGIN_FAILED: 'Login failed due to server error',
});

export const INVITE_PREFIX = 'GAN-';
export const INVITE_CODE_LENGTH = 5;
