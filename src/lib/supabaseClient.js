import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
export const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

/** @type {boolean} */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabasePublishableKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-ref')
);

/**
 * Safe storage wrapper combining window.localStorage, window.sessionStorage,
 * and an in-memory Map so Supabase Auth persists reliably across tabs, refreshes,
 * and restricted/sandboxed iframe environments.
 */
function createResilientStorage() {
  /** @type {Map<string, string>} */
  const memoryStore = new Map();

  return {
    /** @param {string} key */
    getItem(key) {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const val = window.localStorage.getItem(key);
          if (val !== null) {
            memoryStore.set(key, val);
            return val;
          }
        }
      } catch {
        // Fallback to sessionStorage / memoryStore if localStorage is blocked
      }
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          const val = window.sessionStorage.getItem(key);
          if (val !== null) {
            memoryStore.set(key, val);
            return val;
          }
        }
      } catch {
        // Fallback to memoryStore if sessionStorage is blocked
      }
      return memoryStore.has(key) ? memoryStore.get(key) ?? null : null;
    },
    /**
     * @param {string} key
     * @param {string} value
     */
    setItem(key, value) {
      memoryStore.set(key, value);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch {
        // Ignore localStorage quota / iframe security errors
      }
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem(key, value);
        }
      } catch {
        // Ignore sessionStorage errors; memoryStore retains the session
      }
    },
    /** @param {string} key */
    removeItem(key) {
      memoryStore.delete(key);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch {
        // Ignore storage errors
      }
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.removeItem(key);
        }
      } catch {
        // Ignore storage errors
      }
    },
  };
}

const GLOBAL_CLIENT_KEY = '__abcmaSupabaseClient';

/**
 * Strictly initialize the Supabase client once per browser context.
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
function getOrCreateSupabaseClient() {
  if (!isSupabaseConfigured) {
    return null;
  }
  const host = typeof globalThis !== 'undefined' ? /** @type {any} */ (globalThis) : {};
  if (host[GLOBAL_CLIENT_KEY]) {
    return host[GLOBAL_CLIENT_KEY];
  }
  const client = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: createResilientStorage(),
    },
  });
  host[GLOBAL_CLIENT_KEY] = client;
  return client;
}

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supabase = getOrCreateSupabaseClient();
