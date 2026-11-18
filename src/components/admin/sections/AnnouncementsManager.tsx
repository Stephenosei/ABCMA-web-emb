import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, Plus, Edit3, Trash2, Eye, CheckCircle2, Paperclip } from 'lucide-react';
import { supabase, logAdminActivity } from '../../../lib/supabase';
import { CmsAnnouncement } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { useCms } from '../../../context/CmsContext';
import { MediaPickerModal } from '../MediaPickerModal';
import { PreviewModal } from '../PreviewModal';
import { ConfirmDialog } from '../ConfirmDialog';

interface AnnouncementsManagerProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Public Notice',
  audience: 'public' as 'public' | 'internal',
  attachment_url: '',
  attachment_name: '',
  published_at: new Date().toISOString().slice(0, 10),
  expires_at: '',
  status: 'draft' as 'draft' | 'published',
};

export const AnnouncementsManager: React.FC<AnnouncementsManagerProps> = ({ notify }) => {
  const { adminProfile, canPublishOrDelete } = useAuth();
  const { refreshPublicContent } = useCms();

  const [items, setItems] = useState<CmsAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    action: 'delete' | 'unpublish';
    item: CmsAnnouncement;
  } | null>(null);

  const loadAnnouncements = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      notify(error.message, 'error');
    } else if (data) {
      setItems(data as CmsAnnouncement[]);
    }
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, published_at: new Date().toISOString().slice(0, 10) });
    setFormOpen(true);
  };

  const handleOpenEdit = (item: CmsAnnouncement) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      audience: item.audience,
      attachment_url: item.attachment_url || '',
      attachment_name: item.attachment_name || '',
      published_at: item.published_at ? item.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      expires_at: item.expires_at ? item.expires_at.slice(0, 10) : '',
      status: item.status,
    });
    setFormOpen(true);
  };

  const saveAnnouncement = async (targetStatus: 'draft' | 'published') => {
    if (!supabase || !adminProfile) return;
    if (!form.title.trim() || !form.description.trim()) {
      notify('Announcement title and description are required.', 'error');
      return;
    }
    if (targetStatus === 'published' && !canPublishOrDelete) {
      notify('Editors can save drafts only.', 'error');
      return;
    }

    setSaving(true);
    const prevItem = editingId ? items.find((i) => i.id === editingId) || null : null;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || 'Public Notice',
      audience: form.audience,
      attachment_url: form.attachment_url || null,
      attachment_name: form.attachment_name || null,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString(),
      expires_at: form.expires_at ? new Date(`${form.expires_at}T23:59:59Z`).toISOString() : null,
      status: targetStatus,
      author_id: adminProfile.id,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('announcements').update(payload).eq('id', editingId);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: targetStatus === 'published' ? 'PUBLISH_ANNOUNCEMENT' : 'UPDATE_ANNOUNCEMENT',
          entityType: 'announcements',
          entityId: editingId,
          entityLabel: payload.title,
          previousValues: prevItem ? { title: prevItem.title, status: prevItem.status } : null,
          updatedValues: { title: payload.title, status: targetStatus },
        });
      } else {
        const { data, error } = await supabase.from('announcements').insert(payload).select('id').single();
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'CREATE_ANNOUNCEMENT',
          entityType: 'announcements',
          entityId: data?.id || '',
          entityLabel: payload.title,
          updatedValues: { title: payload.title, status: targetStatus, audience: payload.audience },
        });
      }

      notify(
        targetStatus === 'published'
          ? `Announcement "${payload.title}" published.`
          : `Announcement "${payload.title}" saved as draft.`
      );
      setFormOpen(false);
      await loadAnnouncements();
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save announcement.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget || !supabase || !adminProfile) return;
    const { action, item } = confirmTarget;
    setSaving(true);
    try {
      if (action === 'delete') {
        const { error } = await supabase.from('announcements').delete().eq('id', item.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'DELETE_ANNOUNCEMENT',
          entityType: 'announcements',
          entityId: item.id,
          entityLabel: item.title,
        });
        notify(`Deleted announcement "${item.title}".`);
      } else {
        const { error } = await supabase
          .from('announcements')
          .update({ status: 'draft' })
          .eq('id', item.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UNPUBLISH_ANNOUNCEMENT',
          entityType: 'announcements',
          entityId: item.id,
          entityLabel: item.title,
        });
        notify(`Unpublished announcement "${item.title}".`);
      }
      setConfirmTarget(null);
      await loadAnnouncements();
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
              {editingId ? 'Edit Announcement' : 'Create Announcement'}
            </h1>
            <p className="text-xs text-slate-500">
              Public announcements appear on the portal banner and notice board until their expiry date.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
          >
            Back to Announcements
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Announcement Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Q2 Sanitation Clean-Up Exercise Across All 7 Wards"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="Public Notice">Public Notice</option>
                <option value="Ratepayers Advisory">Ratepayers Advisory</option>
                <option value="Sanitation Exercise">Sanitation Exercise</option>
                <option value="Procurement Notice">Procurement Notice</option>
                <option value="Internal Staff Memo">Internal Staff Memo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Audience Visibility *
              </label>
              <select
                value={form.audience}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, audience: e.target.value as 'public' | 'internal' }))
                }
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="public">Public (Visible on Website)</option>
                <option value="internal">Internal (Admins & Staff Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Publish Date
              </label>
              <input
                type="date"
                value={form.published_at}
                onChange={(e) => setForm((prev) => ({ ...prev, published_at: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((prev) => ({ ...prev, expires_at: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Announcement Description *
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Write the full notice details..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Attachment */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Paperclip className="w-4 h-4 text-emerald-700" />
              <span className="font-semibold text-slate-800">
                {form.attachment_name ? `Attached: ${form.attachment_name}` : 'No circular/PDF attached'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {form.attachment_url && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, attachment_url: '', attachment_name: '' }))
                  }
                  className="text-xs text-rose-600 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 hover:border-emerald-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Attach File
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={() => saveAnnouncement('draft')}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer"
              >
                Save as Draft
              </button>
              {canPublishOrDelete && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveAnnouncement('published')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingId && form.status === 'published' ? 'Save Changes' : 'Publish'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <MediaPickerModal
          isOpen={pickerOpen}
          acceptKind="any"
          defaultFolder="documents"
          onClose={() => setPickerOpen(false)}
          onSelect={(asset) => {
            setForm((prev) => ({
              ...prev,
              attachment_url: asset.public_url,
              attachment_name: asset.file_name,
            }));
            setPickerOpen(false);
          }}
        />

        <PreviewModal
          isOpen={previewOpen}
          title={form.title}
          subtitle={`${form.audience.toUpperCase()} ANNOUNCEMENT · ${form.category}`}
          paragraphs={[form.description]}
          metaTags={[
            { label: 'Published Date', value: form.published_at || 'Today' },
            { label: 'Expires At', value: form.expires_at || 'No expiry set' },
          ]}
          onClose={() => setPreviewOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Announcements & Notices</h1>
          <p className="text-xs text-slate-500">
            Publish time-sensitive public notices and internal staff circulars.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Announcement</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading announcements...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Megaphone className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-900">No announcements yet</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Audience / Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expiry</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.title}</td>
                    <td className="py-3 px-4 text-slate-600 capitalize">
                      {item.audience} · {item.category}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          item.status === 'published' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {item.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                      {item.expires_at ? new Date(item.expires_at).toLocaleDateString() : 'None'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canPublishOrDelete && item.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'unpublish', item })}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                          >
                            Unpublish
                          </button>
                        )}
                        {canPublishOrDelete && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'delete', item })}
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
        title={confirmTarget?.action === 'delete' ? 'Delete Announcement?' : 'Unpublish Announcement?'}
        message={`Are you sure you want to ${confirmTarget?.action} "${confirmTarget?.item.title}"?`}
        confirmLabel={confirmTarget?.action === 'delete' ? 'Delete' : 'Unpublish'}
        variant={confirmTarget?.action === 'delete' ? 'danger' : 'warning'}
        busy={saving}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
