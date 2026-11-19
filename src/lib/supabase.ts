import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { CmsMediaAsset } from '../types/cms';
import { inspectUploadFileSecurity, toSafeErrorMessage } from '../utils/security';

export { supabase, isSupabaseConfigured };

export const MEDIA_BUCKET = 'abcma-media';
export const INTERNAL_DOCS_BUCKET = 'abcma-internal-docs';

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024; // 15 MB

const SENSITIVE_LOG_KEY_PATTERN =
  /(password|passcode|token|secret|authorization|cookie|credential|otp|totp|recovery)/i;

function scrubSensitiveFields(
  obj: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!obj || typeof obj !== 'object') return null;
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_LOG_KEY_PATTERN.test(key)) {
      clean[key] = '[REDACTED]';
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      clean[key] = scrubSensitiveFields(val as Record<string, unknown>);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

export function validateUploadFile(
  file: File,
  kind: 'image' | 'document' | 'any' = 'any'
): { valid: boolean; error?: string } {
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return {
      valid: false,
      error: 'SVG files are blocked for security reasons. Use PNG, JPG, or WebP instead.',
    };
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isDoc = ALLOWED_DOCUMENT_TYPES.includes(file.type);

  if (kind === 'image' && !isImage) {
    return {
      valid: false,
      error: 'Only JPG, PNG, or WebP image files are permitted.',
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
      error: 'Unsupported file type. Upload JPG, PNG, WebP, PDF, DOC, or DOCX.',
    };
  }

  const maxLimit = isImage ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (file.size <= 0) {
    return {
      valid: false,
      error: 'Empty files cannot be uploaded.',
    };
  }
  if (file.size > maxLimit) {
    return {
      valid: false,
      error: `File exceeds maximum size of ${Math.round(maxLimit / (1024 * 1024))} MB.`,
    };
  }

  return { valid: true };
}

export async function validateUploadFileAsync(
  file: File,
  kind: 'image' | 'document' | 'any' = 'any'
): Promise<{ valid: boolean; error?: string }> {
  const basic = validateUploadFile(file, kind);
  if (!basic.valid) return basic;
  return inspectUploadFileSecurity(file);
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

  const check = await validateUploadFileAsync(params.file, params.kind || 'any');
  if (!check.valid) {
    throw new Error(check.error || 'File validation failed.');
  }

  const safeFolder = slugify(params.folder) || 'general';
  const cleanExt = params.file.name.split('.').pop()?.toLowerCase() || 'bin';
  const baseName = slugify(params.file.name.replace(/\.[^.]+$/, '')) || 'asset';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${baseName}.${cleanExt}`;
  const storagePath = `${safeFolder}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, params.file, {
      cacheControl: '3600',
      upsert: false,
      contentType: params.file.type,
    });

  if (uploadError) {
    throw new Error(toSafeErrorMessage(uploadError.message, 'Unable to upload file to storage.'));
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
      folder: safeFolder,
      alt_text: params.altText || params.file.name,
      uploaded_by: params.uploadedBy || null,
    })
    .select('*')
    .single();

  if (dbError) {
    // Clean up orphaned object if metadata insert fails
    await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]).catch(() => {});
    throw new Error(toSafeErrorMessage(dbError.message, 'Unable to save media record.'));
  }

  return row as CmsMediaAsset;
}

export async function uploadInternalDocumentFile(params: {
  file: File;
  folder?: string;
}): Promise<{
  storageBucket: string;
  storagePath: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
}> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const check = await validateUploadFileAsync(params.file, 'document');
  if (!check.valid) {
    throw new Error(check.error || 'Document validation failed.');
  }

  const safeFolder = slugify(params.folder || 'internal-documents') || 'internal-documents';
  const cleanExt = params.file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const baseName = slugify(params.file.name.replace(/\.[^.]+$/, '')) || 'document';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${baseName}.${cleanExt}`;
  const storagePath = `${safeFolder}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from(INTERNAL_DOCS_BUCKET)
    .upload(storagePath, params.file, {
      cacheControl: '0',
      upsert: false,
      contentType: params.file.type,
    });

  if (uploadError) {
    throw new Error(
      toSafeErrorMessage(
        uploadError.message,
        'Unable to upload internal document to private storage. Ensure migration 004 has been applied.'
      )
    );
  }

  return {
    storageBucket: INTERNAL_DOCS_BUCKET,
    storagePath,
    fileName: params.file.name,
    fileSize: formatFileSize(params.file.size),
    mimeType: params.file.type,
  };
}

export async function getSignedDocumentUrl(
  storagePath: string,
  bucket = INTERNAL_DOCS_BUCKET,
  expiresInSeconds = 300
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(
      toSafeErrorMessage(error?.message, 'Unable to generate temporary signed download link.')
    );
  }
  return data.signedUrl;
}

