-- ============================================================================
-- Ablekuma Central Municipal Assembly (ABCMA)
-- Migration 006: Centralized Real-Time Admin Notifications & Tasks System
--
-- Reuses existing:
--   - public.admin_profiles, public.admin_roles
--   - public.activity_logs (via trigger -> admin_notifications)
--   - public.is_active_admin(), public.is_super_admin(), public.can_publish_or_delete()
--
-- Adds:
--   - public.admin_tasks
--   - public.admin_notifications
--   - public.admin_notification_reads
--   - public.admin_notification_preferences
--   - Server-authoritative triggers, RLS policies, directory & deadline RPCs
--   - Supabase Realtime publication registration
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ADMIN TASKS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  task_type text not null default 'general'
    check (task_type in ('general', 'approval_request', 'content_review', 'project_action', 'system_maintenance')),
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'needs_review', 'completed', 'cancelled')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  due_at timestamptz,
  assigned_to uuid references public.admin_profiles(id) on delete set null,
  created_by uuid references public.admin_profiles(id) on delete set null,
  related_entity_type text not null default '',
  related_entity_id text not null default '',
  related_entity_label text not null default '',
  action_section text not null default 'tasks',
  approaching_notified_at timestamptz,
  overdue_notified_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_tasks_assigned_status
  on public.admin_tasks(assigned_to, status, due_at);

create index if not exists idx_admin_tasks_created_by
  on public.admin_tasks(created_by, created_at desc);

create index if not exists idx_admin_tasks_due_active
  on public.admin_tasks(due_at)
  where status in ('pending', 'in_progress', 'needs_review');

drop trigger if exists trg_admin_tasks_updated_at on public.admin_tasks;
create trigger trg_admin_tasks_updated_at
  before update on public.admin_tasks
  for each row execute function public.handle_updated_at();

create or replace function public.handle_admin_task_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.created_by := auth.uid();
    end if;
    new.approaching_notified_at := null;
    new.overdue_notified_at := null;
    new.completed_at := case when new.status = 'completed' then timezone('utc', now()) else null end;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Preserve immutable authorship and server-managed deadline tracking columns
    new.created_by := old.created_by;

    if new.status = 'completed' and old.status <> 'completed' then
      new.completed_at := timezone('utc', now());
    elsif new.status <> 'completed' and old.status = 'completed' then
      new.completed_at := null;
    else
      new.completed_at := old.completed_at;
    end if;

    -- Reset deadline reminder flags only if due_at was extended to a later timestamp
    if new.due_at is distinct from old.due_at then
      if new.due_at is null or (old.due_at is not null and new.due_at > old.due_at) then
        new.approaching_notified_at := null;
        new.overdue_notified_at := null;
      end if;
    end if;

    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_admin_tasks_before_write on public.admin_tasks;
create trigger trg_admin_tasks_before_write
  before insert or update on public.admin_tasks
  for each row execute function public.handle_admin_task_before_write();

-- ----------------------------------------------------------------------------
-- 2. ADMIN NOTIFICATIONS TABLE (SERVER-GENERATED ONLY)
-- ----------------------------------------------------------------------------
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null
    check (category in ('task', 'website_update', 'co_admin_activity', 'system_alert')),
  event_type text not null default 'info',
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  audience_type text not null
    check (audience_type in ('personal', 'all_admins', 'role')),
  recipient_id uuid references public.admin_profiles(id) on delete cascade,
  recipient_role text
    check (recipient_role is null or recipient_role in ('super_admin', 'content_admin', 'editor')),
  actor_id uuid references public.admin_profiles(id) on delete set null,
  actor_name text not null default 'System',
  affected_section text not null default '',
  related_task_id uuid references public.admin_tasks(id) on delete set null,
  related_entity_type text not null default '',
  related_entity_id text not null default '',
  related_entity_label text not null default '',
  action_url text not null default '/admin/notifications',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint chk_admin_notifications_audience_target check (
    (audience_type = 'personal' and recipient_id is not null and recipient_role is null)
    or (audience_type = 'role' and recipient_role is not null and recipient_id is null)
    or (audience_type = 'all_admins' and recipient_id is null and recipient_role is null)
  )
);

create index if not exists idx_admin_notifications_created_at
  on public.admin_notifications(created_at desc);

create index if not exists idx_admin_notifications_recipient
  on public.admin_notifications(recipient_id, created_at desc)
  where recipient_id is not null;

create index if not exists idx_admin_notifications_category_priority
  on public.admin_notifications(category, priority, created_at desc);

