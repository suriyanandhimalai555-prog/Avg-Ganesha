/**
 * Auth events - decouple 401 handling from axios and React Router.
 * Emit session-expired; App subscribes and redirects.
 */
const AUTH_SESSION_EXPIRED = 'auth:sessionExpired';

export function emitSessionExpired() {
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED));
}

export function onSessionExpired(callback) {
  const handler = () => callback();
  window.addEventListener(AUTH_SESSION_EXPIRED, handler);
  return () => window.removeEventListener(AUTH_SESSION_EXPIRED, handler);
}
