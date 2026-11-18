import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onNavigatePublic: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onNavigatePublic,
  onLoginSuccess,
}) => {
  const {
    signIn,
    requestPasswordReset,
    updatePassword,
    isRecoveryMode,
    isConfigured,
    authError,
    loading,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (!email.trim() || !password) {
      setFeedbackError('Enter both your authorized administrator email and password.');
      return;
    }

    setSubmitting(true);
    const res = await signIn(email, password);
    setSubmitting(false);

    if (!res.ok) {
      setFeedbackError(res.error || 'Authentication failed.');
      return;
    }

    onLoginSuccess();
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (!email.trim()) {
      setFeedbackError('Enter your registered administrator email address.');
      return;
    }

    setSubmitting(true);
    const res = await requestPasswordReset(email);
    setSubmitting(false);

    if (!res.ok) {
      setFeedbackError(res.error || 'Unable to send password reset email.');
      return;
    }

    setFeedbackSuccess(
      'Password reset instructions have been dispatched to your email if the address is registered in ABCMA Supabase Auth.'
    );
  };

  const handleRecoveryUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (newPassword.length < 8) {
      setFeedbackError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setFeedbackError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const res = await updatePassword(newPassword);
    setSubmitting(false);

    if (!res.ok) {
      setFeedbackError(res.error || 'Failed to update password.');
      return;
    }

    setFeedbackSuccess('Your administrator password has been updated. Redirecting to dashboard...');
    setTimeout(() => {
      onLoginSuccess();
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Back to Public Site */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigatePublic}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Website</span>
          </button>

          <span className="text-[11px] font-mono text-slate-500">/admin/login</span>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-6 py-6 bg-slate-900 text-white border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-white border border-emerald-500/40 overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src="/assets/aistudio/abcma_logo_74f7cef4.jpeg"
                  alt="ABCMA Official Crest"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain scale-[1.42]"
                />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Ablekuma Central Municipal Assembly
                </div>
                <h1 className="text-lg font-bold tracking-tight text-white">
                  CMS & Administration Portal
                </h1>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Environment Warning when Supabase isn't connected */}
            {!isConfigured && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Supabase Configuration Required</span>
                </div>
                <p className="leading-relaxed text-amber-900">
                  Supabase authentication is disabled because{' '}
                  <code className="font-mono bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
                  <code className="font-mono bg-amber-100 px-1 rounded">VITE_SUPABASE_PUBLISHABLE_KEY</code>{' '}
                  (or <code className="font-mono bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>) are
                  not configured in this environment.
                </p>
                <p className="text-[11px] text-amber-800">
                  Set both variables in Vercel Project Settings or <code className="font-mono">.env.local</code>, apply the SQL migrations in <code className="font-mono">supabase/migrations/</code>, and bootstrap your initial Super Administrator account.
                </p>
              </div>
            )}

            {(feedbackError || authError) && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{feedbackError || authError}</span>
              </div>
            )}

            {feedbackSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                <span>{feedbackSuccess}</span>
              </div>
            )}

            {isRecoveryMode ? (
              <form onSubmit={handleRecoveryUpdate} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-700" />
                    <span>Set New Administrator Password</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enter a strong new password for your ABCMA administrator account.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !isConfigured}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            ) : mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@abcma.gov.gh"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setFeedbackError(null);
                        setFeedbackSuccess(null);
                      }}
                      className="text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-9 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || loading || !isConfigured}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Verifying Credentials...' : 'Sign In to Admin Dashboard'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-slate-900">
                    Reset Administrator Password
                  </h2>
                  <p className="text-xs text-slate-500">
                    A secure Supabase recovery link will be sent to your authorized email.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Authorized Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@abcma.gov.gh"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !isConfigured}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Sending Recovery Link...' : 'Send Password Reset Email'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setFeedbackError(null);
                    setFeedbackSuccess(null);
                  }}
                  className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Return to Login
                </button>
              </form>
            )}

            {/* Security Notice (No Public Signup) */}
            <div className="pt-4 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Restricted official system. Public self-registration is disabled. Access is enforced via Supabase Row Level Security (RLS) for authorized Super Administrators, Content Administrators, and Editors only.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
