import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { validateStrongPassword } from '../../../utils/security';

export const AccountSecuritySection: React.FC = () => {
  const {
    adminProfile,
    roleSlug,
    idleRemainingSeconds,
    updatePassword,
    reauthenticate,
    refreshProfile,
  } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const strength = validateStrongPassword(newPassword, adminProfile?.email);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!currentPassword) {
      setStatusMsg({ type: 'err', text: 'Enter your current password first.' });
      return;
    }
    if (!strength.valid) {
      setStatusMsg({ type: 'err', text: strength.error || 'Weak password rejected.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'err', text: 'New password and confirmation do not match.' });
      return;
    }

    setPwdSaving(true);
    const reauth = await reauthenticate(currentPassword);
    setCurrentPassword('');
    if (!reauth.ok) {
      setPwdSaving(false);
      setStatusMsg({ type: 'err', text: reauth.error || 'Current password verification failed.' });
      return;
    }

    const res = await updatePassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setPwdSaving(false);

    if (!res.ok) {
      setStatusMsg({ type: 'err', text: res.error || 'Password update failed.' });
      return;
    }

    setStatusMsg({ type: 'ok', text: 'Password updated successfully.' });
  };

  const idleMins = Math.floor(idleRemainingSeconds / 60);
  const idleSecs = String(idleRemainingSeconds % 60).padStart(2, '0');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Account Security</h2>
        <p className="text-xs text-slate-500">
          Manage your active session status and strong administrator password policy.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMsg.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Active Session Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Active Security Session</h3>
          </div>
          <button
            type="button"
            onClick={() => void refreshProfile()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-verify Session</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500">Signed-In Administrator</div>
            <div className="font-bold text-slate-900 mt-0.5 truncate">{adminProfile?.full_name}</div>
            <div className="text-[11px] text-slate-600 truncate">{adminProfile?.email}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500">Role &amp; Storage Mode</div>
            <div className="font-bold text-slate-900 mt-0.5 uppercase">{roleSlug?.replace('_', ' ')}</div>
            <div className="text-[11px] text-emerald-700">Session-Only (Browser Exit Clears)</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Inactivity Timeout</span>
            </div>
            <div className="font-mono font-bold text-slate-900 mt-0.5">
              {idleMins}:{idleSecs} remaining
            </div>
            <div className="text-[11px] text-slate-600">Auto-logout after 15m idle</div>
          </div>
        </div>
      </div>

      {/* Strong Password Rotation */}
      <form
        onSubmit={handlePasswordChange}
        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4"
      >
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-700" />
            <span>Update Administrator Password</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Requires current password verification and minimum 12-character strong complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Strong Password
            </label>
            <input
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
            <span className={strength.checks.minLength ? 'text-emerald-700 font-semibold' : ''}>
              12+ chars
            </span>
            <span className={strength.checks.hasUpper ? 'text-emerald-700 font-semibold' : ''}>
              Uppercase
            </span>
            <span className={strength.checks.hasLower ? 'text-emerald-700 font-semibold' : ''}>
              Lowercase
            </span>
            <span className={strength.checks.hasDigit ? 'text-emerald-700 font-semibold' : ''}>
              Digit
            </span>
            <span className={strength.checks.hasSpecial ? 'text-emerald-700 font-semibold' : ''}>
              Symbol
            </span>
          </div>

          <button
            type="submit"
            disabled={pwdSaving || !strength.valid}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
          >
            {pwdSaving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
};
