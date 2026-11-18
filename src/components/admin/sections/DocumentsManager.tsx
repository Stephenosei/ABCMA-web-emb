import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Upload, Edit3, Trash2, Eye, CheckCircle2 } from 'lucide-react';
import { supabase, uploadMediaFile, formatFileSize, logAdminActivity } from '../../../lib/supabase';
import { CmsDocument } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { useCms } from '../../../context/CmsContext';
import { MediaPickerModal } from '../MediaPickerModal';
import { PreviewModal } from '../PreviewModal';
import { ConfirmDialog } from '../ConfirmDialog';

interface DocumentsManagerProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const DOC_CATEGORIES = [
  'Reports',
  'Policies',
  'Budget',
  'Procurement',
  'Tenders',
  'Public Notices',
  'Forms',
  'Strategic Plans',
  'Fee-Fixing',
  'Bye-Laws',
  'Guides',
  'Other',
];

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Reports',
  gazette_number: '',
  year: 2026,
  file_url: '',
  file_name: '',
  file_size: '1.0 MB',
  department: 'Central Administration',
  provisionsText: '',
  status: 'published' as 'draft' | 'published',
};

export const DocumentsManager: React.FC<DocumentsManagerProps> = ({ notify }) => {
  const { adminProfile, canPublishOrDelete } = useAuth();
  const { refreshPublicContent } = useCms();

  const [docs, setDocs] = useState<CmsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    action: 'delete' | 'unpublish';
    doc: CmsDocument;
  } | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) notify(error.message, 'error');
    else if (data) setDocs(data as CmsDocument[]);
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminProfile) return;
    setUploading(true);
    try {
      const asset = await uploadMediaFile({
        file,
        folder: 'documents',
        uploadedBy: adminProfile.id,
        kind: 'document',
      });
      setForm((prev) => ({
        ...prev,
        file_url: asset.public_url,
        file_name: asset.file_name,
        file_size: formatFileSize(asset.file_size),
      }));
      notify(`Uploaded "${asset.file_name}" to Supabase Storage.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Document upload failed.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const handleOpenEdit = (doc: CmsDocument) => {
    setEditingId(doc.id);
    setForm({
      title: doc.title,
      description: doc.description,
      category: doc.category,
      gazette_number: doc.gazette_number,
      year: doc.year,
      file_url: doc.file_url || '',
      file_name: doc.file_name,
      file_size: doc.file_size,
      department: doc.department || 'Central Administration',
      provisionsText: Array.isArray(doc.key_provisions) ? doc.key_provisions.join('\n') : '',
      status: doc.status,
    });
    setFormOpen(true);
  };

  const saveDocument = async (targetStatus: 'draft' | 'published') => {
    if (!supabase || !adminProfile) return;
    if (!form.title.trim() || !form.description.trim()) {
      notify('Document title and description are required.', 'error');
      return;
    }
    if (targetStatus === 'published' && !canPublishOrDelete) {
      notify('Editors can save drafts only.', 'error');
      return;
    }

    setSaving(true);
    const provisions = form.provisionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      gazette_number: form.gazette_number.trim() || `ABCMA-${form.year}`,
      year: Number(form.year) || 2026,
      file_url: form.file_url || null,
      file_name: form.file_name.trim() || `${form.title.trim().replace(/\s+/g, '_')}.pdf`,
      file_size: form.file_size.trim() || '1.0 MB',
      department: form.department.trim(),
      key_provisions: provisions,
      status: targetStatus,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('documents').update(payload).eq('id', editingId);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UPDATE_DOCUMENT',
          entityType: 'documents',
          entityId: editingId,
          entityLabel: payload.title,
          updatedValues: { category: payload.category, status: targetStatus },
        });
      } else {
        const { data, error } = await supabase.from('documents').insert(payload).select('id').single();
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'CREATE_DOCUMENT',
          entityType: 'documents',
          entityId: data?.id || '',
          entityLabel: payload.title,
          updatedValues: { category: payload.category, status: targetStatus },
        });
      }
      notify(`Document "${payload.title}" saved (${targetStatus}).`);
      setFormOpen(false);
      await loadDocuments();
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save document.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget || !supabase || !adminProfile) return;
    const { action, doc } = confirmTarget;
    setSaving(true);
    try {
      if (action === 'delete') {
        const { error } = await supabase.from('documents').delete().eq('id', doc.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'DELETE_DOCUMENT',
          entityType: 'documents',
          entityId: doc.id,
          entityLabel: doc.title,
        });
        notify(`Deleted document "${doc.title}".`);
      } else {
        const { error } = await supabase
          .from('documents')
          .update({ status: 'draft' })
          .eq('id', doc.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UNPUBLISH_DOCUMENT',
          entityType: 'documents',
          entityId: doc.id,
          entityLabel: doc.title,
        });
        notify(`Unpublished "${doc.title}".`);
      }
      setConfirmTarget(null);
      await loadDocuments();
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
              {editingId ? 'Edit Official Document' : 'Upload Official Document'}
            </h1>
            <p className="text-xs text-slate-500">
              Published documents are downloadable directly from the Documents & Downloads repository.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
          >
            Back to Documents
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Document Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              >
                {DOC_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Gazette / Reference Number
              </label>
              <input
                type="text"
                value={form.gazette_number}
                onChange={(e) => setForm((prev) => ({ ...prev, gazette_number: e.target.value }))}
                placeholder="e.g. ABCMA-2026-BUD-01"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Issuing Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Publication Year</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) || 2026 }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* File Upload / Picker */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs space-y-0.5">
              <div className="font-semibold text-slate-900">
                {form.file_name || 'No PDF / Word document uploaded yet'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {form.file_url ? `Hosted on Supabase Storage · ${form.file_size}` : 'Upload PDF/DOC/DOCX up to 15 MB'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Pick from Library
              </button>
              <label className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Uploading...' : 'Upload PDF / Doc'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf"
                  onChange={handleDirectUpload}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Document Description *</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Key Provisions / Highlights (One per line)
            </label>
            <textarea
              rows={3}
              value={form.provisionsText}
              onChange={(e) => setForm((prev) => ({ ...prev, provisionsText: e.target.value }))}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
            />
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
                onClick={() => saveDocument('draft')}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
              >
                Save as Draft
              </button>
              {canPublishOrDelete && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveDocument('published')}
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
          isOpen={pickerOpen}
          acceptKind="document"
          defaultFolder="documents"
          onClose={() => setPickerOpen(false)}
          onSelect={(asset) => {
            setForm((prev) => ({
              ...prev,
              file_url: asset.public_url,
              file_name: asset.file_name,
              file_size: formatFileSize(asset.file_size),
            }));
            setPickerOpen(false);
          }}
        />

        <PreviewModal
          isOpen={previewOpen}
          title={form.title}
          subtitle={`${form.category} · ${form.gazette_number}`}
          metaTags={[
            { label: 'Department', value: form.department },
            { label: 'File', value: `${form.file_name || 'Auto PDF'} (${form.file_size})` },
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
          <h1 className="text-xl font-bold text-slate-900">Documents & Downloads</h1>
          <p className="text-xs text-slate-500">
            Manage reports, policies, budgets, procurement tenders, public notices, forms, and strategic plans.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading documents...</div>
        ) : docs.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-900">No documents uploaded yet</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Year / Size</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{doc.title}</div>
                      <div className="text-[11px] font-mono text-slate-500">{doc.file_name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{doc.category}</td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                      {doc.year} · {doc.file_size}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          doc.status === 'published' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {doc.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canPublishOrDelete && doc.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'unpublish', doc })}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                          >
                            Unpublish
                          </button>
                        )}
                        {canPublishOrDelete && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'delete', doc })}
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
        title={confirmTarget?.action === 'delete' ? 'Delete Document?' : 'Unpublish Document?'}
        message={`Are you sure you want to ${confirmTarget?.action} "${confirmTarget?.doc.title}"?`}
        confirmLabel={confirmTarget?.action === 'delete' ? 'Delete' : 'Unpublish'}
        variant={confirmTarget?.action === 'delete' ? 'danger' : 'warning'}
        busy={saving}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
