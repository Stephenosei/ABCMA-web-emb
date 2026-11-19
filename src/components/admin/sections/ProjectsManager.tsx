import React, { useState, useEffect, useCallback } from 'react';
import {
  HardHat,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  X,
  AlertTriangle,
  MapPin,
  Calendar,
  Building2,
  Globe,
  FileEdit,
  ArrowLeft,
} from 'lucide-react';
import {
  supabase,
  slugify,
  uploadMediaFile,
  logAdminActivity,
} from '../../../lib/supabase';
import { CmsDepartment, CmsProject, ProjectStatus } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { useCms } from '../../../context/CmsContext';
import { MediaPickerModal } from '../MediaPickerModal';
import { PreviewModal } from '../PreviewModal';
import { ConfirmDialog } from '../ConfirmDialog';

interface ProjectsManagerProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const PROJECT_STATUSES: ProjectStatus[] = ['Planned', 'Ongoing', 'Completed', 'Suspended'];

const PROJECT_CATEGORIES = [
  'Roads & Drainage',
  'Health Infrastructure',
  'Education & Libraries',
  'Sanitation & Environment',
  'Markets & Trade',
  'Civic Facilities',
  'ICT & Digitalization',
];

interface ProjectFormState {
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  featured_image_url: string;
  gallery_images: string[];
  category: string;
  department_id: string;
  department_name: string;
  location: string;
  start_date: string;
  expected_completion_date: string;
  actual_completion_date: string;
  project_status: ProjectStatus;
  publication_status: 'draft' | 'published';
  progress_percentage: number;
  budget_ghs: string;
  funding_source: string;
  contractor: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  published_at: string;
}

const EMPTY_FORM: ProjectFormState = {
  title: '',
  slug: '',
  short_description: '',
  full_description: '',
  featured_image_url: '',
  gallery_images: [],
  category: 'Roads & Drainage',
  department_id: '',
  department_name: 'Works Department',
  location: 'Abossey Okai',
  start_date: '',
  expected_completion_date: '',
  actual_completion_date: '',
  project_status: 'Planned',
  publication_status: 'draft',
  progress_percentage: 0,
  budget_ghs: '',
  funding_source: '',
  contractor: '',
  display_order: 10,
  created_at: '',
  updated_at: '',
  published_at: '',
};

function isMissingProjectsTableError(message?: string, code?: string): boolean {
  if (!message && !code) return false;
  if (code === 'PGRST205' || code === '42P01') return true;
  const lower = (message || '').toLowerCase();
  return (
    lower.includes('public.projects') &&
    (lower.includes('could not find the table') || lower.includes('does not exist'))
  );
}

