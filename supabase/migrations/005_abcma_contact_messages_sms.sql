-- ============================================================================
-- Ablekuma Central Municipal Assembly (ABCMA) - Contact Enquiries & mNotify SMS
-- Migration 005:
--   1. Create/extend public.contact_messages with SMS tracking columns
--   2. Server-side SMS rate-limit table & check helper (service_role only)
--   3. SECURITY DEFINER public.submit_contact_message RPC (no anon SELECT PII leak)
--   4. Atomic claim RPC public.claim_contact_sms (prevents duplicate SMS sends)
--   5. Admin-only RLS policies for viewing/triaging contact submissions
-- Idempotent & preserves existing website tables, roles, and CMS content.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CONTACT MESSAGES TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_reference text not null unique,
  full_name text not null,
  phone_number text not null,
  normalized_phone text,
  email text not null default '',
  recipient_unit text not null default 'Client Service Unit / Central Administration',
  subject text not null,
  message text not null,
  inquiry_status text not null default 'new'
    check (inquiry_status in ('new', 'in_review', 'resolved', 'archived')),
  sms_status text not null default 'pending'
    check (sms_status in ('pending', 'processing', 'sent', 'failed')),
  sms_sent_at timestamptz,
  sms_error text,
  sms_provider_id text,
  sms_attempts integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Ensure columns exist if an earlier custom contact_messages table already existed
