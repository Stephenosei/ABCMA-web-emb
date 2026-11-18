-- ============================================================================
-- Ablekuma Central Municipal Assembly (ABCMA) - CMS & Admin Database Schema
-- Migration 001: Core Tables, Relationships, Indexes, RLS Policies & Storage
-- Compatible with Supabase PostgreSQL 15+ (Idempotent / Safely Re-runnable)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. AUTOMATIC UPDATED_AT TRIGGER HELPER
-- ----------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. ADMIN ROLES & ADMIN PROFILES
-- ----------------------------------------------------------------------------
create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('super_admin', 'content_admin', 'editor')),
  name text not null,
  description text not null,
  created_at timestamptz not null default timezone('utc', now())
);

insert into public.admin_roles (slug, name, description)
values
  ('super_admin', 'Super Administrator', 'Full control over all website content, settings, navigation, administrator accounts, and security audit logs.'),
  ('content_admin', 'Content Administrator', 'Can create, edit, publish, unpublish, and delete website pages, news, announcements, departments, staff, events, gallery, and documents.'),
  ('editor', 'Editor', 'Can create and edit draft content and upload media, but cannot manage administrators, security settings, or permanently delete records.')
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role_id uuid not null references public.admin_roles(id) on delete restrict,
  department text default 'Management Information Systems (MIS)',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_profiles_role_id on public.admin_profiles(role_id);
create index if not exists idx_admin_profiles_email on public.admin_profiles(email);

