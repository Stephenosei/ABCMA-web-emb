import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, logAdminActivity } from '../lib/supabase';
import { AdminProfile, AdminRoleSlug } from '../types/cms';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  adminProfile: AdminProfile | null;
  roleSlug: AdminRoleSlug | null;
  loading: boolean;
  authError: string | null;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(false);

  const loadAdminProfile = useCallback(async (userId: string) => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*, role:admin_roles(*)')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      setAuthError(error.message);
      setAdminProfile(null);
      return null;
    }

    if (!data) {
      setAuthError('This account does not have an authorized ABCMA administrator profile.');
      setAdminProfile(null);
      return null;
    }

    if (!data.is_active) {
      setAuthError('Your administrator account has been suspended. Contact a Super Administrator.');
      setAdminProfile(null);
      return null;
    }

    setAuthError(null);
    const typed = data as unknown as AdminProfile;
    setAdminProfile(typed);
    return typed;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!supabase || !session?.user) return;
    await loadAdminProfile(session.user.id);
  }, [session, loadAdminProfile]);

  useEffect(() => {
    const sb = supabase;
    if (!sb) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const initSession = async () => {
      try {
        const { data } = await sb.auth.getSession();
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          await loadAdminProfile(data.session.user.id);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const { data: listener } = sb.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        await loadAdminProfile(nextSession.user.id);
      } else {
        setAdminProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadAdminProfile]);

  const signIn = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!supabase) {
      return {
        ok: false,
        error:
          'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY) are not configured.',
      };
    }

    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthError(error.message);
      return { ok: false, error: error.message };
    }

    if (!data.user) {
      return { ok: false, error: 'Authentication failed. No user session returned.' };
    }

    const profile = await loadAdminProfile(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error:
          'Access denied. This account is not registered in admin_profiles or has been deactivated.',
      };
    }

    await supabase
      .from('admin_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', profile.id);

    await logAdminActivity({
      adminId: profile.id,
      adminEmail: profile.email,
      adminName: profile.full_name,
      action: 'LOGIN',
      entityType: 'admin_session',
      entityId: profile.id,
      entityLabel: `${profile.full_name} (${profile.role?.slug || 'admin'}) signed in`,
    });

    return { ok: true };
  };

  const signOut = async () => {
    if (!supabase) return;
    if (adminProfile) {
      await logAdminActivity({
        adminId: adminProfile.id,
        adminEmail: adminProfile.email,
        adminName: adminProfile.full_name,
        action: 'LOGOUT',
        entityType: 'admin_session',
        entityId: adminProfile.id,
        entityLabel: `${adminProfile.full_name} signed out`,
      });
    }
    await supabase.auth.signOut();
    setAdminProfile(null);
    setSession(null);
    setUser(null);
    setAuthError(null);
    setIsRecoveryMode(false);
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
        authError,
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
