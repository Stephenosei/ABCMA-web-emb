import React, { useState } from 'react';
import { ShieldAlert, Lock, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ReauthModalProps {
  isOpen: boolean;
  actionTitle: string;
  actionDescription: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export const ReauthModal: React.FC<ReauthModalProps> = ({
  isOpen,
  actionTitle,
  actionDescription,
  onConfirm,
  onClose,
}) => {
  const { reauthenticate, extendSession } = useAuth();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Enter your current administrator password to authorize this action.');
      return;
    }

    setSubmitting(true);
    const check = await reauthenticate(password);
    setPassword('');

    if (!check.ok) {
      setSubmitting(false);
      setError(check.error || 'Reauthentication failed.');
      return;
    }

    extendSession();
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete action.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold">Verify Administrator Identity</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setPassword('');
              setError(null);
              onClose();
            }}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
            <div className="font-bold">{actionTitle}</div>
            <p className="text-[11px] text-amber-900 leading-relaxed">{actionDescription}</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Re-enter your current password"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setPassword('');
                setError(null);
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Verifying...' : 'Confirm & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
