/**
 * Centralized Security Utilities for Ablekuma Central Municipal Assembly (ABCMA)
 *
 * Covers:
 * - HTML sanitization (Stored XSS prevention for CMS rich text)
 * - Strict URL & redirect validation (javascript:/data: & open-redirect prevention)
 * - Strong password policy validation
 * - File upload extension & magic-byte inspection
 * - Client-side brute-force & form rate limiting
 * - Error message sanitization & plaintext input hardening
 */

const BLOCKED_PASSWORDS = new Set([
  'password',
  'password123',
  'password1234',
  'admin123',
  'admin1234',
  'administrator',
  'abcma123',
  'abcma2026',
  '12345678',
  '123456789',
  '1234567890',
  'qwertyuiop',
  'qwerty123',
  'letmein123',
  'welcome123',
  'changeme123',
  'ghana123',
]);

const EXECUTABLE_EXTENSIONS = new Set([
  'svg',
  'svgz',
  'html',
  'htm',
  'xhtml',
  'js',
  'mjs',
  'cjs',
  'ts',
  'jsx',
  'tsx',
  'php',
  'phtml',
  'asp',
  'aspx',
  'jsp',
  'exe',
  'dll',
  'bat',
  'cmd',
  'sh',
  'bash',
  'ps1',
  'vbs',
  'vbe',
  'scr',
  'msi',
  'jar',
  'py',
  'rb',
  'pl',
  'cgi',
]);

export interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0 to 5
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasDigit: boolean;
    hasSpecial: boolean;
    notCommonOrEmail: boolean;
  };
  error?: string;
}

/**
 * Enforce strong administrator password policy:
 * - Minimum 12 characters (max 128)
 * - Uppercase, lowercase, digit, and special character
 * - Not in common leaked password blocklist or containing email username
 */
export function validateStrongPassword(
  password: string,
  email?: string
): PasswordValidationResult {
  const pwd = password || '';
  const lower = pwd.toLowerCase();
  const emailLocal = (email || '').trim().toLowerCase().split('@')[0] || '';

  const minLength = pwd.length >= 12 && pwd.length <= 128;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9\s]/.test(pwd);

  const containsEmailPart = emailLocal.length >= 3 && lower.includes(emailLocal);
  const isBlocked = BLOCKED_PASSWORDS.has(lower);
  const notCommonOrEmail = !isBlocked && !containsEmailPart;

  const checks = {
    minLength,
    hasUpper,
    hasLower,
    hasDigit,
    hasSpecial,
    notCommonOrEmail,
  };

  const score = [minLength, hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;
  const valid =
    minLength && hasUpper && hasLower && hasDigit && hasSpecial && notCommonOrEmail;

  let error: string | undefined;
  if (!minLength) {
    error = 'Password must be between 12 and 128 characters long.';
  } else if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    error =
      'Password must include uppercase, lowercase, a number, and a special symbol (e.g. !@#$%^&*).';
  } else if (!notCommonOrEmail) {
    error =
      'Choose a stronger password that is not commonly guessed and does not contain your email address.';
  }

  return { valid, score, checks, error };
}

/**
 * Strip ASCII control characters and collapse unsafe whitespace for form inputs.
 */
