import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { CmsMediaAsset } from '../types/cms';

export { supabase, isSupabaseConfigured };

export const MEDIA_BUCKET = 'abcma-media';

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024; // 15 MB

export function validateUploadFile(
  file: File,
  kind: 'image' | 'document' | 'any' = 'any'
): { valid: boolean; error?: string } {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isDoc = ALLOWED_DOCUMENT_TYPES.includes(file.type);

  if (kind === 'image' && !isImage) {
    return {
      valid: false,
      error: 'Only JPG, PNG, WebP, or SVG image files are permitted.',
    };
  }
  if (kind === 'document' && !isDoc) {
    return {
      valid: false,
      error: 'Only PDF, DOC, or DOCX documents are permitted.',
    };
  }
  if (kind === 'any' && !isImage && !isDoc) {
    return {
      valid: false,
      error: 'Unsupported file type. Upload JPG, PNG, WebP, SVG, PDF, DOC, or DOCX.',
    };
  }

  const maxLimit = isImage ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (file.size > maxLimit) {
    return {
      valid: false,
      error: `File exceeds maximum size of ${Math.round(maxLimit / (1024 * 1024))} MB.`,
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function uploadMediaFile(params: {
  file: File;
  folder: string;
  altText?: string;
  uploadedBy?: string | null;
  kind?: 'image' | 'document' | 'any';
}): Promise<CmsMediaAsset> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const check = validateUploadFile(params.file, params.kind || 'any');
  if (!check.valid) {
    throw new Error(check.error || 'File validation failed.');
  }

  const cleanExt = params.file.name.split('.').pop()?.toLowerCase() || 'bin';
  const baseName = slugify(params.file.name.replace(/\.[^.]+$/, '')) || 'asset';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${baseName}.${cleanExt}`;
  const storagePath = `${params.folder}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, params.file, {
      cacheControl: '3600',
      upsert: false,
      contentType: params.file.type,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: pubData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  const publicUrl = pubData.publicUrl;

  const { data: row, error: dbError } = await supabase
    .from('media_library')
    .insert({
      file_name: params.file.name,
      file_path: storagePath,
      public_url: publicUrl,
      mime_type: params.file.type,
      file_size: params.file.size,
      folder: params.folder,
      alt_text: params.altText || params.file.name,
      uploaded_by: params.uploadedBy || null,
    })
    .select('*')
    .single();

  if (dbError) {
    throw new Error(dbError.message);
  }

  return row as CmsMediaAsset;
}

export async function replaceMediaFile(params: {
  asset: CmsMediaAsset;
  newFile: File;
}): Promise<CmsMediaAsset> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const isDoc = ALLOWED_DOCUMENT_TYPES.includes(params.newFile.type);
  const check = validateUploadFile(params.newFile, isDoc ? 'document' : 'image');
  if (!check.valid) {
    throw new Error(check.error || 'Replacement file failed validation.');
  }

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(params.asset.file_path, params.newFile, {
      cacheControl: '0',
      upsert: true,
      contentType: params.newFile.type,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: pubData } = supabase.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(params.asset.file_path);

  const bustedUrl = `${pubData.publicUrl}?v=${Date.now()}`;

  const { data: row, error: dbError } = await supabase
    .from('media_library')
    .update({
      file_name: params.newFile.name,
      mime_type: params.newFile.type,
      file_size: params.newFile.size,
      public_url: bustedUrl,
    })
    .eq('id', params.asset.id)
    .select('*')
    .single();

  if (dbError) {
    throw new Error(dbError.message);
  }

  return row as CmsMediaAsset;
}

export async function deleteMediaFile(asset: CmsMediaAsset): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { error: storageError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove([asset.file_path]);

  if (storageError) {
    throw new Error(storageError.message);
  }

  const { error: dbError } = await supabase
    .from('media_library')
    .delete()
    .eq('id', asset.id);

  if (dbError) {
    throw new Error(dbError.message);
  }
}

export async function logAdminActivity(params: {
  adminId?: string | null;
  adminEmail: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityLabel: string;
  previousValues?: Record<string, unknown> | null;
  updatedValues?: Record<string, unknown> | null;
}): Promise<void> {
  if (!supabase) return;

  await supabase.from('activity_logs').insert({
    admin_id: params.adminId || null,
    admin_email: params.adminEmail,
    admin_name: params.adminName,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId || '',
    entity_label: params.entityLabel,
    previous_values: params.previousValues ?? null,
    updated_values: params.updatedValues ?? null,
  });
}
