import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  logAdminActivity,
  checkServerLoginRateLimit,
  recordServerLoginAttempt,
} from '../lib/supabase';
import { supabaseUrl, supabasePublishableKey } from '../lib/supabaseClient.js';
import { AdminProfile, AdminRole, AdminRoleSlug } from '../types/cms';
import {
  checkClientRateLimit,
  recordClientRateLimitEvent,
  clearClientRateLimit,
  validateStrongPassword,
  toSafeErrorMessage,
} from '../utils/security';

export const INACTIVITY_TIMEOUT_SECONDS = 15 * 60; // 15 minutes
export const INACTIVITY_WARNING_SECONDS = 2 * 60; // 2-minute countdown warning

const GENERIC_LOGIN_ERROR =
  'Invalid administrator credentials or unauthorized account. Please verify your details and try again.';

interface ProfileLookupResult {
  profile: AdminProfile | null;
  errorMessage: string | null;
  missingProfile: boolean;
  inactiveProfile?: boolean;
  transientError?: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  adminProfile: AdminProfile | null;
  roleSlug: AdminRoleSlug | null;
  loading: boolean;
  profileVerifying: boolean;
  authError: string | null;
  isRecoveryMode: boolean;
  isConfigured: boolean;
  isAuthenticatedAdmin: boolean;
  isDashboardAccessGranted: boolean;
  isSuperAdmin: boolean;
  canPublishOrDelete: boolean;
  canManageAdmins: boolean;
  canEditContent: boolean;
  loginLockoutSeconds: number;
  idleRemainingSeconds: number;
  idleWarningActive: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: (reason?: 'USER_LOGOUT' | 'SESSION_TIMEOUT') => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  reauthenticate: (password: string) => Promise<{ ok: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  extendSession: () => void;
  clearRecoveryMode: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfileWithExplicitJwt(
  userId: string,
  accessToken: string
): Promise<{ row: Record<string, unknown> | null; error: string | null }> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/admin_profiles?id=eq.${encodeURIComponent(userId)}&select=*`,
      {
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );
    if (!res.ok) {
      const text = await res.text();
      return { row: null, error: text || `HTTP ${res.status} loading admin profile` };
    }
    const rows = (await res.json()) as Array<Record<string, unknown>>;
    return { row: rows[0] ?? null, error: null };
  } catch (err) {
    return {
      row: null,
      error: err instanceof Error ? err.message : 'Network error loading admin profile',
    };
  }
}

async function fetchRoleWithExplicitJwt(
  roleId: string,
  accessToken: string
): Promise<{ role: AdminRole | null; error: string | null }> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/admin_roles?id=eq.${encodeURIComponent(roleId)}&select=*`,
      {
        headers: {
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );
    if (!res.ok) {
      const text = await res.text();
      return { role: null, error: text || `HTTP ${res.status} loading admin role` };
    }
    const rows = (await res.json()) as AdminRole[];
    return { role: rows[0] ?? null, error: null };
  } catch (err) {
    return {
      role: null,
      error: err instanceof Error ? err.message : 'Network error loading admin role',
    };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [profileVerifying, setProfileVerifying] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(false);

  const [loginLockoutSeconds, setLoginLockoutSeconds] = useState<number>(0);

  const [idleRemainingSeconds, setIdleRemainingSeconds] = useState<number>(INACTIVITY_TIMEOUT_SECONDS);

  const mountedRef = useRef<boolean>(true);
  const signingInRef = useRef<boolean>(false);
  const sessionRef = useRef<Session | null>(null);
  const adminProfileRef = useRef<AdminProfile | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const inFlightProfileRef = useRef<{
    userId: string;
    promise: Promise<ProfileLookupResult>;
  } | null>(null);

  const commitSession = useCallback((nextSession: Session | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
  }, []);

  const commitAdminProfile = useCallback((nextProfile: AdminProfile | null) => {
    adminProfileRef.current = nextProfile;
    setAdminProfile(nextProfile);
  }, []);

  const loadAdminProfile = useCallback(
    async (
      userId: string,
      explicitAccessToken?: string,
      options?: { preserveOnTransientError?: boolean; suppressAuthError?: boolean }
    ): Promise<ProfileLookupResult> => {
      if (!supabase) {
        return {
          profile: null,
          errorMessage: 'Authentication service is unavailable.',
          missingProfile: false,
        };
      }

      if (inFlightProfileRef.current && inFlightProfileRef.current.userId === userId) {
        return inFlightProfileRef.current.promise;
      }

      const executeLookup = async (): Promise<ProfileLookupResult> => {
        const sb = supabase;
        if (!sb) {
          return {
            profile: null,
            errorMessage: 'Authentication service is unavailable.',
            missingProfile: false,
          };
        }

        let token = explicitAccessToken || sessionRef.current?.access_token;
        if (!token) {
          try {
            const { data } = await sb.auth.getSession();
            token = data.session?.access_token;
          } catch {
            // Continue with client query
          }
        }

        let profileRow: (AdminProfile & { role?: AdminRole | AdminRole[] | null }) | null = null;
        let queryErrorMsg: string | null = null;

        try {
          const joinedRes = await sb
            .from('admin_profiles')
            .select('*, role:admin_roles(*)')
            .eq('id', userId)
            .maybeSingle();

          if (joinedRes.error) {
            queryErrorMsg = joinedRes.error.message;
          } else if (joinedRes.data) {
            profileRow = joinedRes.data as unknown as AdminProfile & {
              role?: AdminRole | AdminRole[] | null;
            };
          }
        } catch (err) {
          queryErrorMsg = err instanceof Error ? err.message : 'Unable to query admin profile.';
        }

        if (!profileRow && queryErrorMsg) {
          try {
            const plainRes = await sb
              .from('admin_profiles')
              .select('*')
              .eq('id', userId)
              .maybeSingle();

            if (plainRes.error) {
              queryErrorMsg = plainRes.error.message;
            } else {
              queryErrorMsg = null;
              profileRow = (plainRes.data as unknown as AdminProfile) ?? null;
            }
          } catch (err) {
            queryErrorMsg = err instanceof Error ? err.message : 'Unable to query admin profile.';
          }
        }

        if (!profileRow && token) {
          const directRes = await fetchProfileWithExplicitJwt(userId, token);
          if (directRes.error) {
            queryErrorMsg = directRes.error;
          } else if (directRes.row) {
            queryErrorMsg = null;
            profileRow = directRes.row as unknown as AdminProfile;
          } else {
            queryErrorMsg = null;
          }
        }

        if (queryErrorMsg) {
          const safeMsg = toSafeErrorMessage(
            queryErrorMsg,
            'Unable to verify administrator session right now.'
          );
          if (
            options?.preserveOnTransientError &&
            adminProfileRef.current?.id === userId &&
            adminProfileRef.current.is_active
          ) {
            return {
              profile: adminProfileRef.current,
              errorMessage: null,
              missingProfile: false,
              transientError: true,
            };
          }
          if (mountedRef.current) {
            if (!options?.suppressAuthError) setAuthError(safeMsg);
            commitAdminProfile(null);
          }
          return {
            profile: null,
            errorMessage: safeMsg,
            missingProfile: false,
            transientError: true,
          };
        }

        if (!profileRow) {
          if (mountedRef.current) {
            if (!options?.suppressAuthError) setAuthError(GENERIC_LOGIN_ERROR);
            commitAdminProfile(null);
          }
          return { profile: null, errorMessage: GENERIC_LOGIN_ERROR, missingProfile: true };
        }

        if (!profileRow.is_active) {
          if (mountedRef.current) {
            if (!options?.suppressAuthError) setAuthError(GENERIC_LOGIN_ERROR);
            commitAdminProfile(null);
          }
          return {
            profile: null,
            errorMessage: GENERIC_LOGIN_ERROR,
            missingProfile: false,
            inactiveProfile: true,
          };
        }

        let resolvedRole: AdminRole | null = Array.isArray(profileRow.role)
          ? profileRow.role[0] ?? null
          : profileRow.role ?? null;

        if (!resolvedRole && profileRow.role_id) {
          try {
            const roleRes = await sb
              .from('admin_roles')
              .select('*')
              .eq('id', profileRow.role_id)
              .maybeSingle();

            if (roleRes.data) {
              resolvedRole = roleRes.data as AdminRole;
            } else if (token) {
              const directRole = await fetchRoleWithExplicitJwt(profileRow.role_id, token);
              if (directRole.role) {
                resolvedRole = directRole.role;
              } else if (directRole.error) {
                const safeMsg = toSafeErrorMessage(
                  directRole.error,
                  'Unable to verify administrator role.'
                );
                if (
                  options?.preserveOnTransientError &&
                  adminProfileRef.current?.id === userId &&
                  adminProfileRef.current.is_active
                ) {
                  return {
                    profile: adminProfileRef.current,
                    errorMessage: null,
                    missingProfile: false,
                    transientError: true,
                  };
                }
                if (mountedRef.current) {
                  if (!options?.suppressAuthError) setAuthError(safeMsg);
                  commitAdminProfile(null);
                }
                return { profile: null, errorMessage: safeMsg, missingProfile: false, transientError: true };
              }
            }
          } catch (err) {
            const safeMsg = toSafeErrorMessage(err, 'Unable to verify administrator role.');
            if (mountedRef.current) {
              if (!options?.suppressAuthError) setAuthError(safeMsg);
              commitAdminProfile(null);
            }
            return { profile: null, errorMessage: safeMsg, missingProfile: false, transientError: true };
          }
        }

        if (!resolvedRole) {
          if (mountedRef.current) {
            if (!options?.suppressAuthError) setAuthError(GENERIC_LOGIN_ERROR);
            commitAdminProfile(null);
          }
          return { profile: null, errorMessage: GENERIC_LOGIN_ERROR, missingProfile: false };
        }

        const fullProfile: AdminProfile = {
          ...profileRow,
          role: resolvedRole,
        };

        if (mountedRef.current) {
          setAuthError(null);
          commitAdminProfile(fullProfile);
        }
        return { profile: fullProfile, errorMessage: null, missingProfile: false };
      };

      const promise = executeLookup().finally(() => {
        if (inFlightProfileRef.current?.userId === userId) {
          inFlightProfileRef.current = null;
        }
      });

      inFlightProfileRef.current = { userId, promise };
      return promise;
    },
    [commitAdminProfile]
  );

  const refreshProfile = useCallback(async () => {
    const activeSession = sessionRef.current;
    if (!supabase || !activeSession?.user) return;
    await loadAdminProfile(activeSession.user.id, activeSession.access_token, {
      preserveOnTransientError: true,
    });
  }, [loadAdminProfile]);

  useEffect(() => {
    mountedRef.current = true;
    const sb = supabase;
    if (!sb) {
      setLoading(false);
      return;
    }

    let initialFinished = false;

    const initSession = async () => {
      try {
        const { data, error } = await sb.auth.getSession();
        if (error) throw error;
        if (!mountedRef.current) return;

        const restored = data.session ?? null;
        commitSession(restored);

        if (restored?.user) {
          setProfileVerifying(true);
          await loadAdminProfile(restored.user.id, restored.access_token, {
            preserveOnTransientError: true,
          });
        } else {
          commitAdminProfile(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setAuthError(toSafeErrorMessage(err, 'Unable to restore session.'));
        }
      } finally {
        initialFinished = true;
        if (mountedRef.current) {
          setProfileVerifying(false);
          setLoading(false);
        }
      }
    };

    initSession();

    const { data: listener } = sb.auth.onAuthStateChange((event, nextSession) => {
      if (!mountedRef.current) return;

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }

      if (signingInRef.current) {
        return;
      }

      if (event === 'INITIAL_SESSION' && !initialFinished) {
        return;
      }

      if (event === 'SIGNED_OUT' || !nextSession?.user) {
        if (event === 'SIGNED_OUT' || initialFinished) {
          commitSession(null);
          commitAdminProfile(null);
          setProfileVerifying(false);
          setLoading(false);
        }
        return;
      }

      commitSession(nextSession);

      const uid = nextSession.user.id;
      const token = nextSession.access_token;
      const alreadyVerifiedSameUser =
        adminProfileRef.current?.id === uid && adminProfileRef.current.is_active;

      if (event === 'TOKEN_REFRESHED') {
        if (!alreadyVerifiedSameUser) {
          setTimeout(() => {
            if (!mountedRef.current || signingInRef.current) return;
            void loadAdminProfile(uid, token, { preserveOnTransientError: true });
          }, 0);
        }
        return;
      }

      if (alreadyVerifiedSameUser) {
        setTimeout(() => {
          if (!mountedRef.current || signingInRef.current) return;
          void loadAdminProfile(uid, token, { preserveOnTransientError: true });
        }, 0);
        return;
      }

      setProfileVerifying(true);
      setTimeout(() => {
        if (!mountedRef.current || signingInRef.current) return;
        loadAdminProfile(uid, token, { preserveOnTransientError: false }).finally(() => {
          if (mountedRef.current) {
            setProfileVerifying(false);
            setLoading(false);
          }
        });
      }, 0);
    });

    return () => {
      mountedRef.current = false;
      listener.subscription.unsubscribe();
    };
  }, [loadAdminProfile, commitSession, commitAdminProfile]);

  // Lockout countdown ticker
  useEffect(() => {
    if (loginLockoutSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setLoginLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [loginLockoutSeconds]);

  const roleSlug: AdminRoleSlug | null = adminProfile?.role?.slug ?? null;
  const isAuthenticatedAdmin = Boolean(session && adminProfile && adminProfile.is_active);
  const isDashboardAccessGranted = isAuthenticatedAdmin;

  const isSuperAdmin = isDashboardAccessGranted && roleSlug === 'super_admin';
  const canPublishOrDelete =
    isDashboardAccessGranted && (roleSlug === 'super_admin' || roleSlug === 'content_admin');
  const canManageAdmins = isSuperAdmin;
  const canEditContent =
    isDashboardAccessGranted &&
    (roleSlug === 'super_admin' || roleSlug === 'content_admin' || roleSlug === 'editor');

  const signOut = useCallback(
    async (reason: 'USER_LOGOUT' | 'SESSION_TIMEOUT' = 'USER_LOGOUT') => {
      if (!supabase) return;
      const currentProfile = adminProfileRef.current;
      if (currentProfile) {
        try {
          await logAdminActivity({
            adminId: currentProfile.id,
            adminEmail: currentProfile.email,
            adminName: currentProfile.full_name,
            action: reason === 'SESSION_TIMEOUT' ? 'SESSION_TIMEOUT' : 'LOGOUT',
            entityType: 'admin_session',
            entityId: currentProfile.id,
            entityLabel:
              reason === 'SESSION_TIMEOUT'
                ? `${currentProfile.full_name} auto-logged out due to inactivity`
                : `${currentProfile.full_name} signed out`,
            outcome: reason === 'SESSION_TIMEOUT' ? 'blocked' : 'success',
          });
        } catch {
          // Ignore audit failure on sign-out
        }
      }
      await supabase.auth.signOut();
      commitAdminProfile(null);
      commitSession(null);
      setAuthError(null);
      setIsRecoveryMode(false);
      setProfileVerifying(false);
      setLoading(false);
    },
    [commitAdminProfile, commitSession]
  );

  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleRemainingSeconds(INACTIVITY_TIMEOUT_SECONDS);
  }, []);

  // Strict inactivity expiration when dashboard is active
  useEffect(() => {
    if (!isDashboardAccessGranted) {
      lastActivityRef.current = Date.now();
      setIdleRemainingSeconds(INACTIVITY_TIMEOUT_SECONDS);
      return;
    }

    lastActivityRef.current = Date.now();
    setIdleRemainingSeconds(INACTIVITY_TIMEOUT_SECONDS);

    let lastRecorded = Date.now();
    const recordActivity = () => {
      const now = Date.now();
      if (now - lastRecorded > 1000) {
        lastRecorded = now;
        lastActivityRef.current = now;
        setIdleRemainingSeconds(INACTIVITY_TIMEOUT_SECONDS);
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((evt) => window.addEventListener(evt, recordActivity, { passive: true }));

    const interval = window.setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, INACTIVITY_TIMEOUT_SECONDS - elapsedSec);
      setIdleRemainingSeconds(remaining);
      if (remaining === 0) {
        window.clearInterval(interval);
        void signOut('SESSION_TIMEOUT');
        if (mountedRef.current) {
          setAuthError('Your administrator session expired due to 15 minutes of inactivity.');
        }
      }
    }, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, recordActivity));
      window.clearInterval(interval);
    };
  }, [isDashboardAccessGranted, signOut]);

  const idleWarningActive =
    isDashboardAccessGranted &&
    idleRemainingSeconds > 0 &&
    idleRemainingSeconds <= INACTIVITY_WARNING_SECONDS;

  const signIn = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!supabase) {
      return {
        ok: false,
        error: 'Authentication service is not configured.',
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    const rateKey = `admin_login:${cleanEmail || 'unknown'}`;

    const clientCheck = checkClientRateLimit(rateKey);
    if (clientCheck.blocked) {
      setLoginLockoutSeconds(clientCheck.retryAfterSeconds);
      const msg = `Too many failed sign-in attempts. Please wait ${Math.ceil(clientCheck.retryAfterSeconds / 60)} minute(s) before retrying.`;
      setAuthError(msg);
      return { ok: false, error: msg };
    }

    const serverCheck = await checkServerLoginRateLimit(cleanEmail);
    if (serverCheck.blocked) {
      setLoginLockoutSeconds(serverCheck.retryAfterSeconds);
      const msg = `Account login temporarily locked due to repeated failed attempts. Retry in ${Math.ceil(serverCheck.retryAfterSeconds / 60)} minute(s).`;
      setAuthError(msg);
      return { ok: false, error: msg };
    }

    setAuthError(null);
    signingInRef.current = true;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error || !data.user || !data.session) {
        const clientRec = recordClientRateLimitEvent(rateKey, {
          maxAttempts: 5,
          windowMs: 15 * 60 * 1000,
          lockoutMs: 15 * 60 * 1000,
        });
        const serverRec = await recordServerLoginAttempt(
          cleanEmail,
          false,
          error?.message?.slice(0, 60) || 'invalid_credentials'
        );

        const retrySec = Math.max(clientRec.retryAfterSeconds, serverRec.retryAfterSeconds);
        if (retrySec > 0) {
          setLoginLockoutSeconds(retrySec);
          const lockMsg = `Too many failed sign-in attempts. Login is temporarily locked for ${Math.ceil(retrySec / 60)} minute(s).`;
          setAuthError(lockMsg);
          return { ok: false, error: lockMsg };
        }

        // Progressive delay on failed attempt (anti-brute-force)
        const delayMs = Math.min(1800, 350 * Math.max(1, clientRec.attemptsInWindow));
        await new Promise((r) => setTimeout(r, delayMs));

        setAuthError(GENERIC_LOGIN_ERROR);
        return { ok: false, error: GENERIC_LOGIN_ERROR };
      }

      const { data: currentSessionData } = await supabase.auth.getSession();
      if (!currentSessionData.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      const lookup = await loadAdminProfile(data.user.id, data.session.access_token, {
        preserveOnTransientError: false,
        suppressAuthError: true,
      });

      if (!lookup.profile) {
        await supabase.auth.signOut();
        commitSession(null);
        commitAdminProfile(null);
        recordClientRateLimitEvent(rateKey);
        await recordServerLoginAttempt(
          cleanEmail,
          false,
          lookup.inactiveProfile ? 'inactive_admin' : 'missing_admin_profile'
        );
        setAuthError(GENERIC_LOGIN_ERROR);
        return { ok: false, error: GENERIC_LOGIN_ERROR };
      }

      clearClientRateLimit(rateKey);
      setLoginLockoutSeconds(0);

      commitSession(data.session);
      commitAdminProfile(lookup.profile);

      setAuthError(null);
      setProfileVerifying(false);
      setLoading(false);

      const profileSnapshot = lookup.profile;
      const sbClient = supabase;
      void (async () => {
        try {
          await sbClient
            .from('admin_profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', profileSnapshot.id);

          const serverRes = await recordServerLoginAttempt(cleanEmail, true);
          if (!serverRes) {
            await logAdminActivity({
              adminId: profileSnapshot.id,
              adminEmail: profileSnapshot.email,
              adminName: profileSnapshot.full_name,
              action: 'LOGIN_SUCCESS',
              entityType: 'admin_session',
              entityId: profileSnapshot.id,
              entityLabel: `${profileSnapshot.full_name} (${profileSnapshot.role?.slug || 'admin'}) authenticated`,
              outcome: 'success',
            });
          }
        } catch {
          // Non-blocking audit update
        }
      })();

      return { ok: true };
    } catch {
      setAuthError(GENERIC_LOGIN_ERROR);
      return { ok: false, error: GENERIC_LOGIN_ERROR };
    } finally {
      signingInRef.current = false;
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    if (!supabase) {
      return { ok: false, error: 'Authentication service is not configured.' };
    }
    const cleanEmail = email.trim().toLowerCase();
    const rateKey = `pwd_reset:${cleanEmail || 'unknown'}`;
    const check = checkClientRateLimit(rateKey, 15 * 60 * 1000);
    if (check.blocked) {
      return {
        ok: false,
        error: `Please wait ${Math.ceil(check.retryAfterSeconds / 60)} minute(s) before requesting another reset email.`,
      };
    }
    recordClientRateLimitEvent(rateKey, {
      maxAttempts: 3,
      windowMs: 15 * 60 * 1000,
      lockoutMs: 15 * 60 * 1000,
    });

    const redirectTo = `${window.location.origin}/admin/login`;
    await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
    // Generic response prevents email enumeration even on reset endpoints
    return { ok: true };
  };

  const updatePassword = async (newPassword: string): Promise<{ ok: boolean; error?: string }> => {
    if (!supabase) {
      return { ok: false, error: 'Authentication service is not configured.' };
    }
    const pwdCheck = validateStrongPassword(newPassword, user?.email);
    if (!pwdCheck.valid) {
      return { ok: false, error: pwdCheck.error || 'Password does not meet complexity rules.' };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return {
        ok: false,
        error: toSafeErrorMessage(error.message, 'Unable to update password.'),
      };
    }

    const prof = adminProfileRef.current;
    if (prof) {
      await logAdminActivity({
        adminId: prof.id,
        adminEmail: prof.email,
        adminName: prof.full_name,
        action: 'PASSWORD_CHANGE',
        entityType: 'admin_profile',
        entityId: prof.id,
        entityLabel: `${prof.full_name} updated account password`,
        outcome: 'success',
      }).catch(() => {});
    }

    setIsRecoveryMode(false);
    return { ok: true };
  };

  /**
   * Verify the currently signed-in administrator's password via direct GoTrue REST
   * endpoint so we do NOT disturb the active session listener on the shared client.
   */
  const reauthenticate = async (password: string): Promise<{ ok: boolean; error?: string }> => {
    const email = user?.email || adminProfileRef.current?.email;
    if (!email || !password) {
      return { ok: false, error: 'Enter your current password to confirm.' };
    }
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: supabasePublishableKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const prof = adminProfileRef.current;
        if (prof) {
          void logAdminActivity({
            adminId: prof.id,
            adminEmail: prof.email,
            adminName: prof.full_name,
            action: 'REAUTH_FAILED',
            entityType: 'admin_session',
            entityId: prof.id,
            entityLabel: 'Failed reauthentication challenge for sensitive operation',
            outcome: 'failure',
          }).catch(() => {});
        }
        return { ok: false, error: 'Incorrect current password.' };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Unable to verify credentials right now.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        adminProfile,
        roleSlug,
        loading,
        profileVerifying,
        authError,
        isRecoveryMode,
        isConfigured: isSupabaseConfigured,
        isAuthenticatedAdmin,
        isDashboardAccessGranted,
        isSuperAdmin,
        canPublishOrDelete,
        canManageAdmins,
        canEditContent,
        loginLockoutSeconds,
        idleRemainingSeconds,
        idleWarningActive,
        signIn,
        signOut,
        requestPasswordReset,
        updatePassword,
        reauthenticate,
        refreshProfile,
        extendSession,
        clearRecoveryMode: () => setIsRecoveryMode(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}