export async function deleteInternalDocumentFile(
  storagePath: string,
  bucket = INTERNAL_DOCS_BUCKET
): Promise<void> {
  if (!supabase || !storagePath) return;
  const { error } = await supabase.storage.from(bucket).remove([storagePath]);
  if (error) {
    throw new Error(toSafeErrorMessage(error.message, 'Unable to remove private document file.'));
  }
}

export async function replaceMediaFile(params: {
  asset: CmsMediaAsset;
  newFile: File;
}): Promise<CmsMediaAsset> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const isDoc = ALLOWED_DOCUMENT_TYPES.includes(params.newFile.type);
  const check = await validateUploadFileAsync(params.newFile, isDoc ? 'document' : 'image');
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
    throw new Error(toSafeErrorMessage(uploadError.message, 'Unable to replace storage file.'));
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
    throw new Error(toSafeErrorMessage(dbError.message, 'Unable to update media metadata.'));
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
    throw new Error(toSafeErrorMessage(storageError.message, 'Unable to delete file from storage.'));
  }

  const { error: dbError } = await supabase
    .from('media_library')
    .delete()
    .eq('id', asset.id);

  if (dbError) {
    throw new Error(toSafeErrorMessage(dbError.message, 'Unable to delete media record.'));
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
  outcome?: 'success' | 'failure' | 'blocked';
  metadata?: Record<string, unknown> | null;
  previousValues?: Record<string, unknown> | null;
  updatedValues?: Record<string, unknown> | null;
}): Promise<void> {
  if (!supabase) return;

  const basePayload = {
    admin_id: params.adminId || null,
    admin_email: params.adminEmail,
    admin_name: params.adminName,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId || '',
    entity_label: params.entityLabel,
    previous_values: scrubSensitiveFields(params.previousValues),
    updated_values: scrubSensitiveFields(params.updatedValues),
  };

  const extendedPayload = {
    ...basePayload,
    outcome: params.outcome ?? 'success',
    metadata: scrubSensitiveFields(params.metadata),
  };

  const { error } = await supabase.from('activity_logs').insert(extendedPayload);
  if (error) {
    // Graceful fallback if migration 004 columns (outcome, metadata) are not yet applied
    await supabase.from('activity_logs').insert(basePayload);
  }
}

export async function checkServerLoginRateLimit(
  email: string
): Promise<{ blocked: boolean; retryAfterSeconds: number; failedAttempts: number }> {
  if (!supabase || !email.trim()) {
    return { blocked: false, retryAfterSeconds: 0, failedAttempts: 0 };
  }
  try {
    const { data, error } = await supabase.rpc('check_login_rate_limit', {
      p_email: email.trim().toLowerCase(),
    });
    if (error || !data) {
      return { blocked: false, retryAfterSeconds: 0, failedAttempts: 0 };
    }
    const res = data as {
      blocked?: boolean;
      retry_after_seconds?: number;
      failed_attempts?: number;
    };
    return {
      blocked: Boolean(res.blocked),
      retryAfterSeconds: Number(res.retry_after_seconds || 0),
      failedAttempts: Number(res.failed_attempts || 0),
    };
  } catch {
    return { blocked: false, retryAfterSeconds: 0, failedAttempts: 0 };
  }
}

export async function recordServerLoginAttempt(
  email: string,
  success: boolean,
  reason?: string
): Promise<{ blocked: boolean; retryAfterSeconds: number; failedAttempts: number }> {
  if (!supabase || !email.trim()) {
    return { blocked: false, retryAfterSeconds: 0, failedAttempts: 0 };
  }
  try {
    const { data, error } = await supabase.rpc('record_login_attempt', {
      p_email: email.trim().toLowerCase(),
      p_success: success,
      p_reason: reason || null,
    });
    if (error || !data) {
      return { blocked: false, retryAfterSeconds: 0, failedAttempts: 0 };
    }
    const res = data as {
      blocked?: boolean;
      retry_after_seconds?: number;
      failed_attempts?: number;
    };
    return {
      blocked: Boolean(res.blocked),
      retryAfterSeconds: Number(res.retry_after_seconds || 0),
      failedAttempts: Number(res.failed_attempts || 0),
    };
  } catch {
    return { blocked: false, retryAfterSeconds: 0, failedAttempts: 0 };
  }
}

export async function recordSecurityEvent(params: {
  action: string;
  entityType: string;
  entityId?: string;
  entityLabel: string;
  outcome?: 'success' | 'failure' | 'blocked';
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.rpc('record_security_event', {
      p_action: params.action,
      p_entity_type: params.entityType,
      p_entity_id: params.entityId || '',
      p_entity_label: params.entityLabel,
      p_outcome: params.outcome || 'success',
      p_metadata: scrubSensitiveFields(params.metadata),
    });
    if (!error) return;
  } catch {
    // Fallback to direct audit insert below
  }
}

