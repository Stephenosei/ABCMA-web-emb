-- ============================================================================
-- Ablekuma Central Municipal Assembly (ABCMA) - Municipal Projects CMS Schema
-- Migration 003: Projects Table, Indexes, RLS Policies & Idempotent Seed
-- Compatible with Supabase PostgreSQL 15+ (Idempotent / Safely Re-runnable)
-- ============================================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text not null default '',
  full_description text not null default '',
  featured_image_url text,
  gallery_images jsonb not null default '[]'::jsonb,
  category text not null default 'Roads & Drainage',
  department_id uuid references public.departments(id) on delete set null,
  department_name text not null default 'Works Department',
  location text not null default 'Ablekuma Central',
  start_date date,
  expected_completion_date date,
  actual_completion_date date,
  project_status text not null default 'Ongoing'
    check (project_status in ('Planned', 'Ongoing', 'Completed', 'Suspended')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published')),
  progress_percentage integer not null default 0
    check (progress_percentage >= 0 and progress_percentage <= 100),
  budget_ghs text not null default '',
  funding_source text not null default '',
  contractor text not null default '',
  display_order integer not null default 0,
  author_id uuid references public.admin_profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_publication_status on public.projects(publication_status);
create index if not exists idx_projects_project_status on public.projects(project_status);
create index if not exists idx_projects_department_id on public.projects(department_id);
create index if not exists idx_projects_display_order on public.projects(display_order, created_at desc);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

-- Grants & Row Level Security (RLS)
grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;

alter table public.projects enable row level security;

drop policy if exists "projects_public_read" on public.projects;
create policy "projects_public_read" on public.projects
  for select using (publication_status = 'published' or public.is_active_admin());

drop policy if exists "projects_insert" on public.projects;
create policy "projects_insert" on public.projects
  for insert to authenticated
  with check (
    public.can_publish_or_delete()
    or (public.can_edit_content() and publication_status = 'draft')
  );

drop policy if exists "projects_update" on public.projects;
create policy "projects_update" on public.projects
  for update to authenticated
  using (public.can_edit_content())
  with check (
    public.can_publish_or_delete()
    or (public.can_edit_content() and publication_status = 'draft')
  );

drop policy if exists "projects_delete" on public.projects;
create policy "projects_delete" on public.projects
  for delete to authenticated
  using (public.can_publish_or_delete());

-- ============================================================================
-- Idempotent Seed: Preserve all 8 initial ABCMA Capital Projects
-- Safe to rerun multiple times without creating duplicates (on conflict slug)
-- ============================================================================
insert into public.projects (
  title,
  slug,
  short_description,
  full_description,
  featured_image_url,
  gallery_images,
  category,
  department_id,
  department_name,
  location,
  start_date,
  expected_completion_date,
  actual_completion_date,
  project_status,
  publication_status,
  progress_percentage,
  budget_ghs,
  funding_source,
  contractor,
  display_order,
  published_at
)
select
  v.title,
  v.slug,
  v.short_description,
  v.full_description,
  v.featured_image_url,
  v.gallery_images::jsonb,
  v.category,
  (select d.id from public.departments d where d.slug = v.dept_slug limit 1),
  v.department_name,
  v.location,
  v.start_date::date,
  v.expected_completion_date::date,
  v.actual_completion_date::date,
  v.project_status,
  'published',
  v.progress_percentage,
  v.budget_ghs,
  v.funding_source,
  v.contractor,
  v.display_order,
  timezone('utc', now())
from (values
  (
    'Abossey Okai Stormwater Concrete Channel & Culvert Construction',
    'abossey-okai-stormwater-concrete-channel-culvert',
    'Construction of a 1.2km reinforced concrete U-drain and three twin-cell box culverts to permanently end perennial flooding across the commercial spare parts corridor.',
    'Construction of a 1.2km reinforced concrete U-drain and three twin-cell box culverts along the Abossey Okai spare parts trading corridor to divert peak stormwater runoff safely into the primary Odaw outflow channel, protecting over 400 retail shops and vehicular access lanes.',
    '/images/municipal_works_project_1794370610757.jpg',
    '[]',
    'Roads & Drainage',
    'dept-works',
    'Works Department',
    'Abossey Okai',
    '2025-11-01',
    '2026-05-30',
    null,
    'Ongoing',
    85,
    'GHS 4,250,000',
    'GoG District Assembly Common Fund (DACF) & ABCMA IGF',
    'Ofori-Atta Civil Engineering Consortium Ltd',
    1
  ),
  (
    'Lartebiokorshie Polyclinic Mother & Child Health Pavilion',
    'lartebiokorshie-polyclinic-mother-child-health-pavilion',
    'Modern 40-bed maternal health wing with dedicated ultrasound diagnostics, surgical theater for emergencies, and 10 incubator neonatal intensive care unit (NICU).',
    'Modern 40-bed maternal health wing at Lartebiokorshie Polyclinic featuring dedicated ultrasound diagnostic suites, emergency obstetric surgical theater, sterile recovery bays, and a 10-incubator neonatal intensive care unit (NICU) serving families across Ablekuma Central.',
    '/images/acma_civic_headquarters_1794370608615.jpg',
    '[]',
    'Health Infrastructure',
    'dept-works',
    'Works Department',
    'Lartebiokorshie',
    '2025-08-01',
    '2026-04-30',
    null,
    'Ongoing',
    92,
    'GHS 3,100,000',
    'Secondary Cities Infrastructure Support & ABCMA Capital Fund',
    'Apex Horizon Built Environments Ltd',
    2
  ),
  (
    'Mataheko - Town Council Line Road Resurfacing & 220 LED Solar Streetlights',
    'mataheko-town-council-line-road-resurfacing-streetlights',
    'Asphaltic overlay of 4.8km link roads, road line markings, speed tables near schools, and installation of 220 high-output solar LED streetlight poles.',
    'Comprehensive asphaltic resurfacing of 4.8km arterial and neighborhood link roads connecting Mataheko and Town Council Line, complete with thermoplastic lane markings, pedestrian speed tables around school zones, and 220 high-output solar LED streetlight poles.',
    '/images/municipal_works_project_1794370610757.jpg',
    '[]',
    'Roads & Drainage',
    'dept-works',
    'Works Department',
    'Mataheko & Town Council Line',
    '2026-01-10',
    '2026-07-31',
    null,
    'Ongoing',
    65,
    'GHS 2,800,000',
    'Ministry of Roads & Highways / ABCMA Joint Works',
    'Dan-Adams Highway Contractors Ghana',
    3
  ),
  (
    'Sukura & Abossey Okai Mechanized Sanitation Skip Stations',
    'sukura-abossey-okai-mechanized-sanitation-skip-stations',
    'Construction of 6 paved, odor-controlled communal waste transfer pads with modern roll-on roll-off skips and 24/7 sanitary warden posts.',
    'Completed construction of 6 paved, odor-controlled communal solid waste transfer stations equipped with hydraulic roll-on roll-off skip containers, leachate drainage traps, perimeter screening walls, and 24/7 environmental health warden posts.',
    '/images/abossey_okai_district_1794370608977.jpg',
    '[]',
    'Sanitation & Environment',
    'dept-health-sanitation',
    'Environmental Health & Sanitation Unit (EHSU)',
    'Sukura & Abossey Okai',
    '2025-09-01',
    '2026-02-28',
    '2026-02-24',
    'Completed',
    100,
    'GHS 950,000',
    'ABCMA Sanitation Levy & Environmental Protection Grant',
    'Klenam Green Sanitation Services Ltd',
    4
  ),
  (
    'Gbortsui Community Health Post & Pediatric Outpatient Clinic',
    'gbortsui-community-health-post-pediatric-clinic',
    'Construction of a primary healthcare center featuring a consultation wing, child immunization ward, dispensary, and solar backup power supply.',
    'Construction of a neighborhood primary healthcare post in Gbortsui comprising four clinical consultation rooms, child welfare and immunization wing, pharmacy dispensary, maternal screening desk, and hybrid solar backup power system.',
    '/images/acma_civic_headquarters_1794370608615.jpg',
    '[]',
    'Health Infrastructure',
    'dept-works',
    'Works Department',
    'Gbortsui',
    '2025-12-01',
    '2026-06-30',
    null,
    'Ongoing',
    75,
    'GHS 1,650,000',
    'District Assembly Common Fund (DACF)',
    'Nana Yaw Built Works Ltd',
    5
  ),
  (
    'Town Council Line Market Modern Paved Sheds & Fire Hydrant Network',
    'town-council-line-market-paved-sheds-fire-hydrant-network',
    'Paving of central market stalls, installation of high-pressure fire hydrants, stormwater grates, and secure lockable storage units for dry food traders.',
    'Upgrade of the Town Council Line central market featuring interlocking concrete walkway paving, steel-truss ventilated market sheds, high-pressure Ghana National Fire Service hydrants, stormwater channel grates, and lockable trader storage units.',
    '/images/abossey_okai_district_1794370608977.jpg',
    '[]',
    'Markets & Trade',
    'dept-physical-planning',
    'Physical Planning Department',
    'Town Council Line',
    '2026-02-01',
    '2026-08-31',
    null,
    'Ongoing',
    50,
    'GHS 2,150,000',
    'ABCMA Internally Generated Revenue (IGF) & Trade Facility',
    'Metro Standard Civil Engineering Ltd',
    6
  ),
  (
    'Mabrouk Zonal Digital Community Library & Youth ICT Lab',
    'mabrouk-zonal-digital-community-library-youth-ict-lab',
    'Establishment of a 50-workstation e-library facility with high-speed internet, coding laboratory, and quiet civic research room for students and teachers.',
    'Establishment of a 50-workstation digital community library and youth coding laboratory in Mabrouk with fiber broadband connectivity, solar power backup, interactive STEM learning bays, and quiet study space for basic and senior high students.',
    '/images/municipal_works_project_1794370610757.jpg',
    '[]',
    'Education & Libraries',
    'dept-mis',
    'Management Information Systems Department',
    'Mabrouk',
    '2025-10-01',
    '2026-04-30',
    null,
    'Ongoing',
    90,
    'GHS 1,200,000',
    'ABCMA Special Education Fund & Ghana Investment Fund for Electronic Communications (GIFEC)',
    'Silicon Horizon Infrastructure Ltd',
    7
  ),
  (
    'Lartebiokorshie Cluster of Schools 6-Unit Block & Sanitation Block',
    'lartebiokorshie-cluster-of-schools-6-unit-block',
    'Completed multi-storey primary school block with modern teacher staffroom, computer laboratory, library, and disability-accessible modern water-closet washrooms.',
    'Completed two-storey 6-unit classroom block at the Lartebiokorshie Cluster of Schools including a fully furnished teachers staffroom, ICT room, school library, rainwater harvesting system, and disability-accessible modern water-closet washroom facilities.',
    '/images/acma_civic_headquarters_1794370608615.jpg',
    '[]',
    'Education & Libraries',
    'dept-works',
    'Works Department',
    'Lartebiokorshie',
    '2025-06-01',
    '2026-01-31',
    '2026-01-22',
    'Completed',
    100,
    'GHS 1,850,000',
    'GoG GETFund / ABCMA Joint Educational Development Grant',
    'Golden Coast Builders Consortium',
    8
  )
) as v(
  title,
  slug,
  short_description,
  full_description,
  featured_image_url,
  gallery_images,
  category,
  dept_slug,
  department_name,
  location,
  start_date,
  expected_completion_date,
  actual_completion_date,
  project_status,
  progress_percentage,
  budget_ghs,
  funding_source,
  contractor,
  display_order
)
on conflict (slug) do nothing;
