import React, { useState, useEffect, useCallback } from 'react';
import { Images, Plus, Upload, Trash2, Star, Edit3, FolderPlus } from 'lucide-react';
import { supabase, uploadMediaFile, logAdminActivity } from '../../../lib/supabase';
import { CmsGalleryAlbum, CmsGalleryImage } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { useCms } from '../../../context/CmsContext';
import { ConfirmDialog } from '../ConfirmDialog';

interface GalleryManagerProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({ notify }) => {
  const { adminProfile, canPublishOrDelete } = useAuth();
  const { refreshPublicContent } = useCms();

  const [albums, setAlbums] = useState<CmsGalleryAlbum[]>([]);
  const [images, setImages] = useState<CmsGalleryImage[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumCategory, setNewAlbumCategory] = useState('Civic Events');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');
  const [showAlbumCreator, setShowAlbumCreator] = useState(false);

  const [editingImage, setEditingImage] = useState<CmsGalleryImage | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editCategory, setEditCategory] = useState('Civic Events');

  const [deleteTarget, setDeleteTarget] = useState<{
    kind: 'image' | 'album';
    id: string;
    label: string;
  } | null>(null);

  const loadGallery = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [albRes, imgRes] = await Promise.all([
      supabase.from('gallery_albums').select('*').order('created_at', { ascending: false }),
      supabase.from('gallery_images').select('*').order('created_at', { ascending: false }),
    ]);
    if (albRes.data) setAlbums(albRes.data as CmsGalleryAlbum[]);
    if (imgRes.data) setImages(imgRes.data as CmsGalleryImage[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !adminProfile || !newAlbumTitle.trim()) return;
    const { data, error } = await supabase
      .from('gallery_albums')
      .insert({
        title: newAlbumTitle.trim(),
        category: newAlbumCategory,
        description: newAlbumDesc.trim(),
        status: canPublishOrDelete ? 'published' : 'draft',
      })
      .select('*')
      .single();

    if (error) {
      notify(error.message, 'error');
      return;
    }

    await logAdminActivity({
      adminId: adminProfile.id,
      adminEmail: adminProfile.email,
      adminName: adminProfile.full_name,
      action: 'CREATE_GALLERY_ALBUM',
      entityType: 'gallery_albums',
      entityId: data.id,
      entityLabel: newAlbumTitle.trim(),
    });

    notify(`Album "${newAlbumTitle.trim()}" created.`);
    setNewAlbumTitle('');
    setNewAlbumDesc('');
    setShowAlbumCreator(false);
    setSelectedAlbumId(data.id);
    await loadGallery();
    await refreshPublicContent();
  };

  const handleMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !supabase || !adminProfile) return;

    setUploading(true);
    let successCount = 0;

    try {
      const targetAlbumId = selectedAlbumId !== 'all' ? selectedAlbumId : albums[0]?.id || null;
      for (const file of files) {
        const asset = await uploadMediaFile({
          file,
          folder: 'gallery',
          uploadedBy: adminProfile.id,
          kind: 'image',
        });

        const { error: imgErr } = await supabase.from('gallery_images').insert({
          album_id: targetAlbumId,
          title: file.name.replace(/\.[^.]+$/, ''),
          caption: '',
          category: newAlbumCategory,
          image_url: asset.public_url,
          is_featured: false,
          status: canPublishOrDelete ? 'published' : 'draft',
        });

        if (!imgErr) successCount++;
      }

      await logAdminActivity({
        adminId: adminProfile.id,
        adminEmail: adminProfile.email,
        adminName: adminProfile.full_name,
        action: 'UPLOAD_GALLERY_PHOTOS',
        entityType: 'gallery_images',
        entityLabel: `Uploaded ${successCount} photo(s) to gallery`,
      });

      notify(`${successCount} photograph(s) uploaded to Supabase Storage.`);
      await loadGallery();
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Batch upload error.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleToggleFeatured = async (img: CmsGalleryImage) => {
    if (!supabase || !adminProfile) return;
    const { error } = await supabase
      .from('gallery_images')
      .update({ is_featured: !img.is_featured })
      .eq('id', img.id);
    if (error) {
      notify(error.message, 'error');
      return;
    }
    notify(img.is_featured ? 'Removed from featured gallery.' : 'Marked as featured image.');
    await loadGallery();
    await refreshPublicContent();
  };

  const handleSaveCaption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage || !supabase || !adminProfile) return;
    const { error } = await supabase
      .from('gallery_images')
      .update({
        title: editTitle.trim(),
        caption: editCaption.trim(),
        category: editCategory,
      })
      .eq('id', editingImage.id);

    if (error) {
      notify(error.message, 'error');
      return;
    }
    await logAdminActivity({
      adminId: adminProfile.id,
      adminEmail: adminProfile.email,
      adminName: adminProfile.full_name,
      action: 'UPDATE_GALLERY_IMAGE',
      entityType: 'gallery_images',
      entityId: editingImage.id,
      entityLabel: editTitle.trim(),
    });
    notify('Image details updated.');
    setEditingImage(null);
    await loadGallery();
    await refreshPublicContent();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !supabase || !adminProfile) return;
    const table = deleteTarget.kind === 'album' ? 'gallery_albums' : 'gallery_images';
    const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id);
    if (error) {
      notify(error.message, 'error');
      return;
    }
    await logAdminActivity({
      adminId: adminProfile.id,
      adminEmail: adminProfile.email,
      adminName: adminProfile.full_name,
      action: `DELETE_${table.toUpperCase()}`,
      entityType: table,
      entityId: deleteTarget.id,
      entityLabel: deleteTarget.label,
    });
    notify(`Deleted "${deleteTarget.label}".`);
    if (deleteTarget.kind === 'album' && selectedAlbumId === deleteTarget.id) {
      setSelectedAlbumId('all');
    }
    setDeleteTarget(null);
    await loadGallery();
    await refreshPublicContent();
  };

  const visibleImages =
    selectedAlbumId === 'all'
      ? images
      : images.filter((img) => img.album_id === selectedAlbumId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Photo Gallery & Albums</h1>
          <p className="text-xs text-slate-500">
            Create civic albums, upload multiple photos to Supabase Storage, add captions, and feature highlights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAlbumCreator(!showAlbumCreator)}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:border-emerald-700 text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-700" />
            <span>New Album</span>
          </button>

          <label className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Uploading Photos...' : 'Upload Multiple Photos'}</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleMultiUpload}
              disabled={uploading}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Create Album Drawer */}
      {showAlbumCreator && (
        <form
          onSubmit={handleCreateAlbum}
          className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Album Title *</label>
            <input
              type="text"
              required
              value={newAlbumTitle}
              onChange={(e) => setNewAlbumTitle(e.target.value)}
              placeholder="e.g. 2026 Disability Fund Disbursement"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={newAlbumCategory}
              onChange={(e) => setNewAlbumCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            >
              <option value="Civic Events">Civic Events</option>
              <option value="Infrastructure">Infrastructure Works</option>
              <option value="Sanitation">Sanitation & Public Health</option>
              <option value="Leadership">Leadership & Visits</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newAlbumDesc}
              onChange={(e) => setNewAlbumDesc(e.target.value)}
              placeholder="Short description..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0 inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          </div>
        </form>
      )}

      {/* Albums Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedAlbumId('all')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
            selectedAlbumId === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Photos ({images.length})
        </button>
        {albums.map((alb) => (
          <div key={alb.id} className="inline-flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setSelectedAlbumId(alb.id)}
              className={`px-3.5 py-2 rounded-l-lg text-xs font-semibold whitespace-nowrap cursor-pointer border ${
                selectedAlbumId === alb.id
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {alb.title}
            </button>
            {canPublishOrDelete && (
              <button
                type="button"
                onClick={() => setDeleteTarget({ kind: 'album', id: alb.id, label: alb.title })}
                title="Delete album"
                className="px-2 py-2 bg-white border border-l-0 border-slate-200 rounded-r-lg text-slate-400 hover:text-rose-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
          Loading photo gallery...
        </div>
      ) : visibleImages.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-2">
          <Images className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-semibold text-slate-900">No photographs in this album</div>
          <p className="text-xs text-slate-500">
            Use "Upload Multiple Photos" to upload images directly into Supabase Storage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleImages.map((img) => (
            <div
              key={img.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <div className="relative h-44 bg-slate-100">
                <img
                  src={img.image_url}
                  alt={img.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {img.is_featured && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-bold">
                    Featured
                  </span>
                )}
              </div>
              <div className="p-3 space-y-1.5">
                <div className="text-xs font-bold text-slate-900 truncate">{img.title || 'Untitled Photo'}</div>
                <div className="text-[11px] text-slate-500 line-clamp-2">
                  {img.caption || 'No caption set'}
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(img)}
                    className={`text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                      img.is_featured ? 'text-amber-600' : 'text-slate-500 hover:text-amber-600'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>{img.is_featured ? 'Featured' : 'Feature'}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingImage(img);
                        setEditTitle(img.title);
                        setEditCaption(img.caption || '');
                        setEditCategory(img.category);
                      }}
                      className="p-1 text-slate-500 hover:text-emerald-800 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {canPublishOrDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ kind: 'image', id: img.id, label: img.title })}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Caption Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm">
          <form
            onSubmit={handleSaveCaption}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-slate-900">Edit Photograph Details</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Photo Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="Civic Events">Civic Events</option>
                <option value="Infrastructure">Infrastructure Works</option>
                <option value="Sanitation">Sanitation & Public Health</option>
                <option value="Leadership">Leadership & Visits</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Caption / Description</label>
              <textarea
                rows={3}
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingImage(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.kind === 'album' ? 'Delete Photo Album?' : 'Delete Photograph?'}
        message={`Permanently delete "${deleteTarget?.label}"?`}
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
