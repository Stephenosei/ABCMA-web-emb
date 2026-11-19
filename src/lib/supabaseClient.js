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
 * Derive the exact Supabase auth storage key for this project URL.
 * Matches @supabase/supabase-js defaultStorageKey (`sb-<project-ref>-auth-token`).
 */
function resolveAuthStorageKey() {
  try {
    if (supabaseUrl) {
      const hostname = new URL(supabaseUrl).hostname;
      const projectRef = hostname.split('.')[0];
      if (projectRef) {
        return `sb-${projectRef}-auth-token`;
      }
    }
  } catch {
    // Fall through to default key
  }
  return 'sb-abcma-auth-token';
}

export const AUTH_STORAGE_KEY = resolveAuthStorageKey();

const SESSION_ALIVE_KEY = '__abcma_session_alive_at';
const SESSION_UNLOAD_KEY = '__abcma_session_unload_at';
const SESSION_CHANNEL_NAME = 'abcma-admin-session-liveness';
const RELOAD_GRACE_MS = 2500;
const LIVE_TAB_PROBE_TIMEOUT_MS = 140;
const HEARTBEAT_INTERVAL_MS = 1200;

const TAB_INSTANCE_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Check whether an arbitrary storage key is a Supabase Auth key.
 * @param {string | null | undefined} key
 */
function isSupabaseAuthKey(key) {
  if (!key) return false;
  return (
    key === AUTH_STORAGE_KEY ||
    key.startsWith(`${AUTH_STORAGE_KEY}-`) ||
    /^sb-.*-auth-token/.test(key) ||
    /^sb-.*-code-verifier/.test(key) ||
    key === 'supabase.auth.token'
  );
}

/**
 * Remove any previously persisted Supabase Auth tokens from window.localStorage
 * so administrator sessions never survive after the browser is closed.
 * Never removes unrelated website or user data.
 */
function clearLegacyLocalStorageAuth() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const keysToRemove = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (isSupabaseAuthKey(k)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      window.localStorage.removeItem(k);
    }
  } catch {
    // Ignore storage access errors in restricted/sandboxed contexts
  }
}

/**
 * Check if window.sessionStorage is accessible.
 */
function getSessionStorageSafe() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const probeKey = '__abcma_ss_probe__';
    window.sessionStorage.setItem(probeKey, '1');
    window.sessionStorage.removeItem(probeKey);
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Remove all Supabase Auth keys and session liveness markers from sessionStorage.
 * @param {Map<string, string>} memoryStore
 */
function purgeSessionStorageAuth(memoryStore) {
  for (const k of Array.from(memoryStore.keys())) {
    if (isSupabaseAuthKey(k) || k === SESSION_ALIVE_KEY || k === SESSION_UNLOAD_KEY) {
      memoryStore.delete(k);
    }
  }

  const ss = getSessionStorageSafe();
  if (ss) {
    const keysToRemove = [];
    for (let i = 0; i < ss.length; i += 1) {
      const k = ss.key(i);
      if (isSupabaseAuthKey(k) || k === SESSION_ALIVE_KEY || k === SESSION_UNLOAD_KEY) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      ss.removeItem(k);
    }
  }

  clearLegacyLocalStorageAuth();
}

/**
 * Query any currently open live tab in the same browser session via BroadcastChannel
 * (in-memory IPC only — zero disk/cookie persistence).
 * Returns the live tab's raw auth session JSON if one is open and authenticated,
 * or null if no live tabs exist (e.g., after closing and reopening the browser).
 * @param {BroadcastChannel | null} channel
 * @returns {Promise<{ alive: boolean; sessionValue: string | null }>}
 */
