import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Edit3, Trash2, Eye, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { supabase, slugify, logAdminActivity } from '../../../lib/supabase';
import { CmsDepartment } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { useCms } from '../../../context/CmsContext';
import { MediaPickerModal } from '../MediaPickerModal';
import { PreviewModal } from '../PreviewModal';
import { ConfirmDialog } from '../ConfirmDialog';

interface DepartmentsManagerProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  short_code: '',
  category: 'admin' as CmsDepartment['category'],
  head_name: '',
  head_title: '',
  head_image_url: '',
  banner_image_url: '',
  room: 'Block A',
  phone: '+233 (0) 302 228 900',
  email: 'info@abcma.gov.gh',
  description: '',
  coreFunctionsText: '',
  servicesOfferedText: '',
  operating_hours: 'Mon - Fri: 8:00 AM - 5:00 PM',
  display_order: 1,
  status: 'published' as 'draft' | 'published',
};

export const DepartmentsManager: React.FC<DepartmentsManagerProps> = ({ notify }) => {
  const { adminProfile, canPublishOrDelete } = useAuth();
  const { refreshPublicContent } = useCms();

  const [departments, setDepartments] = useState<CmsDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [pickerTarget, setPickerTarget] = useState<'head' | 'banner' | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    action: 'delete' | 'unpublish';
    dept: CmsDepartment;
  } | null>(null);

  const loadDepartments = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) {
      notify(error.message, 'error');
    } else if (data) {
      setDepartments(data as CmsDepartment[]);
    }
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, display_order: departments.length + 1 });
    setFormOpen(true);
  };

  const handleOpenEdit = (dept: CmsDepartment) => {
    setEditingId(dept.id);
    setForm({
      name: dept.name,
      slug: dept.slug,
      short_code: dept.short_code,
      category: dept.category,
      head_name: dept.head_name,
      head_title: dept.head_title,
      head_image_url: dept.head_image_url || '',
      banner_image_url: dept.banner_image_url || '',
      room: dept.room,
      phone: dept.phone,
      email: dept.email,
      description: dept.description,
      coreFunctionsText: Array.isArray(dept.core_functions) ? dept.core_functions.join('\n') : '',
      servicesOfferedText: Array.isArray(dept.services_offered) ? dept.services_offered.join('\n') : '',
      operating_hours: dept.operating_hours,
      display_order: dept.display_order,
      status: dept.status,
    });
    setFormOpen(true);
  };

  const saveDepartment = async (targetStatus: 'draft' | 'published') => {
    if (!supabase || !adminProfile) return;
    if (!form.name.trim() || !form.short_code.trim() || !form.head_name.trim()) {
      notify('Department name, short code, and head name are required.', 'error');
      return;
    }
    if (targetStatus === 'published' && !canPublishOrDelete) {
      notify('Editors can only save drafts.', 'error');
      return;
    }

    setSaving(true);
    const coreFunctions = form.coreFunctionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const servicesOffered = form.servicesOfferedText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      short_code: form.short_code.trim(),
      category: form.category,
      head_name: form.head_name.trim(),
      head_title: form.head_title.trim() || 'Head of Department',
      head_image_url: form.head_image_url || null,
      banner_image_url: form.banner_image_url || null,
      room: form.room.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      description: form.description.trim(),
      core_functions: coreFunctions,
      services_offered: servicesOffered,
      operating_hours: form.operating_hours.trim(),
      display_order: Number(form.display_order) || 0,
      status: targetStatus,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('departments').update(payload).eq('id', editingId);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UPDATE_DEPARTMENT',
          entityType: 'departments',
          entityId: editingId,
          entityLabel: payload.name,
          updatedValues: { head_name: payload.head_name, status: targetStatus },
        });
      } else {
        const { data, error } = await supabase.from('departments').insert(payload).select('id').single();
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'CREATE_DEPARTMENT',
          entityType: 'departments',
          entityId: data?.id || '',
          entityLabel: payload.name,
          updatedValues: { head_name: payload.head_name, status: targetStatus },
        });
      }

      notify(`Department "${payload.name}" saved (${targetStatus}).`);
      setFormOpen(false);
      await loadDepartments();
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save department.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget || !supabase || !adminProfile) return;
    const { action, dept } = confirmTarget;
    setSaving(true);
    try {
      if (action === 'delete') {
        const { error } = await supabase.from('departments').delete().eq('id', dept.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'DELETE_DEPARTMENT',
          entityType: 'departments',
          entityId: dept.id,
          entityLabel: dept.name,
        });
        notify(`Deleted department "${dept.name}".`);
      } else {
        const { error } = await supabase
          .from('departments')
          .update({ status: 'draft' })
          .eq('id', dept.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UNPUBLISH_DEPARTMENT',
          entityType: 'departments',
          entityId: dept.id,
          entityLabel: dept.name,
        });
        notify(`Unpublished "${dept.name}".`);
      }
      setConfirmTarget(null);
      await loadDepartments();
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Action failed.', 'error');
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
              {editingId ? 'Edit Department' : 'Add Municipal Department'}
            </h1>
            <p className="text-xs text-slate-500">
              Changes sync immediately to the Homepage spotlight, Departments Directory, and Assembly modal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
          >
            Back to Departments
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Department Full Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name: val,
                    slug: editingId ? prev.slug : slugify(val),
                  }));
                }}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Short Code *
              </label>
              <input
                type="text"
                value={form.short_code}
                onChange={(e) => setForm((prev) => ({ ...prev, short_code: e.target.value }))}
                placeholder="e.g. MIS"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: e.target.value as CmsDepartment['category'],
                  }))
                }
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="admin">Central Admin & HR</option>
                <option value="technical">Works, MIS & Tech</option>
                <option value="social">Social Welfare & Agriculture</option>
                <option value="finance">Finance & Revenue</option>
                <option value="planning">Physical Planning</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Department Head Name *
              </label>
              <input
                type="text"
                value={form.head_name}
                onChange={(e) => setForm((prev) => ({ ...prev, head_name: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Head Official Title
              </label>
              <input
                type="text"
                value={form.head_title}
                onChange={(e) => setForm((prev) => ({ ...prev, head_title: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Office Room / Block
              </label>
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm((prev) => ({ ...prev, room: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {form.head_image_url ? (
                  <img
                    src={form.head_image_url}
                    alt="Head"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <div className="text-xs">
                  <div className="font-semibold text-slate-800">Head Portrait</div>
                  <div className="text-[11px] text-slate-500">Shown on department card</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickerTarget('head')}
                className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Upload / Pick
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {form.banner_image_url ? (
                  <img
                    src={form.banner_image_url}
                    alt="Banner"
                    referrerPolicy="no-referrer"
                    className="w-16 h-12 rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-12 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <div className="text-xs">
                  <div className="font-semibold text-slate-800">Departmental Banner</div>
                  <div className="text-[11px] text-slate-500">Optional banner photo</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickerTarget('banner')}
                className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Upload / Pick
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description & Mandate *
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Core Functions (One per line)
              </label>
              <textarea
                rows={4}
                value={form.coreFunctionsText}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, coreFunctionsText: e.target.value }))
                }
                placeholder="Coordinating decentralized administration&#10;Preparing annual work plans"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Public Services Offered (One per line)
              </label>
              <textarea
                rows={4}
                value={form.servicesOfferedText}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, servicesOfferedText: e.target.value }))
                }
                placeholder="Business permit clearance&#10;Site inspection certificates"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Operating Hours
              </label>
              <input
                type="text"
                value={form.operating_hours}
                onChange={(e) => setForm((prev) => ({ ...prev, operating_hours: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, display_order: Number(e.target.value) || 0 }))
                }
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
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
                onClick={() => saveDepartment('draft')}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
              >
                Save as Draft
              </button>
              {canPublishOrDelete && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveDepartment('published')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingId && form.status === 'published' ? 'Save Changes' : 'Publish'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <MediaPickerModal
          isOpen={Boolean(pickerTarget)}
          acceptKind="image"
          defaultFolder="departments"
          onClose={() => setPickerTarget(null)}
          onSelect={(asset) => {
            if (pickerTarget === 'head') {
              setForm((prev) => ({ ...prev, head_image_url: asset.public_url }));
            } else {
              setForm((prev) => ({ ...prev, banner_image_url: asset.public_url }));
            }
            setPickerTarget(null);
          }}
        />

        <PreviewModal
          isOpen={previewOpen}
          title={form.name}
          subtitle={`${form.short_code} · ${form.head_name} (${form.head_title})`}
          imageUrl={form.banner_image_url || form.head_image_url || null}
          metaTags={[
            { label: 'Office Location', value: form.room },
            { label: 'Contact', value: `${form.phone} · ${form.email}` },
          ]}
          paragraphs={[form.description]}
          onClose={() => setPreviewOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Departments Management</h1>
          <p className="text-xs text-slate-500">
            Update statutory directorates, department heads, photos, and responsibilities.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Department</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading departments...</div>
        ) : departments.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-900">No departments in Supabase yet</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Head of Department</th>
                  <th className="py-3 px-4">Office / Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{dept.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{dept.short_code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {dept.head_image_url && (
                          <img
                            src={dept.head_image_url}
                            alt={dept.head_name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{dept.head_name}</div>
                          <div className="text-[11px] text-slate-500">{dept.head_title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{dept.room}</div>
                      <div className="font-mono text-[11px]">{dept.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          dept.status === 'published' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {dept.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(dept)}
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canPublishOrDelete && dept.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'unpublish', dept })}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                          >
                            Unpublish
                          </button>
                        )}
                        {canPublishOrDelete && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'delete', dept })}
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
        title={confirmTarget?.action === 'delete' ? 'Delete Department?' : 'Unpublish Department?'}
        message={`Are you sure you want to ${confirmTarget?.action} "${confirmTarget?.dept.name}"?`}
        confirmLabel={confirmTarget?.action === 'delete' ? 'Delete' : 'Unpublish'}
        variant={confirmTarget?.action === 'delete' ? 'danger' : 'warning'}
        busy={saving}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
