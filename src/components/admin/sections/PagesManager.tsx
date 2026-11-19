import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCode2,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  Image as ImageIcon,
  Paperclip,
  X,
} from 'lucide-react';
import { supabase, slugify, logAdminActivity } from '../../../lib/supabase';
import { CmsPage, PageAttachment } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { useCms } from '../../../context/CmsContext';
import { RichTextEditor } from '../RichTextEditor';
import { MediaPickerModal } from '../MediaPickerModal';
import { PreviewModal } from '../PreviewModal';
import { ConfirmDialog } from '../ConfirmDialog';
import { sanitizeHtml, sanitizeUrl, toSafeErrorMessage } from '../../../utils/security';

interface PagesManagerProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  summary: '',
  content_html: '<p></p>',
  featured_image_url: '',
  attachments: [] as PageAttachment[],
  status: 'draft' as 'draft' | 'published',
};

export const PagesManager: React.FC<PagesManagerProps> = ({ notify }) => {
  const { adminProfile, canPublishOrDelete } = useAuth();
  const { refreshPublicContent } = useCms();

  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [docPickerOpen, setDocPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    action: 'delete' | 'unpublish';
    page: CmsPage;
  } | null>(null);

  const loadPages = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      notify(toSafeErrorMessage(error, 'Failed to load pages.'), 'error');
    } else if (data) {
      setPages(data as CmsPage[]);
    }
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const handleOpenEdit = (page: CmsPage) => {
    setEditingId(page.id);
    setForm({
      title: page.title,
      slug: page.slug,
      summary: page.summary || '',
      content_html: page.content_html || '<p></p>',
      featured_image_url: page.featured_image_url || '',
      attachments: Array.isArray(page.attachments) ? page.attachments : [],
      status: page.status,
    });
    setFormOpen(true);
  };

  const savePage = async (targetStatus: 'draft' | 'published') => {
    if (!supabase || !adminProfile) return;
    if (!form.title.trim()) {
      notify('Page title is required.', 'error');
      return;
    }
    if (targetStatus === 'published' && !canPublishOrDelete) {
      notify('Editors can save drafts only. Ask a Content or Super Admin to publish.', 'error');
      return;
    }

    setSaving(true);
    const cleanSlug = slugify(form.slug || form.title);
    const prevPage = editingId ? pages.find((p) => p.id === editingId) || null : null;
    const cleanHtml = sanitizeHtml(form.content_html || '');
    const cleanFeaturedImage = form.featured_image_url
      ? sanitizeUrl(form.featured_image_url, { allowRelative: true, allowHash: false, allowMailtoTel: false })
      : '';
    const cleanAttachments = form.attachments
      .map((att) => ({
        ...att,
        url: sanitizeUrl(att.url, { allowRelative: true, allowHash: false, allowMailtoTel: false }),
      }))
      .filter((att) => Boolean(att.url));

    const payload = {
      title: form.title.trim(),
      slug: cleanSlug,
      summary: form.summary.trim(),
      content_html: cleanHtml,
      featured_image_url: cleanFeaturedImage || null,
      attachments: cleanAttachments,
      status: targetStatus,
      author_id: adminProfile.id,
      published_at: targetStatus === 'published' ? prevPage?.published_at || new Date().toISOString() : null,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('pages').update(payload).eq('id', editingId);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: targetStatus === 'published' ? 'PUBLISH_PAGE' : 'UPDATE_PAGE',
          entityType: 'pages',
          entityId: editingId,
          entityLabel: payload.title,
          previousValues: prevPage ? { title: prevPage.title, status: prevPage.status, slug: prevPage.slug } : null,
          updatedValues: { title: payload.title, status: targetStatus, slug: cleanSlug },
        });
      } else {
        const { data, error } = await supabase.from('pages').insert(payload).select('id').single();
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: targetStatus === 'published' ? 'CREATE_AND_PUBLISH_PAGE' : 'CREATE_DRAFT_PAGE',
          entityType: 'pages',
          entityId: data?.id || '',
          entityLabel: payload.title,
          updatedValues: { title: payload.title, status: targetStatus, slug: cleanSlug },
        });
      }

      notify(
        targetStatus === 'published'
          ? `Page "${payload.title}" published live at /page/${cleanSlug}.`
          : `Page "${payload.title}" saved as draft.`
      );
      setFormOpen(false);
      await loadPages();
      await refreshPublicContent();
    } catch (err) {
      notify(toSafeErrorMessage(err, 'Failed to save page.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget || !supabase || !adminProfile) return;
    const { action, page } = confirmTarget;
    setSaving(true);
    try {
      if (action === 'delete') {
        const { error } = await supabase.from('pages').delete().eq('id', page.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'DELETE_PAGE',
          entityType: 'pages',
          entityId: page.id,
          entityLabel: page.title,
          previousValues: { title: page.title, slug: page.slug },
        });
        notify(`Deleted page "${page.title}".`);
      } else {
        const { error } = await supabase
          .from('pages')
          .update({ status: 'draft' })
          .eq('id', page.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UNPUBLISH_PAGE',
          entityType: 'pages',
          entityId: page.id,
          entityLabel: page.title,
          previousValues: { status: 'published' },
          updatedValues: { status: 'draft' },
        });
        notify(`Unpublished "${page.title}" back to drafts.`);
      }
      setConfirmTarget(null);
      await loadPages();
      await refreshPublicContent();
    } catch (err) {
      notify(toSafeErrorMessage(err, 'Action failed.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = pages.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
  });

  if (formOpen) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {editingId ? 'Edit Website Page' : 'Create New Website Page'}
            </h1>
            <p className="text-xs text-slate-500">
              Custom pages are served dynamically at <code className="font-mono">/page/{slugify(form.slug || form.title || 'your-slug')}</code>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Back to Pages List
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Page Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    title: val,
                    slug: editingId ? prev.slug : slugify(val),
                  }));
                }}
                placeholder="e.g. Right to Information (RTI) Manual"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                URL Slug *
              </label>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                <span className="px-3 py-2 text-xs font-mono text-slate-500 border-r border-slate-300">
                  /page/
                </span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="rti-manual"
                  className="flex-1 px-3 py-2 text-xs font-mono bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Short Summary / Meta Excerpt
            </label>
            <textarea
              rows={2}
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              placeholder="Concise overview displayed under the page heading..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Featured Image & Document Attachments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-700" />
                  Featured Banner Image
                </span>
                <div className="flex items-center gap-2">
                  {form.featured_image_url && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, featured_image_url: '' }))}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setImagePickerOpen(true)}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:border-emerald-700 text-xs font-semibold rounded-md cursor-pointer"
                  >
                    Choose / Upload
                  </button>
                </div>
              </div>
              {form.featured_image_url ? (
                <img
                  src={form.featured_image_url}
                  alt="Featured preview"
                  referrerPolicy="no-referrer"
                  className="h-28 w-full object-cover rounded-lg border border-slate-200"
                />
              ) : (
                <div className="h-20 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[11px] text-slate-400">
                  No header banner selected
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-emerald-700" />
                  Attached Documents ({form.attachments.length})
                </span>
                <button
                  type="button"
                  onClick={() => setDocPickerOpen(true)}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:border-emerald-700 text-xs font-semibold rounded-md cursor-pointer"
                >
                  Attach PDF / Doc
                </button>
              </div>
              {form.attachments.length === 0 ? (
                <div className="h-20 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[11px] text-slate-400">
                  No downloadable files attached
                </div>
              ) : (
                <div className="space-y-1.5 max-h-24 overflow-y-auto">
                  {form.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
                    >
                      <span className="truncate font-medium text-slate-800">{att.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            attachments: prev.attachments.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Page Content (Rich Text Editor)
            </label>
            <RichTextEditor
              value={form.content_html}
              onChange={(html) => setForm((prev) => ({ ...prev, content_html: html }))}
            />
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Page</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={() => savePage('draft')}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer"
              >
                Save as Draft
              </button>

              {canPublishOrDelete && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => savePage('published')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingId && form.status === 'published' ? 'Save & Keep Published' : 'Publish Page'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <MediaPickerModal
          isOpen={imagePickerOpen}
          acceptKind="image"
          defaultFolder="pages"
          onClose={() => setImagePickerOpen(false)}
          onSelect={(asset) => {
            setForm((prev) => ({ ...prev, featured_image_url: asset.public_url }));
            setImagePickerOpen(false);
          }}
        />

        <MediaPickerModal
          isOpen={docPickerOpen}
          acceptKind="document"
          defaultFolder="documents"
          onClose={() => setDocPickerOpen(false)}
          onSelect={(asset) => {
            setForm((prev) => ({
              ...prev,
              attachments: [
                ...prev.attachments,
                {
                  name: asset.file_name,
                  url: asset.public_url,
                  size: `${(asset.file_size / (1024 * 1024)).toFixed(2)} MB`,
                },
              ],
            }));
            setDocPickerOpen(false);
          }}
        />

        <PreviewModal
          isOpen={previewOpen}
          title={form.title}
          subtitle={`/page/${slugify(form.slug || form.title || 'preview')}`}
          imageUrl={form.featured_image_url || null}
          htmlContent={form.content_html}
          onClose={() => setPreviewOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manage Pages</h1>
          <p className="text-xs text-slate-500">
            Create and manage custom dynamic pages linked from your public navigation menu.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Page</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages by title or slug..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono tabular-nums ml-auto">
          {filtered.length} page(s)
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading pages...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <FileCode2 className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-900">No custom pages created yet</div>
            <p className="text-xs text-slate-500">
              Create informational pages (e.g. Bye-Laws FAQ, RTI Manual, Municipal Profile) and link them in Navigation Management.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Page Title</th>
                  <th className="py-3 px-4">URL Slug</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{page.title}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">/page/{page.slug}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          page.status === 'published' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {page.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(page)}
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canPublishOrDelete && page.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'unpublish', page })}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                          >
                            Unpublish
                          </button>
                        )}
                        {canPublishOrDelete && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'delete', page })}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Delete"
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
        title={confirmTarget?.action === 'delete' ? 'Delete Website Page?' : 'Unpublish Website Page?'}
        message={
          confirmTarget?.action === 'delete'
            ? `Permanently delete "${confirmTarget?.page.title}"? Visitors navigating to /page/${confirmTarget?.page.slug} will no longer see it.`
            : `Move "${confirmTarget?.page.title}" back to draft status? It will be hidden from public visitors.`
        }
        confirmLabel={confirmTarget?.action === 'delete' ? 'Delete Permanently' : 'Unpublish Page'}
        variant={confirmTarget?.action === 'delete' ? 'danger' : 'warning'}
        busy={saving}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