export function sanitizePlainText(value: string, maxLength = 500): string {
  return (value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Escape HTML special characters for safe attribute / text interpolation.
 */
export function escapeHtmlAttr(value: string): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Strict URL validation against XSS protocols (javascript:, data:, vbscript:)
 * and protocol-relative open redirects (//evil.com).
 */
export function sanitizeUrl(
  rawUrl: string | null | undefined,
  options: {
    allowRelative?: boolean;
    allowHash?: boolean;
    allowMailtoTel?: boolean;
    allowDataRasterImage?: boolean;
  } = {}
): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const {
    allowRelative = true,
    allowHash = false,
    allowMailtoTel = false,
    allowDataRasterImage = false,
  } = options;

  // Remove invisible control chars & leading/trailing whitespace
  const cleaned = rawUrl.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!cleaned) return null;

  if (allowHash && cleaned.startsWith('#')) {
    return /^#[A-Za-z0-9_-]{1,80}$/.test(cleaned) ? cleaned : null;
  }

  if (allowRelative && cleaned.startsWith('/')) {
    // Reject protocol-relative redirects like //attacker.com or /\attacker.com
    if (cleaned.startsWith('//') || cleaned.startsWith('/\\')) {
      return null;
    }
    return cleaned;
  }

  if (
    allowDataRasterImage &&
    /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(cleaned)
  ) {
    return cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    const proto = parsed.protocol.toLowerCase();
    if (proto === 'https:' || proto === 'http:') {
      return parsed.toString();
    }
    if (allowMailtoTel && (proto === 'mailto:' || proto === 'tel:')) {
      return cleaned;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Strict validation for ?redirect= URL parameter after /admin/login.
 * Prevents open redirects to external domains or non-admin routes.
 */
export function isSafeAdminRedirectPath(rawRedirect: string | null): string | null {
  if (!rawRedirect) return null;
  const trimmed = rawRedirect.trim();
  if (!trimmed.startsWith('/admin') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return null;
  }
  if (trimmed === '/admin/login') {
    return null;
  }
  if (!/^\/admin(\/[a-z-]+)?$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

const ALLOWED_HTML_TAGS = new Set([
  'p',
  'br',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'a',
  'img',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'hr',
  'div',
  'span',
]);

const STRIP_ENTIRELY_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'svg',
  'math',
  'form',
  'input',
  'textarea',
  'button',
  'select',
  'option',
  'meta',
  'link',
  'base',
  'noscript',
]);

const ALLOWED_GLOBAL_ATTRS = new Set(['class', 'title']);
const ALLOWED_TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel', 'title']),
  img: new Set(['src', 'alt', 'width', 'height', 'title']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
};

function sanitizeStyleAttribute(styleValue: string): string | null {
  const lower = styleValue.toLowerCase();
  if (
    lower.includes('expression') ||
    lower.includes('javascript:') ||
    lower.includes('vbscript:') ||
    lower.includes('-moz-binding') ||
    lower.includes('behavior:') ||
    lower.includes('url(')
  ) {
    return null;
  }
  const safeDeclarations: string[] = [];
  for (const part of styleValue.split(';')) {
    const colonIdx = part.indexOf(':');
    if (colonIdx <= 0) continue;
    const prop = part.slice(0, colonIdx).trim().toLowerCase();
    const val = part.slice(colonIdx + 1).trim();
    if (
      [
        'width',
        'max-width',
        'height',
        'border',
        'border-collapse',
        'border-radius',
        'padding',
        'margin',
        'background',
        'background-color',
        'color',
        'text-align',
        'font-weight',
      ].includes(prop) &&
      val.length > 0 &&
      val.length < 80
    ) {
      safeDeclarations.push(`${prop}: ${val}`);
    }
  }
  return safeDeclarations.length > 0 ? safeDeclarations.join('; ') : null;
}

/**
 * Strict allowlist HTML sanitizer to mitigate Stored XSS across rich text CMS pages & previews.
 */
export function sanitizeHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';

  // Non-DOM fallback (e.g. Node unit tests)
  if (typeof DOMParser === 'undefined') {
    return dirtyHtml
      .replace(/<\s*(script|style|iframe|object|embed|svg|math|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
      .replace(/<\s*(script|style|iframe|object|embed|svg|math|form|meta|link|base)[^>]*\/?>/gi, '')
      .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/(href|src)\s*=\s*(?:"\s*(?:javascript|vbscript|data):[^"]*"|'\s*(?:javascript|vbscript|data):[^']*')/gi, '$1="#"');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(dirtyHtml, 'text/html');

  const cleanNode = (node: Node): void => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.COMMENT_NODE) {
        node.removeChild(child);
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) {
        continue;
      }

      const el = child as Element;
      const tag = el.tagName.toLowerCase();

      if (STRIP_ENTIRELY_TAGS.has(tag)) {
        node.removeChild(el);
        continue;
      }

      cleanNode(el);

      if (!ALLOWED_HTML_TAGS.has(tag)) {
        // Unwrap unknown/disallowed container tags while keeping safe text children
        while (el.firstChild) {
          node.insertBefore(el.firstChild, el);
        }
        node.removeChild(el);
        continue;
      }

      const tagSpecific = ALLOWED_TAG_ATTRS[tag];
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction') {
          el.removeAttribute(attr.name);
          continue;
        }

        if (name === 'style') {
          const safeStyle = sanitizeStyleAttribute(attr.value);
          if (safeStyle) {
            el.setAttribute('style', safeStyle);
          } else {
            el.removeAttribute('style');
          }
          continue;
        }

        if (!ALLOWED_GLOBAL_ATTRS.has(name) && !(tagSpecific && tagSpecific.has(name))) {
          el.removeAttribute(attr.name);
          continue;
        }

        if (name === 'href') {
          const safeHref = sanitizeUrl(attr.value, {
            allowRelative: true,
            allowHash: true,
            allowMailtoTel: true,
          });
          if (!safeHref) {
            el.removeAttribute('href');
          } else {
            el.setAttribute('href', safeHref);
          }
        }

        if (name === 'src') {
          const safeSrc = sanitizeUrl(attr.value, {
            allowRelative: true,
            allowDataRasterImage: true,
          });
          if (!safeSrc) {
            el.removeAttribute('src');
          } else {
            el.setAttribute('src', safeSrc);
          }
        }
      }

      if (tag === 'a') {
        if (el.getAttribute('target') === '_blank') {
          el.setAttribute('rel', 'noopener noreferrer');
        } else {
          el.removeAttribute('target');
        }
      }
    }
  };

  cleanNode(doc.body);
  return doc.body.innerHTML;
}

const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
};

