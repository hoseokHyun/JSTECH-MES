import { User, UserPermissions } from '../types';

export interface AuthSession {
  sessionId: string;
  user: User;
  createdAt: number;     // timestamp ms
  lastActiveAt: number;  // timestamp ms
  expiresAt: number;     // timestamp ms
  rememberMe: boolean;   // true if user opted into persistent remember-me (max 7 days)
}

// Storage Keys
export const STORAGE_KEY_SESSION_TRANSIENT = 'junsung_mes_session_transient_v3';
export const STORAGE_KEY_SESSION_PERSISTENT = 'junsung_mes_session_persistent_v3';
export const STORAGE_KEY_SAVED_EMAIL = 'saved_user_email';
export const STORAGE_KEY_REMEMBER_EMAIL = 'remember_email';

// Legacy keys to purge completely
export const LEGACY_STORAGE_KEYS = [
  'junsung_mes_user_v2',
  'mes_user_v2',
  'isLoggedIn',
  'currentUser',
  'user',
  'auth_user'
];

// Session Expirations
export const DEFAULT_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;    // 8 Hours
export const MAX_REMEMBER_ME_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days Max
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;                // 30 Minutes Inactivity
export const INACTIVITY_WARNING_COUNTDOWN_SECONDS = 60;            // 60 Seconds warning countdown

/**
 * Remove sensitive credentials (passwords, temporary tokens) from User object
 */
export function sanitizeUser(user: User): User {
  if (!user) return user;
  const safe: User = {
    uid: user.uid || '',
    email: user.email || '',
    name: user.name || '사용자',
    role: user.role || 'USER',
    isApproved: user.isApproved ?? true,
    isOnline: user.isOnline ?? true,
    createdAt: user.createdAt,
    loginAt: user.loginAt || new Date().toISOString(),
    logoutAt: user.logoutAt,
    permissions: user.permissions || {
      canEditOrder: user.role === 'ADMIN',
      canExecuteMES: true,
      canManageUsers: user.role === 'ADMIN',
      canEditMaster: user.role === 'ADMIN',
      canArchive: user.role === 'ADMIN',
    }
  };
  // Ensure password is never included in the sanitized user object
  delete (safe as any).password;
  return safe;
}

/**
 * Purge any legacy unsecure auth keys
 */
export function purgeLegacyStorage(): void {
  try {
    LEGACY_STORAGE_KEYS.forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  } catch (e) {
    console.warn('Error purging legacy auth storage:', e);
  }
}

/**
 * Create a new authenticated session
 * @param user Authenticated user object
 * @param rememberMe Whether the user opted in to persistent session (default: false)
 */
export function createAuthSession(user: User, rememberMe: boolean = false): AuthSession {
  purgeLegacyStorage();

  const now = Date.now();
  const safeUser = sanitizeUser(user);
  const duration = rememberMe ? MAX_REMEMBER_ME_DURATION_MS : DEFAULT_SESSION_DURATION_MS;

  const session: AuthSession = {
    sessionId: `sess_${now}_${Math.random().toString(36).substring(2, 9)}`,
    user: safeUser,
    createdAt: now,
    lastActiveAt: now,
    expiresAt: now + duration,
    rememberMe: Boolean(rememberMe),
  };

  try {
    if (rememberMe) {
      // Persistent session in localStorage (max 7 days)
      localStorage.setItem(STORAGE_KEY_SESSION_PERSISTENT, JSON.stringify(session));
      sessionStorage.removeItem(STORAGE_KEY_SESSION_TRANSIENT);
    } else {
      // Standard session in sessionStorage (wiped on browser close or reboot)
      sessionStorage.setItem(STORAGE_KEY_SESSION_TRANSIENT, JSON.stringify(session));
      localStorage.removeItem(STORAGE_KEY_SESSION_PERSISTENT);
    }
  } catch (e) {
    console.error('Failed to store auth session:', e);
  }

  return session;
}

/**
 * Retrieve and validate currently stored authentication session
 * Checks for session existence, hard expiry, and inactivity expiry
 */
