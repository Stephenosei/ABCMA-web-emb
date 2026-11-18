import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  Image as ImageIcon,
  Star,
} from 'lucide-react';
import { supabase, slugify, logAdminActivity } from '../../../lib/supabase';
import { CmsNewsArticle } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { useCms } from '../../../context/CmsContext';
import { MediaPickerModal } from '../MediaPickerModal';
import { PreviewModal } from '../PreviewModal';
import { ConfirmDialog } from '../ConfirmDialog';

interface NewsManagerProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const EMPTY_FORM = {
  title: '',
  slug: '',
  news_scope: 'local' as 'local' | 'other',
  category: 'Notice',
  author_name: 'ABCMA Information Desk',
  location: 'Lartebiokorshie, Ablekuma Central',
  excerpt: '',
  bodyParagraphs: '',
  featured_image_url: '',
  target_page: 'news',
  target_label: 'Read More',
  is_featured_homepage: false,
  status: 'draft' as 'draft' | 'scheduled' | 'published',
  published_at: new Date().toISOString().slice(0, 16),
  scheduled_at: '',
};

export const NewsManager: React.FC<NewsManagerProps> = ({ notify }) => {
  const { adminProfile, canPublishOrDelete } = useAuth();
  const { refreshPublicContent } = useCms();

  const [articles, setArticles] = useState<CmsNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    action: 'delete' | 'unpublish';
    item: CmsNewsArticle;
  } | null>(null);

  const loadArticles = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false });
    if (error) {
      notify(error.message, 'error');
    } else if (data) {
      setArticles(data as CmsNewsArticle[]);
    }
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      published_at: new Date().toISOString().slice(0, 16),
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (item: CmsNewsArticle) => {
    setEditingId(item.id);
    const storyArray = Array.isArray(item.full_story) ? item.full_story : [];
    setForm({
      title: item.title,
      slug: item.slug,
      news_scope: item.news_scope,
      category: item.category,
      author_name: item.author_name,
      location: item.location || '',
      excerpt: item.excerpt,
      bodyParagraphs: storyArray.length > 0 ? storyArray.join('\n\n') : item.content,
      featured_image_url: item.featured_image_url || '',
      target_page: item.target_page || 'news',
      target_label: item.target_label || 'Read More',
      is_featured_homepage: item.is_featured_homepage,
      status: item.status,
      published_at: item.published_at ? item.published_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
      scheduled_at: item.scheduled_at ? item.scheduled_at.slice(0, 16) : '',
    });
    setFormOpen(true);
  };

  const saveArticle = async (targetStatus: 'draft' | 'scheduled' | 'published') => {
    if (!supabase || !adminProfile) return;
    if (!form.title.trim() || !form.excerpt.trim()) {
      notify('Article title and excerpt are required.', 'error');
      return;
    }
    if ((targetStatus === 'published' || targetStatus === 'scheduled') && !canPublishOrDelete) {
      notify('Editors can only save drafts. Ask a Content or Super Admin to publish.', 'error');
      return;
    }
    if (targetStatus === 'scheduled' && !form.scheduled_at) {
      notify('Select a scheduled publication date & time.', 'error');
      return;
    }

    setSaving(true);
    const paragraphs = form.bodyParagraphs
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    const prevItem = editingId ? articles.find((a) => a.id === editingId) || null : null;
    const cleanSlug = slugify(form.slug || form.title);

    const payload = {
      title: form.title.trim(),
      slug: cleanSlug,
      news_scope: form.news_scope,
      category: form.category.trim() || 'Notice',
      author_name: form.author_name.trim() || adminProfile.full_name,
      location: form.location.trim() || null,
      excerpt: form.excerpt.trim(),
      content: paragraphs[0] || form.excerpt.trim(),
      full_story: paragraphs,
      featured_image_url: form.featured_image_url || null,
      target_page: form.target_page || 'news',
      target_label: form.target_label || 'Read More',
      is_featured_homepage: form.is_featured_homepage,
      status: targetStatus,
      published_at: form.published_at
        ? new Date(form.published_at).toISOString()
        : new Date().toISOString(),
      scheduled_at:
        targetStatus === 'scheduled' && form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : null,
      author_id: adminProfile.id,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('news').update(payload).eq('id', editingId);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: `UPDATE_NEWS_${targetStatus.toUpperCase()}`,
          entityType: 'news',
          entityId: editingId,
          entityLabel: payload.title,
          previousValues: prevItem ? { title: prevItem.title, status: prevItem.status } : null,
          updatedValues: { title: payload.title, status: targetStatus },
        });
      } else {
        const { data, error } = await supabase.from('news').insert(payload).select('id').single();
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: `CREATE_NEWS_${targetStatus.toUpperCase()}`,
          entityType: 'news',
          entityId: data?.id || '',
          entityLabel: payload.title,
          updatedValues: { title: payload.title, status: targetStatus },
        });
      }

      notify(
        targetStatus === 'published'
          ? `Article "${payload.title}" published live.`
          : targetStatus === 'scheduled'
          ? `Article "${payload.title}" scheduled for publication.`
          : `Article "${payload.title}" saved as draft.`
      );
      setFormOpen(false);
      await loadArticles();
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save news article.', 'error');
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
        const { error } = await supabase.from('news').delete().eq('id', item.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'DELETE_NEWS',
          entityType: 'news',
          entityId: item.id,
          entityLabel: item.title,
          previousValues: { title: item.title, status: item.status },
        });
        notify(`Deleted article "${item.title}".`);
      } else {
        const { error } = await supabase
          .from('news')
          .update({ status: 'draft' })
          .eq('id', item.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UNPUBLISH_NEWS',
          entityType: 'news',
          entityId: item.id,
          entityLabel: item.title,
          previousValues: { status: item.status },
          updatedValues: { status: 'draft' },
        });
        notify(`Moved "${item.title}" back to draft.`);
      }
      setConfirmTarget(null);
      await loadArticles();
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Action failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = articles.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.author_name.toLowerCase().includes(q)
    );
  });

  if (formOpen) {
    const previewParagraphs = form.bodyParagraphs
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {editingId ? 'Edit News Article' : 'Publish News Article'}
            </h1>
            <p className="text-xs text-slate-500">
              Published news automatically appears in the News tab and What's New feed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Back to Articles
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Headline *
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
                placeholder="Enter official news headline..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                News Scope *
              </label>
              <select
                value={form.news_scope}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, news_scope: e.target.value as 'local' | 'other' }))
                }
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="local">Local News (Ablekuma Central Assembly)</option>
                <option value="other">Other News (Regional / National)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="Notice">Notice</option>
                <option value="Civic Activity">Civic Activity</option>
                <option value="Community">Community</option>
                <option value="Press Release">Press Release</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Author / Issuing Unit
              </label>
              <input
                type="text"
                value={form.author_name}
                onChange={(e) => setForm((prev) => ({ ...prev, author_name: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Location / Electoral Area
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Publication Date
              </label>
              <input
                type="datetime-local"
                value={form.published_at}
                onChange={(e) => setForm((prev) => ({ ...prev, published_at: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Schedule Future Publication (Optional)
              </label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured_homepage}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_featured_homepage: e.target.checked }))
              }
              className="w-4 h-4 accent-emerald-800 rounded"
            />
            <span>Feature this article prominently on Homepage ("What's New")</span>
          </label>

          {/* Featured Image */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {form.featured_image_url ? (
                <img
                  src={form.featured_image_url}
                  alt="Featured"
                  referrerPolicy="no-referrer"
                  className="w-20 h-14 rounded-lg object-cover border border-slate-200"
                />
              ) : (
                <div className="w-20 h-14 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                </div>
              )}
              <div className="text-xs">
                <div className="font-semibold text-slate-800">Featured Photograph</div>
                <div className="text-[11px] text-slate-500">
                  {form.featured_image_url ? 'Image linked from storage' : 'Upload or select from Media Library'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {form.featured_image_url && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, featured_image_url: '' }))}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:border-emerald-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Select / Upload Image
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Summary Excerpt *
            </label>
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
              placeholder="2-3 sentence summary shown on news cards..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Article Body (separate paragraphs with a blank line)
            </label>
            <textarea
              rows={8}
              value={form.bodyParagraphs}
              onChange={(e) => setForm((prev) => ({ ...prev, bodyParagraphs: e.target.value }))}
              placeholder="Write the full municipal press release or story..."
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
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
              <span>Preview</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={() => saveArticle('draft')}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer"
              >
                Save as Draft
              </button>

              {canPublishOrDelete && form.scheduled_at && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveArticle('scheduled')}
                  className="px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg cursor-pointer"
                >
                  Schedule Publication
                </button>
              )}

              {canPublishOrDelete && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveArticle('published')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingId && form.status === 'published' ? 'Save Changes' : 'Publish Now'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <MediaPickerModal
          isOpen={pickerOpen}
          acceptKind="image"
          defaultFolder="news"
          onClose={() => setPickerOpen(false)}
          onSelect={(asset) => {
            setForm((prev) => ({ ...prev, featured_image_url: asset.public_url }));
            setPickerOpen(false);
          }}
        />

        <PreviewModal
          isOpen={previewOpen}
          title={form.title}
          subtitle={`${form.news_scope === 'local' ? 'Local News' : 'Other News'} · ${form.category}`}
          imageUrl={form.featured_image_url || null}
          metaTags={[
            { label: 'Author', value: form.author_name },
            { label: 'Location', value: form.location || 'Ablekuma Central' },
          ]}
          paragraphs={[form.excerpt, ...previewParagraphs]}
          onClose={() => setPreviewOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">News & Articles</h1>
          <p className="text-xs text-slate-500">
            Manage municipal stories, notices, and scheduled press releases.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Article</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news headline, author, category..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {(['all', 'published', 'draft', 'scheduled'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading news articles...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Newspaper className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-900">No news articles found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Headline</th>
                  <th className="py-3 px-4">Scope / Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Published Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {item.is_featured_homepage && (
                          <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-900 line-clamp-1 max-w-md">
                          {item.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{item.author_name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {item.news_scope === 'local' ? 'Local' : 'Other'} · {item.category}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold capitalize ${
                          item.status === 'published'
                            ? 'text-emerald-700'
                            : item.status === 'scheduled'
                            ? 'text-blue-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {item.published_at ? new Date(item.published_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                          title="Edit"
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
        title={confirmTarget?.action === 'delete' ? 'Delete News Article?' : 'Unpublish Article?'}
        message={
          confirmTarget?.action === 'delete'
            ? `Permanently delete "${confirmTarget?.item.title}" from the database?`
            : `Move "${confirmTarget?.item.title}" back to draft status?`
        }
        confirmLabel={confirmTarget?.action === 'delete' ? 'Delete' : 'Unpublish'}
        variant={confirmTarget?.action === 'delete' ? 'danger' : 'warning'}
        busy={saving}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