function startsWithBytes(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, idx) => bytes[idx] === byte);
}

/**
 * Inspect file extension + binary magic bytes before allowing upload to Supabase Storage.
 * Explicitly blocks SVG (XSS vector) and executables / double extensions.
 */
export async function inspectUploadFileSecurity(file: File): Promise<{
  valid: boolean;
  error?: string;
}> {
  const rawName = (file.name || '').trim();
  if (!rawName || rawName.includes('/') || rawName.includes('\\') || rawName.includes('..')) {
    return { valid: false, error: 'Invalid file name.' };
  }

  const segments = rawName.toLowerCase().split('.');
  if (segments.length < 2) {
    return { valid: false, error: 'File must have a valid extension.' };
  }

  const ext = segments[segments.length - 1];
  if (EXECUTABLE_EXTENSIONS.has(ext) || file.type === 'image/svg+xml') {
    return {
      valid: false,
      error: 'Executable scripts, HTML, and SVG files are blocked for security reasons.',
    };
  }

  // Block dangerous intermediate segments like payload.php.jpg or shell.html.pdf
  const innerSegments = segments.slice(1, -1);
  if (innerSegments.some((seg) => EXECUTABLE_EXTENSIONS.has(seg))) {
    return {
      valid: false,
      error: 'Suspicious multi-extension file name rejected.',
    };
  }

  const expectedExts = MIME_TO_EXTENSIONS[file.type];
  if (!expectedExts || !expectedExts.includes(ext)) {
    return {
      valid: false,
      error: 'File extension does not match an allowed safe format (JPG, PNG, WebP, PDF, DOC, DOCX).',
    };
  }

  // Verify magic bytes in browser runtime
  if (typeof file.slice === 'function') {
    try {
      const buffer = await file.slice(0, 16).arrayBuffer();
      const bytes = new Uint8Array(buffer);

      if (file.type === 'image/jpeg' && !startsWithBytes(bytes, [0xff, 0xd8, 0xff])) {
        return { valid: false, error: 'Invalid JPEG file signature detected.' };
      }
      if (
        file.type === 'image/png' &&
        !startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ) {
        return { valid: false, error: 'Invalid PNG file signature detected.' };
      }
      if (file.type === 'image/webp') {
        const isRiff = startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]);
        const isWebp =
          bytes.length >= 12 &&
          bytes[8] === 0x57 &&
          bytes[9] === 0x45 &&
          bytes[10] === 0x42 &&
          bytes[11] === 0x50;
        if (!isRiff || !isWebp) {
          return { valid: false, error: 'Invalid WebP file signature detected.' };
        }
      }
      if (
        file.type === 'application/pdf' &&
        !startsWithBytes(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])
      ) {
        return { valid: false, error: 'Invalid PDF header (%PDF-) detected.' };
      }
      if (
        file.type === 'application/msword' &&
        !startsWithBytes(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
      ) {
        return { valid: false, error: 'Invalid Word (.doc) file signature detected.' };
      }
      if (
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
        !startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04])
      ) {
        return { valid: false, error: 'Invalid Word (.docx) archive signature detected.' };
      }
    } catch {
      return { valid: false, error: 'Unable to inspect uploaded file signature.' };
    }
  }

  return { valid: true };
}

interface RateLimitBucket {
  timestamps: number[];
  lockedUntil: number;
}

const memoryBuckets = new Map<string, RateLimitBucket>();