-- ----------------------------------------------------------------------------
-- 3. PER-ADMIN READ RECEIPTS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.admin_notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.admin_notifications(id) on delete cascade,
  admin_id uuid not null references public.admin_profiles(id) on delete cascade,
  read_at timestamptz not null default timezone('utc', now()),
  unique (notification_id, admin_id)
);

create index if not exists idx_admin_notification_reads_admin
  on public.admin_notification_reads(admin_id, notification_id);

-- ----------------------------------------------------------------------------
-- 4. ADMIN NOTIFICATION PREFERENCES TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.admin_notification_preferences (
  admin_id uuid primary key references public.admin_profiles(id) on delete cascade,
  receive_task_notifications boolean not null default true,
  receive_co_admin_activities boolean not null default true,
  receive_publishing_notifications boolean not null default true,
  receive_system_alerts boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_admin_notification_prefs_updated_at on public.admin_notification_preferences;
create trigger trg_admin_notification_prefs_updated_at
  before update on public.admin_notification_preferences
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 5. SECURITY & VISIBILITY HELPERS (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
create or replace function public.can_view_notification(p_notification_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_notifications n
    join public.admin_profiles ap on ap.id = auth.uid() and ap.is_active = true
    join public.admin_roles ar on ar.id = ap.role_id
    where n.id = p_notification_id
      and (
        n.audience_type = 'all_admins'
        or (n.audience_type = 'personal' and n.recipient_id = auth.uid())
        or (n.audience_type = 'role' and n.recipient_role = ar.slug)
      )
  );
$$;

-- Safe active admin directory for task assignment (excludes sensitive account metadata)
create or replace function public.list_active_admin_directory()
returns table (
  id uuid,
  full_name text,
  department text,
  role_slug text,
  role_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ap.id,
    ap.full_name,
    coalesce(ap.department, 'Administration') as department,
    ar.slug as role_slug,
    ar.name as role_name
  from public.admin_profiles ap
  join public.admin_roles ar on ar.id = ap.role_id
  where public.is_active_admin()
    and ap.is_active = true
  order by
    case ar.slug when 'super_admin' then 1 when 'content_admin' then 2 else 3 end,
    ap.full_name asc;
$$;

revoke all on function public.list_active_admin_directory() from public, anon;
grant execute on function public.list_active_admin_directory() to authenticated;

-- Mark all visible notifications as read for auth.uid() (optionally filtered by category)
create or replace function public.mark_all_notifications_read(p_category text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_inserted integer := 0;
begin
  if not public.is_active_admin() then
    raise exception 'Active administrator authentication required.';
  end if;

  v_role := public.current_admin_role();

  insert into public.admin_notification_reads (notification_id, admin_id)
  select n.id, auth.uid()
  from public.admin_notifications n
  where (
      n.audience_type = 'all_admins'
      or (n.audience_type = 'personal' and n.recipient_id = auth.uid())
      or (n.audience_type = 'role' and n.recipient_role = v_role)
    )
    and (p_category is null or p_category = '' or n.category = p_category)
    and not exists (
      select 1
      from public.admin_notification_reads r
      where r.notification_id = n.id and r.admin_id = auth.uid()
    )
  on conflict (notification_id, admin_id) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke all on function public.mark_all_notifications_read(text) from public, anon;
grant execute on function public.mark_all_notifications_read(text) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY POLICIES
-- ----------------------------------------------------------------------------
alter table public.admin_tasks enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.admin_notification_reads enable row level security;
alter table public.admin_notification_preferences enable row level security;

revoke all on
  public.admin_tasks,
  public.admin_notifications,
  public.admin_notification_reads,
  public.admin_notification_preferences
from anon, public;

grant select, insert, update, delete on public.admin_tasks to authenticated;
grant select on public.admin_notifications to authenticated;
grant select, insert, delete on public.admin_notification_reads to authenticated;
grant select, insert, update on public.admin_notification_preferences to authenticated;

-- A. admin_tasks policies
drop policy if exists "admin_tasks_select" on public.admin_tasks;
create policy "admin_tasks_select"
  on public.admin_tasks for select
  to authenticated
  using (
    public.is_active_admin()
    and (
      public.is_super_admin()
      or assigned_to = auth.uid()
      or created_by = auth.uid()
      or (public.can_publish_or_delete() and status = 'needs_review')
    )
  );

drop policy if exists "admin_tasks_insert" on public.admin_tasks;
create policy "admin_tasks_insert"
  on public.admin_tasks for insert
  to authenticated
  with check (
    public.is_active_admin()
    and (created_by is null or created_by = auth.uid())
  );

drop policy if exists "admin_tasks_update" on public.admin_tasks;
create policy "admin_tasks_update"
  on public.admin_tasks for update
  to authenticated
  using (
    public.is_active_admin()
    and (
      public.is_super_admin()
      or created_by = auth.uid()
      or assigned_to = auth.uid()
      or (public.can_publish_or_delete() and status = 'needs_review')
    )
  )
  with check (
    public.is_active_admin()
    and (
      public.is_super_admin()
      or created_by = auth.uid()
      or assigned_to = auth.uid()
      or public.can_publish_or_delete()
    )
  );

drop policy if exists "admin_tasks_delete" on public.admin_tasks;
create policy "admin_tasks_delete"
  on public.admin_tasks for delete
  to authenticated
  using (
    public.is_active_admin()
    and (
      public.is_super_admin()
      or (created_by = auth.uid() and status in ('pending', 'cancelled'))
    )
  );

-- B. admin_notifications policies (SELECT ONLY — no client inserts/updates/deletes)
drop policy if exists "admin_notifications_select" on public.admin_notifications;
create policy "admin_notifications_select"
  on public.admin_notifications for select
  to authenticated
  using (
    public.is_active_admin()
    and (
      audience_type = 'all_admins'
      or (audience_type = 'personal' and recipient_id = auth.uid())
      or (audience_type = 'role' and recipient_role = public.current_admin_role())
    )
  );

-- C. admin_notification_reads policies (admins only read/mark their own read receipts)
drop policy if exists "admin_notification_reads_select" on public.admin_notification_reads;
create policy "admin_notification_reads_select"
  on public.admin_notification_reads for select
  to authenticated
  using (public.is_active_admin() and admin_id = auth.uid());

drop policy if exists "admin_notification_reads_insert" on public.admin_notification_reads;
create policy "admin_notification_reads_insert"
  on public.admin_notification_reads for insert
  to authenticated
  with check (
    public.is_active_admin()
    and admin_id = auth.uid()
    and public.can_view_notification(notification_id)
  );

drop policy if exists "admin_notification_reads_delete" on public.admin_notification_reads;
create policy "admin_notification_reads_delete"
  on public.admin_notification_reads for delete
  to authenticated
  using (public.is_active_admin() and admin_id = auth.uid());

-- D. admin_notification_preferences policies (strictly per-admin)
drop policy if exists "admin_notification_prefs_select" on public.admin_notification_preferences;
create policy "admin_notification_prefs_select"
  on public.admin_notification_preferences for select
  to authenticated
  using (public.is_active_admin() and admin_id = auth.uid());

drop policy if exists "admin_notification_prefs_insert" on public.admin_notification_preferences;
create policy "admin_notification_prefs_insert"
  on public.admin_notification_preferences for insert
  to authenticated
  with check (public.is_active_admin() and admin_id = auth.uid());

drop policy if exists "admin_notification_prefs_update" on public.admin_notification_preferences;
create policy "admin_notification_prefs_update"
  on public.admin_notification_preferences for update
  to authenticated
  using (public.is_active_admin() and admin_id = auth.uid())
  with check (public.is_active_admin() and admin_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 7. ROUTE HELPER FOR ACTION DESTINATIONS
-- ----------------------------------------------------------------------------
create or replace function public.resolve_admin_action_url(p_entity_type text)
returns text
language sql
immutable
as $$
  select case lower(coalesce(p_entity_type, ''))
    when 'projects' then '/admin/projects'
    when 'news' then '/admin/news'
    when 'announcements' then '/admin/announcements'
    when 'pages' then '/admin/pages'
    when 'departments' then '/admin/departments'
    when 'staff_profiles' then '/admin/staff'
    when 'events' then '/admin/events'
    when 'gallery_albums' then '/admin/gallery'
    when 'gallery_images' then '/admin/gallery'
    when 'documents' then '/admin/documents'
    when 'homepage' then '/admin/homepage'
    when 'navigation_items' then '/admin/navigation'
    when 'website_settings' then '/admin/settings'
    when 'contact_messages' then '/admin/enquiries'
    when 'admin_profiles' then '/admin/admins'
    when 'admin_roles' then '/admin/admins'
    when 'admin_tasks' then '/admin/tasks'
    when 'admin_session' then '/admin/logs'
    else '/admin/notifications'
  end;
$$;

create or replace function public.resolve_admin_section_label(p_entity_type text)
returns text
language sql
immutable
as $$
  select case lower(coalesce(p_entity_type, ''))
    when 'projects' then 'Projects'
    when 'news' then 'News & Articles'
    when 'announcements' then 'Announcements'
    when 'pages' then 'Website Pages'
    when 'departments' then 'Departments'
    when 'staff_profiles' then 'Management & Staff'
    when 'staff' then 'Management & Staff'
    when 'events' then 'Events & Activities'
    when 'gallery_albums' then 'Photo Gallery'
    when 'gallery_images' then 'Photo Gallery'
    when 'gallery' then 'Photo Gallery'
    when 'documents' then 'Documents & Downloads'
    when 'homepage' then 'Homepage Management'
    when 'navigation_items' then 'Navigation Management'
    when 'navigation' then 'Navigation Management'
    when 'website_settings' then 'Website Settings'
    when 'settings' then 'Website Settings'
    when 'contact' then 'Contact Information'
    when 'contact_messages' then 'Contact Enquiries'
    when 'enquiries' then 'Contact Enquiries'
    when 'admin_profiles' then 'Administrator Accounts'
    when 'admins' then 'Administrator Accounts'
    when 'admin_roles' then 'Administrator Roles'
    when 'admin_tasks' then 'Tasks & Approvals'
    when 'tasks' then 'Tasks & Approvals'
    else 'System Administration'
  end;
$$;

-- ----------------------------------------------------------------------------
-- 8. TRIGGER: ACTIVITY LOGS -> CENTRALIZED SHARED / SECURITY NOTIFICATIONS
--    Reuses public.activity_logs and avoids spamming routine login/media noise.
-- ----------------------------------------------------------------------------
create or replace function public.handle_activity_log_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text := upper(coalesce(new.action, ''));
  v_entity text := lower(coalesce(new.entity_type, ''));
  v_outcome text := lower(coalesce(new.outcome, 'success'));
  v_actor_name text := coalesce(nullif(trim(new.admin_name), ''), 'Administrator');
  v_section_label text := public.resolve_admin_section_label(new.entity_type);
  v_action_url text := public.resolve_admin_action_url(new.entity_type);
  v_category text;
  v_priority text := 'normal';
  v_audience text := 'all_admins';
  v_recipient_role text := null;
  v_title text;
  v_desc text;
  v_event_type text;
  v_notif_id uuid;
begin
  -- Filter out noisy routine session, asset-tag actions, or task rows handled by trg_admin_tasks_notifications
  if v_entity = 'admin_tasks'
     or v_action in ('LOGIN_SUCCESS', 'LOGOUT', 'SESSION_TIMEOUT', 'PASSWORD_CHANGE', 'UPLOAD_MEDIA', 'REPLACE_MEDIA') then
    return new;
  end if;

  -- A. Urgent security & lockout alerts (always super_admin urgent alert)
  if v_action in ('LOGIN_LOCKED', 'REAUTH_FAILED') or v_outcome in ('blocked', 'failure') then
    v_category := 'system_alert';
    v_priority := 'urgent';
    v_audience := 'role';
    v_recipient_role := 'super_admin';
    v_event_type := 'security_alert';
    v_title := 'Urgent Security Alert: ' || replace(initcap(lower(v_action)), '_', ' ');
    v_desc := coalesce(nullif(new.entity_label, ''), 'Security event recorded by ' || v_actor_name)
      || ' (' || to_char(timezone('UTC', new.created_at), 'YYYY-MM-DD HH24:MI') || ' UTC).';

  -- B. Administrator account / role / permission changes
  elsif v_entity in ('admin_profiles', 'admin_roles')
     or v_action in ('CREATE_ADMIN_PROFILE', 'CHANGE_ADMIN_ROLE', 'ACTIVATE_ADMIN', 'SUSPEND_ADMIN', 'DELETE_ADMIN_PROFILE') then
    v_category := 'co_admin_activity';
    v_priority := 'high';
    v_audience := 'all_admins';
    v_event_type := 'admin_changed';
    v_title := case v_action
      when 'CREATE_ADMIN_PROFILE' then 'New Administrator Added'
      when 'SUSPEND_ADMIN' then 'Administrator Deactivated'
      when 'ACTIVATE_ADMIN' then 'Administrator Reactivated'
      when 'DELETE_ADMIN_PROFILE' then 'Administrator Account Removed'
      when 'CHANGE_ADMIN_ROLE' then 'Administrator Role Updated'
      else 'Administrative Settings Changed'
    end;
    v_desc := v_actor_name || ' performed ' || replace(lower(v_action), '_', ' ')
      || ' on ' || coalesce(nullif(new.entity_label, ''), v_section_label) || '.';

  -- C. Website settings & navigation / contact settings updates
  elsif v_entity in ('website_settings', 'navigation_items', 'homepage') then
    v_category := 'website_update';
    v_priority := case when v_action like '%CONTACT%' or v_action like '%SETTINGS%' then 'high' else 'normal' end;
    v_audience := 'all_admins';
    v_event_type := 'settings_updated';
    v_title := 'Website Configuration Updated: ' || v_section_label;
    v_desc := v_actor_name || ' updated ' || coalesce(nullif(new.entity_label, ''), v_section_label) || '.';

  -- D. Drafts or changes needing editorial review / approval
  elsif v_action like '%_DRAFT' or v_action like '%REVIEW%' then
    v_category := 'co_admin_activity';
    v_priority := 'normal';
    v_audience := 'role';
    v_recipient_role := 'content_admin';
    v_event_type := 'review_needed';
    v_title := v_section_label || ' Saved for Review';
    v_desc := v_actor_name || ' saved draft "' || coalesce(nullif(new.entity_label, ''), 'Untitled') || '" in ' || v_section_label || '.';

  -- E. Projects, News, Announcements, Pages, Events, Documents, Departments, Staff, Gallery
  elsif v_entity in ('projects', 'news', 'announcements', 'pages', 'events', 'documents', 'departments', 'staff_profiles', 'gallery_albums', 'gallery_images', 'contact_messages') then
    -- Only notify co-admins for meaningful changes (skip minor enquiry delete noise if desired; keep triage/content changes)
    v_category := case
      when v_action like '%PUBLISH%' or v_entity in ('news', 'announcements', 'projects', 'pages') then 'website_update'
      else 'co_admin_activity'
    end;
    v_priority := case
      when v_action like 'DELETE_%' then 'high'
      else 'normal'
    end;
    v_audience := 'all_admins';
    v_event_type := case
      when v_entity = 'projects' then 'project_changed'
      when v_action like '%PUBLISH%' then 'content_published'
      else 'content_updated'
    end;
    v_title := v_section_label || ': ' || replace(initcap(lower(v_action)), '_', ' ');
    v_desc := v_actor_name || ' updated ' || v_section_label || ' — "' || coalesce(nullif(new.entity_label, ''), 'Record') || '".';

  else
    return new;
  end if;

  insert into public.admin_notifications (
    title,
    description,
    category,
    event_type,
    priority,
    audience_type,
    recipient_id,
    recipient_role,
    actor_id,
    actor_name,
    affected_section,
    related_entity_type,
    related_entity_id,
    related_entity_label,
    action_url,
    metadata
  ) values (
    left(v_title, 180),
    left(v_desc, 500),
    v_category,
    v_event_type,
    v_priority,
    v_audience,
    null,
    v_recipient_role,
    new.admin_id,
    v_actor_name,
    v_section_label,
    coalesce(new.entity_type, ''),
    coalesce(new.entity_id, ''),
    coalesce(new.entity_label, ''),
    v_action_url,
    jsonb_build_object(
      'activity_action', new.action,
      'outcome', v_outcome
    )
  )
  returning id into v_notif_id;

  -- Mark self-triggered co-admin activity as already read for the acting admin
  if new.admin_id is not null and v_notif_id is not null and v_audience <> 'personal' then
    insert into public.admin_notification_reads (notification_id, admin_id)
    values (v_notif_id, new.admin_id)
    on conflict (notification_id, admin_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_activity_logs_to_notifications on public.activity_logs;
create trigger trg_activity_logs_to_notifications
  after insert on public.activity_logs
  for each row execute function public.handle_activity_log_notification();

-- ----------------------------------------------------------------------------
-- 9. TRIGGER: ADMIN TASKS -> TASK & APPROVAL NOTIFICATIONS
-- ----------------------------------------------------------------------------
create or replace function public.handle_admin_task_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text := 'Administrator';
  v_assignee_name text := '';
  v_dest_url text := case
    when coalesce(new.action_section, '') <> '' and new.action_section <> 'tasks'
      then '/admin/' || new.action_section
    else '/admin/tasks'
  end;
  v_section_label text := case
    when coalesce(new.related_entity_type, '') <> ''
      then public.resolve_admin_section_label(new.related_entity_type)
    else 'Tasks & Approvals'
  end;
begin
  if v_actor_id is not null then
    select full_name into v_actor_name
    from public.admin_profiles
    where id = v_actor_id;
    v_actor_name := coalesce(nullif(v_actor_name, ''), 'Administrator');
  end if;

  if new.assigned_to is not null then
    select full_name into v_assignee_name
    from public.admin_profiles
    where id = new.assigned_to;
    v_assignee_name := coalesce(nullif(v_assignee_name, ''), 'Administrator');
  end if;

  -- Note: completed_at and deadline resets are maintained atomically in trg_admin_tasks_before_write.

  -- INSERT EVENTS
  if tg_op = 'INSERT' then
    -- 1. Approval / Review Request
    if new.task_type = 'approval_request' or new.status = 'needs_review' then
      if new.assigned_to is not null then
        insert into public.admin_notifications (
          title, description, category, event_type, priority,
          audience_type, recipient_id, actor_id, actor_name,
          affected_section, related_task_id, related_entity_type,
          related_entity_id, related_entity_label, action_url
        ) values (
          'Approval Requested: ' || left(new.title, 120),
          v_actor_name || ' requested your approval/review on "' || new.title || '".',
          'task', 'approval_requested',
          case when new.priority = 'low' then 'normal' else new.priority end,
          'personal', new.assigned_to, v_actor_id, v_actor_name,
          v_section_label, new.id, new.related_entity_type,
          new.related_entity_id, new.title, v_dest_url
        );
      else
        insert into public.admin_notifications (
          title, description, category, event_type, priority,
          audience_type, recipient_role, actor_id, actor_name,
          affected_section, related_task_id, related_entity_type,
          related_entity_id, related_entity_label, action_url
        ) values (
          'Review Requested: ' || left(new.title, 120),
          v_actor_name || ' requested editorial approval for "' || new.title || '".',
          'task', 'approval_requested',
          case when new.priority = 'low' then 'normal' else new.priority end,
          'role', 'content_admin', v_actor_id, v_actor_name,
          v_section_label, new.id, new.related_entity_type,
          new.related_entity_id, new.title, v_dest_url
        );
      end if;

      -- Ensure Super Admins also have visibility on approval requests
      insert into public.admin_notifications (
        title, description, category, event_type, priority,
        audience_type, recipient_role, actor_id, actor_name,
        affected_section, related_task_id, related_entity_type,
        related_entity_id, related_entity_label, action_url
      ) values (
        'Pending Approval Task: ' || left(new.title, 120),
        v_actor_name || ' submitted "' || new.title || '" for approval'
          || case when v_assignee_name <> '' then ' (assigned to ' || v_assignee_name || ')' else '' end || '.',
        'task', 'approval_requested', new.priority,
        'role', 'super_admin', v_actor_id, v_actor_name,
        v_section_label, new.id, new.related_entity_type,
        new.related_entity_id, new.title, v_dest_url
      );
      return new;
    end if;

    -- 2. Standard task assigned to an administrator
    if new.assigned_to is not null then
      insert into public.admin_notifications (
        title, description, category, event_type, priority,
        audience_type, recipient_id, actor_id, actor_name,
        affected_section, related_task_id, related_entity_type,
        related_entity_id, related_entity_label, action_url
      ) values (
        'New Task Assigned: ' || left(new.title, 120),
        v_actor_name || ' assigned you the task "' || new.title || '"'
          || case when new.due_at is not null then ' (Due: ' || to_char(timezone('UTC', new.due_at), 'YYYY-MM-DD') || ')' else '' end || '.',
        'task', 'task_assigned', new.priority,
        'personal', new.assigned_to, v_actor_id, v_actor_name,
        v_section_label, new.id, new.related_entity_type,
        new.related_entity_id, new.title, v_dest_url
      );
    end if;

    -- 3. Unassigned pending high/urgent task alerts Super Admins
    if new.status = 'pending' and (new.assigned_to is null or new.priority in ('high', 'urgent')) then
      insert into public.admin_notifications (
        title, description, category, event_type, priority,
        audience_type, recipient_role, actor_id, actor_name,
        affected_section, related_task_id, related_entity_type,
        related_entity_id, related_entity_label, action_url
      ) values (
        'Pending Task Requires Action: ' || left(new.title, 120),
        v_actor_name || ' logged a ' || upper(new.priority) || ' task "' || new.title || '"'
          || case when v_assignee_name <> '' then ' for ' || v_assignee_name else ' (unassigned)' end || '.',
        'task', 'pending_action_required', new.priority,
        'role', 'super_admin', v_actor_id, v_actor_name,
        v_section_label, new.id, new.related_entity_type,
        new.related_entity_id, new.title, v_dest_url
      );
    end if;

    return new;
  end if;

  -- UPDATE EVENTS
  if tg_op = 'UPDATE' then
    -- A. Reassigned to a different admin
    if new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null then
      insert into public.admin_notifications (
        title, description, category, event_type, priority,
        audience_type, recipient_id, actor_id, actor_name,
        affected_section, related_task_id, related_entity_type,
        related_entity_id, related_entity_label, action_url
      ) values (
        'Task Reassigned to You: ' || left(new.title, 120),
        v_actor_name || ' assigned you the task "' || new.title || '".',
        'task', 'task_assigned', new.priority,
        'personal', new.assigned_to, v_actor_id, v_actor_name,
        v_section_label, new.id, new.related_entity_type,
        new.related_entity_id, new.title, v_dest_url
      );
    end if;

    -- B. Task completed
    if new.status = 'completed' and old.status <> 'completed' then
      if new.created_by is not null and new.created_by is distinct from v_actor_id then
        insert into public.admin_notifications (
          title, description, category, event_type, priority,
          audience_type, recipient_id, actor_id, actor_name,
          affected_section, related_task_id, related_entity_type,
          related_entity_id, related_entity_label, action_url
        ) values (
          'Task Completed: ' || left(new.title, 120),
          v_actor_name || ' marked "' || new.title || '" as completed.',
          'task', 'task_completed', 'normal',
          'personal', new.created_by, v_actor_id, v_actor_name,
          v_section_label, new.id, new.related_entity_type,
          new.related_entity_id, new.title, v_dest_url
        );
      end if;

      insert into public.admin_notifications (
        title, description, category, event_type, priority,
        audience_type, recipient_role, actor_id, actor_name,
        affected_section, related_task_id, related_entity_type,
        related_entity_id, related_entity_label, action_url
      ) values (
        'Task Completed: ' || left(new.title, 120),
        v_actor_name || ' completed "' || new.title || '".',
        'task', 'task_completed', 'normal',
        'role', 'super_admin', v_actor_id, v_actor_name,
        v_section_label, new.id, new.related_entity_type,
        new.related_entity_id, new.title, v_dest_url
      );
      return new;
    end if;

    -- C. Status moved to needs_review
    if new.status = 'needs_review' and old.status <> 'needs_review' then
      insert into public.admin_notifications (
        title, description, category, event_type, priority,
        audience_type, recipient_role, actor_id, actor_name,
        affected_section, related_task_id, related_entity_type,
        related_entity_id, related_entity_label, action_url
      ) values (
        'Task Ready for Review: ' || left(new.title, 120),
        v_actor_name || ' submitted "' || new.title || '" for review/approval.',
        'task', 'approval_requested',
        case when new.priority = 'low' then 'normal' else new.priority end,
        'role', 'super_admin', v_actor_id, v_actor_name,
        v_section_label, new.id, new.related_entity_type,
        new.related_entity_id, new.title, v_dest_url
      );
      return new;
    end if;

    -- D. Status or Priority changed
    if new.status is distinct from old.status or new.priority is distinct from old.priority then
      if new.assigned_to is not null and new.assigned_to is distinct from v_actor_id then
        insert into public.admin_notifications (
          title, description, category, event_type, priority,
          audience_type, recipient_id, actor_id, actor_name,
          affected_section, related_task_id, related_entity_type,
          related_entity_id, related_entity_label, action_url
        ) values (
          'Task Updated: ' || left(new.title, 120),
          v_actor_name || ' updated "' || new.title || '" (Status: ' || replace(new.status, '_', ' ') || ', Priority: ' || new.priority || ').',
          'task', 'task_updated', new.priority,
          'personal', new.assigned_to, v_actor_id, v_actor_name,
          v_section_label, new.id, new.related_entity_type,
          new.related_entity_id, new.title, v_dest_url
        );
      end if;

      if new.created_by is not null and new.created_by is distinct from v_actor_id and new.created_by is distinct from new.assigned_to then
        insert into public.admin_notifications (
          title, description, category, event_type, priority,
          audience_type, recipient_id, actor_id, actor_name,
          affected_section, related_task_id, related_entity_type,
          related_entity_id, related_entity_label, action_url
        ) values (
          'Task Status/Priority Updated: ' || left(new.title, 120),
          v_actor_name || ' changed "' || new.title || '" to ' || replace(new.status, '_', ' ') || ' (' || new.priority || ' priority).',
          'task', 'task_updated', new.priority,
          'personal', new.created_by, v_actor_id, v_actor_name,
          v_section_label, new.id, new.related_entity_type,
          new.related_entity_id, new.title, v_dest_url
        );
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_admin_tasks_notifications on public.admin_tasks;
create trigger trg_admin_tasks_notifications
  after insert or update on public.admin_tasks
  for each row execute function public.handle_admin_task_notifications();

-- ----------------------------------------------------------------------------
-- 10. IDEMPOTENT DEADLINE & OVERDUE TASK NOTIFICATION SYNC RPC
-- ----------------------------------------------------------------------------
create or replace function public.sync_task_deadline_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := timezone('utc', now());
  v_rec record;
  v_created integer := 0;
begin
  if not public.is_active_admin() then
    return 0;
  end if;

  -- A. Overdue tasks (due_at < now, not yet notified)
  for v_rec in
    select id, title, assigned_to, created_by, due_at, related_entity_type, related_entity_id, action_section
    from public.admin_tasks
    where status in ('pending', 'in_progress', 'needs_review')
      and due_at is not null
      and due_at < v_now
      and overdue_notified_at is null
    for update skip locked
  loop
    update public.admin_tasks
    set overdue_notified_at = v_now
    where id = v_rec.id;

    if v_rec.assigned_to is not null then
      insert into public.admin_notifications (
        title, description, category, event_type, priority,
        audience_type, recipient_id, actor_name,
        affected_section, related_task_id, related_entity_type,
        related_entity_id, related_entity_label, action_url
      ) values (
        'Task Overdue: ' || left(v_rec.title, 120),
        'Task "' || v_rec.title || '" passed its deadline (' || to_char(timezone('UTC', v_rec.due_at), 'YYYY-MM-DD HH24:MI') || ' UTC) and requires urgent action.',
        'task', 'task_overdue', 'urgent',
        'personal', v_rec.assigned_to, 'Deadline Monitor',
        'Tasks & Approvals', v_rec.id, v_rec.related_entity_type,
        v_rec.related_entity_id, v_rec.title,
        case when coalesce(v_rec.action_section, '') <> '' and v_rec.action_section <> 'tasks' then '/admin/' || v_rec.action_section else '/admin/tasks' end
      );
      v_created := v_created + 1;
    end if;

    insert into public.admin_notifications (
      title, description, category, event_type, priority,
      audience_type, recipient_role, actor_name,
      affected_section, related_task_id, related_entity_type,
      related_entity_id, related_entity_label, action_url
    ) values (
      'Overdue Task Alert: ' || left(v_rec.title, 120),
      'Task "' || v_rec.title || '" is overdue since ' || to_char(timezone('UTC', v_rec.due_at), 'YYYY-MM-DD HH24:MI') || ' UTC.',
      'task', 'task_overdue', 'urgent',
      'role', 'super_admin', 'Deadline Monitor',
      'Tasks & Approvals', v_rec.id, v_rec.related_entity_type,
      v_rec.related_entity_id, v_rec.title,
      case when coalesce(v_rec.action_section, '') <> '' and v_rec.action_section <> 'tasks' then '/admin/' || v_rec.action_section else '/admin/tasks' end
    );
    v_created := v_created + 1;
  end loop;

  -- B. Approaching deadline tasks (within next 24 hours, not yet notified)
  for v_rec in
    select id, title, assigned_to, due_at, related_entity_type, related_entity_id, action_section
    from public.admin_tasks
    where status in ('pending', 'in_progress', 'needs_review')
      and due_at is not null
      and due_at >= v_now
      and due_at <= (v_now + interval '24 hours')
      and approaching_notified_at is null
      and overdue_notified_at is null
    for update skip locked
  loop
    update public.admin_tasks
    set approaching_notified_at = v_now
    where id = v_rec.id;

    if v_rec.assigned_to is not null then
      insert into public.admin_notifications (
        title, description, category, event_type, priority,
        audience_type, recipient_id, actor_name,
        affected_section, related_task_id, related_entity_type,
        related_entity_id, related_entity_label, action_url
      ) values (
        'Deadline Approaching: ' || left(v_rec.title, 120),
        'Task "' || v_rec.title || '" is due within 24 hours (' || to_char(timezone('UTC', v_rec.due_at), 'YYYY-MM-DD HH24:MI') || ' UTC).',
        'task', 'task_due_soon', 'high',
        'personal', v_rec.assigned_to, 'Deadline Monitor',
        'Tasks & Approvals', v_rec.id, v_rec.related_entity_type,
        v_rec.related_entity_id, v_rec.title,
        case when coalesce(v_rec.action_section, '') <> '' and v_rec.action_section <> 'tasks' then '/admin/' || v_rec.action_section else '/admin/tasks' end
      );
      v_created := v_created + 1;
    end if;
  end loop;

  return v_created;
end;
$$;

revoke all on function public.sync_task_deadline_notifications() from public, anon;
grant execute on function public.sync_task_deadline_notifications() to authenticated;

-- ----------------------------------------------------------------------------
-- 11. ENABLE SUPABASE REALTIME FOR NOTIFICATION & TASK TABLES
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_notifications'
    ) then
      alter publication supabase_realtime add table public.admin_notifications;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_notification_reads'
    ) then
      alter publication supabase_realtime add table public.admin_notification_reads;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_tasks'
    ) then
      alter publication supabase_realtime add table public.admin_tasks;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_notification_preferences'
    ) then
      alter publication supabase_realtime add table public.admin_notification_preferences;
    end if;
  end if;
end $$;