drop trigger if exists trg_admin_profiles_updated_at on public.admin_profiles;
create trigger trg_admin_profiles_updated_at
  before update on public.admin_profiles
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 3. RLS AUTHORIZATION HELPER FUNCTIONS (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
create or replace function public.current_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select ar.slug
  from public.admin_profiles ap
  join public.admin_roles ar on ar.id = ap.role_id
  where ap.id = auth.uid()
    and ap.is_active = true
  limit 1;
$$;

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = auth.uid()
      and ap.is_active = true
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_admin_role() = 'super_admin';
$$;

create or replace function public.can_publish_or_delete()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_admin_role() in ('super_admin', 'content_admin');
$$;

create or replace function public.can_edit_content()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_admin_role() in ('super_admin', 'content_admin', 'editor');
$$;

-- Prevent non-super-admins from altering their own role_id, is_active, or email
create or replace function public.protect_admin_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_super_admin() then
    if new.id is distinct from old.id
       or new.email is distinct from old.email
       or new.role_id is distinct from old.role_id
       or new.is_active is distinct from old.is_active then
      raise exception 'Only a Super Administrator may change administrator roles, emails, or active status.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_admin_profiles_protect_columns on public.admin_profiles;
create trigger trg_admin_profiles_protect_columns
  before update on public.admin_profiles
  for each row execute function public.protect_admin_profile_columns();

-- ----------------------------------------------------------------------------
-- 4. WEBSITE PAGES
-- ----------------------------------------------------------------------------
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text default '',
  content_html text not null default '',
  featured_image_url text,
  attachments jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_id uuid references public.admin_profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_pages_slug on public.pages(slug);
create index if not exists idx_pages_status on public.pages(status);

drop trigger if exists trg_pages_updated_at on public.pages;
create trigger trg_pages_updated_at
  before update on public.pages
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 5. NEWS & ARTICLES
-- ----------------------------------------------------------------------------
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  news_scope text not null default 'local' check (news_scope in ('local', 'other')),
  category text not null default 'Notice',
  excerpt text not null,
  content text not null default '',
  full_story jsonb not null default '[]'::jsonb,
  featured_image_url text,
  author_name text not null default 'ABCMA Information Desk',
  location text default 'Lartebiokorshie',
  target_page text default 'news',
  target_label text default 'Read More',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  is_featured_homepage boolean not null default false,
  published_at timestamptz default timezone('utc', now()),
  scheduled_at timestamptz,
  author_id uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_news_status on public.news(status);
create index if not exists idx_news_scope on public.news(news_scope);
create index if not exists idx_news_featured on public.news(is_featured_homepage);
create index if not exists idx_news_published_at on public.news(published_at desc);

drop trigger if exists trg_news_updated_at on public.news;
create trigger trg_news_updated_at
  before update on public.news
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 6. ANNOUNCEMENTS & NOTICES
-- ----------------------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null default 'Public Notice',
  audience text not null default 'public' check (audience in ('public', 'internal')),
  attachment_url text,
  attachment_name text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz default timezone('utc', now()),
  expires_at timestamptz,
  author_id uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_announcements_status on public.announcements(status);
create index if not exists idx_announcements_audience on public.announcements(audience);

drop trigger if exists trg_announcements_updated_at on public.announcements;
create trigger trg_announcements_updated_at
  before update on public.announcements
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 7. DEPARTMENTS
-- ----------------------------------------------------------------------------
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_code text not null,
  category text not null default 'admin' check (category in ('admin', 'technical', 'social', 'finance', 'planning')),
  head_name text not null,
  head_title text not null,
  head_image_url text,
  banner_image_url text,
  room text not null default 'Block A',
  phone text not null default '',
  email text not null default '',
  description text not null,
  core_functions jsonb not null default '[]'::jsonb,
  services_offered jsonb not null default '[]'::jsonb,
  operating_hours text not null default 'Mon - Fri: 8:00 AM - 5:00 PM',
  display_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_departments_status on public.departments(status);
create index if not exists idx_departments_order on public.departments(display_order);

drop trigger if exists trg_departments_updated_at on public.departments;
create trigger trg_departments_updated_at
  before update on public.departments
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 8. MANAGEMENT & STAFF PROFILES
-- ----------------------------------------------------------------------------
create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  position_title text not null,
  department_id uuid references public.departments(id) on delete set null,
  department_name text default '',
  biography text not null default '',
  photo_url text,
  email text default '',
  phone text default '',
  is_management boolean not null default false,
  is_public boolean not null default true,
  display_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_staff_profiles_dept on public.staff_profiles(department_id);
create index if not exists idx_staff_profiles_public on public.staff_profiles(is_public, status);

drop trigger if exists trg_staff_profiles_updated_at on public.staff_profiles;
create trigger trg_staff_profiles_updated_at
  before update on public.staff_profiles
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 9. EVENTS & ACTIVITIES
-- ----------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  venue text not null,
  electoral_area text default 'All Electoral Areas',
  event_date date not null,
  event_time text not null default '10:00 AM',
  banner_url text,
  agenda jsonb not null default '[]'::jsonb,
  event_status text not null default 'upcoming' check (event_status in ('upcoming', 'completed', 'cancelled')),
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_events_status on public.events(status, event_status);
create index if not exists idx_events_date on public.events(event_date);

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 10. PHOTO GALLERY ALBUMS & IMAGES
-- ----------------------------------------------------------------------------
create table if not exists public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  category text not null default 'Civic Events',
  cover_image_url text,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_gallery_albums_updated_at on public.gallery_albums;
create trigger trg_gallery_albums_updated_at
  before update on public.gallery_albums
  for each row execute function public.handle_updated_at();

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references public.gallery_albums(id) on delete cascade,
  title text not null default '',
  caption text default '',
  category text not null default 'Civic Events',
  image_url text not null,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_gallery_images_album on public.gallery_images(album_id);
create index if not exists idx_gallery_images_featured on public.gallery_images(is_featured);

drop trigger if exists trg_gallery_images_updated_at on public.gallery_images;
create trigger trg_gallery_images_updated_at
  before update on public.gallery_images
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 11. DOCUMENTS & DOWNLOADS
-- ----------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null default 'Reports',
  gazette_number text not null default '',
  year integer not null default 2026,
  file_url text,
  file_name text not null default '',
  file_size text not null default '1.0 MB',
  department text default 'Central Administration',
  key_provisions jsonb not null default '[]'::jsonb,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_documents_status on public.documents(status);
create index if not exists idx_documents_category on public.documents(category);

drop trigger if exists trg_documents_updated_at on public.documents;
create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 12. NAVIGATION ITEMS
-- ----------------------------------------------------------------------------
create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  target_type text not null default 'section' check (target_type in ('section', 'page', 'external')),
  target_value text not null,
  parent_id uuid references public.navigation_items(id) on delete cascade,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_navigation_sort on public.navigation_items(sort_order);

drop trigger if exists trg_navigation_items_updated_at on public.navigation_items;
create trigger trg_navigation_items_updated_at
  before update on public.navigation_items
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 13. WEBSITE SETTINGS & HOMEPAGE CONFIGURATION (SINGLETON RECORD)
-- ----------------------------------------------------------------------------
create table if not exists public.website_settings (
  id integer primary key default 1 check (id = 1),
  site_title text not null default 'Ablekuma Central Municipal Assembly',
  site_description text not null default 'Official municipal assembly portal for public service delivery, permits, property & business rates billing, and citizen community engagement in Greater Accra, Ghana.',
  logo_url text not null default '/assets/aistudio/abcma_logo_74f7cef4.jpeg',
  favicon_url text not null default '/assets/aistudio/abcma_logo_74f7cef4.jpeg',
  hero_heading text not null default 'Ablekuma Central Municipal Assembly',
  hero_subheading text not null default 'Akwaaba · Official Digital Portal',
  welcome_message text not null default 'Welcoming residents, corporate institutions, and commercial traders across Abossey Okai, Lartebiokorshie, Mataheko, Sukura, Town Council Line, Gbortsui, and Mabrouk. Pay property rates, renew Business Operating Permits, review capital projects, and engage your local government.',
  hero_image_url text not null default '/images/ablekuma_assembly_welcome_1794372179601.jpg',
  homepage_banners jsonb not null default '[]'::jsonb,
  homepage_highlights jsonb not null default '[]'::jsonb,
  homepage_cta jsonb not null default '{"primaryLabel":"Open Services Page","primaryTarget":"service","secondaryLabel":"Explore All News & Activities","secondaryTarget":"news"}'::jsonb,
  homepage_stats jsonb not null default '[{"label":"Electoral Areas in ABCMA","value":"7"},{"label":"Active Municipal Departments","value":"10"},{"label":"Registered Commercial Businesses","value":"4,280+"},{"label":"Instant MoMo & Card Gateway","value":"24/7"}]'::jsonb,
  contact_phones jsonb not null default '["0302-228-900","0302-228-901"]'::jsonb,
  contact_emails jsonb not null default '["info@abcma.gov.gh","support@abcma.gov.gh"]'::jsonb,
  office_location text not null default 'Municipal Assembly Complex, Lartebiokorshie, Accra',
  postal_address text not null default 'P.O. Box GP 19401, Accra Central, Ghana',
  gps_address text not null default 'GA-140-2210',
  working_hours text not null default 'Monday – Friday: 8:00 AM – 5:00 PM (GMT)',
  google_maps_url text not null default 'https://maps.google.com/?q=Lartebiokorshie+Accra',
  social_links jsonb not null default '{"facebook":"","twitter":"","instagram":"","youtube":""}'::jsonb,
  footer_text text not null default 'Serving the residents, commercial trading zones, and communities of Ablekuma Central under the Local Governance Act 2016 (Act 936).',
  copyright_text text not null default '© 2026 Ablekuma Central Municipal Assembly (ABCMA). Republic of Ghana. All statutory rights reserved.',
  seo_metadata jsonb not null default '{"keywords":"Ablekuma Central Municipal Assembly, ABCMA, Accra, Local Government Ghana","ogImage":"/images/ablekuma_assembly_welcome_1794372179601.jpg"}'::jsonb,
  status text not null default 'published' check (status in ('draft', 'published')),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.website_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists trg_website_settings_updated_at on public.website_settings;
create trigger trg_website_settings_updated_at
  before update on public.website_settings
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 14. MEDIA LIBRARY
-- ----------------------------------------------------------------------------
create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_path text not null unique,
  public_url text not null,
  mime_type text not null,
  file_size bigint not null default 0,
  folder text not null default 'general',
  alt_text text default '',
  uploaded_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_media_library_folder on public.media_library(folder);

-- ----------------------------------------------------------------------------
-- 15. ACTIVITY LOGS
-- ----------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_profiles(id) on delete set null,
  admin_email text not null,
  admin_name text not null,
  action text not null,
  entity_type text not null,
  entity_id text default '',
  entity_label text not null,
  previous_values jsonb,
  updated_values jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_activity_logs_created_at on public.activity_logs(created_at desc);
create index if not exists idx_activity_logs_entity on public.activity_logs(entity_type);

-- ----------------------------------------------------------------------------
-- 16. SCHEMA GRANTS & ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

alter table public.admin_roles enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.pages enable row level security;
alter table public.news enable row level security;
alter table public.announcements enable row level security;
alter table public.departments enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.events enable row level security;
alter table public.gallery_albums enable row level security;
alter table public.gallery_images enable row level security;
alter table public.documents enable row level security;
alter table public.navigation_items enable row level security;
alter table public.website_settings enable row level security;
alter table public.media_library enable row level security;
alter table public.activity_logs enable row level security;

-- admin_roles: active admins can read; only super_admin can mutate
drop policy if exists "admin_roles_select_admins" on public.admin_roles;
create policy "admin_roles_select_admins" on public.admin_roles
  for select to authenticated using (public.is_active_admin());

drop policy if exists "admin_roles_manage_super" on public.admin_roles;
create policy "admin_roles_manage_super" on public.admin_roles
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- admin_profiles: admins can view own profile or super_admin views all;
-- super_admin creates/deletes/updates; active admins may update their own last_login_at (protected by trigger)
drop policy if exists "admin_profiles_select" on public.admin_profiles;
create policy "admin_profiles_select" on public.admin_profiles
  for select to authenticated using (id = auth.uid() or public.is_super_admin());

drop policy if exists "admin_profiles_insert_super" on public.admin_profiles;
create policy "admin_profiles_insert_super" on public.admin_profiles
  for insert to authenticated with check (public.is_super_admin());

drop policy if exists "admin_profiles_update_super" on public.admin_profiles;
drop policy if exists "admin_profiles_update" on public.admin_profiles;
create policy "admin_profiles_update" on public.admin_profiles
  for update to authenticated
  using (public.is_super_admin() or (id = auth.uid() and is_active = true))
  with check (public.is_super_admin() or (id = auth.uid() and is_active = true));

drop policy if exists "admin_profiles_delete_super" on public.admin_profiles;
create policy "admin_profiles_delete_super" on public.admin_profiles
  for delete to authenticated using (public.is_super_admin());

-- PAGES
drop policy if exists "pages_public_read" on public.pages;
create policy "pages_public_read" on public.pages
  for select using (status = 'published' or public.is_active_admin());

drop policy if exists "pages_editor_insert" on public.pages;
create policy "pages_editor_insert" on public.pages
  for insert to authenticated with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "pages_update" on public.pages;
create policy "pages_update" on public.pages
  for update to authenticated
  using (public.can_edit_content())
  with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "pages_delete" on public.pages;
create policy "pages_delete" on public.pages
  for delete to authenticated using (public.can_publish_or_delete());

-- NEWS
drop policy if exists "news_public_read" on public.news;
create policy "news_public_read" on public.news
  for select using (
    (status = 'published')
    or (status = 'scheduled' and scheduled_at <= timezone('utc', now()))
    or public.is_active_admin()
  );

drop policy if exists "news_insert" on public.news;
create policy "news_insert" on public.news
  for insert to authenticated with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "news_update" on public.news;
create policy "news_update" on public.news
  for update to authenticated
  using (public.can_edit_content())
  with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "news_delete" on public.news;
create policy "news_delete" on public.news
  for delete to authenticated using (public.can_publish_or_delete());

-- ANNOUNCEMENTS
drop policy if exists "announcements_public_read" on public.announcements;
create policy "announcements_public_read" on public.announcements
  for select using ((status = 'published' and audience = 'public') or public.is_active_admin());

drop policy if exists "announcements_insert" on public.announcements;
create policy "announcements_insert" on public.announcements
  for insert to authenticated with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "announcements_update" on public.announcements;
create policy "announcements_update" on public.announcements
  for update to authenticated
  using (public.can_edit_content())
  with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "announcements_delete" on public.announcements;
create policy "announcements_delete" on public.announcements
  for delete to authenticated using (public.can_publish_or_delete());

-- DEPARTMENTS
drop policy if exists "departments_public_read" on public.departments;
create policy "departments_public_read" on public.departments
  for select using (status = 'published' or public.is_active_admin());

drop policy if exists "departments_insert" on public.departments;
create policy "departments_insert" on public.departments
  for insert to authenticated with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "departments_update" on public.departments;
create policy "departments_update" on public.departments
  for update to authenticated
  using (public.can_edit_content())
  with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "departments_delete" on public.departments;
create policy "departments_delete" on public.departments
  for delete to authenticated using (public.can_publish_or_delete());

-- STAFF PROFILES
drop policy if exists "staff_public_read" on public.staff_profiles;
create policy "staff_public_read" on public.staff_profiles
  for select using ((status = 'published' and is_public = true) or public.is_active_admin());

drop policy if exists "staff_insert" on public.staff_profiles;
create policy "staff_insert" on public.staff_profiles
  for insert to authenticated with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "staff_update" on public.staff_profiles;
create policy "staff_update" on public.staff_profiles
  for update to authenticated
  using (public.can_edit_content())
  with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "staff_delete" on public.staff_profiles;
create policy "staff_delete" on public.staff_profiles
  for delete to authenticated using (public.can_publish_or_delete());

-- EVENTS
drop policy if exists "events_public_read" on public.events;
create policy "events_public_read" on public.events
  for select using (status = 'published' or public.is_active_admin());

drop policy if exists "events_insert" on public.events;
create policy "events_insert" on public.events
  for insert to authenticated with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "events_update" on public.events;
create policy "events_update" on public.events
  for update to authenticated
  using (public.can_edit_content())
  with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "events_delete" on public.events;
create policy "events_delete" on public.events
  for delete to authenticated using (public.can_publish_or_delete());

-- GALLERY ALBUMS & IMAGES
drop policy if exists "gallery_albums_public_read" on public.gallery_albums;
create policy "gallery_albums_public_read" on public.gallery_albums
  for select using (status = 'published' or public.is_active_admin());

drop policy if exists "gallery_albums_insert" on public.gallery_albums;
create policy "gallery_albums_insert" on public.gallery_albums
  for insert to authenticated with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "gallery_albums_update" on public.gallery_albums;
create policy "gallery_albums_update" on public.gallery_albums
  for update to authenticated
  using (public.can_edit_content())
  with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "gallery_albums_delete" on public.gallery_albums;
create policy "gallery_albums_delete" on public.gallery_albums
  for delete to authenticated using (public.can_publish_or_delete());

drop policy if exists "gallery_images_public_read" on public.gallery_images;
create policy "gallery_images_public_read" on public.gallery_images
  for select using (status = 'published' or public.is_active_admin());

drop policy if exists "gallery_images_insert" on public.gallery_images;
create policy "gallery_images_insert" on public.gallery_images
  for insert to authenticated with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "gallery_images_update" on public.gallery_images;
create policy "gallery_images_update" on public.gallery_images
  for update to authenticated
  using (public.can_edit_content())
  with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "gallery_images_delete" on public.gallery_images;
create policy "gallery_images_delete" on public.gallery_images
  for delete to authenticated using (public.can_publish_or_delete());

-- DOCUMENTS
drop policy if exists "documents_public_read" on public.documents;
create policy "documents_public_read" on public.documents
  for select using (status = 'published' or public.is_active_admin());

drop policy if exists "documents_insert" on public.documents;
create policy "documents_insert" on public.documents
  for insert to authenticated with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "documents_update" on public.documents;
create policy "documents_update" on public.documents
  for update to authenticated
  using (public.can_edit_content())
  with check (public.can_publish_or_delete() or (public.can_edit_content() and status = 'draft'));

drop policy if exists "documents_delete" on public.documents;
create policy "documents_delete" on public.documents
  for delete to authenticated using (public.can_publish_or_delete());

-- NAVIGATION ITEMS
drop policy if exists "navigation_public_read" on public.navigation_items;
create policy "navigation_public_read" on public.navigation_items
  for select using (is_visible = true or public.is_active_admin());

drop policy if exists "navigation_manage" on public.navigation_items;
create policy "navigation_manage" on public.navigation_items
  for all to authenticated using (public.can_publish_or_delete()) with check (public.can_publish_or_delete());

-- WEBSITE SETTINGS
drop policy if exists "website_settings_public_read" on public.website_settings;
create policy "website_settings_public_read" on public.website_settings
  for select using (true);

drop policy if exists "website_settings_manage" on public.website_settings;
create policy "website_settings_manage" on public.website_settings
  for all to authenticated using (public.can_publish_or_delete()) with check (public.can_publish_or_delete());

-- MEDIA LIBRARY
drop policy if exists "media_library_public_read" on public.media_library;
create policy "media_library_public_read" on public.media_library
  for select using (true);

drop policy if exists "media_library_insert" on public.media_library;
create policy "media_library_insert" on public.media_library
  for insert to authenticated with check (public.can_edit_content());

drop policy if exists "media_library_update" on public.media_library;
create policy "media_library_update" on public.media_library
  for update to authenticated using (public.can_edit_content()) with check (public.can_edit_content());

drop policy if exists "media_library_delete" on public.media_library;
create policy "media_library_delete" on public.media_library
  for delete to authenticated using (public.can_publish_or_delete());

-- ACTIVITY LOGS (Only active admins can read/insert; never public)
drop policy if exists "activity_logs_select_admins" on public.activity_logs;
create policy "activity_logs_select_admins" on public.activity_logs
  for select to authenticated using (public.is_active_admin());

drop policy if exists "activity_logs_insert_admins" on public.activity_logs;
create policy "activity_logs_insert_admins" on public.activity_logs
  for insert to authenticated with check (public.is_active_admin());

-- ----------------------------------------------------------------------------
-- 17. SUPABASE STORAGE BUCKET FOR MEDIA & DOCUMENTS (abcma-media)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'abcma-media',
  'abcma-media',
  true,
  15728640, -- 15 MB limit per file
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "abcma_media_public_read" on storage.objects;
create policy "abcma_media_public_read"
  on storage.objects for select
  using (bucket_id = 'abcma-media');

drop policy if exists "abcma_media_admin_upload" on storage.objects;
create policy "abcma_media_admin_upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'abcma-media' and public.can_edit_content());

drop policy if exists "abcma_media_admin_update" on storage.objects;
create policy "abcma_media_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'abcma-media' and public.can_edit_content())
  with check (bucket_id = 'abcma-media' and public.can_edit_content());

drop policy if exists "abcma_media_admin_delete" on storage.objects;
create policy "abcma_media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'abcma-media' and public.can_publish_or_delete());