alter table public.contact_messages
  add column if not exists ticket_reference text,
  add column if not exists normalized_phone text,
  add column if not exists email text not null default '',
  add column if not exists recipient_unit text not null default 'Client Service Unit / Central Administration',
  add column if not exists inquiry_status text not null default 'new',
  add column if not exists sms_status text not null default 'pending',
  add column if not exists sms_sent_at timestamptz,
  add column if not exists sms_error text,
  add column if not exists sms_provider_id text,
  add column if not exists sms_attempts integer not null default 0,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'chk_contact_messages_sms_status'
  ) then
    alter table public.contact_messages
      add constraint chk_contact_messages_sms_status
      check (sms_status in ('pending', 'processing', 'sent', 'failed'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'chk_contact_messages_inquiry_status'
  ) then
    alter table public.contact_messages
      add constraint chk_contact_messages_inquiry_status
      check (inquiry_status in ('new', 'in_review', 'resolved', 'archived'));
  end if;
end $$;

create index if not exists idx_contact_messages_created_at
  on public.contact_messages(created_at desc);

create index if not exists idx_contact_messages_sms_status
  on public.contact_messages(sms_status, created_at desc);

create index if not exists idx_contact_messages_inquiry_status
  on public.contact_messages(inquiry_status, created_at desc);

drop trigger if exists trg_contact_messages_updated_at on public.contact_messages;
create trigger trg_contact_messages_updated_at
  before update on public.contact_messages
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2. ROW-LEVEL SECURITY (ADMIN READ/TRIAGE ONLY — NO ANON SELECT PII LEAK)
-- ----------------------------------------------------------------------------
alter table public.contact_messages enable row level security;

revoke all on public.contact_messages from anon, public;
grant select, update, delete on public.contact_messages to authenticated;

drop policy if exists "contact_messages_admin_select" on public.contact_messages;
create policy "contact_messages_admin_select"
  on public.contact_messages for select
  to authenticated
  using (public.is_active_admin());

drop policy if exists "contact_messages_admin_update" on public.contact_messages;
create policy "contact_messages_admin_update"
  on public.contact_messages for update
  to authenticated
  using (public.can_publish_or_delete())
  with check (public.can_publish_or_delete());

drop policy if exists "contact_messages_admin_delete" on public.contact_messages;
create policy "contact_messages_admin_delete"
  on public.contact_messages for delete
  to authenticated
  using (public.can_publish_or_delete());

-- ----------------------------------------------------------------------------
-- 3. PUBLIC SUBMISSION RPC (VALIDATES INPUTS & RETURNS NEW ID WITHOUT ANON SELECT)
-- ----------------------------------------------------------------------------
create or replace function public.submit_contact_message(
  p_full_name text,
  p_phone_number text,
  p_email text default '',
  p_recipient_unit text default 'Client Service Unit / Central Administration',
  p_subject text default '',
  p_message text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := regexp_replace(trim(coalesce(p_full_name, '')), '[\u0000-\u001F\u007F]', '', 'g');
  v_phone text := regexp_replace(trim(coalesce(p_phone_number, '')), '[\u0000-\u001F\u007F]', '', 'g');
  v_email text := regexp_replace(trim(coalesce(p_email, '')), '[\u0000-\u001F\u007F]', '', 'g');
  v_unit text := regexp_replace(trim(coalesce(p_recipient_unit, 'Client Service Unit / Central Administration')), '[\u0000-\u001F\u007F]', '', 'g');
  v_subject text := regexp_replace(trim(coalesce(p_subject, '')), '[\u0000-\u001F\u007F]', '', 'g');
  v_message text := regexp_replace(trim(coalesce(p_message, '')), '[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]', '', 'g');
  v_digits text;
  v_recent_count integer := 0;
  v_ticket text;
  v_inserted public.contact_messages%rowtype;
begin
  if length(v_name) < 2 or length(v_name) > 100 then
    raise exception 'Please enter a valid full name (2-100 characters).';
  end if;

  if length(v_phone) < 9 or length(v_phone) > 25 then
    raise exception 'Please enter a valid Ghanaian mobile phone number.';
  end if;

  if length(v_subject) < 2 or length(v_subject) > 150 then
    raise exception 'Please enter a valid enquiry subject (2-150 characters).';
  end if;

  if length(v_message) < 5 or length(v_message) > 2000 then
    raise exception 'Please enter your enquiry message details (5-2000 characters).';
  end if;

  if v_email <> '' and v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Please enter a valid email address or leave email blank.';
  end if;

  -- Strip non-digits for Ghanaian mobile prefix check & anti-flood guard
  v_digits := regexp_replace(v_phone, '[^0-9]', '', 'g');
  if v_digits ~ '^00233[235][0-9]{8}$' then
    v_digits := '0' || substring(v_digits from 6);
  elsif v_digits ~ '^233[235][0-9]{8}$' then
    v_digits := '0' || substring(v_digits from 4);
  elsif v_digits !~ '^0(2[0345678]|5[0345679])[0-9]{7}$' then
    raise exception 'Invalid Ghanaian mobile number. Accepted examples: 0241234567, 0201234567, 233241234567, or +233241234567.';
  end if;

  -- Basic anti-flood check per normalized phone number (max 5 submissions in 15 mins)
  select count(*)
  into v_recent_count
  from public.contact_messages cm
  where cm.normalized_phone = v_digits
    and cm.created_at > (timezone('utc', now()) - interval '15 minutes');

  if v_recent_count >= 5 then
    raise exception 'Too many enquiries submitted from this phone number. Please wait 15 minutes before trying again.';
  end if;

  v_ticket := 'ABCMA-INQ-' || to_char(timezone('utc', now()), 'YYYY') || '-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));

  insert into public.contact_messages (
    ticket_reference,
    full_name,
    phone_number,
    normalized_phone,
    email,
    recipient_unit,
    subject,
    message,
    inquiry_status,
    sms_status
  ) values (
    v_ticket,
    v_name,
    v_phone,
    v_digits,
    left(v_email, 160),
    left(coalesce(nullif(v_unit, ''), 'Client Service Unit / Central Administration'), 160),
    v_subject,
    v_message,
    'new',
    'pending'
  )
  returning * into v_inserted;

  return jsonb_build_object(
    'id', v_inserted.id,
    'ticket_reference', v_inserted.ticket_reference,
    'created_at', v_inserted.created_at
  );
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. SERVER-ONLY SMS RATE-LIMIT STORE & ATOMIC CLAIM RPC (SERVICE ROLE ONLY)
-- ----------------------------------------------------------------------------
create table if not exists public.sms_rate_limits (
  bucket_key text primary key,
  request_count integer not null default 0,
  window_started_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.sms_rate_limits enable row level security;
revoke all on public.sms_rate_limits from anon, authenticated, public;

create or replace function public.check_and_increment_sms_rate_limit(
  p_ip_hash text,
  p_phone_hash text,
  p_max_per_ip integer default 5,
  p_max_per_phone integer default 3,
  p_window_minutes integer default 15
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_cutoff timestamptz := v_now - make_interval(mins => p_window_minutes);
  v_ip_key text := 'ip:' || coalesce(nullif(p_ip_hash, ''), 'unknown');
  v_phone_key text := 'phone:' || coalesce(nullif(p_phone_hash, ''), 'unknown');
  v_ip_count integer := 0;
  v_phone_count integer := 0;
begin
  -- Upsert IP bucket
  insert into public.sms_rate_limits (bucket_key, request_count, window_started_at, updated_at)
  values (v_ip_key, 1, v_now, v_now)
  on conflict (bucket_key) do update
    set request_count = case
          when public.sms_rate_limits.window_started_at < v_cutoff then 1
          else public.sms_rate_limits.request_count + 1
        end,
        window_started_at = case
          when public.sms_rate_limits.window_started_at < v_cutoff then v_now
          else public.sms_rate_limits.window_started_at
        end,
        updated_at = v_now
  returning request_count into v_ip_count;

  if v_ip_count > p_max_per_ip then
    return jsonb_build_object('allowed', false, 'reason', 'ip_rate_limit_exceeded');
  end if;

  -- Upsert Phone bucket
  insert into public.sms_rate_limits (bucket_key, request_count, window_started_at, updated_at)
  values (v_phone_key, 1, v_now, v_now)
  on conflict (bucket_key) do update
    set request_count = case
          when public.sms_rate_limits.window_started_at < v_cutoff then 1
          else public.sms_rate_limits.request_count + 1
        end,
        window_started_at = case
          when public.sms_rate_limits.window_started_at < v_cutoff then v_now
          else public.sms_rate_limits.window_started_at
        end,
        updated_at = v_now
  returning request_count into v_phone_count;

  if v_phone_count > p_max_per_phone then
    return jsonb_build_object('allowed', false, 'reason', 'phone_rate_limit_exceeded');
  end if;

  return jsonb_build_object('allowed', true, 'ip_count', v_ip_count, 'phone_count', v_phone_count);
end;
$$;

revoke all on function public.check_and_increment_sms_rate_limit(text, text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.check_and_increment_sms_rate_limit(text, text, integer, integer, integer) to service_role;

create or replace function public.claim_contact_sms(p_contact_id uuid)
returns table (
  id uuid,
  ticket_reference text,
  full_name text,
  phone_number text,
  normalized_phone text,
  sms_status text,
  sms_attempts integer,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  update public.contact_messages cm
  set sms_status = 'processing',
      sms_attempts = cm.sms_attempts + 1,
      sms_error = null,
      updated_at = timezone('utc', now())
  where cm.id = p_contact_id
    and cm.sms_status = 'pending'
  returning
    cm.id,
    cm.ticket_reference,
    cm.full_name,
    cm.phone_number,
    cm.normalized_phone,
    cm.sms_status,
    cm.sms_attempts,
    cm.created_at;
$$;

revoke all on function public.claim_contact_sms(uuid) from public, anon, authenticated;
grant execute on function public.claim_contact_sms(uuid) to service_role;
