import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, logAdminActivity } from '../lib/supabase';
import { supabaseUrl, supabasePublishableKey } from '../lib/supabaseClient.js';
import { AdminProfile, AdminRole, AdminRoleSlug } from '../types/cms';

export interface PendingSetupUser {
  id: string;
  email: string;
}

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
  pendingSetupUser: PendingSetupUser | null;
  isRecoveryMode: boolean;
  isConfigured: boolean;
  isAuthenticatedAdmin: boolean;
  isSuperAdmin: boolean;
  canPublishOrDelete: boolean;
  canManageAdmins: boolean;
  canEditContent: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
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
  const [pendingSetupUser, setPendingSetupUser] = useState<PendingSetupUser | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(false);

  const mountedRef = useRef<boolean>(true);
  const signingInRef = useRef<boolean>(false);
  const sessionRef = useRef<Session | null>(null);
  const adminProfileRef = useRef<AdminProfile | null>(null);
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
      options?: { preserveOnTransientError?: boolean }
    ): Promise<ProfileLookupResult> => {
      if (!supabase) {
        return {
          profile: null,
          errorMessage: 'Supabase client is not configured.',
          missingProfile: false,
        };
      }

      // Deduplicate concurrent lookups for the same user ID
      if (inFlightProfileRef.current && inFlightProfileRef.current.userId === userId) {
        return inFlightProfileRef.current.promise;
      }

      const executeLookup = async (): Promise<ProfileLookupResult> => {
        const sb = supabase;
        if (!sb) {
          return {
            profile: null,
            errorMessage: 'Supabase client is not configured.',
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

        // Step 1: Try querying admin_profiles joined with admin_roles using the Supabase client
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

        // Step 2: If the embedded join errored or returned empty, query admin_profiles directly
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

        // Step 3: If client returned no row (or errored) and we have a JWT, query directly with Bearer JWT
        if (!profileRow && token) {
          const directRes = await fetchProfileWithExplicitJwt(userId, token);
          if (directRes.error) {
            queryErrorMsg = directRes.error;
          } else if (directRes.row) {
            queryErrorMsg = null;
            profileRow = directRes.row as unknown as AdminProfile;
          } else {
            // HTTP 200 with empty result confirms no profile exists
            queryErrorMsg = null;
          }
        }

        if (queryErrorMsg) {
          const msg = `Unable to verify administrator profile: ${queryErrorMsg}`;
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
            setAuthError(msg);
            commitAdminProfile(null);
          }
          return {
            profile: null,
            errorMessage: msg,
            missingProfile: false,
            transientError: true,
          };
        }

        if (!profileRow) {
          const msg =
            'Your email and password are valid in Supabase Auth, but no matching administrator profile was found in public.admin_profiles.';
          if (mountedRef.current) {
            setAuthError(msg);
            commitAdminProfile(null);
          }
          return { profile: null, errorMessage: msg, missingProfile: true };
        }

        if (!profileRow.is_active) {
          const msg =
            'Your administrator account is inactive or suspended. Contact a Super Administrator.';
          if (mountedRef.current) {
            setAuthError(msg);
            commitAdminProfile(null);
          }
          return {
            profile: null,
            errorMessage: msg,
            missingProfile: false,
            inactiveProfile: true,
          };
        }

        // Step 4: Normalize or fetch the corresponding role from public.admin_roles
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
                const msg = `Unable to load administrator role: ${directRole.error}`;
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
                  setAuthError(msg);
                  commitAdminProfile(null);
                }
                return { profile: null, errorMessage: msg, missingProfile: false, transientError: true };
              }
            } else if (roleRes.error) {
              const msg = `Unable to load administrator role: ${roleRes.error.message}`;
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
                setAuthError(msg);
                commitAdminProfile(null);
              }
              return { profile: null, errorMessage: msg, missingProfile: false, transientError: true };
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unable to load administrator role.';
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
              setAuthError(`Unable to load administrator role: ${msg}`);
              commitAdminProfile(null);
            }
            return { profile: null, errorMessage: msg, missingProfile: false, transientError: true };
          }
        }

        if (!resolvedRole) {
          const msg =
            'Administrator role record could not be retrieved from public.admin_roles. Verify RLS policies and role assignment.';
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
            setAuthError(msg);
            commitAdminProfile(null);
          }
          return { profile: null, errorMessage: msg, missingProfile: false };
        }

        const fullProfile: AdminProfile = {
          ...profileRow,
          role: resolvedRole,
        };

        if (mountedRef.current) {
          setAuthError(null);
          setPendingSetupUser(null);
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
          setAuthError(err instanceof Error ? err.message : 'Unable to restore session.');
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

    // Keep callback synchronous so Supabase's internal auth state never deadlocks.
    const { data: listener } = sb.auth.onAuthStateChange((event, nextSession) => {
      if (!mountedRef.current) return;

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }

      if (signingInRef.current) {
        return;
      }

      // Let initSession() own the initial hydration so loading never drops prematurely.
      if (event === 'INITIAL_SESSION' && !initialFinished) {
        return;
      }

      if (event === 'SIGNED_OUT' || !nextSession?.user) {
        if (event === 'SIGNED_OUT' || initialFinished) {
          commitSession(null);
          commitAdminProfile(null);
          setPendingSetupUser(null);
          setProfileVerifying(false);
          setLoading(false);
        }
        return;
      }

      // Update active session & user cleanly
      commitSession(nextSession);

      const uid = nextSession.user.id;
      const token = nextSession.access_token;
      const alreadyVerifiedSameUser =
        adminProfileRef.current?.id === uid && adminProfileRef.current.is_active;

      // On token refresh or redundant event for the same already-verified active admin,
      // preserve the active dashboard without resetting profile or toggling loading.
      if (event === 'TOKEN_REFRESHED' && alreadyVerifiedSameUser) {
        return;
      }

      if (alreadyVerifiedSameUser) {
        setTimeout(() => {
          if (!mountedRef.current || signingInRef.current) return;
          void loadAdminProfile(uid, token, { preserveOnTransientError: true });
        }, 0);
        return;
      }

      // Verify profile for newly authenticated / restored session without treating loading as logged-out
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

  const signIn = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!supabase) {
      return {
        ok: false,
        error:
          'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY) are not configured.',
      };
    }

    setAuthError(null);
    setPendingSetupUser(null);
    signingInRef.current = true;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError(error.message);
        return { ok: false, error: error.message };
      }

      if (!data.user || !data.session) {
        const msg = 'Authentication failed. No user session was returned by Supabase.';
        setAuthError(msg);
        return { ok: false, error: msg };
      }

      // Ensure the Supabase client session store holds the fresh session before querying RLS tables
      const { data: currentSessionData } = await supabase.auth.getSession();
      if (!currentSessionData.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      const lookup = await loadAdminProfile(data.user.id, data.session.access_token, {
        preserveOnTransientError: false,
      });
      if (!lookup.profile) {
        if (lookup.missingProfile) {
          setPendingSetupUser({
            id: data.user.id,
            email: data.user.email || email.trim(),
          });
        }
        await supabase.auth.signOut();
        commitSession(null);
        commitAdminProfile(null);
        const msg =
          lookup.errorMessage ||
          'Access denied. This account is not registered in admin_profiles or has been deactivated.';
        setAuthError(msg);
        return { ok: false, error: msg };
      }

      // Commit verified session + profile before returning so /admin never bounces back
      commitSession(data.session);
      commitAdminProfile(lookup.profile);
      setAuthError(null);
      setPendingSetupUser(null);
      setProfileVerifying(false);
      setLoading(false);

      // Record last login & audit entry asynchronously so navigation is immediate and non-blocking
      const profileSnapshot = lookup.profile;
      const sbClient = supabase;
      void (async () => {
        try {
          await sbClient
            .from('admin_profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', profileSnapshot.id);

          await logAdminActivity({
            adminId: profileSnapshot.id,
            adminEmail: profileSnapshot.email,
            adminName: profileSnapshot.full_name,
            action: 'LOGIN',
            entityType: 'admin_session',
            entityId: profileSnapshot.id,
            entityLabel: `${profileSnapshot.full_name} (${profileSnapshot.role?.slug || 'admin'}) signed in`,
          });
        } catch {
          // Non-blocking audit telemetry
        }
      })();

      return { ok: true };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unexpected error during administrator sign-in.';
      setAuthError(msg);
      return { ok: false, error: msg };
    } finally {
      signingInRef.current = false;
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    const currentProfile = adminProfileRef.current;
    if (currentProfile) {
      try {
        await logAdminActivity({
          adminId: currentProfile.id,
          adminEmail: currentProfile.email,
          adminName: currentProfile.full_name,
          action: 'LOGOUT',
          entityType: 'admin_session',
          entityId: currentProfile.id,
          entityLabel: `${currentProfile.full_name} signed out`,
        });
      } catch {
        // Ignore audit write failure on logout
      }
    }
    await supabase.auth.signOut();
    commitAdminProfile(null);
    commitSession(null);
    setAuthError(null);
    setPendingSetupUser(null);
    setIsRecoveryMode(false);
    setProfileVerifying(false);
    setLoading(false);
  };

  const requestPasswordReset = async (email: string): Promise<{ ok: boolean; error?: string }> => {
    if (!supabase) {
      return {
        ok: false,
        error:
          'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY first.',
      };
    }
    const redirectTo = `${window.location.origin}/admin/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  };

  const updatePassword = async (newPassword: string): Promise<{ ok: boolean; error?: string }> => {
    if (!supabase) {
      return { ok: false, error: 'Supabase is not configured.' };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { ok: false, error: error.message };
    }
    setIsRecoveryMode(false);
    return { ok: true };
  };

  const roleSlug: AdminRoleSlug | null = adminProfile?.role?.slug ?? null;
  const isAuthenticatedAdmin = Boolean(session && adminProfile && adminProfile.is_active);
  const isSuperAdmin = isAuthenticatedAdmin && roleSlug === 'super_admin';
  const canPublishOrDelete =
    isAuthenticatedAdmin && (roleSlug === 'super_admin' || roleSlug === 'content_admin');
  const canManageAdmins = isSuperAdmin;
  const canEditContent =
    isAuthenticatedAdmin &&
    (roleSlug === 'super_admin' || roleSlug === 'content_admin' || roleSlug === 'editor');

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
        pendingSetupUser,
        isRecoveryMode,
        isConfigured: isSupabaseConfigured,
        isAuthenticatedAdmin,
        isSuperAdmin,
        canPublishOrDelete,
        canManageAdmins,
        canEditContent,
        signIn,
        signOut,
        requestPasswordReset,
        updatePassword,
        refreshProfile,
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