function getProjectStatusBadgeClass(status: ProjectStatus): string {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Ongoing':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'Planned':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Suspended':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({ notify }) => {
  const { adminProfile, canPublishOrDelete } = useAuth();
  const { refreshPublicContent } = useCms();

  const [projects, setProjects] = useState<CmsProject[]>([]);
  const [departments, setDepartments] = useState<CmsDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [pubFilter, setPubFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const [pickerTarget, setPickerTarget] = useState<'cover' | 'gallery' | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    action: 'delete' | 'unpublish' | 'publish';
    item: CmsProject;
  } | null>(null);

  const loadData = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [projRes, deptRes] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('departments')
        .select('*')
        .order('display_order', { ascending: true }),
    ]);

    if (projRes.error) {
      if (isMissingProjectsTableError(projRes.error.message, projRes.error.code)) {
        setTableMissing(true);
      } else {
        notify(projRes.error.message, 'error');
      }
      setProjects([]);
    } else {
      setTableMissing(false);
      setProjects((projRes.data || []) as CmsProject[]);
    }

    if (!deptRes.error && deptRes.data) {
      setDepartments(deptRes.data as CmsDepartment[]);
    }

    setLoading(false);
  }, [notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenNew = () => {
    const defaultDept =
      departments.find((d) => d.name.toLowerCase().includes('works')) || departments[0] || null;
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      department_id: defaultDept?.id || '',
      department_name: defaultDept?.name || 'Works Department',
      display_order: projects.length + 1,
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (item: CmsProject) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      slug: item.slug,
      short_description: item.short_description || '',
      full_description: item.full_description || '',
      featured_image_url: item.featured_image_url || '',
      gallery_images: Array.isArray(item.gallery_images) ? item.gallery_images : [],
      category: item.category || 'Roads & Drainage',
      department_id: item.department_id || '',
      department_name: item.department_name || 'Works Department',
      location: item.location || 'Ablekuma Central',
      start_date: item.start_date ? item.start_date.slice(0, 10) : '',
      expected_completion_date: item.expected_completion_date
        ? item.expected_completion_date.slice(0, 10)
        : '',
      actual_completion_date: item.actual_completion_date
        ? item.actual_completion_date.slice(0, 10)
        : '',
      project_status: item.project_status,
      publication_status: item.publication_status,
      progress_percentage: Number(item.progress_percentage ?? 0),
      budget_ghs: item.budget_ghs || '',
      funding_source: item.funding_source || '',
      contractor: item.contractor || '',
      display_order: Number(item.display_order ?? 0),
      created_at: item.created_at || '',
      updated_at: item.updated_at || '',
      published_at: item.published_at || '',
    });
    setFormOpen(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const asset = await uploadMediaFile({
        file,
        folder: 'projects',
        altText: form.title.trim() || file.name,
        uploadedBy: adminProfile?.id || null,
        kind: 'image',
      });
      setForm((prev) => ({ ...prev, featured_image_url: asset.public_url }));
      notify(`Uploaded cover image "${asset.file_name}" to Supabase Storage.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Cover upload failed.', 'error');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingGallery(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const asset = await uploadMediaFile({
          file,
          folder: 'projects',
          altText: `${form.title.trim() || 'Project'} gallery image`,
          uploadedBy: adminProfile?.id || null,
          kind: 'image',
        });
        uploadedUrls.push(asset.public_url);
      }
      setForm((prev) => ({
        ...prev,
        gallery_images: [...prev.gallery_images, ...uploadedUrls],
      }));
      notify(`Uploaded ${uploadedUrls.length} gallery photo(s) to Supabase Storage.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Gallery upload failed.', 'error');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const saveProject = async (targetPublication: 'draft' | 'published') => {
    if (!supabase || !adminProfile) return;
    if (!form.title.trim()) {
      notify('Project title is required.', 'error');
      return;
    }
    if (!form.short_description.trim()) {
      notify('Short summary description is required.', 'error');
      return;
    }
    if (targetPublication === 'published' && !canPublishOrDelete) {
      notify(
        'Editors can only save project drafts. Ask a Content or Super Admin to publish.',
        'error'
      );
      return;
    }

    setSaving(true);
    const prevItem = editingId ? projects.find((p) => p.id === editingId) || null : null;
    const cleanSlug = slugify(form.slug || form.title) || `project-${Date.now()}`;
    const clampedProgress = Math.max(0, Math.min(100, Number(form.progress_percentage) || 0));

    const payload = {
      title: form.title.trim(),
      slug: cleanSlug,
      short_description: form.short_description.trim(),
      full_description: form.full_description.trim() || form.short_description.trim(),
      featured_image_url: form.featured_image_url.trim() || null,
      gallery_images: form.gallery_images.filter(Boolean),
      category: form.category.trim() || 'Roads & Drainage',
      department_id: form.department_id || null,
      department_name: form.department_name.trim() || 'Works Department',
      location: form.location.trim() || 'Ablekuma Central',
      start_date: form.start_date || null,
      expected_completion_date: form.expected_completion_date || null,
      actual_completion_date: form.actual_completion_date || null,
      project_status: form.project_status,
      publication_status: targetPublication,
      progress_percentage:
        form.project_status === 'Completed' && clampedProgress === 0 ? 100 : clampedProgress,
      budget_ghs: form.budget_ghs.trim(),
      funding_source: form.funding_source.trim(),
      contractor: form.contractor.trim(),
      display_order: Number(form.display_order) || 0,
      author_id: adminProfile.id,
      published_at:
        targetPublication === 'published'
          ? prevItem?.published_at || new Date().toISOString()
          : prevItem?.published_at || null,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('projects').update(payload).eq('id', editingId);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action:
            targetPublication === 'published'
              ? 'UPDATE_PROJECT_PUBLISHED'
              : 'UPDATE_PROJECT_DRAFT',
          entityType: 'projects',
          entityId: editingId,
          entityLabel: payload.title,
          previousValues: prevItem
            ? {
                title: prevItem.title,
                project_status: prevItem.project_status,
                publication_status: prevItem.publication_status,
              }
            : null,
          updatedValues: {
            title: payload.title,
            project_status: payload.project_status,
            publication_status: payload.publication_status,
          },
        });
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action:
            targetPublication === 'published'
              ? 'CREATE_PROJECT_PUBLISHED'
              : 'CREATE_PROJECT_DRAFT',
          entityType: 'projects',
          entityId: data?.id || '',
          entityLabel: payload.title,
          updatedValues: {
            title: payload.title,
            project_status: payload.project_status,
            publication_status: payload.publication_status,
          },
        });
      }

      notify(
        targetPublication === 'published'
          ? `Project "${payload.title}" published to the public portal.`
          : `Project "${payload.title}" saved as draft.`
      );
      setFormOpen(false);
      await loadData();
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save project.', 'error');
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
        const { error } = await supabase.from('projects').delete().eq('id', item.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'DELETE_PROJECT',
          entityType: 'projects',
          entityId: item.id,
          entityLabel: item.title,
          previousValues: {
            title: item.title,
            project_status: item.project_status,
            publication_status: item.publication_status,
          },
        });
        notify(`Deleted project "${item.title}".`);
      } else if (action === 'unpublish') {
        const { error } = await supabase
          .from('projects')
          .update({ publication_status: 'draft' })
          .eq('id', item.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UNPUBLISH_PROJECT',
          entityType: 'projects',
          entityId: item.id,
          entityLabel: item.title,
          previousValues: { publication_status: item.publication_status },
          updatedValues: { publication_status: 'draft' },
        });
        notify(`Unpublished "${item.title}" (moved to draft).`);
      } else if (action === 'publish') {
        const { error } = await supabase
          .from('projects')
          .update({
            publication_status: 'published',
            published_at: item.published_at || new Date().toISOString(),
          })
          .eq('id', item.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'PUBLISH_PROJECT',
          entityType: 'projects',
          entityId: item.id,
          entityLabel: item.title,
          previousValues: { publication_status: item.publication_status },
          updatedValues: { publication_status: 'published' },
        });
        notify(`Published "${item.title}" to the public website.`);
      }

      setConfirmTarget(null);
      await loadData();
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Project action failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = projects.filter((p) => {
    if (pubFilter !== 'all' && p.publication_status !== pubFilter) return false;
    if (statusFilter !== 'all' && p.project_status !== statusFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.department_name.toLowerCase().includes(q) ||
      (p.contractor || '').toLowerCase().includes(q)
    );
  });

  if (formOpen) {
    const isCustomCategory =
      Boolean(form.category) && !PROJECT_CATEGORIES.includes(form.category);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {editingId ? 'Edit Municipal Project' : 'Add New Municipal Project'}
            </h1>
            <p className="text-xs text-slate-500">
              Published projects automatically update the public Projects &amp; Infrastructure section.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          {/* Core Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Project Title *
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
                placeholder="e.g., Abossey Okai Stormwater Concrete Channel & Culvert Construction"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                URL Slug *
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                placeholder="auto-generated-from-title"
                className="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Location / Electoral Area *
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Abossey Okai, Lartebiokorshie, Mataheko..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Project Category *
              </label>
              <div className="space-y-2">
                <select
                  value={isCustomCategory ? '__custom__' : form.category}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setForm((prev) => ({ ...prev, category: '' }));
                    } else {
                      setForm((prev) => ({ ...prev, category: e.target.value }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {PROJECT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__custom__">Custom Category...</option>
                </select>
                {isCustomCategory && (
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="Enter custom category name..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Responsible Department *
              </label>
              {departments.length > 0 ? (
                <select
                  value={form.department_id || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const found = departments.find((d) => d.id === selectedId);
                    setForm((prev) => ({
                      ...prev,
                      department_id: selectedId,
                      department_name: found ? found.name : prev.department_name,
                    }));
                  }}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="">Custom / General Assembly</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.short_code})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.department_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, department_name: e.target.value }))
                  }
                  placeholder="Works Department"
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              )}
              {!form.department_id && departments.length > 0 && (
                <input
                  type="text"
                  value={form.department_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, department_name: e.target.value }))
                  }
                  placeholder="Department label"
                  className="w-full mt-2 px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              )}
            </div>
          </div>

          {/* Status & Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Project Status *
              </label>
              <select
                value={form.project_status}
                onChange={(e) => {
                  const next = e.target.value as ProjectStatus;
                  setForm((prev) => ({
                    ...prev,
                    project_status: next,
                    progress_percentage:
                      next === 'Completed'
                        ? 100
                        : next === 'Planned' && prev.progress_percentage === 100
                        ? 0
                        : prev.progress_percentage,
                  }));
                }}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {PROJECT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Expected Completion Date
              </label>
              <input
                type="date"
                value={form.expected_completion_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, expected_completion_date: e.target.value }))
                }
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Actual Completion Date
              </label>
              <input
                type="date"
                value={form.actual_completion_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, actual_completion_date: e.target.value }))
                }
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Progress, Budget, Contractor */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Completion Progress ({form.progress_percentage}%)
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.progress_percentage}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      progress_percentage: Number(e.target.value),
                    }))
                  }
                  className="flex-1 accent-emerald-800"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.progress_percentage}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      progress_percentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                    }))
                  }
                  className="w-16 px-2 py-1.5 text-xs font-mono text-center border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contract Budget (GHS)
              </label>
              <input
                type="text"
                value={form.budget_ghs}
                onChange={(e) => setForm((prev) => ({ ...prev, budget_ghs: e.target.value }))}
                placeholder="e.g., GHS 2,500,000"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Funding Source
              </label>
              <input
                type="text"
                value={form.funding_source}
                onChange={(e) => setForm((prev) => ({ ...prev, funding_source: e.target.value }))}
                placeholder="e.g., DACF / ABCMA IGF"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lead Contractor &amp; Sort Order
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.contractor}
                  onChange={(e) => setForm((prev) => ({ ...prev, contractor: e.target.value }))}
                  placeholder="Contractor name"
                  className="flex-1 min-w-0 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <input
                  type="number"
                  min={0}
                  value={form.display_order}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, display_order: Number(e.target.value) || 0 }))
                  }
                  title="Display order on public website"
                  className="w-16 px-2 py-2 text-xs font-mono text-center border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Short Summary Description *
              </label>
              <textarea
                rows={2}
                value={form.short_description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, short_description: e.target.value }))
                }
                placeholder="Concise summary displayed on the public project card..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Project Description &amp; Scope
              </label>
              <textarea
                rows={5}
                value={form.full_description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, full_description: e.target.value }))
                }
                placeholder="Detailed engineering scope, public benefit, deliverables, and beneficiary communities..."
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
              />
            </div>
          </div>

          {/* Featured Cover Image */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {form.featured_image_url ? (
                  <img
                    src={form.featured_image_url}
                    alt="Project Cover"
                    referrerPolicy="no-referrer"
                    className="w-24 h-16 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                  />
                ) : (
                  <div className="w-24 h-16 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div className="text-xs">
                  <div className="font-semibold text-slate-800">Featured Cover Image</div>
                  <div className="text-[11px] text-slate-500">
                    {form.featured_image_url
                      ? 'Cover photograph linked'
                      : 'Upload directly to Supabase Storage (abcma-media) or pick from Media Library'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {form.featured_image_url && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, featured_image_url: '' }))}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    Remove
                  </button>
                )}
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingCover ? 'Uploading...' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    disabled={uploadingCover || !supabase}
                    onChange={handleCoverUpload}
                    className="sr-only"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setPickerTarget('cover')}
                  className="px-3.5 py-2 bg-white border border-slate-300 hover:border-emerald-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Media Library
                </button>
              </div>
            </div>
          </div>

          {/* Optional Additional Gallery Images */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Additional Project Progress Gallery ({form.gallery_images.length})
                </div>
                <div className="text-[11px] text-slate-500">
                  Optional site progress photos shown on the project dossier page.
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-700 text-xs font-semibold rounded-lg cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{uploadingGallery ? 'Uploading...' : 'Upload Photos'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    disabled={uploadingGallery || !supabase}
                    onChange={handleGalleryUpload}
                    className="sr-only"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setPickerTarget('gallery')}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Add from Library
                </button>
              </div>
            </div>

            {form.gallery_images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                {form.gallery_images.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white h-20"
                  >
                    <img
                      src={url}
                      alt={`Project gallery ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          gallery_images: prev.gallery_images.filter((_, i) => i !== idx),
                        }))
                      }
                      title="Remove image"
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Read-Only Metadata */}
          {editingId && (
            <div className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-slate-500 font-mono">
              <span>
                Status: <strong className="uppercase text-slate-800">{form.publication_status}</strong>
              </span>
              {form.created_at && (
                <span>Created: {new Date(form.created_at).toLocaleString()}</span>
              )}
              {form.updated_at && (
                <span>Last Updated: {new Date(form.updated_at).toLocaleString()}</span>
              )}
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Dossier</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              {!canPublishOrDelete && (
                <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                  Editor Role: Save drafts for Admin review &amp; publishing.
                </span>
              )}

              <button
                type="button"
                disabled={saving}
                onClick={() => saveProject('draft')}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Save as Draft</span>
              </button>

              {canPublishOrDelete && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveProject('published')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {editingId && form.publication_status === 'published'
                      ? 'Save & Keep Published'
                      : 'Publish Project'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        <MediaPickerModal
          isOpen={pickerTarget !== null}
          acceptKind="image"
          defaultFolder="projects"
          onClose={() => setPickerTarget(null)}
          onSelect={(asset) => {
            if (pickerTarget === 'cover') {
              setForm((prev) => ({ ...prev, featured_image_url: asset.public_url }));
            } else if (pickerTarget === 'gallery') {
              setForm((prev) => ({
                ...prev,
                gallery_images: prev.gallery_images.includes(asset.public_url)
                  ? prev.gallery_images
                  : [...prev.gallery_images, asset.public_url],
              }));
            }
            setPickerTarget(null);
          }}
        />

        <PreviewModal
          isOpen={previewOpen}
          title={form.title}
          subtitle={`${form.category} · ${form.project_status}`}
          imageUrl={form.featured_image_url || null}
          metaTags={[
            { label: 'Location', value: form.location || 'Ablekuma Central' },
            { label: 'Department', value: form.department_name || 'Works Department' },
            { label: 'Completion Progress', value: `${form.progress_percentage}%` },
            { label: 'Contract Budget', value: form.budget_ghs || 'Assembly Capital Budget' },
            { label: 'Funding Source', value: form.funding_source || 'ABCMA / DACF' },
            { label: 'Contractor', value: form.contractor || 'Works Directorate Supervised' },
          ]}
          paragraphs={[
            form.short_description,
            ...(form.full_description && form.full_description !== form.short_description
              ? [form.full_description]
              : []),
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
          <h1 className="text-xl font-bold text-slate-900">Projects Management</h1>
          <p className="text-xs text-slate-500">
            Create, edit, publish, and track municipal capital and community development projects.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          disabled={tableMissing}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Project</span>
        </button>
      </div>

      {tableMissing && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-sm">
                Supabase Migration Required: <code>public.projects</code> Table Not Found
              </div>
              <p className="leading-relaxed">
                Run <code>supabase/migrations/003_abcma_projects_cms.sql</code> inside your Supabase
                Dashboard SQL Editor to create the <code>public.projects</code> table, RLS policies,
                and seed the 8 existing ABCMA projects without affecting existing tables.
              </p>
              <button
                type="button"
                onClick={loadData}
                className="mt-1 px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white font-semibold rounded-lg cursor-pointer"
              >
                Re-check Database Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search project title, location, department, category..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['all', 'published', 'draft'] as const).map((pub) => (
              <button
                key={pub}
                type="button"
                onClick={() => setPubFilter(pub)}
                className={`px-3 py-1.5 rounded-md font-semibold capitalize cursor-pointer ${
                  pubFilter === pub
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {pub}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ProjectStatus)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">All Project Statuses</option>
            {PROJECT_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Loading municipal projects from Supabase...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <HardHat className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-900">
              {tableMissing
                ? 'Waiting for Projects Table Migration'
                : 'No projects match the current filter'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Department &amp; Category</th>
                  <th className="py-3 px-4">Project Status</th>
                  <th className="py-3 px-4">Publication</th>
                  <th className="py-3 px-4">Timeline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-[240px]">
                        <div className="w-14 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center">
                          {item.featured_image_url ? (
                            <img
                              src={item.featured_image_url}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 line-clamp-1 max-w-xs">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{item.department_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.category}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getProjectStatusBadgeClass(
                            item.project_status
                          )}`}
                        >
                          {item.project_status} · {item.progress_percentage}%
                        </span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-700"
                            style={{ width: `${Math.min(100, Math.max(0, item.progress_percentage))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${
                          item.publication_status === 'published'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <Globe className="w-3 h-3" />
                        <span>{item.publication_status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono tabular-nums text-[11px] text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>
                          {item.expected_completion_date
                            ? new Date(item.expected_completion_date).toLocaleDateString()
                            : 'Scheduled'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Upd: {new Date(item.updated_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {canPublishOrDelete && item.publication_status === 'published' && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'unpublish', item })}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                          >
                            Unpublish
                          </button>
                        )}

                        {canPublishOrDelete && item.publication_status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'publish', item })}
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                          >
                            Publish
                          </button>
                        )}

                        {canPublishOrDelete && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'delete', item })}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Delete Project"
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
        title={
          confirmTarget?.action === 'delete'
            ? 'Delete Project Permanently?'
            : confirmTarget?.action === 'unpublish'
            ? 'Unpublish Project?'
            : 'Publish Project?'
        }
        message={
          confirmTarget?.action === 'delete'
            ? `Are you sure you want to permanently delete "${confirmTarget?.item.title}"? It will be removed from the public website immediately.`
            : confirmTarget?.action === 'unpublish'
            ? `Move "${confirmTarget?.item.title}" back to draft? Citizens will no longer see this project on the public portal.`
            : `Publish "${confirmTarget?.item.title}" so it becomes visible on the public website?`
        }
        confirmLabel={
          confirmTarget?.action === 'delete'
            ? 'Delete Project'
            : confirmTarget?.action === 'unpublish'
            ? 'Unpublish'
            : 'Publish'
        }
        variant={
          confirmTarget?.action === 'delete'
            ? 'danger'
            : confirmTarget?.action === 'unpublish'
            ? 'warning'
            : 'primary'
        }
        busy={saving}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
