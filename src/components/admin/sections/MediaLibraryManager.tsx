import React, { useState, useEffect, useCallback } from 'react';
import {
  HardDrive,
  Upload,
  Search,
  FileText,
  Trash2,
  RefreshCw,
  Copy,
  Eye,
  X,
} from 'lucide-react';
import {
  supabase,
  uploadMediaFile,
  replaceMediaFile,
  deleteMediaFile,
  formatFileSize,
  logAdminActivity,
} from '../../../lib/supabase';
import { CmsMediaAsset } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { ConfirmDialog } from '../ConfirmDialog';
import { sanitizeUrl, toSafeErrorMessage } from '../../../utils/security';

interface MediaLibraryManagerProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export const MediaLibraryManager: React.FC<MediaLibraryManagerProps> = ({ notify }) => {
  const { adminProfile, canPublishOrDelete } = useAuth();
  const [assets, setAssets] = useState<CmsMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState('general');
  const [folderFilter, setFolderFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewAsset, setPreviewAsset] = useState<CmsMediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CmsMediaAsset | null>(null);

  const loadAssets = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) notify(toSafeErrorMessage(error, 'Failed to load media library.'), 'error');
    else if (data) setAssets(data as CmsMediaAsset[]);
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !adminProfile) return;
    setUploading(true);
    try {
      for (const file of files) {
        const asset = await uploadMediaFile({
          file,
          folder: uploadFolder,
          uploadedBy: adminProfile.id,
          kind: 'any',
        });
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UPLOAD_MEDIA_ASSET',
          entityType: 'media_library',
          entityId: asset.id,
          entityLabel: asset.file_name,
        });
      }
      notify(`Uploaded ${files.length} asset(s) to "${uploadFolder}".`);
      await loadAssets();
    } catch (err) {
      notify(toSafeErrorMessage(err, 'Upload failed.'), 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleReplace = async (asset: CmsMediaAsset, e: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = e.target.files?.[0];
    if (!newFile || !adminProfile) return;
    setUploading(true);
    try {
      const updated = await replaceMediaFile({ asset, newFile });
      await logAdminActivity({
        adminId: adminProfile.id,
        adminEmail: adminProfile.email,
        adminName: adminProfile.full_name,
        action: 'REPLACE_MEDIA_ASSET',
        entityType: 'media_library',
        entityId: updated.id,
        entityLabel: updated.file_name,
      });
      notify(`Replaced "${asset.file_name}" in Supabase Storage.`);
      await loadAssets();
    } catch (err) {
      notify(toSafeErrorMessage(err, 'Replace failed.'), 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !adminProfile) return;
    try {
      await deleteMediaFile(deleteTarget);
      await logAdminActivity({
        adminId: adminProfile.id,
        adminEmail: adminProfile.email,
        adminName: adminProfile.full_name,
        action: 'DELETE_MEDIA_ASSET',
        entityType: 'media_library',
        entityId: deleteTarget.id,
        entityLabel: deleteTarget.file_name,
      });
      notify(`Deleted "${deleteTarget.file_name}" from Storage.`);
      setDeleteTarget(null);
      await loadAssets();
    } catch (err) {
      notify(toSafeErrorMessage(err, 'Delete failed.'), 'error');
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      notify('Asset URL copied to clipboard.');
    } catch {
      notify('Unable to copy automatically. Open preview to inspect URL.', 'error');
    }
  };

  const filtered = assets.filter((a) => {
    if (folderFilter !== 'all' && a.folder !== folderFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    return !q || a.file_name.toLowerCase().includes(q) || a.folder.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Central Media Library</h1>
          <p className="text-xs text-slate-500">
            Upload, preview, search, replace, or delete photographs, banners, and official documents on Supabase Storage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
          >
            <option value="general">Folder: General</option>
            <option value="banners">Folder: Banners</option>
            <option value="news">Folder: News</option>
            <option value="pages">Folder: Pages</option>
            <option value="departments">Folder: Departments</option>
            <option value="staff">Folder: Staff</option>
            <option value="gallery">Folder: Gallery</option>
            <option value="documents">Folder: Documents</option>
          </select>

          <label className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Uploading...' : 'Upload Files'}</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx"
              onChange={handleUpload}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search uploaded files..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <select
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg"
          >
            <option value="all">All Folders ({assets.length})</option>
            <option value="general">General</option>
            <option value="banners">Banners</option>
            <option value="news">News</option>
            <option value="pages">Pages</option>
            <option value="departments">Departments</option>
            <option value="staff">Staff</option>
            <option value="gallery">Gallery</option>
            <option value="documents">Documents</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
          Loading Supabase media library...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-2">
          <HardDrive className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-semibold text-slate-900">No files in Media Library</div>
          <p className="text-xs text-slate-500">
            Supported formats: JPG, PNG, WebP (max 8 MB) and PDF, DOC, DOCX (max 15 MB).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((asset) => {
            const isImg = asset.mime_type.startsWith('image/');
            return (
              <div
                key={asset.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div className="h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {isImg ? (
                    <img
                      src={sanitizeUrl(asset.public_url, { allowRelative: true, allowHash: false, allowMailtoTel: false }) || undefined}
                      alt={asset.alt_text || asset.file_name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center space-y-1 p-4">
                      <FileText className="w-8 h-8 text-emerald-700 mx-auto" />
                      <span className="text-[11px] font-mono text-slate-500 block">DOCUMENT</span>
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900 truncate">{asset.file_name}</div>
                    <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between">
                      <span>{asset.folder}</span>
                      <span>{formatFileSize(asset.file_size)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-slate-500">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewAsset(asset)}
                        title="Preview"
                        className="p-1.5 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(asset.public_url)}
                        title="Copy URL"
                        className="p-1.5 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {canPublishOrDelete && (
                        <label
                          title="Replace file"
                          className="p-1.5 hover:text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx"
                            onChange={(e) => handleReplace(asset, e)}
                            className="sr-only"
                          />
                        </label>
                      )}
                    </div>

                    {canPublishOrDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(asset)}
                        title="Delete file"
                        className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 truncate">{previewAsset.file_name}</div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {previewAsset.mime_type.startsWith('image/') ? (
                <img
                  src={sanitizeUrl(previewAsset.public_url, { allowRelative: true, allowHash: false, allowMailtoTel: false }) || undefined}
                  alt={previewAsset.file_name}
                  referrerPolicy="no-referrer"
                  className="max-h-80 w-full object-contain rounded-xl bg-slate-50 border border-slate-200"
                />
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                  <FileText className="w-10 h-10 text-emerald-700 mx-auto" />
                  <a
                    href={sanitizeUrl(previewAsset.public_url, { allowRelative: true, allowHash: false, allowMailtoTel: false }) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-bold text-emerald-800 underline"
                  >
                    Open File in Browser Tab
                  </a>
                </div>
              )}
              <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-3 rounded-lg break-all border border-slate-200">
                {previewAsset.public_url}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Media File?"
        message={`Permanently remove "${deleteTarget?.file_name}" from Supabase Storage? Any article or page referencing this URL will lose its asset.`}
        confirmLabel="Delete File"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
