import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Search, X, Image as ImageIcon, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  supabase,
  uploadMediaFile,
  formatFileSize,
} from '../../lib/supabase';
import { CmsMediaAsset } from '../../types/cms';
import { useAuth } from '../../context/AuthContext';

interface MediaPickerModalProps {
  isOpen: boolean;
  acceptKind?: 'image' | 'document' | 'any';
  defaultFolder?: string;
  onSelect: (asset: CmsMediaAsset) => void;
  onClose: () => void;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  acceptKind = 'image',
  defaultFolder = 'general',
  onSelect,
  onClose,
}) => {
  const { adminProfile } = useAuth();
  const [assets, setAssets] = useState<CmsMediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('media_library')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(120);

    if (err) {
      setError(err.message);
    } else if (data) {
      setAssets(data as CmsMediaAsset[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen, loadAssets]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const created = await uploadMediaFile({
        file,
        folder: defaultFolder,
        uploadedBy: adminProfile?.id || null,
        kind: acceptKind,
      });
      setAssets((prev) => [created, ...prev]);
      onSelect(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  const filtered = assets.filter((item) => {
    const isImage = item.mime_type.startsWith('image/');
    if (acceptKind === 'image' && !isImage) return false;
    if (acceptKind === 'document' && isImage) return false;
    if (folderFilter !== 'all' && item.folder !== folderFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    return (
      !q ||
      item.file_name.toLowerCase().includes(q) ||
      (item.alt_text || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[88vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ABCMA Supabase Media Library
            </h3>
            <p className="text-xs text-slate-500">
              Select an existing asset or upload directly to the protected storage bucket.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload & Search Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search file name..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">All Folders</option>
              <option value="news">News</option>
              <option value="pages">Pages</option>
              <option value="departments">Departments</option>
              <option value="staff">Staff</option>
              <option value="projects">Projects</option>
              <option value="events">Events</option>
              <option value="gallery">Gallery</option>
              <option value="documents">Documents</option>
              <option value="banners">Banners & Settings</option>
              <option value="general">General</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer whitespace-nowrap shrink-0">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Uploading...' : 'Upload New File'}</span>
            <input
              type="file"
              onChange={handleUpload}
              disabled={uploading || !supabase}
              accept={
                acceptKind === 'image'
                  ? 'image/jpeg,image/png,image/webp,image/svg+xml'
                  : acceptKind === 'document'
                  ? '.pdf,.doc,.docx,application/pdf'
                  : 'image/jpeg,image/png,image/webp,image/svg+xml,.pdf,.doc,.docx'
              }
              className="sr-only"
            />
          </label>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Asset Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Loading files from Supabase Storage...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-dashed border-slate-300 rounded-xl bg-slate-50">
              <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">
                No matching files in Media Library
              </div>
              <p className="text-[11px] text-slate-500">
                Use the "Upload New File" button above to store assets in Supabase Storage.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((asset) => {
                const isImg = asset.mime_type.startsWith('image/');
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => onSelect(asset)}
                    className="group text-left bg-white border border-slate-200 hover:border-emerald-700 rounded-xl overflow-hidden transition-all cursor-pointer flex flex-col"
                  >
                    <div className="h-28 w-full bg-slate-100 flex items-center justify-center overflow-hidden relative">
                      {isImg ? (
                        <img
                          src={asset.public_url}
                          alt={asset.alt_text || asset.file_name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-emerald-700" />
                      )}
                      <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-800 text-white rounded-full p-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="p-2.5 space-y-0.5">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {asset.file_name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                        <span>{asset.folder}</span>
                        <span>{formatFileSize(asset.file_size)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
