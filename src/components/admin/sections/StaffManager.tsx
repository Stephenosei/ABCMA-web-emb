import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Edit3, Trash2, Eye, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { supabase, logAdminActivity } from '../../../lib/supabase';
import { CmsStaffProfile, CmsDepartment } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { useCms } from '../../../context/CmsContext';
import { MediaPickerModal } from '../MediaPickerModal';
import { PreviewModal } from '../PreviewModal';
import { ConfirmDialog } from '../ConfirmDialog';

interface StaffManagerProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const EMPTY_FORM = {
  full_name: '',
  position_title: '',
  department_id: '',
  department_name: '',
  biography: '',
  photo_url: '',
  email: '',
  phone: '',
  is_management: true,
  is_public: true,
  display_order: 1,
  status: 'published' as 'draft' | 'published',
};

export const StaffManager: React.FC<StaffManagerProps> = ({ notify }) => {
  const { adminProfile, canPublishOrDelete } = useAuth();
  const { refreshPublicContent } = useCms();

  const [staff, setStaff] = useState<CmsStaffProfile[]>([]);
  const [departments, setDepartments] = useState<CmsDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    action: 'delete' | 'unpublish';
    person: CmsStaffProfile;
  } | null>(null);

  const loadData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [staffRes, deptRes] = await Promise.all([
      supabase.from('staff_profiles').select('*').order('display_order', { ascending: true }),
      supabase.from('departments').select('*').order('display_order', { ascending: true }),
    ]);
    if (staffRes.error) notify(staffRes.error.message, 'error');
    else if (staffRes.data) setStaff(staffRes.data as CmsStaffProfile[]);
    if (deptRes.data) setDepartments(deptRes.data as CmsDepartment[]);
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, display_order: staff.length + 1 });
    setFormOpen(true);
  };

  const handleOpenEdit = (person: CmsStaffProfile) => {
    setEditingId(person.id);
    setForm({
      full_name: person.full_name,
      position_title: person.position_title,
      department_id: person.department_id || '',
      department_name: person.department_name || '',
      biography: person.biography || '',
      photo_url: person.photo_url || '',
      email: person.email || '',
      phone: person.phone || '',
      is_management: person.is_management,
      is_public: person.is_public,
      display_order: person.display_order,
      status: person.status,
    });
    setFormOpen(true);
  };

  const savePerson = async (targetStatus: 'draft' | 'published') => {
    if (!supabase || !adminProfile) return;
    if (!form.full_name.trim() || !form.position_title.trim()) {
      notify('Full name and position title are required.', 'error');
      return;
    }
    if (targetStatus === 'published' && !canPublishOrDelete) {
      notify('Editors can save drafts only.', 'error');
      return;
    }

    setSaving(true);
    const matchedDept = departments.find((d) => d.id === form.department_id);
    const payload = {
      full_name: form.full_name.trim(),
      position_title: form.position_title.trim(),
      department_id: form.department_id || null,
      department_name: matchedDept ? matchedDept.name : form.department_name.trim() || null,
      biography: form.biography.trim(),
      photo_url: form.photo_url || null,
      email: form.email.trim(),
      phone: form.phone.trim(),
      is_management: form.is_management,
      is_public: form.is_public,
      display_order: Number(form.display_order) || 0,
      status: targetStatus,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('staff_profiles').update(payload).eq('id', editingId);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UPDATE_STAFF_PROFILE',
          entityType: 'staff_profiles',
          entityId: editingId,
          entityLabel: payload.full_name,
          updatedValues: { position: payload.position_title, is_public: payload.is_public, status: targetStatus },
        });
      } else {
        const { data, error } = await supabase.from('staff_profiles').insert(payload).select('id').single();
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'CREATE_STAFF_PROFILE',
          entityType: 'staff_profiles',
          entityId: data?.id || '',
          entityLabel: payload.full_name,
          updatedValues: { position: payload.position_title, status: targetStatus },
        });
      }
      notify(`Profile for "${payload.full_name}" saved (${targetStatus}).`);
      setFormOpen(false);
      await loadData();
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save staff profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget || !supabase || !adminProfile) return;
    const { action, person } = confirmTarget;
    setSaving(true);
    try {
      if (action === 'delete') {
        const { error } = await supabase.from('staff_profiles').delete().eq('id', person.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'DELETE_STAFF_PROFILE',
          entityType: 'staff_profiles',
          entityId: person.id,
          entityLabel: person.full_name,
        });
        notify(`Deleted profile "${person.full_name}".`);
      } else {
        const { error } = await supabase
          .from('staff_profiles')
          .update({ status: 'draft' })
          .eq('id', person.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UNPUBLISH_STAFF_PROFILE',
          entityType: 'staff_profiles',
          entityId: person.id,
          entityLabel: person.full_name,
        });
        notify(`Moved "${person.full_name}" back to draft.`);
      }
      setConfirmTarget(null);
      await loadData();
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Operation failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (formOpen) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {editingId ? 'Edit Management / Staff Profile' : 'Add Management / Staff Member'}
            </h1>
            <p className="text-xs text-slate-500">
              Control public visibility, department assignment, portrait photo, and official biography.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
          >
            Back to Staff Directory
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="e.g. Hon. Frank Nkansah"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Position / Rank *</label>
              <input
                type="text"
                value={form.position_title}
                onChange={(e) => setForm((prev) => ({ ...prev, position_title: e.target.value }))}
                placeholder="e.g. Municipal Coordinating Director"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department Assignment</label>
              <select
                value={form.department_id}
                onChange={(e) => setForm((prev) => ({ ...prev, department_id: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="">-- Executive / Custom Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Custom Department Label (if unlinked)
              </label>
              <input
                type="text"
                value={form.department_name}
                onChange={(e) => setForm((prev) => ({ ...prev, department_name: e.target.value }))}
                placeholder="e.g. Office of the MCE"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Photo */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {form.photo_url ? (
                <img
                  src={form.photo_url}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                </div>
              )}
              <div className="text-xs">
                <div className="font-semibold text-slate-800">Profile Photograph</div>
                <div className="text-[11px] text-slate-500">Recommended 3:4 or square headshot</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="px-3.5 py-2 bg-white border border-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Upload / Pick Photo
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Biography</label>
            <textarea
              rows={4}
              value={form.biography}
              onChange={(e) => setForm((prev) => ({ ...prev, biography: e.target.value }))}
              placeholder="Academic background, civil service experience, and statutory mandate..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-800">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_management}
                onChange={(e) => setForm((prev) => ({ ...prev, is_management: e.target.checked }))}
                className="w-4 h-4 accent-emerald-800"
              />
              <span>Senior Management Member</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm((prev) => ({ ...prev, is_public: e.target.checked }))}
                className="w-4 h-4 accent-emerald-800"
              />
              <span>Display on Public Website</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={() => savePerson('draft')}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
              >
                Save as Draft
              </button>
              {canPublishOrDelete && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => savePerson('published')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingId && form.status === 'published' ? 'Save Changes' : 'Publish Profile'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <MediaPickerModal
          isOpen={pickerOpen}
          acceptKind="image"
          defaultFolder="staff"
          onClose={() => setPickerOpen(false)}
          onSelect={(asset) => {
            setForm((prev) => ({ ...prev, photo_url: asset.public_url }));
            setPickerOpen(false);
          }}
        />

        <PreviewModal
          isOpen={previewOpen}
          title={form.full_name}
          subtitle={form.position_title}
          imageUrl={form.photo_url || null}
          metaTags={[
            { label: 'Department', value: form.department_name || 'Executive Management' },
            { label: 'Public Visibility', value: form.is_public ? 'Visible on Portal' : 'Hidden (Internal)' },
          ]}
          paragraphs={[form.biography]}
          onClose={() => setPreviewOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Management & Staff Profiles</h1>
          <p className="text-xs text-slate-500">
            Manage MCE, Coordinating Director, management heads, and public staff visibility.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Profile</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading staff directory...</div>
        ) : staff.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-900">No staff profiles recorded</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Official</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {person.photo_url && (
                          <img
                            src={person.photo_url}
                            alt={person.full_name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{person.full_name}</div>
                          <div className="text-[11px] text-slate-500">{person.position_title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{person.department_name || 'Executive'}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {person.is_public ? 'Public' : 'Internal Only'} · {person.is_management ? 'Management' : 'Staff'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          person.status === 'published' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {person.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(person)}
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canPublishOrDelete && person.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'unpublish', person })}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                          >
                            Unpublish
                          </button>
                        )}
                        {canPublishOrDelete && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'delete', person })}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirmTarget)}
        title={confirmTarget?.action === 'delete' ? 'Delete Profile?' : 'Unpublish Profile?'}
        message={`Are you sure you want to ${confirmTarget?.action} "${confirmTarget?.person.full_name}"?`}
        confirmLabel={confirmTarget?.action === 'delete' ? 'Delete' : 'Unpublish'}
        variant={confirmTarget?.action === 'delete' ? 'danger' : 'warning'}
        busy={saving}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