function getBucket(key: string): RateLimitBucket {
  const fromMem = memoryBuckets.get(key);
  if (fromMem) return fromMem;

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(`__abcma_rl_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw) as RateLimitBucket;
        if (Array.isArray(parsed.timestamps)) {
          memoryBuckets.set(key, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore storage parse failure
    }
  }
  return { timestamps: [], lockedUntil: 0 };
}

function saveBucket(key: string, bucket: RateLimitBucket): void {
  memoryBuckets.set(key, bucket);
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(`__abcma_rl_${key}`, JSON.stringify(bucket));
    } catch {
      // Ignore storage quota errors
    }
  }
}

export function checkClientRateLimit(
  key: string,
  windowMs = 15 * 60 * 1000
): { blocked: boolean; retryAfterSeconds: number; attemptsInWindow: number } {
  const now = Date.now();
  const bucket = getBucket(key);
  const recent = bucket.timestamps.filter((ts) => now - ts < windowMs);

  if (bucket.lockedUntil > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.lockedUntil - now) / 1000)),
      attemptsInWindow: recent.length,
    };
  }

  return {
    blocked: false,
    retryAfterSeconds: 0,
    attemptsInWindow: recent.length,
  };
}

export function recordClientRateLimitEvent(
  key: string,
  options: {
    maxAttempts?: number;
    windowMs?: number;
    lockoutMs?: number;
  } = {}
): { blocked: boolean; retryAfterSeconds: number; attemptsInWindow: number } {
  const maxAttempts = options.maxAttempts ?? 5;
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const lockoutMs = options.lockoutMs ?? 15 * 60 * 1000;
  const now = Date.now();

  const bucket = getBucket(key);
  const recent = bucket.timestamps.filter((ts) => now - ts < windowMs);
  recent.push(now);

  let lockedUntil = bucket.lockedUntil > now ? bucket.lockedUntil : 0;
  if (recent.length >= maxAttempts && lockedUntil <= now) {
    lockedUntil = now + lockoutMs;
  }

  saveBucket(key, { timestamps: recent, lockedUntil });

  return {
    blocked: lockedUntil > now,
    retryAfterSeconds: lockedUntil > now ? Math.ceil((lockedUntil - now) / 1000) : 0,
    attemptsInWindow: recent.length,
  };
}

export function clearClientRateLimit(key: string): void {
  memoryBuckets.delete(key);
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.removeItem(`__abcma_rl_${key}`);
    } catch {
      // Ignore
    }
  }
}

/**
 * Normalize database / API error strings so raw internal Postgres/PostgREST details
 * are never exposed to the UI.
 */
export function toSafeErrorMessage(err: unknown, fallback = 'An unexpected error occurred.'): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : fallback;
  const lower = raw.toLowerCase();

  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'You do not have permission to perform this action.';
  }
  if (lower.includes('duplicate key') || lower.includes('already exists')) {
    return 'A record with this unique identifier or URL slug already exists.';
  }
  if (lower.includes('last active super administrator')) {
    return 'Operation blocked: Cannot remove, demote, or suspend the last active Super Administrator.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts detected. Please wait a few minutes before trying again.';
  }
  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Unable to reach ABCMA servers. Verify your internet connection and try again.';
  }

  // Strip SQL state codes or relation leaks if any remain
  if (/(pgrst|sqlstate|relation "|column "|constraint ")/i.test(raw)) {
    return fallback;
  }

  return raw || fallback;
}

export interface GhanaPhoneValidationResult {
  valid: boolean;
  normalized: string | null;
  error?: string;
}

/**
 * Validate and normalize Ghanaian mobile phone numbers for mNotify SMS delivery.
 * Accepts: 0241234567, 0201234567, 233241234567, +233241234567 (spaces/hyphens tolerated).
 * Returns normalized 10-digit Ghana mobile string (e.g. 0241234567) without altering raw storage input.
 */
export function normalizeGhanaPhoneNumber(rawPhone: string): GhanaPhoneValidationResult {
  const compact = (rawPhone || '').replace(/[\s().-]/g, '').trim();
  if (!compact) {
    return { valid: false, normalized: null, error: 'Phone number is required.' };
  }

  let localNineDigits = '';
  if (compact.startsWith('+233')) {
    localNineDigits = compact.slice(4);
  } else if (compact.startsWith('00233')) {
    localNineDigits = compact.slice(5);
  } else if (compact.startsWith('233') && compact.length === 12) {
    localNineDigits = compact.slice(3);
  } else if (compact.startsWith('0') && compact.length === 10) {
    localNineDigits = compact.slice(1);
  } else {
    return {
      valid: false,
      normalized: null,
      error:
        'Enter a valid Ghanaian mobile number (e.g. 0241234567, 0201234567, 233241234567, or +233241234567).',
    };
  }

  if (!/^(2[0345678]|5[0345679])\d{7}$/.test(localNineDigits)) {
    return {
      valid: false,
      normalized: null,
      error:
        'Phone number does not match a valid Ghanaian mobile network prefix (e.g. 024, 020, 054, 055, 059, 026, 027, 050, 053).',
    };
  }

  return {
    valid: true,
    normalized: `0${localNineDigits}`,
  };
}

export function maskPhoneNumber(phone: string): string {
  const cleaned = (phone || '').trim();
  if (cleaned.length < 6) return '***';
  return `${cleaned.slice(0, 3)}****${cleaned.slice(-3)}`;
}