function probeLiveTabsForSession(channel) {
  if (!channel) {
    return Promise.resolve({ alive: false, sessionValue: null });
  }

  return new Promise((resolve) => {
    const requestId = `${TAB_INSTANCE_ID}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      channel.removeEventListener('message', onMessage);
      resolve(result);
    };

    /** @param {MessageEvent} event */
    const onMessage = (event) => {
      const msg = event.data;
      if (!msg || msg.senderId === TAB_INSTANCE_ID) return;
      if (msg.type === 'LIVE_SESSION_RESPONSE' && msg.requestId === requestId) {
        if (typeof msg.value === 'string' && msg.value.length > 0) {
          finish({ alive: true, sessionValue: msg.value });
        }
      }
    };

    const timer = setTimeout(() => {
      finish({ alive: false, sessionValue: null });
    }, LIVE_TAB_PROBE_TIMEOUT_MS);

    channel.addEventListener('message', onMessage);
    try {
      channel.postMessage({
        type: 'REQUEST_LIVE_SESSION',
        requestId,
        senderId: TAB_INSTANCE_ID,
      });
    } catch {
      finish({ alive: false, sessionValue: null });
    }
  });
}

/**
 * Session-scoped storage adapter backed exclusively by window.sessionStorage
 * (with an in-memory Map fallback only when sessionStorage is blocked by browser rules).
 *
 * Also guards against browsers with "Continue where you left off" / session-restore
 * settings that persist window.sessionStorage across full browser restarts:
 * - In-session page refreshes (F5/reload) and same-tab navigation preserve the session.
 * - Opening another tab during the same active browser session syncs via BroadcastChannel.
 * - Closing the browser completely and reopening it clears any restored session so
 *   a fresh login is always required.
 */
function createSessionOnlyStorage() {
  /** @type {Map<string, string>} */
  const memoryStore = new Map();

  /** @type {BroadcastChannel | null} */
  let channel = null;
  if (typeof window !== 'undefined' && typeof globalThis.BroadcastChannel === 'function') {
    try {
      channel = new globalThis.BroadcastChannel(SESSION_CHANNEL_NAME);
    } catch {
      channel = null;
    }
  }

  let livenessChecked = false;
  /** @type {Promise<void> | null} */
  let livenessPromise = null;

  const markAliveNow = () => {
    const ss = getSessionStorageSafe();
    if (!ss) return;
    if (ss.getItem(AUTH_STORAGE_KEY)) {
      ss.setItem(SESSION_ALIVE_KEY, String(Date.now()));
    }
  };

  const markUnloadNow = () => {
    const ss = getSessionStorageSafe();
    if (!ss) return;
    if (ss.getItem(AUTH_STORAGE_KEY)) {
      const now = String(Date.now());
      ss.setItem(SESSION_UNLOAD_KEY, now);
      ss.setItem(SESSION_ALIVE_KEY, now);
    }
  };

  const ensureBrowserSessionVerified = () => {
    if (livenessChecked) {
      return Promise.resolve();
    }
    if (livenessPromise) {
      return livenessPromise;
    }

    livenessPromise = (async () => {
      try {
        clearLegacyLocalStorageAuth();

        const ss = getSessionStorageSafe();
        if (!ss) {
          livenessChecked = true;
          return;
        }

        const existingRaw = ss.getItem(AUTH_STORAGE_KEY);
        const navStartMs =
          typeof performance !== 'undefined' && typeof performance.timeOrigin === 'number'
            ? performance.timeOrigin
            : Date.now();

        if (existingRaw) {
          const unloadAt = Number(ss.getItem(SESSION_UNLOAD_KEY) || '0');
          const aliveAt = Number(ss.getItem(SESSION_ALIVE_KEY) || '0');

          const unloadDelta = unloadAt > 0 ? navStartMs - unloadAt : Infinity;
          const aliveDelta = aliveAt > 0 ? navStartMs - aliveAt : Infinity;

          const isImmediateReload =
            unloadDelta >= -1000 && unloadDelta <= RELOAD_GRACE_MS;
          const isFreshlyClonedTab =
            aliveDelta >= -1000 && aliveDelta <= RELOAD_GRACE_MS;

          if (isImmediateReload || isFreshlyClonedTab) {
            ss.removeItem(SESSION_UNLOAD_KEY);
            ss.setItem(SESSION_ALIVE_KEY, String(Date.now()));
            livenessChecked = true;
            return;
          }

          // Restored sessionStorage with an old/missing timestamp (e.g. browser closed & reopened
          // with "Continue where you left off"). Keep only if another active tab is still open.
          const probe = await probeLiveTabsForSession(channel);
          if (probe.alive && probe.sessionValue) {
            ss.setItem(AUTH_STORAGE_KEY, probe.sessionValue);
            ss.removeItem(SESSION_UNLOAD_KEY);
            ss.setItem(SESSION_ALIVE_KEY, String(Date.now()));
            memoryStore.set(AUTH_STORAGE_KEY, probe.sessionValue);
          } else {
            purgeSessionStorageAuth(memoryStore);
          }
          livenessChecked = true;
          return;
        }

        // No token in this tab's sessionStorage yet: if another tab in the same active
        // browser session is already logged in, sync that active session to this tab.
        const probe = await probeLiveTabsForSession(channel);
        if (probe.alive && probe.sessionValue) {
          ss.setItem(AUTH_STORAGE_KEY, probe.sessionValue);
          ss.removeItem(SESSION_UNLOAD_KEY);
          ss.setItem(SESSION_ALIVE_KEY, String(Date.now()));
          memoryStore.set(AUTH_STORAGE_KEY, probe.sessionValue);
        }
      } finally {
        livenessChecked = true;
      }
    })();

    return livenessPromise;
  };

  if (typeof window !== 'undefined') {
    if (channel) {
      channel.addEventListener('message', (event) => {
        const msg = event.data;
        if (!msg || msg.senderId === TAB_INSTANCE_ID) return;

        const ss = getSessionStorageSafe();

        if (msg.type === 'REQUEST_LIVE_SESSION' && livenessChecked) {
          const activeValue = ss
            ? ss.getItem(AUTH_STORAGE_KEY)
            : memoryStore.get(AUTH_STORAGE_KEY) ?? null;
          if (activeValue) {
            try {
              channel?.postMessage({
                type: 'LIVE_SESSION_RESPONSE',
                requestId: msg.requestId,
                senderId: TAB_INSTANCE_ID,
                value: activeValue,
              });
            } catch {
              // Ignore BroadcastChannel post errors
            }
          }
          return;
        }

        if (msg.type === 'SESSION_UPDATED' && msg.key === AUTH_STORAGE_KEY && typeof msg.value === 'string') {
          memoryStore.set(AUTH_STORAGE_KEY, msg.value);
          if (ss) {
            ss.setItem(AUTH_STORAGE_KEY, msg.value);
            ss.setItem(SESSION_ALIVE_KEY, String(Date.now()));
          }
          return;
        }

        if (msg.type === 'SESSION_CLEARED') {
          purgeSessionStorageAuth(memoryStore);
        }
      });
    }

    window.addEventListener('beforeunload', markUnloadNow);
    window.addEventListener('pagehide', (event) => {
      if (!event.persisted) {
        markUnloadNow();
      }
    });
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        markAliveNow();
      }
    });
    window.addEventListener('storage', (event) => {
      if (event.storageArea === window.localStorage && isSupabaseAuthKey(event.key)) {
        clearLegacyLocalStorageAuth();
      }
    });
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          markAliveNow();
        }
      });
    }
    window.setInterval(markAliveNow, HEARTBEAT_INTERVAL_MS);
  }

  return {
    /** @param {string} key */
    async getItem(key) {
      await ensureBrowserSessionVerified();
      const ss = getSessionStorageSafe();
      if (ss) {
        const val = ss.getItem(key);
        if (val !== null) {
          memoryStore.set(key, val);
          return val;
        }
        memoryStore.delete(key);
        return null;
      }
      return memoryStore.has(key) ? memoryStore.get(key) ?? null : null;
    },
    /**
     * @param {string} key
     * @param {string} value
     */
    async setItem(key, value) {
      livenessChecked = true;
      memoryStore.set(key, value);
      clearLegacyLocalStorageAuth();

      const ss = getSessionStorageSafe();
      if (ss) {
        ss.setItem(key, value);
        if (key === AUTH_STORAGE_KEY) {
          ss.removeItem(SESSION_UNLOAD_KEY);
          ss.setItem(SESSION_ALIVE_KEY, String(Date.now()));
        }
      }

      if (key === AUTH_STORAGE_KEY && channel) {
        try {
          channel.postMessage({
            type: 'SESSION_UPDATED',
            senderId: TAB_INSTANCE_ID,
            key,
            value,
          });
        } catch {
          // Ignore BroadcastChannel errors
        }
      }
    },
    /** @param {string} key */
    async removeItem(key) {
      memoryStore.delete(key);
      const ss = getSessionStorageSafe();
      if (ss) {
        ss.removeItem(key);
        if (key === AUTH_STORAGE_KEY) {
          ss.removeItem(SESSION_ALIVE_KEY);
          ss.removeItem(SESSION_UNLOAD_KEY);
        }
      }
      clearLegacyLocalStorageAuth();

      if (key === AUTH_STORAGE_KEY && channel) {
        try {
          channel.postMessage({
            type: 'SESSION_CLEARED',
            senderId: TAB_INSTANCE_ID,
          });
        } catch {
          // Ignore BroadcastChannel errors
        }
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

  clearLegacyLocalStorageAuth();

  const client = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      storageKey: AUTH_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: createSessionOnlyStorage(),
    },
  });
  host[GLOBAL_CLIENT_KEY] = client;
  return client;
}

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supabase = getOrCreateSupabaseClient();
