import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ScrollText, UserPlus, Search, Lock, Trash2 } from 'lucide-react';
import { supabase, logAdminActivity } from '../../../lib/supabase';
import { AdminProfile, AdminRole, CmsActivityLog } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { ReauthModal } from '../ReauthModal';
import { sanitizePlainText, toSafeErrorMessage } from '../../../utils/security';

interface AdminsAndLogsManagerProps {
  mode: 'admins' | 'logs';
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PendingReauthAction =
  | {
      type: 'role';
      targetAdmin: AdminProfile;
      nextRoleId: string;
      nextRoleName: string;
    }
  | {
      type: 'toggle_active';
      targetAdmin: AdminProfile;
      nextState: boolean;
    }
  | {
      type: 'delete_admin';
      targetAdmin: AdminProfile;
    }
  | {
      type: 'create_admin';
      payload: {
        id: string;
        email: string;
        full_name: string;
        department: string;
        role_id: string;
      };
    };

export const AdminsAndLogsManager: React.FC<AdminsAndLogsManagerProps> = ({ mode, notify }) => {
  const { adminProfile, isSuperAdmin } = useAuth();

  // Admin accounts state
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    id: '',
    email: '',
    full_name: '',
    department: 'Management Information Systems (MIS)',
    role_id: '',
  });
  const [pendingAction, setPendingAction] = useState<PendingReauthAction | null>(null);

  // Activity logs state
  const [logs, setLogs] = useState<CmsActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logSearch, setLogSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'success' | 'failure' | 'blocked'>('all');
  const [expandedLog, setExpandedLog] = useState<CmsActivityLog | null>(null);

  const loadAdmins = useCallback(async () => {
    if (!supabase || !isSuperAdmin) {
      setLoadingAdmins(false);
      return;
    }
    setLoadingAdmins(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase
        .from('admin_profiles')
        .select('*, role:admin_roles(*)')
        .order('created_at', { ascending: true }),
      supabase.from('admin_roles').select('*').order('slug', { ascending: true }),
    ]);

    if (profilesRes.error) {
      notify(toSafeErrorMessage(profilesRes.error.message, 'Failed to load administrator accounts.'), 'error');
    } else if (profilesRes.data) {
      setAdmins(profilesRes.data as unknown as AdminProfile[]);
    }

    if (rolesRes.data) {
      const roleRows = rolesRes.data as AdminRole[];
      setRoles(roleRows);
      setNewAdminForm((prev) => ({
        ...prev,
        role_id: prev.role_id || roleRows.find((r) => r.slug === 'editor')?.id || roleRows[0]?.id || '',
      }));
    }
    setLoadingAdmins(false);
  }, [isSuperAdmin, notify]);

  const loadLogs = useCallback(async () => {
    if (!supabase || !isSuperAdmin) {
      setLoadingLogs(false);
      return;
    }
    setLoadingLogs(true);
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      notify(toSafeErrorMessage(error.message, 'Failed to load audit logs.'), 'error');
    } else if (data) {
      setLogs(data as CmsActivityLog[]);
    }
    setLoadingLogs(false);
  }, [isSuperAdmin, notify]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoadingAdmins(false);
      setLoadingLogs(false);
      return;
    }
    if (mode === 'admins') loadAdmins();
    else loadLogs();
  }, [mode, isSuperAdmin, loadAdmins, loadLogs]);

  if (!isSuperAdmin) {
    return (
      <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
        <Lock className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-sm">Super Administrator Privileges Required</div>
          <p className="leading-relaxed">
            Administrator account management and security audit trails are strictly restricted to active Super Administrators with verified Multi-Factor Authentication.
          </p>
        </div>
      </div>
    );
  }

  const activeSuperAdminCount = admins.filter(
    (a) => a.is_active && a.role?.slug === 'super_admin'
  ).length;

  const requestRoleChange = (targetAdmin: AdminProfile, nextRoleId: string) => {
    if (targetAdmin.id === adminProfile?.id) {
      notify('You cannot change your own role from this panel.', 'error');
      return;
    }
    const targetIsSuper = targetAdmin.role?.slug === 'super_admin' && targetAdmin.is_active;
    const nextRoleObj = roles.find((r) => r.id === nextRoleId);
    if (targetIsSuper && nextRoleObj?.slug !== 'super_admin' && activeSuperAdminCount <= 1) {
      notify('At least one active Super Administrator must remain on the system.', 'error');
      return;
    }
    setPendingAction({
      type: 'role',
      targetAdmin,
      nextRoleId,
      nextRoleName: nextRoleObj?.name || nextRoleId,
    });
  };

  const requestToggleActive = (targetAdmin: AdminProfile) => {
    if (targetAdmin.id === adminProfile?.id) {
      notify('You cannot suspend your own active Super Administrator account.', 'error');
      return;
    }
    const nextState = !targetAdmin.is_active;
    if (!nextState && targetAdmin.role?.slug === 'super_admin' && activeSuperAdminCount <= 1) {
      notify('You cannot suspend the last active Super Administrator.', 'error');
      return;
    }
    setPendingAction({
      type: 'toggle_active',
      targetAdmin,
      nextState,
    });
  };

  const requestDeleteAdmin = (targetAdmin: AdminProfile) => {
    if (targetAdmin.id === adminProfile?.id) {
      notify('You cannot delete your own active administrator account.', 'error');
      return;
    }
    if (targetAdmin.is_active && targetAdmin.role?.slug === 'super_admin' && activeSuperAdminCount <= 1) {
      notify('You cannot delete the last active Super Administrator.', 'error');
      return;
    }
    setPendingAction({
      type: 'delete_admin',
      targetAdmin,
    });
  };

  const handleLinkNewAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newAdminForm.id.trim();
    const cleanEmail = newAdminForm.email.trim().toLowerCase();
    const cleanName = sanitizePlainText(newAdminForm.full_name, 120);
    const cleanDept = sanitizePlainText(newAdminForm.department, 120);

    if (!UUID_REGEX.test(cleanId)) {
      notify('Enter a valid Supabase Auth User UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).', 'error');
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      notify('Enter a valid official administrator email address.', 'error');
      return;
    }
    if (!cleanName || cleanName.length < 3) {
      notify('Administrator full name must be at least 3 characters.', 'error');
      return;
    }
    if (!newAdminForm.role_id) {
      notify('Select an administrator role.', 'error');
      return;
    }

    setPendingAction({
      type: 'create_admin',
      payload: {
        id: cleanId,
        email: cleanEmail,
        full_name: cleanName,
        department: cleanDept || 'Administration',
        role_id: newAdminForm.role_id,
      },
    });
  };

  const executePendingAction = async () => {
    if (!pendingAction || !supabase || !adminProfile) return;

    if (pendingAction.type === 'role') {
      const { targetAdmin, nextRoleId, nextRoleName } = pendingAction;
      const { error } = await supabase
        .from('admin_profiles')
        .update({ role_id: nextRoleId })
        .eq('id', targetAdmin.id);
      if (error) {
        throw new Error(toSafeErrorMessage(error.message, 'Failed to change administrator role.'));
      }
      await logAdminActivity({
        adminId: adminProfile.id,
        adminEmail: adminProfile.email,
        adminName: adminProfile.full_name,
        action: 'CHANGE_ADMIN_ROLE',
        entityType: 'admin_profiles',
        entityId: targetAdmin.id,
        entityLabel: `${targetAdmin.full_name} -> ${nextRoleName}`,
        outcome: 'success',
        previousValues: { role: targetAdmin.role?.name },
        updatedValues: { role: nextRoleName },
      });
      notify(`Updated role for ${targetAdmin.full_name} to ${nextRoleName}.`);
      await loadAdmins();
      return;
    }

    if (pendingAction.type === 'toggle_active') {
      const { targetAdmin, nextState } = pendingAction;
      const { error } = await supabase
        .from('admin_profiles')
        .update({ is_active: nextState })
        .eq('id', targetAdmin.id);
      if (error) {
        throw new Error(toSafeErrorMessage(error.message, 'Failed to update account status.'));
      }
      await logAdminActivity({
        adminId: adminProfile.id,
        adminEmail: adminProfile.email,
        adminName: adminProfile.full_name,
        action: nextState ? 'ACTIVATE_ADMIN' : 'SUSPEND_ADMIN',
        entityType: 'admin_profiles',
        entityId: targetAdmin.id,
        entityLabel: targetAdmin.email,
        outcome: 'success',
        previousValues: { is_active: targetAdmin.is_active },
        updatedValues: { is_active: nextState },
      });
      notify(`${targetAdmin.full_name} marked as ${nextState ? 'Active' : 'Suspended'}.`);
      await loadAdmins();
      return;
    }

    if (pendingAction.type === 'delete_admin') {
      const { targetAdmin } = pendingAction;
      const { error } = await supabase
        .from('admin_profiles')
        .delete()
        .eq('id', targetAdmin.id);
      if (error) {
        throw new Error(toSafeErrorMessage(error.message, 'Failed to remove administrator profile.'));
      }
      await logAdminActivity({
        adminId: adminProfile.id,
        adminEmail: adminProfile.email,
        adminName: adminProfile.full_name,
        action: 'DELETE_ADMIN_PROFILE',
        entityType: 'admin_profiles',
        entityId: targetAdmin.id,
        entityLabel: `${targetAdmin.full_name} (${targetAdmin.email})`,
        outcome: 'success',
        previousValues: { email: targetAdmin.email, role: targetAdmin.role?.slug },
      });
      notify(`Removed administrator authorization for ${targetAdmin.full_name}.`);
      await loadAdmins();
      return;
    }

    if (pendingAction.type === 'create_admin') {
      const { payload } = pendingAction;
      const { error } = await supabase.from('admin_profiles').insert({
        ...payload,
        is_active: true,
      });
      if (error) {
        throw new Error(toSafeErrorMessage(error.message, 'Failed to authorize new administrator.'));
      }
      const roleObj = roles.find((r) => r.id === payload.role_id);
      await logAdminActivity({
        adminId: adminProfile.id,
        adminEmail: adminProfile.email,
        adminName: adminProfile.full_name,
        action: 'CREATE_ADMIN_PROFILE',
        entityType: 'admin_profiles',
        entityId: payload.id,
        entityLabel: `${payload.full_name} (${payload.email})`,
        outcome: 'success',
        updatedValues: { role: roleObj?.slug || payload.role_id },
      });
      notify(`Authorized administrator profile created for ${payload.full_name}.`);
      setNewAdminForm((prev) => ({ ...prev, id: '', email: '', full_name: '' }));
      setShowAddAdmin(false);
      await loadAdmins();
    }
  };

  const getReauthCopy = (): { title: string; description: string } => {
    if (!pendingAction) return { title: '', description: '' };
    switch (pendingAction.type) {
      case 'role':
        return {
          title: `Change Role for ${pendingAction.targetAdmin.full_name}`,
          description: `Assigning "${pendingAction.nextRoleName}" changes privilege boundaries immediately. Re-enter your password to confirm.`,
        };
      case 'toggle_active':
        return {
          title: `${pendingAction.nextState ? 'Activate' : 'Suspend'} ${pendingAction.targetAdmin.full_name}`,
          description: pendingAction.nextState
            ? 'Reactivating restores CMS portal access for this administrator.'
            : 'Suspending immediately blocks login and CMS writes for this administrator.',
        };
      case 'delete_admin':
        return {
          title: `Remove Admin Authorization: ${pendingAction.targetAdmin.full_name}`,
          description: 'This revokes all CMS access by deleting their admin_profiles record. Re-enter your password to authorize.',
        };
      case 'create_admin':
        return {
          title: `Authorize New Administrator (${pendingAction.payload.email})`,
          description: 'Granting CMS privileges creates an active admin profile. Confirm with your Super Administrator password.',
        };
    }
  };

  if (mode === 'admins') {
    const reauthCopy = getReauthCopy();

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <span>Administrator Accounts &amp; Roles</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Role-Based Access Control enforced via Supabase Row Level Security. Sensitive changes require password confirmation.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddAdmin(!showAddAdmin)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Authorize Admin User</span>
          </button>
        </div>

        {showAddAdmin && (
          <form
            onSubmit={handleLinkNewAdminSubmit}
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <div className="text-xs text-slate-600 leading-relaxed">
              First create the staff member&apos;s user account inside <strong>Supabase Dashboard &rarr; Authentication &rarr; Users &rarr; Add User</strong>, copy their <strong>User UID</strong>, and assign their ABCMA role below.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="text"
                required
                value={newAdminForm.id}
                onChange={(e) => setNewAdminForm((p) => ({ ...p, id: e.target.value }))}
                placeholder="Auth User UUID"
                className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
              <input
                type="email"
                required
                value={newAdminForm.email}
                onChange={(e) => setNewAdminForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email address"
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                required
                value={newAdminForm.full_name}
                onChange={(e) => setNewAdminForm((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Full Name"
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                value={newAdminForm.department}
                onChange={(e) => setNewAdminForm((p) => ({ ...p, department: e.target.value }))}
                placeholder="Department"
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <select
                value={newAdminForm.role_id}
                onChange={(e) => setNewAdminForm((p) => ({ ...p, role_id: e.target.value }))}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddAdmin(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Authorize Admin
              </button>
            </div>
          </form>
        )}

        {/* Role Permissions Reference */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
              <div className="text-xs font-bold text-slate-900">{role.name}</div>
              <div className="text-[11px] font-mono text-emerald-800">{role.slug}</div>
              <p className="text-xs text-slate-600 leading-relaxed">{role.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loadingAdmins ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading administrator accounts...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Administrator</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.map((adm) => {
                    const isSelf = adm.id === adminProfile?.id;
                    const isLastActiveSuper =
                      adm.is_active && adm.role?.slug === 'super_admin' && activeSuperAdminCount <= 1;
                    return (
                      <tr key={adm.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {adm.full_name} {isSelf && <span className="text-[10px] font-mono text-emerald-700">(You)</span>}
                          </div>
                          <div className="text-[11px] text-slate-500">{adm.email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{adm.department || '—'}</td>
                        <td className="py-3 px-4">
                          {!isSelf ? (
                            <select
                              value={adm.role_id}
                              disabled={isLastActiveSuper}
                              onChange={(e) => requestRoleChange(adm, e.target.value)}
                              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white disabled:opacity-50"
                            >
                              {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-semibold text-slate-800">{adm.role?.name}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-semibold ${
                              adm.is_active ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {adm.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                          {adm.last_login_at ? new Date(adm.last_login_at).toLocaleString() : 'Never'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {!isSelf && (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isLastActiveSuper}
                                onClick={() => requestToggleActive(adm)}
                                className="px-2.5 py-1 text-[11px] font-semibold border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer disabled:opacity-40"
                              >
                                {adm.is_active ? 'Suspend' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                disabled={isLastActiveSuper}
                                onClick={() => requestDeleteAdmin(adm)}
                                title="Remove administrator"
                                className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer disabled:opacity-40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ReauthModal
          isOpen={Boolean(pendingAction)}
          actionTitle={reauthCopy.title}
          actionDescription={reauthCopy.description}
          onConfirm={executePendingAction}
          onClose={() => setPendingAction(null)}
        />
      </div>
    );
  }

  // -------------------- ACTIVITY LOGS MODE --------------------
  const filteredLogs = logs.filter((l) => {
    const rowOutcome = l.outcome || 'success';
    if (outcomeFilter !== 'all' && rowOutcome !== outcomeFilter) return false;
    const q = logSearch.trim().toLowerCase();
    return (
      !q ||
      l.action.toLowerCase().includes(q) ||
      l.admin_name.toLowerCase().includes(q) ||
      l.admin_email.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      l.entity_label.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-emerald-700" />
          <span>Administrative Activity Audit Logs</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable, append-only audit trail recording logins, reauthentication checks, lockouts, role changes, uploads, and CMS edits.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Filter by admin, action, or content..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value as typeof outcomeFilter)}
            className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success Only</option>
            <option value="failure">Failures Only</option>
            <option value="blocked">Blocked / Lockouts</option>
          </select>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {filteredLogs.length} event(s)
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loadingLogs ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            No administrative actions recorded matching your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">Content Affected</th>
                  <th className="py-3 px-4 text-right">Diff / Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const outcome = log.outcome || 'success';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{log.admin_name}</div>
                        <div className="text-[11px] text-slate-500">{log.admin_email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-800 whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            outcome === 'blocked'
                              ? 'bg-amber-100 text-amber-900'
                              : outcome === 'failure'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {outcome}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{log.entity_label}</div>
                        <div className="text-[11px] font-mono text-slate-500">{log.entity_type}</div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {log.previous_values || log.updated_values || log.metadata ? (
                          <button
                            type="button"
                            onClick={() => setExpandedLog(log)}
                            className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
                          >
                            Inspect Values
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {expandedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Audit Diff · {expandedLog.action}
              </h3>
              <button
                type="button"
                onClick={() => setExpandedLog(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>

            {expandedLog.previous_values && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-600 uppercase">Previous Values</div>
                <pre className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(expandedLog.previous_values, null, 2)}
                </pre>
              </div>
            )}

            {expandedLog.updated_values && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-emerald-800 uppercase">Updated Values</div>
                <pre className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(expandedLog.updated_values, null, 2)}
                </pre>
              </div>
            )}

            {expandedLog.metadata && (
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-slate-600 uppercase">Event Metadata</div>
                <pre className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(expandedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

