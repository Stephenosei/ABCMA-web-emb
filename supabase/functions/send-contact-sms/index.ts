// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const MNOTIFY_QUICK_SMS_ENDPOINT = 'https://api.mnotify.com/api/sms/quick';
const SENDER_ID = 'ABCMA';
const MAX_RECORD_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'https://abcma.gov.gh',
  'https://www.abcma.gov.gh',
];

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const cleanOrigin = normalizeOrigin(origin);

  const extra = (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map((o) => normalizeOrigin(o))
    .filter(Boolean);

  if (DEFAULT_ALLOWED_ORIGINS.includes(cleanOrigin) || extra.includes(cleanOrigin)) {
    return true;
  }

  try {
    const parsed = new URL(cleanOrigin);
    const host = parsed.hostname.toLowerCase();

    if (parsed.protocol === 'http:' && (host === 'localhost' || host === '127.0.0.1')) {
      return true;
    }

    if (parsed.protocol !== 'https:') return false;

    // Allow official Vercel deployments, regional Google Cloud Run AI Studio previews, and ABCMA domains
    if (host.endsWith('.vercel.app')) return true;
    if (/^ais-(dev|pre)-[a-z0-9-]+(?:\.[a-z0-9-]+)*\.run\.app$/i.test(host)) return true;
    if (host === 'abcma.gov.gh' || host.endsWith('.abcma.gov.gh')) return true;
  } catch {
    return false;
  }

  return false;
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
  };

  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = normalizeOrigin(origin);
  }

  return headers;
}

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function normalizeGhanaPhoneForMnotify(rawPhone: string): {
  valid: boolean;
  normalized: string | null;
  error?: string;
} {
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
      error: 'Phone number does not match a supported Ghanaian mobile format.',
    };
  }

  // Supported Ghanaian mobile operator prefixes (MTN, Telecel, AT, Glo, Expresso)
  if (!/^(2[0345678]|5[0345679])\d{7}$/.test(localNineDigits)) {
    return {
      valid: false,
      normalized: null,
      error: 'Phone number must be a valid Ghanaian mobile number.',
    };
  }

  return {
    valid: true,
    normalized: `0${localNineDigits}`,
  };
}

