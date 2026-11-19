-- ============================================================================
-- Ablekuma Central Municipal Assembly (ABCMA) - Security Hardening Migration
-- Migration 004:
--   1. Least-privilege Postgres schema & table grants (no blanket anon SELECT)
--   2. Strict RLS policies replacing broad USING (true) rules on settings & media
--   3. Private document audience support ('public' vs 'internal')
--   4. Private Storage bucket 'abcma-internal-docs' + remove SVG XSS vector
--   5. Last-super-admin deletion/demotion trigger & admin column protection
--   6. Immutable Audit Logs (no UPDATE/DELETE, auth.uid() binding)
--   7. Server-side brute-force rate limiting & security audit RPCs
-- Idempotent & preserves all existing administrator accounts and CMS data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DOCUMENTS AUDIENCE & STORAGE METADATA
-- ----------------------------------------------------------------------------
alter table public.documents
  add column if not exists audience text not null default 'public'
    check (audience in ('public', 'internal')),
  add column if not exists storage_bucket text not null default 'abcma-media',
  add column if not exists storage_path text;

create index if not exists idx_documents_status_audience
  on public.documents(status, audience, created_at desc);

-- ----------------------------------------------------------------------------
-- 2. ENHANCED AUDIT LOG COLUMNS
-- ----------------------------------------------------------------------------
alter table public.activity_logs
  add column if not exists outcome text not null default 'success'
    check (outcome in ('success', 'failure', 'blocked')),
  add column if not exists metadata jsonb;

create index if not exists idx_activity_logs_action_created
  on public.activity_logs(action, created_at desc);