export function getStoredAuthSession(): AuthSession | null {
  purgeLegacyStorage();

  const now = Date.now();

  // 1. Check transient session in sessionStorage first (when rememberMe is OFF)
  try {
    const rawTransient = sessionStorage.getItem(STORAGE_KEY_SESSION_TRANSIENT);
    if (rawTransient) {
      const session = JSON.parse(rawTransient) as AuthSession;
      if (isValidSession(session, now)) {
        return session;
      } else {
        sessionStorage.removeItem(STORAGE_KEY_SESSION_TRANSIENT);
      }
    }
  } catch (e) {
    sessionStorage.removeItem(STORAGE_KEY_SESSION_TRANSIENT);
  }

  // 2. Check persistent session in localStorage (ONLY valid if rememberMe was true and not expired)
  try {
    const rawPersistent = localStorage.getItem(STORAGE_KEY_SESSION_PERSISTENT);
    if (rawPersistent) {
      const session = JSON.parse(rawPersistent) as AuthSession;
      if (session.rememberMe && isValidSession(session, now)) {
        return session;
      } else {
        localStorage.removeItem(STORAGE_KEY_SESSION_PERSISTENT);
      }
    }
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY_SESSION_PERSISTENT);
  }

  return null;
}

/**
 * Check if a session is structurally valid, unexpired, and within inactivity window
 */
function isValidSession(session: any, now: number): boolean {
  if (!session || typeof session !== 'object') return false;
  if (!session.user || !session.sessionId || !session.expiresAt || !session.lastActiveAt) return false;

  // Hard expiration check (8 hours or 7 days)
  if (now > session.expiresAt) {
    return false;
  }

  // Inactivity timeout check (30 minutes since last interaction)
  // If the browser was idle or closed for more than 30 minutes
  if (now - session.lastActiveAt > INACTIVITY_TIMEOUT_MS) {
    return false;
  }

  return true;
}

/**
 * Touch / Update last activity timestamp of current active session
 */
export function updateSessionActivity(): void {
  const now = Date.now();

  try {
    const rawTransient = sessionStorage.getItem(STORAGE_KEY_SESSION_TRANSIENT);
    if (rawTransient) {
      const session = JSON.parse(rawTransient) as AuthSession;
      session.lastActiveAt = now;
      sessionStorage.setItem(STORAGE_KEY_SESSION_TRANSIENT, JSON.stringify(session));
      return;
    }

    const rawPersistent = localStorage.getItem(STORAGE_KEY_SESSION_PERSISTENT);
    if (rawPersistent) {
      const session = JSON.parse(rawPersistent) as AuthSession;
      session.lastActiveAt = now;
      localStorage.setItem(STORAGE_KEY_SESSION_PERSISTENT, JSON.stringify(session));
    }
  } catch (e) {
    console.warn('Failed to update session activity timestamp:', e);
  }
}

/**
 * Extend session (when user clicks "Stay Logged In" in warning modal)
 */
export function extendSession(): void {
  const now = Date.now();

  try {
    const rawTransient = sessionStorage.getItem(STORAGE_KEY_SESSION_TRANSIENT);
    if (rawTransient) {
      const session = JSON.parse(rawTransient) as AuthSession;
      session.lastActiveAt = now;
      // Reset 8-hour window from now
      session.expiresAt = now + DEFAULT_SESSION_DURATION_MS;
      sessionStorage.setItem(STORAGE_KEY_SESSION_TRANSIENT, JSON.stringify(session));
      return;
    }

    const rawPersistent = localStorage.getItem(STORAGE_KEY_SESSION_PERSISTENT);
    if (rawPersistent) {
      const session = JSON.parse(rawPersistent) as AuthSession;
      session.lastActiveAt = now;
      session.expiresAt = now + MAX_REMEMBER_ME_DURATION_MS;
      localStorage.setItem(STORAGE_KEY_SESSION_PERSISTENT, JSON.stringify(session));
    }
  } catch (e) {
    console.warn('Failed to extend session:', e);
  }
}

/**
 * Completely wipe all authentication sessions and prevent back-navigation
 */
export function clearAllAuthSessions(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_SESSION_TRANSIENT);
    localStorage.removeItem(STORAGE_KEY_SESSION_PERSISTENT);
    purgeLegacyStorage();

    // Clear history state to avoid cached back navigation
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  } catch (e) {
    console.error('Error during clearAllAuthSessions:', e);
  }
}