function sanitizeVisitorName(rawName: string): string {
  const clean = (rawName || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  return clean;
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return '***';
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}

function scrubSecrets(text: string, apiKey?: string): string {
  let cleaned = (text || '').replace(/([?&]key=)[^&\s]+/gi, '$1[REDACTED]');
  if (apiKey && apiKey.length >= 6) {
    cleaned = cleaned.split(apiKey).join('[REDACTED]');
  }
  return cleaned.slice(0, 350);
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);

  // Enforce strict CORS when an Origin header is supplied by browsers
  if (origin && !isAllowedOrigin(origin)) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Origin not permitted.' }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          Vary: 'Origin',
        },
      }
    );
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed.' }, corsHeaders);
  }

  const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').trim();
  const serviceRoleKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();
  const mnotifyApiKey = (Deno.env.get('MNOTIFY_API_KEY') || '').trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[send-contact-sms] Missing Supabase server environment variables.');
    return jsonResponse(
      500,
      { ok: false, smsStatus: 'failed', error: 'SMS service configuration incomplete.' },
      corsHeaders
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse(400, { ok: false, error: 'Invalid JSON request body.' }, corsHeaders);
  }

  const rawContactId =
    typeof payload.contactId === 'string'
      ? payload.contactId.trim()
      : typeof payload.contact_id === 'string'
        ? payload.contact_id.trim()
        : '';

  if (!UUID_REGEX.test(rawContactId)) {
    return jsonResponse(400, { ok: false, error: 'Invalid contact record ID.' }, corsHeaders);
  }

  // Service-role client strictly on server; browser recipient/message params are never trusted
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Fetch contact record strictly from database
  const { data: contactRow, error: fetchError } = await adminClient
    .from('contact_messages')
    .select('id, ticket_reference, full_name, phone_number, sms_status, sms_sent_at, created_at')
    .eq('id', rawContactId)
    .maybeSingle();

  if (fetchError) {
    console.error('[send-contact-sms] Database read failed:', { contactId: rawContactId });
    return jsonResponse(
      500,
      { ok: false, smsStatus: 'failed', error: 'Unable to retrieve enquiry record.' },
      corsHeaders
    );
  }

  if (!contactRow) {
    return jsonResponse(404, { ok: false, error: 'Contact enquiry record not found.' }, corsHeaders);
  }

  // 2. Idempotency checks BEFORE claiming
  if (contactRow.sms_status === 'sent') {
    return jsonResponse(
      200,
      {
        ok: true,
        alreadySent: true,
        smsStatus: 'sent',
        sentAt: contactRow.sms_sent_at,
        message: 'Confirmation SMS was already sent for this enquiry.',
      },
      corsHeaders
    );
  }

  if (contactRow.sms_status === 'processing') {
    return jsonResponse(
      409,
      {
        ok: false,
        smsStatus: 'processing',
        error: 'Confirmation SMS is currently being processed.',
      },
      corsHeaders
    );
  }

  if (contactRow.sms_status === 'failed') {
    return jsonResponse(
      200,
      {
        ok: false,
        smsStatus: 'failed',
        error: 'Confirmation SMS could not be delivered.',
      },
      corsHeaders
    );
  }

  // Prevent replay on stale historical pending records
  const createdMs = new Date(contactRow.created_at).getTime();
  if (!Number.isNaN(createdMs) && Date.now() - createdMs > MAX_RECORD_AGE_MS) {
    await adminClient
      .from('contact_messages')
      .update({
        sms_status: 'failed',
        sms_error: 'Enquiry window expired before SMS dispatch.',
      })
      .eq('id', rawContactId)
      .eq('sms_status', 'pending');

    return jsonResponse(
      400,
      { ok: false, smsStatus: 'failed', error: 'Enquiry SMS window expired.' },
      corsHeaders
    );
  }

  // 3. Validate visitor name & Ghanaian mobile number from DB record
  const visitorName = sanitizeVisitorName(contactRow.full_name || '');
  const phoneCheck = normalizeGhanaPhoneForMnotify(contactRow.phone_number || '');

  if (visitorName.length < 2 || !phoneCheck.valid || !phoneCheck.normalized) {
    const validationErr =
      visitorName.length < 2
        ? 'Invalid visitor name on enquiry record.'
        : phoneCheck.error || 'Invalid Ghanaian mobile number.';

    await adminClient
      .from('contact_messages')
      .update({
        sms_status: 'failed',
        sms_error: validationErr,
      })
      .eq('id', rawContactId)
      .eq('sms_status', 'pending');

    console.warn('[send-contact-sms] Validation rejected:', {
      contactId: rawContactId,
      reason: validationErr,
    });

    return jsonResponse(
      200,
      { ok: false, smsStatus: 'failed', error: validationErr },
      corsHeaders
    );
  }

  const normalizedPhone = phoneCheck.normalized;

  // 4. Server-side SMS rate limit check before claiming/sending
  const ipHash = await sha256Hex(getClientIp(req));
  const phoneHash = await sha256Hex(normalizedPhone);

  const { data: rateData, error: rateErr } = await adminClient.rpc(
    'check_and_increment_sms_rate_limit',
    {
      p_ip_hash: ipHash,
      p_phone_hash: phoneHash,
      p_max_per_ip: 5,
      p_max_per_phone: 3,
      p_window_minutes: 15,
    }
  );

  if (!rateErr && rateData && rateData.allowed === false) {
    const rateMsg = 'SMS rate limit reached. Please try again later.';
    await adminClient
      .from('contact_messages')
      .update({
        sms_status: 'failed',
        sms_error: rateMsg,
        normalized_phone: normalizedPhone,
      })
      .eq('id', rawContactId)
      .eq('sms_status', 'pending');

    console.warn('[send-contact-sms] Rate limited:', {
      contactId: rawContactId,
      maskedPhone: maskPhone(normalizedPhone),
      reason: rateData.reason,
    });

    return jsonResponse(
      429,
      { ok: false, smsStatus: 'failed', error: rateMsg },
      corsHeaders
    );
  }

  // 5. Atomically claim pending -> processing to guarantee zero duplicate SMS sends
  const { data: claimedRows, error: claimError } = await adminClient.rpc(
    'claim_contact_sms',
    { p_contact_id: rawContactId }
  );

  if (claimError) {
    console.error('[send-contact-sms] Atomic claim error:', { contactId: rawContactId });
    return jsonResponse(
      500,
      { ok: false, smsStatus: 'failed', error: 'Unable to lock SMS delivery job.' },
      corsHeaders
    );
  }

  if (!Array.isArray(claimedRows) || claimedRows.length === 0) {
    // Another concurrent invocation claimed this record first
    const { data: latest } = await adminClient
      .from('contact_messages')
      .select('sms_status, sms_sent_at')
      .eq('id', rawContactId)
      .maybeSingle();

    if (latest?.sms_status === 'sent') {
      return jsonResponse(
        200,
        { ok: true, alreadySent: true, smsStatus: 'sent', sentAt: latest.sms_sent_at },
        corsHeaders
      );
    }

    return jsonResponse(
      409,
      {
        ok: false,
        smsStatus: latest?.sms_status || 'processing',
        error: 'Duplicate SMS request ignored.',
      },
      corsHeaders
    );
  }

  if (!mnotifyApiKey) {
    const missingKeyErr = 'MNOTIFY_API_KEY secret is not configured on the server.';
    await adminClient
      .from('contact_messages')
      .update({
        sms_status: 'failed',
        sms_error: missingKeyErr,
        normalized_phone: normalizedPhone,
      })
      .eq('id', rawContactId)
      .eq('sms_status', 'processing');

    console.error('[send-contact-sms] Missing MNOTIFY_API_KEY secret.');
    return jsonResponse(
      200,
      { ok: false, smsStatus: 'failed', error: 'SMS gateway is not configured.' },
      corsHeaders
    );
  }

  // 6. Construct required personalized message and invoke mNotify API
  const smsMessage = `Dear ${visitorName}, thank you for contacting Ablekuma Municipal Assembly (ABCMA). Your enquiry has been successfully received. Our team will attend to it as soon as possible. Thank you.`;

  try {
    const endpointUrl = `${MNOTIFY_QUICK_SMS_ENDPOINT}?key=${encodeURIComponent(mnotifyApiKey)}`;
    const mnotifyRes = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        recipient: [normalizedPhone],
        sender: SENDER_ID,
        message: smsMessage,
        is_schedule: false,
        schedule_date: '',
      }),
      signal: AbortSignal.timeout(12000),
    });

    const rawResponseText = await mnotifyRes.text();
    let mnotifyJson: Record<string, unknown> | null = null;
    try {
      mnotifyJson = rawResponseText ? (JSON.parse(rawResponseText) as Record<string, unknown>) : null;
    } catch {
      mnotifyJson = null;
    }

    const acceptedByMnotify =
      mnotifyRes.ok &&
      mnotifyJson?.status === 'success' &&
      String(mnotifyJson?.code ?? '') === '2000';

    if (!acceptedByMnotify) {
      const upstreamDetail =
        typeof mnotifyJson?.message === 'string' && mnotifyJson.message.trim()
          ? mnotifyJson.message.trim()
          : rawResponseText.trim()
            ? rawResponseText.trim()
            : `mNotify rejected SMS (HTTP ${mnotifyRes.status})`;

      const upstreamReason = scrubSecrets(upstreamDetail, mnotifyApiKey);

      await adminClient
        .from('contact_messages')
        .update({
          sms_status: 'failed',
          sms_error: upstreamReason,
          normalized_phone: normalizedPhone,
        })
        .eq('id', rawContactId)
        .eq('sms_status', 'processing');

      console.error('[send-contact-sms] mNotify API error:', {
        contactId: rawContactId,
        maskedPhone: maskPhone(normalizedPhone),
        httpStatus: mnotifyRes.status,
        status: mnotifyJson?.status ? String(mnotifyJson.status) : undefined,
        code: mnotifyJson?.code !== undefined ? String(mnotifyJson.code) : undefined,
        reason: upstreamReason,
      });

      return jsonResponse(
        200,
        {
          ok: false,
          smsStatus: 'failed',
          error: 'SMS confirmation could not be delivered.',
        },
        corsHeaders
      );
    }

    const sentAt = new Date().toISOString();
    const summaryObj = (mnotifyJson?.summary || {}) as Record<string, unknown>;
    const providerId = typeof summaryObj._id === 'string' ? summaryObj._id : '';

    await adminClient
      .from('contact_messages')
      .update({
        sms_status: 'sent',
        sms_sent_at: sentAt,
        sms_error: null,
        normalized_phone: normalizedPhone,
        sms_provider_id: providerId || null,
      })
      .eq('id', rawContactId)
      .eq('sms_status', 'processing');

    console.info('[send-contact-sms] Confirmation SMS accepted:', {
      contactId: rawContactId,
      maskedPhone: maskPhone(normalizedPhone),
      ticket: contactRow.ticket_reference,
      providerId: providerId || undefined,
    });

    return jsonResponse(
      200,
      {
        ok: true,
        smsStatus: 'sent',
        sentAt,
        message: 'Confirmation SMS sent successfully.',
      },
      corsHeaders
    );
  } catch (err) {
    const safeErr = scrubSecrets(
      err instanceof Error ? err.message : 'Network error calling mNotify gateway.',
      mnotifyApiKey
    );

    await adminClient
      .from('contact_messages')
      .update({
        sms_status: 'failed',
        sms_error: safeErr,
        normalized_phone: normalizedPhone,
      })
      .eq('id', rawContactId)
      .eq('sms_status', 'processing');

    console.error('[send-contact-sms] Upstream request exception:', {
      contactId: rawContactId,
      maskedPhone: maskPhone(normalizedPhone),
      reason: safeErr,
    });

    return jsonResponse(
      200,
      {
        ok: false,
        smsStatus: 'failed',
        error: 'SMS confirmation could not be delivered.',
      },
      corsHeaders
    );
  }
});