-- ----------------------------------------------------------------------------
-- 3. RATE-LIMITING STORE FOR AUTHENTICATION BRUTE-FORCE DEFENSE
-- ----------------------------------------------------------------------------
create table if not exists public.login_rate_limits (
  email_hash text primary key,
  failed_attempts integer not null default 0,
  first_failed_at timestamptz,
  locked_until timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.login_rate_limits enable row level security;
revoke all on public.login_rate_limits from anon, authenticated, public;

-- ----------------------------------------------------------------------------
-- 4. PREVENT REMOVING, DEMOTING, OR SUSPENDING THE LAST ACTIVE SUPER ADMIN
-- ----------------------------------------------------------------------------
create or replace function public.prevent_last_super_admin_loss()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_super_role_id uuid;
  v_remaining_super_admins integer;
begin
  select id into v_super_role_id
  from public.admin_roles
  where slug = 'super_admin'
  limit 1;

  if v_super_role_id is null then
    return coalesce(new, old);
  end if;

  -- Check only if the target row is currently an active super_admin
  if old.role_id = v_super_role_id and old.is_active = true then
    if tg_op = 'DELETE'
       or new.is_active = false
       or new.role_id <> v_super_role_id then
      select count(*)
      into v_remaining_super_admins
      from public.admin_profiles ap
      where ap.id <> old.id
        and ap.role_id = v_super_role_id
        and ap.is_active = true;

      if v_remaining_super_admins < 1 then
        raise exception 'Cannot remove, demote, or suspend the last active Super Administrator account.';
      end if;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_prevent_last_super_admin_loss on public.admin_profiles;
create trigger trg_prevent_last_super_admin_loss
  before update or delete on public.admin_profiles
  for each row execute function public.prevent_last_super_admin_loss();

-- Harden column protection trigger on admin_profiles
create or replace function public.protect_admin_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if not public.is_super_admin() then
    if new.id is distinct from old.id
      or new.email is distinct from old.email
      or new.role_id is distinct from old.role_id
      or new.is_active is distinct from old.is_active then
      raise exception 'Only an active Super Administrator may modify privileged account fields.';
    end if;
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. SERVER-SIDE LOGIN RATE LIMIT & SECURITY AUDIT LOGGING RPCS
-- ----------------------------------------------------------------------------
create or replace function public.mask_email_for_audit(p_email text)
returns text
language plpgsql
immutable
as $$
declare
  v_clean text := lower(trim(coalesce(p_email, '')));
  v_at integer;
  v_local text;
  v_domain text;
begin
  v_at := position('@' in v_clean);
  if v_at <= 1 then
    return '***';
  end if;
  v_local := substring(v_clean from 1 for v_at - 1);
  v_domain := substring(v_clean from v_at + 1);
  return substring(v_local from 1 for 1) || '***@' || v_domain;
end;
$$;

create or replace function public.check_login_rate_limit(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_rec public.login_rate_limits%rowtype;
  v_now timestamptz := timezone('utc', now());
  v_retry integer := 0;
begin
  if coalesce(trim(p_email), '') = '' then
    return jsonb_build_object('blocked', false, 'retry_after_seconds', 0, 'failed_attempts', 0);
  end if;

  v_hash := encode(sha256(convert_to(lower(trim(p_email)), 'UTF8')), 'hex');
  select * into v_rec from public.login_rate_limits where email_hash = v_hash;

  if not found then
    return jsonb_build_object('blocked', false, 'retry_after_seconds', 0, 'failed_attempts', 0);
  end if;

  if v_rec.locked_until is not null and v_rec.locked_until > v_now then
    v_retry := greatest(1, ceil(extract(epoch from (v_rec.locked_until - v_now)))::integer);
    return jsonb_build_object(
      'blocked', true,
      'retry_after_seconds', v_retry,
      'failed_attempts', v_rec.failed_attempts
    );
  end if;

  -- Window reset after 20 minutes of quiet
  if v_rec.first_failed_at is not null and v_rec.first_failed_at < (v_now - interval '20 minutes') then
    update public.login_rate_limits
    set failed_attempts = 0, first_failed_at = null, locked_until = null, updated_at = v_now
    where email_hash = v_hash;
    return jsonb_build_object('blocked', false, 'retry_after_seconds', 0, 'failed_attempts', 0);
  end if;

  return jsonb_build_object(
    'blocked', false,
    'retry_after_seconds', 0,
    'failed_attempts', v_rec.failed_attempts
  );
end;
$$;

create or replace function public.record_login_attempt(
  p_email text,
  p_success boolean,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clean_email text := lower(trim(coalesce(p_email, '')));
  v_masked text := public.mask_email_for_audit(p_email);
  v_hash text;
  v_now timestamptz := timezone('utc', now());
  v_rec public.login_rate_limits%rowtype;
  v_attempts integer := 0;
  v_locked_until timestamptz := null;
  v_retry integer := 0;
  v_admin_profile public.admin_profiles%rowtype;
begin
  if v_clean_email = '' then
    return jsonb_build_object('blocked', false, 'retry_after_seconds', 0);
  end if;

  v_hash := encode(sha256(convert_to(v_clean_email, 'UTF8')), 'hex');

  if p_success then
    -- Only active authenticated admins can clear failure state / record login success
    if auth.uid() is null then
      return jsonb_build_object('blocked', false, 'retry_after_seconds', 0);
    end if;

    select * into v_admin_profile
    from public.admin_profiles
    where id = auth.uid() and is_active = true;

    if not found then
      return jsonb_build_object('blocked', false, 'retry_after_seconds', 0);
    end if;

    delete from public.login_rate_limits where email_hash = v_hash;

    insert into public.activity_logs (
      admin_id, admin_email, admin_name, action, entity_type, entity_id,
      entity_label, outcome, metadata
    ) values (
      v_admin_profile.id,
      v_admin_profile.email,
      v_admin_profile.full_name,
      'LOGIN_SUCCESS',
      'admin_session',
      v_admin_profile.id::text,
      v_admin_profile.full_name || ' authenticated',
      'success',
      jsonb_build_object('role_verified', true)
    );

    return jsonb_build_object('blocked', false, 'retry_after_seconds', 0, 'failed_attempts', 0);
  end if;

  select * into v_rec from public.login_rate_limits where email_hash = v_hash;

  if not found or (v_rec.first_failed_at is not null and v_rec.first_failed_at < (v_now - interval '20 minutes')) then
    v_attempts := 1;
    insert into public.login_rate_limits (email_hash, failed_attempts, first_failed_at, locked_until, updated_at)
    values (v_hash, v_attempts, v_now, null, v_now)
    on conflict (email_hash) do update
      set failed_attempts = 1, first_failed_at = v_now, locked_until = null, updated_at = v_now;
  else
    v_attempts := v_rec.failed_attempts + 1;
    if v_attempts >= 8 then
      v_locked_until := v_now + interval '30 minutes';
    elsif v_attempts >= 5 then
      v_locked_until := v_now + interval '15 minutes';
    else
      v_locked_until := v_rec.locked_until;
    end if;

    update public.login_rate_limits
    set failed_attempts = v_attempts,
        locked_until = v_locked_until,
        updated_at = v_now
    where email_hash = v_hash;
  end if;

  insert into public.activity_logs (
    admin_id, admin_email, admin_name, action, entity_type, entity_id,
    entity_label, outcome, metadata
  ) values (
    null,
    v_masked,
    'Unauthenticated Attempt',
    case when v_locked_until is not null and v_locked_until > v_now then 'LOGIN_LOCKED' else 'LOGIN_FAILED' end,
    'admin_session',
    left(v_hash, 16),
    'Failed sign-in attempt (' || v_masked || ')',
    case when v_locked_until is not null and v_locked_until > v_now then 'blocked' else 'failure' end,
    jsonb_build_object(
      'attempts', v_attempts,
      'reason', coalesce(left(p_reason, 80), 'invalid_credentials')
    )
  );

  if v_locked_until is not null and v_locked_until > v_now then
    v_retry := greatest(1, ceil(extract(epoch from (v_locked_until - v_now)))::integer);
    return jsonb_build_object('blocked', true, 'retry_after_seconds', v_retry, 'failed_attempts', v_attempts);
  end if;

  return jsonb_build_object('blocked', false, 'retry_after_seconds', 0, 'failed_attempts', v_attempts);
end;
$$;

create or replace function public.record_security_event(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_entity_label text,
  p_outcome text default 'success',
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin public.admin_profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_admin
  from public.admin_profiles
  where id = auth.uid() and is_active = true;

  if not found then
    raise exception 'Active administrator profile required';
  end if;

  insert into public.activity_logs (
    admin_id, admin_email, admin_name, action, entity_type, entity_id,
    entity_label, outcome, metadata
  ) values (
    v_admin.id,
    v_admin.email,
    v_admin.full_name,
    left(coalesce(p_action, 'SECURITY_EVENT'), 80),
    left(coalesce(p_entity_type, 'security'), 60),
    left(coalesce(p_entity_id, ''), 120),
    left(coalesce(p_entity_label, ''), 200),
    case when p_outcome in ('success', 'failure', 'blocked') then p_outcome else 'success' end,
    p_metadata
  );
end;
$$;

revoke all on function public.check_login_rate_limit(text) from public;
grant execute on function public.check_login_rate_limit(text) to anon, authenticated;

revoke all on function public.record_login_attempt(text, boolean, text) from public;
grant execute on function public.record_login_attempt(text, boolean, text) to anon, authenticated;

revoke all on function public.record_security_event(text, text, text, text, text, jsonb) from public;
grant execute on function public.record_security_event(text, text, text, text, text, jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. HARDEN ROW-LEVEL SECURITY POLICIES (REPLACE OVERLY PERMISSIVE RULES)
-- ----------------------------------------------------------------------------

-- A. website_settings: hide 'draft' settings from anonymous visitors
drop policy if exists "website_settings_public_read" on public.website_settings;
create policy "website_settings_public_read"
  on public.website_settings for select
  using (status = 'published' or public.is_active_admin());

drop policy if exists "website_settings_update_publishers" on public.website_settings;
create policy "website_settings_update_publishers"
  on public.website_settings for update
  using (public.can_publish_or_delete())
  with check (public.can_publish_or_delete());

-- B. media_library: restrict enumeration to authenticated active admins only
drop policy if exists "media_library_public_read" on public.media_library;
create policy "media_library_admin_read"
  on public.media_library for select
  using (public.is_active_admin());

drop policy if exists "media_library_insert_editors" on public.media_library;
create policy "media_library_insert_editors"
  on public.media_library for insert
  with check (
    public.can_edit_content()
    and (uploaded_by is null or uploaded_by = auth.uid())
  );

-- C. documents: enforce 'public' vs 'internal' audience isolation
drop policy if exists "documents_public_read" on public.documents;
create policy "documents_public_read"
  on public.documents for select
  using (
    (status = 'published' and audience = 'public')
    or public.is_active_admin()
  );

-- D. staff_profiles: strictly publishable + is_public=true for public visitors
drop policy if exists "staff_public_read" on public.staff_profiles;
create policy "staff_public_read"
  on public.staff_profiles for select
  using ((status = 'published' and is_public = true) or public.is_active_admin());

-- E. admin_profiles: restrict account management strictly to active Super Admins
drop policy if exists "admin_profiles_super_admin_insert" on public.admin_profiles;
create policy "admin_profiles_super_admin_insert"
  on public.admin_profiles for insert
  with check (public.is_super_admin());

drop policy if exists "admin_profiles_update_self_or_super" on public.admin_profiles;
create policy "admin_profiles_update_self_or_super"
  on public.admin_profiles for update
  using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

drop policy if exists "admin_profiles_super_admin_delete" on public.admin_profiles;
create policy "admin_profiles_super_admin_delete"
  on public.admin_profiles for delete
  using (public.is_super_admin() and id <> auth.uid());

-- F. activity_logs: immutable audit trail; prevent log forging and restrict reads
drop policy if exists "activity_logs_select_admins" on public.activity_logs;
create policy "activity_logs_select_restricted"
  on public.activity_logs for select
  using (
    public.is_super_admin()
    or (public.is_active_admin() and admin_id = auth.uid())
  );

drop policy if exists "activity_logs_insert_admins" on public.activity_logs;
create policy "activity_logs_insert_admins"
  on public.activity_logs for insert
  with check (public.is_active_admin() and admin_id = auth.uid());

drop policy if exists "activity_logs_no_update" on public.activity_logs;
create policy "activity_logs_no_update"
  on public.activity_logs for update
  using (false);

drop policy if exists "activity_logs_no_delete" on public.activity_logs;
create policy "activity_logs_no_delete"
  on public.activity_logs for delete
  using (false);

revoke update, delete on public.activity_logs from anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. LEAST-PRIVILEGE TABLE GRANTS (REPLACE BLANKET ANON SELECT ON ALL TABLES)
-- ----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;

grant select on
  public.website_settings,
  public.navigation_items,
  public.pages,
  public.news,
  public.announcements,
  public.departments,
  public.staff_profiles,
  public.events,
  public.gallery_albums,
  public.gallery_images,
  public.documents
to anon;

-- Grant public read on projects if migration 003 has been applied
do $$
begin
  if to_regclass('public.projects') is not null then
    execute 'grant select on public.projects to anon';
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 8. SUPABASE STORAGE SECURITY HARDENING
--    - Remove 'image/svg+xml' from public 'abcma-media' bucket (blocks SVG XSS)
--    - Provision private 'abcma-internal-docs' bucket accessed via Signed URLs
-- ----------------------------------------------------------------------------
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
where id = 'abcma-media';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'abcma-internal-docs',
  'abcma-internal-docs',
  false,
  15728640, -- 15 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "abcma_internal_docs_admin_read" on storage.objects;
create policy "abcma_internal_docs_admin_read"
  on storage.objects for select
  using (bucket_id = 'abcma-internal-docs' and public.is_active_admin());

drop policy if exists "abcma_internal_docs_admin_upload" on storage.objects;
create policy "abcma_internal_docs_admin_upload"
  on storage.objects for insert
  with check (bucket_id = 'abcma-internal-docs' and public.can_edit_content());

drop policy if exists "abcma_internal_docs_admin_update" on storage.objects;
create policy "abcma_internal_docs_admin_update"
  on storage.objects for update
  using (bucket_id = 'abcma-internal-docs' and public.can_publish_or_delete())
  with check (bucket_id = 'abcma-internal-docs' and public.can_publish_or_delete());

drop policy if exists "abcma_internal_docs_admin_delete" on storage.objects;
create policy "abcma_internal_docs_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'abcma-internal-docs' and public.can_publish_or_delete());
