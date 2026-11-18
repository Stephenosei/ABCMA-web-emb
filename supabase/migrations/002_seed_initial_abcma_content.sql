-- ============================================================================
-- Ablekuma Central Municipal Assembly (ABCMA) - Initial Content Migration Seed
-- Migration 002: Idempotently seeds website settings, navigation items, all 10
-- departments, staff profiles, all 12 news articles, announcements, events,
-- gallery albums/photos, all 16 official documents, and a starter CMS page.
-- Safe to rerun multiple times without duplicating records.
-- ============================================================================

-- 1. Website Settings & Homepage Singleton (id = 1)
insert into public.website_settings (
  id,
  site_title,
  site_description,
  logo_url,
  favicon_url,
  hero_heading,
  hero_subheading,
  welcome_message,
  hero_image_url,
  homepage_banners,
  homepage_highlights,
  homepage_cta,
  homepage_stats,
  contact_phones,
  contact_emails,
  office_location,
  postal_address,
  gps_address,
  working_hours,
  google_maps_url,
  social_links,
  footer_text,
  copyright_text,
  seo_metadata,
  status
)
values (
  1,
  'Ablekuma Central Municipal Assembly',
  'Official municipal assembly portal for public service delivery, permits, property & business rates billing, and citizen community engagement in Greater Accra, Ghana.',
  '/assets/aistudio/abcma_logo_74f7cef4.jpeg',
  '/assets/aistudio/abcma_logo_74f7cef4.jpeg',
  'Ablekuma Central Municipal Assembly',
  'Akwaaba · Official Digital Portal',
  'Welcoming residents, corporate institutions, and commercial traders across Abossey Okai, Lartebiokorshie, Mataheko, Sukura, Town Council Line, Gbortsui, and Mabrouk. Pay property rates, renew Business Operating Permits, review capital projects, and engage your local government.',
  '/images/ablekuma_assembly_welcome_1794372179601.jpg',
  '[]'::jsonb,
  '[]'::jsonb,
  '{"primaryLabel":"Open Services Page","primaryTarget":"service","secondaryLabel":"Explore All News & Activities","secondaryTarget":"news"}'::jsonb,
  '[{"label":"Electoral Areas in ABCMA","value":"7"},{"label":"Active Municipal Departments","value":"10"},{"label":"Registered Commercial Businesses","value":"4,280+"},{"label":"Instant MoMo & Card Gateway","value":"24/7"}]'::jsonb,
  '["0302-228-900","0302-228-901"]'::jsonb,
  '["info@abcma.gov.gh","support@abcma.gov.gh"]'::jsonb,
  'Municipal Assembly Complex, Lartebiokorshie, Accra',
  'P.O. Box GP 19401, Accra Central, Ghana',
  'GA-140-2210',
  'Monday – Friday: 8:00 AM – 5:00 PM (GMT)',
  'https://maps.google.com/?q=Lartebiokorshie+Accra',
  '{"facebook":"","twitter":"","instagram":"","youtube":""}'::jsonb,
  'Serving the residents, commercial trading zones, and communities of Ablekuma Central under the Local Governance Act 2016 (Act 936).',
  '© 2026 Ablekuma Central Municipal Assembly (ABCMA). Republic of Ghana. All statutory rights reserved.',
  '{"keywords":"Ablekuma Central Municipal Assembly, ABCMA, Accra, Local Government Ghana","ogImage":"/images/ablekuma_assembly_welcome_1794372179601.jpg"}'::jsonb,
  'published'
)
on conflict (id) do nothing;

-- 2. Navigation Items (preserving tab order: News between Home and Departments)
insert into public.navigation_items (label, target_type, target_value, sort_order, is_visible)
select v.label, v.target_type, v.target_value, v.sort_order, v.is_visible
from (values
  ('Home', 'section', 'home', 1, true),
  ('News', 'section', 'news', 2, true),
  ('Departments', 'section', 'departments', 3, true),
  ('Service', 'section', 'service', 4, true),
  ('Projects', 'section', 'projects', 5, true),
  ('Documents', 'section', 'documents', 6, true),
  ('Gallery', 'section', 'gallery', 7, true),
  ('The Assembly', 'section', 'assembly', 8, true)
) as v(label, target_type, target_value, sort_order, is_visible)
where not exists (
  select 1 from public.navigation_items n
  where n.target_type = v.target_type and n.target_value = v.target_value
);

-- 3. All 10 Municipal Departments (idempotent on unique slug)
insert into public.departments (
  slug, name, short_code, category, head_name, head_title, head_image_url,
  room, phone, email, description, core_functions, services_offered,
  operating_hours, display_order, status
)
values
  ('dept-central-admin', 'Central Administration Department', 'Central Admin', 'admin',
   'Mr. Emmanuel Kofi Boateng', 'Municipal Coordinating Director (MCD)', '/images/director.jpg',
   'Block A, First Floor, Room 102 & 104', '+233 (0) 302 228 901', 'centraladmin@abcma.gov.gh',
   'The Secretariat of the Assembly responsible for overall administrative coordination, executive decision implementation, protocol, legal affairs, and public relations.',
   '["Serving as the General Secretariat of the Assembly & Executive Committee","Coordinating all decentralized departments and development partners","Protocol, public relations, records management, and civil marriages under Cap 127","Monitoring execution of General Assembly resolutions and policy directives"]'::jsonb,
   '["Ordinance & Customary Marriage Registration","Administrative Clearances & Official Letters of Introduction","Client Service Charters & Public Information Inquiries","Assembly Hall Bookings for Civic Ceremonies"]'::jsonb,
   'Mon - Fri: 8:00 AM - 5:00 PM', 1, 'published'),

  ('dept-hr', 'Human Resource Department', 'HR', 'admin',
   'Mrs. Lydia Afriyie', 'Municipal Human Resource Manager', '/images/hr.jpg',
   'Block A, Second Floor, Room 205', '+233 (0) 302 228 903', 'hr@abcma.gov.gh',
   'Manages staff recruitment, postings, continuous capacity building, staff welfare, internships, and performance management across all ABCMA directorates.',
   '["Staff development, training needs assessment, and capacity building programs","Civil service human resource management & local government service appraisal","National Service personnel (NSS) and tertiary student internship placements","Staff welfare, occupational safety compliance, and retirement transitions"]'::jsonb,
   '["Tertiary Internship & Industrial Attachment Applications","National Service Personnel (NSS) Onboarding & Verification","Capacity Building Workshops & Civic Leadership Seminars","Staff Verification for Civil Service & Financial Institutions"]'::jsonb,
   'Mon - Fri: 8:30 AM - 4:30 PM', 2, 'published'),

  ('dept-mis', 'Management Information Systems Department', 'MIS', 'technical',
   'Mr Justice Marfo', 'Head of Management Information Systems', '/images/uknown.jpg',
   'Block A, Ground Floor, Room 012 (Tech Hub)', '+233 (0) 302 228 906', 'mis@abcma.gov.gh',
   'Spearheads ABCMA digital transformation, portal infrastructure, online revenue billing gateways, GIS municipal mapping, database administration, and cyber security.',
   '["Managing ABCMA public digital portal, revenue collection APIs & MoMo gateways","Geographic Information Systems (GIS) mapping of properties and street naming","Hardware maintenance, network infrastructure, and database administration","Data analytics on internally generated funds (IGF) and service delivery turnaround"]'::jsonb,
   '["Digital Address Verification & GhanaPostGPS Mapping Support","Online Ratepayer Account Assistance & MoMo Receipt Reconciliation","Municipal Open Data Requests & Civic Technology Collaborations","IT Support for Digital Business Operating Permit Applications"]'::jsonb,
   'Mon - Fri: 8:00 AM - 5:00 PM (24/7 Portal Support)', 3, 'published'),

  ('dept-works', 'Works Department', 'Works', 'technical',
   'Ing. Stephen Kwaku Annan', 'Municipal Works Engineer', '/images/dept_head_engineer_1794482218772.jpg',
   'Block B, First Floor, Room 112 & 114', '+233 (0) 302 228 907', 'works@abcma.gov.gh',
   'Supervises capital projects, feeder roads, storm drainage infrastructure, street lighting maintenance, and physical structural inspections of residential & commercial developments.',
   '["Execution and monitoring of municipal civil works, drainage culverts, and roads","Building inspection for structural integrity and permit compliance","Municipal streetlights installation, maintenance, and energy management","Preparation of Bills of Quantities (BoQ) and public tender evaluation"]'::jsonb,
   '["Site Structural Inspections & Building Permit Vetting","Streetlight Fault Repair & Infrastructure Maintenance Request","Drainage Connection Approvals & Culvert Construction Supervision","Right-of-Way Permits for Utility Excavations"]'::jsonb,
   'Mon - Fri: 8:00 AM - 5:00 PM (Emergency Works On-Call)', 4, 'published'),

  ('dept-social-welfare', 'Department of Social Welfare & Community Development', 'Social Welfare', 'social',
   'Ms. Faustina Akua Opare', 'Municipal Social Welfare & Community Officer', '/images/uknown.jpg',
   'Block C, Ground Floor, Room 015', '+233 (0) 302 228 909', 'socialwelfare@abcma.gov.gh',
   'Promotes social justice, child protection, family reconciliation, disability inclusion funds, youth apprenticeship, and community-driven development initiatives.',
   '["Administration of the 3% District Assembly Common Fund for Persons with Disabilities (PWDs)","Child rights enforcement, custody mediation, and foster care supervision","Livelihood Empowerment Against Poverty (LEAP) bi-monthly cash disbursements","Youth vocational skill trainings, community self-help projects, and NGO accreditation"]'::jsonb,
   '["Disability (PWD) Support Fund & Assistive Device Grants","Family Welfare, Child Custody & Maintenance Mediation","NGO & Community-Based Organization (CBO) Registration & Clearance","Youth Apprenticeship Sponsorship in Tailoring, Auto Mechanics & ICT"]'::jsonb,
   'Mon - Fri: 8:30 AM - 4:30 PM', 5, 'published'),

  ('dept-physical-planning', 'Physical Planning Department', 'Physical Planning', 'planning',
   'Tpl. Kwame Mensah Danquah', 'Municipal Town Planning Officer', '/images/Physical_planning.jpg',
   'Block B, Ground Floor, Room 04', '+233 (0) 302 228 904', 'planning@abcma.gov.gh',
   'Controls spatial layout, zoning schemes, land-use planning, masterplans, and development permit statutory committee secretariat.',
   '["Formulating spatial development frameworks and local zoning schemes","Secretariat of the Spatial Planning Committee (SPC) and Technical Sub-Committee","Processing planning permissions, rezoning applications, and land subdivision","Street naming and property numbering (SNPA) coordination"]'::jsonb,
   '["Zoning Search & Land Use Suitability Verification","Development Planning Approvals & Temporary Structure Licenses","Street Naming & Digital Property Identification Certificates","Architectural Layout Consultation for Commercial Hubs"]'::jsonb,
   'Mon - Fri: 8:30 AM - 4:30 PM', 6, 'published'),

  ('dept-finance', 'Finance & Revenue Mobilization Directorate', 'Finance', 'finance',
   'Mr. Sakibu Ahmed', 'Municipal Finance Officer (MFO)', '/images/uknown.jpg',
   'Block A, Ground Floor, Room 08', '+233 (0) 302 228 910', 'finance@abcma.gov.gh',
   'Manages municipal public funds, internally generated revenue (IGF), property rates billing, commercial licenses collection, and statutory financial reporting.',
   '["Collection and accounting of property rates, business operating permits, and market tolls","Ensuring compliance with the Public Financial Management Act 2016 (Act 921)","Coordination of revenue taskforces and electronic collection points","Preparation of monthly and annual municipal financial statements"]'::jsonb,
   '["Official Receipt Issuance & Tax Clearance Certificates","Property Rate Assessment & Commercial Revaluation Inquiries","Direct MoMo/Bank Payment Verification & Settlement","Installment Payment Arrangements for Micro-Enterprises"]'::jsonb,
   'Mon - Fri: 8:00 AM - 5:00 PM', 7, 'published'),

  ('dept-health-sanitation', 'Environmental Health & Sanitation Unit (EHSU)', 'EHSU', 'technical',
   'San. Insp. Patience Korkor Tetteh', 'Municipal Environmental Health Officer', '/images/uknown.jpg',
   'Block C, Ground Floor, Room 02', '+233 (0) 302 228 915', 'sanitation@abcma.gov.gh',
   'Ensures public health standards, food vendor screening, market hygiene, cemetery management, and solid waste collection enforcement.',
   '["Routine sanitary inspection of domestic and commercial premises","Mandatory medical screening and certification of food vendors","Enforcement of Assembly sanitation bye-laws and court prosecutions","Supervision of private waste management concessionaires (Zoomlion, etc.)"]'::jsonb,
   '["Food Handlers Medical Screening & Certification Cards","Sanitary Inspection Clearance for Restaurants & Cold Stores","Pest Control, Fumigation & Disinfestation Certification","Communal Waste Bin Distribution & Skip Relocation Requests"]'::jsonb,
   'Mon - Fri: 7:30 AM - 4:30 PM (Field Inspections Active)', 8, 'published'),

  ('dept-nadmo', 'Disaster Prevention & Management (NADMO Desk)', 'NADMO', 'technical',
   'Mr. Alhaji Ibrahim Adams', 'Municipal NADMO Director', '/images/uknown.jpg',
   'Block C, Room 10', '+233 (0) 302 228 920', 'nadmo@abcma.gov.gh',
   'Coordinates emergency disaster response, flood contingency planning, public safety education, and relief item distributions.',
   '["Pre-flood vulnerability assessment along critical drainage basins","Community sensitization on fire outbreaks, building collapses, and storm hazards","Rapid emergency rescue dispatch during heavy downpours","Distribution of verified humanitarian relief supplies to affected victims"]'::jsonb,
   '["Emergency Flood & Fire Hazard Reporting Desk","Disaster Relief Registration & Assessment","School & Market Safety Drills and Fire Prevention Workshops","Volunteer Disaster Management Committee Recruitment"]'::jsonb,
   '24/7 Emergency Operations', 9, 'published'),

  ('dept-agriculture', 'Department of Agriculture', 'Agriculture', 'social',
   'Dr. Seth Osei Tutu', 'Municipal Director of Agriculture', '/images/uknown.jpg',
   'Block C, First Floor, Room 108', '+233 (0) 302 228 924', 'agriculture@abcma.gov.gh',
   'Supports peri-urban farming, backyard gardening, mushroom cultivation, aquaculture, veterinary health care, and farmer-market linkages.',
   '["Agricultural extension services to urban vegetable growers and livestock keepers","Veterinary services including rabies vaccination and pet licensing","Promotion of modern hydroponics, vertical farming, and agro-processing","Annual National Best Farmer Awards Municipal Celebration"]'::jsonb,
   '["Pet & Livestock Rabies Vaccination Services","Free Urban Farming Advisory & Improved Seedling Distribution","Agro-Enterprise Advisory & Value-Addition Training","Veterinary Clinic Consultations & Meat Inspection"]'::jsonb,
   'Mon - Fri: 8:00 AM - 4:30 PM', 10, 'published')
on conflict (slug) do nothing;

-- 4. Management & Staff Profiles (linked to department where applicable)
insert into public.staff_profiles (
  full_name, position_title, department_id, department_name, biography,
  photo_url, email, phone, is_management, is_public, display_order, status
)
select
  v.full_name,
  v.position_title,
  (select d.id from public.departments d where d.slug = v.dept_slug limit 1),
  v.department_name,
  v.biography,
  v.photo_url,
  v.email,
  v.phone,
  v.is_management,
  v.is_public,
  v.display_order,
  v.status
from (values
  ('Hon. Frank Nkansah', 'Municipal Chief Executive (MCE)', null, 'Office of the MCE',
   'Political and administrative head of Ablekuma Central Municipal Assembly leading municipal infrastructure modernization, sanitation transformation, and digital revenue reform.',
   '/images/acma_mce_portrait_1794438674697.jpg', 'mce@abcma.gov.gh', '0302-228-900', true, true, 1, 'published'),
  ('Mr. Emmanuel Kofi Boateng', 'Municipal Coordinating Director (MCD)', 'dept-central-admin', 'Central Administration Department',
   'Head of Civil Service and Secretary to the General Assembly overseeing inter-departmental policy implementation and governance compliance.',
   '/images/director.jpg', 'centraladmin@abcma.gov.gh', '+233 (0) 302 228 901', true, true, 2, 'published'),
  ('Mrs. Lydia Afriyie', 'Municipal Human Resource Manager', 'dept-hr', 'Human Resource Department',
   'Directs capacity building, civil service appraisals, internship placements, and staff welfare across all municipal directorates.',
   '/images/hr.jpg', 'hr@abcma.gov.gh', '+233 (0) 302 228 903', true, true, 3, 'published'),
  ('Ing. Stephen Kwaku Annan', 'Municipal Works Engineer', 'dept-works', 'Works Department',
   'Leads municipal civil works supervision, stormwater culvert engineering, feeder road maintenance, and structural permitting inspections.',
   '/images/dept_head_engineer_1794482218772.jpg', 'works@abcma.gov.gh', '+233 (0) 302 228 907', true, true, 4, 'published'),
  ('Tpl. Kwame Mensah Danquah', 'Municipal Town Planning Officer', 'dept-physical-planning', 'Physical Planning Department',
   'Directs spatial zoning schemes, Spatial Planning Committee secretariat duties, and development permitting approvals.',
   '/images/Physical_planning.jpg', 'planning@abcma.gov.gh', '+233 (0) 302 228 904', true, true, 5, 'published'),
  ('Mr Justice Marfo', 'Head of Management Information Systems', 'dept-mis', 'Management Information Systems Department',
   'Leads ABCMA digital government systems, GIS municipal rating maps, e-tax clearance integration, and citizen portal security.',
   '/images/uknown.jpg', 'mis@abcma.gov.gh', '+233 (0) 302 228 906', true, true, 6, 'published')
) as v(full_name, position_title, dept_slug, department_name, biography, photo_url, email, phone, is_management, is_public, display_order, status)
where not exists (
  select 1 from public.staff_profiles s
  where s.full_name = v.full_name and s.position_title = v.position_title
);

-- 5. All 12 News Articles (idempotent on unique slug)
insert into public.news (
  title, slug, news_scope, category, excerpt, content, full_story,
  featured_image_url, author_name, location, target_page, target_label,
  status, is_featured_homepage, published_at
)
values
  ('2026 BOP & Property Rates Early-Bird Compliance Window Now Open with Instant MoMo Reconciliation',
   '2026-bop-property-rates-compliance-window', 'local', 'Notice',
   'All shop owners, automotive dealers in Abossey Okai, pharmacies, and property owners across Ablekuma Central are reminded to verify their 2026 assessments. Direct payments via MTN MoMo, Telecel Cash, and AT Money now provide instant official e-receipts and compliance certificates.',
   'Under the Local Governance Act 2016 (Act 936) and the 2026 Gazetted Fee-Fixing Resolution, rate notices have been dispatched. Business owners are urged to settle before March 31, 2026 to avoid statutory enforcement penalties.',
   '["The Finance & Revenue Mobilization Directorate of Ablekuma Central Municipal Assembly (ABCMA) has officially opened the 2026 Early-Bird Business Operating Permit (BOP) and Property Rate compliance window for all commercial operators, landlords, and institutional property owners.","Under the Local Governance Act, 2016 (Act 936) and the 2026 Gazetted Fee-Fixing Resolution, updated assessment demand notices have been served across Abossey Okai, Lartebiokorshie, Mataheko, Gbortsui, Sukura, Town Council Line, and Mabrouk.","To eliminate manual paper delays and revenue leakages, ratepayers can look up their Bill Number online through the ABCMA Billing Portal and complete full or partial settlements via MTN MoMo, Telecel Cash, AT Money, or GH-Link debit cards. Each transaction automatically generates a QR-verifiable digital receipt recognized by banking institutions and municipal compliance inspectors.","Commercial enterprises that clear their 2026 dues before March 31, 2026 automatically qualify for instant digital Municipal Tax Clearance generation without visiting Block A."]'::jsonb,
   '/images/acma_civic_headquarters_1794370608615.jpg',
   'Finance & Revenue Directorate', 'Municipal Assembly Complex, Lartebiokorshie',
   'service', 'Pay Rates & BOP Now', 'published', true, '2026-03-10T09:00:00Z'),

  ('Abossey Okai Stormwater Channel Phase 1 Reaches 85% Completion Ahead of Seasonal Rains',
   'abossey-okai-stormwater-channel-phase-1-85-percent', 'local', 'Civic Activity',
   'The 1.2km engineered reinforced concrete stormwater box culvert along the commercial spare parts corridor has reached critical milestones, diverting peak stormwater runoff into the primary Odaw channel and protecting over 400 spare parts retail shops.',
   'Municipal Works Engineer Ing. Stephen Annan inspected the ongoing pouring of twin-cell culverts. Paving of approach aprons and safety guardrails will be finalized by April 2026.',
   '["Civil engineering works on the 1.2-kilometer Abossey Okai Reinforced Concrete Stormwater Channel have crossed the 85% completion mark following intensive concrete box-culvert casting by the contracted D1/K1 consortium.","During a technical site inspection led by Municipal Works Engineer Ing. Stephen Kwaku Annan alongside Works Subcommittee Assembly Members, engineers confirmed that all three twin-cell junction culverts tying into the primary Odaw outflow basin are structurally complete.","For years, heavy June and September rains flooded automotive spare-parts shops and disrupted vehicular traffic along the Abossey Okai corridor. The widened hydraulic cross-section is engineered to double peak discharge capacity and prevent backflow into adjoining side lanes.","Final works over the next four weeks will focus on sidewalk slab decking, pedestrian safety guardrails, and asphaltic reinstatement of driveway aprons ahead of official commissioning."]'::jsonb,
   '/images/municipal_works_project_1794370610757.jpg',
   'Municipal Works Department', 'Abossey Okai Spare Parts Corridor',
   'projects', 'View Projects Tracker', 'published', true, '2026-03-08T09:00:00Z'),

  ('Social Welfare Department Disburses DACF Disability Fund & Distributes Youth Artisan Toolkits',
   'social-welfare-disburses-dacf-disability-fund', 'local', 'Community',
   'The Ablekuma Central Municipal Assembly today held a disbursement programme under the Disability Common Fund at the forecourt of the Assembly to provide support to persons with disabilities within the municipality.',
   'Hon. Municipal Chief Executive emphasized that economic inclusion for Persons with Disabilities (PWDs) remains a non-negotiable pillar of ABCMA civic governance.',
   '["The programme was attended by the Member of Parliament for Ablekuma Central, Hon. Abdul-Latif Dan, and the Municipal Chief Executive, Hon. Frank Nkansah, alongside other stakeholders who joined in reaffirming the importance of supporting persons with disabilities and promoting their inclusion in the development process.","The disbursement is aimed at providing beneficiaries with the necessary support to improve their livelihoods, strengthen their economic independence and enhance their general well-being.","Addressing the beneficiaries, the MCE, Hon. Frank Nkansah, admonished them to make good and responsible use of the items and support received to improve their living conditions and contribute to their personal and economic development.","Through initiatives such as the Disability Common Fund, the Assembly continues to work towards building a municipality where persons with disabilities are empowered, supported and given the opportunity to live with dignity."]'::jsonb,
   '/images/leap.jpg',
   'Social Welfare & Community Development', 'ABCMA, Lartebiokorshie',
   'departments', 'Visit Social Welfare Dept', 'published', true, '2026-03-04T09:00:00Z'),

  ('General Assembly Announces Public Hearings for 2026/2027 Medium Term Development Plan (MTDP)',
   'general-assembly-public-hearings-2026-2027-mtdp', 'local', 'Notice',
   'Residents, market women associations, transport unions, and youth leaders are invited to participate in open consultative hearings across Lartebiokorshie, Sukura, and Town Council Line to prioritize communal projects.',
   'Submissions of memoranda and oral deliberations will inform the final gazetted budget allocation for school expansions and solar streetlight networks.',
   '["The Office of the Presiding Member and the Municipal Planning Coordinating Unit (MPCU) have published the schedule for town hall public hearings informing the 2026/2027 Medium Term Development Plan (MTDP) and Composite Budget.","Sessions are open to all residents, traditional authorities, market queens, artisans, religious leaders, and civil society organizations across the 7 electoral areas.","Priority agenda items include siting of additional communal refuse transfer bays, prioritization of inner-lane solar street lighting in Sukura and Gbortsui, and expansion of public basic school ICT laboratories.","Citizens who cannot attend in person may submit formal written memoranda directly through the Town Halls & Hearings portal under The Assembly tab."]'::jsonb,
   '/images/acma_townhall_meeting_1794370609788.jpg',
   'Office of the Presiding Member', 'General Assembly Chamber, Lartebiokorshie',
   'assembly', 'Attend Assembly Town Hall', 'published', false, '2026-02-28T09:00:00Z'),

  ('Environmental Health Unit Launches Intensive Medical Screening for Food Handlers & Vendors',
   'environmental-health-medical-screening-food-handlers', 'local', 'Notice',
   'Mobile clinical screening vans have deployed to Mataheko Flamingo Market, Town Council Line Market, and Abossey Okai to test and issue certified medical clearance cards for commercial food preparers.',
   'The mandatory exercise aims to eliminate foodborne pathogens and ensure hygienic public consumption across food joints, chop bars, and restaurants.',
   '["The Environmental Health & Sanitation Unit (EHSU), led by Sanitary Inspector Patience Korkor Tetteh, has launched a municipality-wide mobile clinical screening campaign for commercial food handlers, caterers, bakers, and street food vendors.","Mobile screening stations operated in partnership with the Municipal Health Directorate are stationed sequentially at Mataheko Flamingo Market, Town Council Line Market, and Abossey Okai to minimize travel disruption for traders.","Vendors who complete screening receive tamper-resistant annual Health Clearance ID Cards valid across Greater Accra as mandated by the ABCMA Public Health & Food Handlers Certification Bye-Laws."]'::jsonb,
   '/images/abossey_okai_district_1794370608977.jpg',
   'Environmental Health & Sanitation Unit (EHSU)', 'Mataheko Flamingo & Town Council Line Markets',
   'service', 'Apply for Health Clearance', 'published', false, '2026-02-24T09:00:00Z'),

  ('Commissioning of 6-Unit Modern Primary Block at Lartebiokorshie Cluster of Schools',
   'commissioning-6-unit-primary-block-lartebiokorshie', 'local', 'Civic Activity',
   'The Municipal Chief Executive Hon. Frank Nkansah formally handed over keys to a newly constructed multi-storey educational facility equipped with modern ICT laboratory and sanitation facilities.',
   'Funded under the District Assembly Common Fund and GETFund, the facility will accommodate over 350 pupils and eliminate the double-shift school schedule in the sub-metro area.',
   '["Hon. Frank Nkansah, Municipal Chief Executive for Ablekuma Central, joined traditional leaders, teachers, and parents to commission a newly completed 6-unit two-storey classroom block at the Lartebiokorshie Cluster of Schools.","Jointly financed through the District Assembly Common Fund (DACF) and GETFund, the facility houses six sunlit classrooms, a 35-seat networked ICT computer laboratory, headteacher and staff offices, and disability-accessible modern water-closet sanitation blocks.","The Municipal Director of Education noted that the addition of 350 pupil seats immediately relieves overcrowding and phases out the double-shift teaching timetable in Lartebiokorshie."]'::jsonb,
   '/images/ablekuma_assembly_welcome_1794372179601.jpg',
   'Municipal Education Directorate & Works', 'Lartebiokorshie Electoral Area',
   'projects', 'View Education Project', 'published', false, '2026-02-20T09:00:00Z'),

  ('ABCMA Management Information Systems (MIS) Deploys Instant E-Tax Clearance Portal',
   'abcma-mis-deploys-instant-e-tax-clearance-portal', 'local', 'Notice',
   'Business owners who settle their 2026 Business Operating Permits online can now instantly download digitally signed, QR-verifiable Municipal Tax Clearance certificates for banking and commercial compliance.',
   'The new system links directly to the Ghana Revenue Authority TIN database and ABCMA revenue vaults, eliminating bureaucratic paper queues.',
   '["Led by Head of MIS Mr. Justice Marfo, Ablekuma Central Municipal Assembly has rolled out an automated E-Tax Clearance and Digital Verification Engine integrated directly into the municipal portal.","Previously, local enterprises bidding for public procurement tenders or renewing commercial bank credit facilities waited several working days for stamped paper clearance letters.","With the new MIS portal upgrade, any taxpayer whose 2026 Business Operating Permit or Property Rate balance reads zero receives an instant cryptographically signed verification token and printable receipt."]'::jsonb,
   '/images/assembly_chamber_backdrop_1794482218382.jpg',
   'Management Information Systems (MIS) Unit', 'Block A Tech Hub, Lartebiokorshie',
   'departments', 'Read on MIS Department', 'published', false, '2026-02-16T09:00:00Z'),

  ('Zonal Pre-Rainy Season Desilting Taskforce Deploys Across Mataheko & Abossey Okai Corridors',
   'zonal-pre-rainy-season-desilting-taskforce-deploys', 'local', 'Civic Activity',
   'A combined taskforce of Urban Roads engineers, NADMO rapid responders, and communal sanitation squads has commenced dredging critical culverts along the Odaw tributary line.',
   'Residents and commercial shopkeepers are requested to desist from discarding solid plastics into open stormwater channels as offenders face municipal court prosecution.',
   '["Ahead of the major rainy season, ABCMA has mobilized its Urban Roads maintenance unit, NADMO field responders, and contracted waste haulage tippers to desilt primary and secondary drains along the Mataheko, Sukura, and Abossey Okai corridors.","Over 420 metric tonnes of compacted silt, plastic waste, and construction debris have already been cleared and transported directly to accredited landfill transfer sites rather than left along road shoulders."]'::jsonb,
   '/images/municipal_works_project_1794370610757.jpg',
   'Urban Roads & Disaster Prevention', 'Mataheko & Abossey Okai Corridors',
   'projects', 'Inspect Works Program', 'published', false, '2026-02-12T09:00:00Z'),

  ('GARCC Synchronizes Greater Accra Municipal Sanitation & Clean Corridors Operation',
   'garcc-synchronizes-sanitation-clean-corridors', 'other', 'Press Release',
   'All 29 Metropolitan, Municipal, and District Assemblies in Greater Accra have aligned first-Saturday clean-up exercises and bulk waste transfer logistics along major arterial markets and transport corridors.',
   'The Greater Accra Regional Coordinating Council commended frontline assemblies including Ablekuma Central for deploying skip transfer pads and digital sanitation enforcement.',
   '["The Greater Accra Regional Coordinating Council (GARCC) has unveiled an updated Regional Sanitation Synchronization Framework bringing together all 29 Metropolitan, Municipal, and District Assemblies across Greater Accra.","Under the regional initiative, boundary markets and shared drainage corridors receive coordinated mechanized sweepers, joint municipal guard patrols, and synchronized tipper dispatch schedules on the first Saturday of every month."]'::jsonb,
   '/images/acma_civic_plaza_bg_1794482218453.jpg',
   'Greater Accra Regional Coordinating Council (GARCC)', 'Greater Accra Region',
   'assembly', 'View Citizen Incident Desk', 'published', false, '2026-03-11T09:00:00Z'),

  ('Ministry of Local Government Issues 2026 Digital IGF & Public Accountability Directives',
   'mlgrd-issues-2026-digital-igf-directives', 'other', 'Press Release',
   'New national guidelines mandate all MMDAs to publish quarterly Composite Budget performance summaries online and expand cashless mobile money collection portals to boost citizen trust.',
   'The Ministry highlighted digital ratepayer portals and open document repositories as mandatory benchmarks under the District Performance Assessment Tool (DPAT).',
   '["The Ministry of Local Government, Decentralisation and Rural Development (MLGDRD) has circulated the 2026 Composite Budget Transparency & Digital Revenue Guidelines for implementation across all 261 MMDAs nationwide.","Key directives require Assemblies to transition commercial Business Operating Permits and Property Rate billing onto cashless mobile money and card gateways, publish audited Internally Generated Funds (IGF) reports openly, and maintain accessible citizen Right to Information (RTI) submission channels."]'::jsonb,
   '/images/assembly_chamber_backdrop_1794482218382.jpg',
   'Ministry of Local Government, Decentralisation & Rural Development', 'National · Accra',
   'documents', 'Browse Gazetted Documents', 'published', false, '2026-03-05T09:00:00Z'),

  ('NADMO & Ghana Meteorological Agency Release 2026 Coastal Rainy Season Flood Early-Warning Advisory',
   'nadmo-gmet-2026-flood-early-warning-advisory', 'other', 'Notice',
   'Meteorological forecasts indicate above-average peak rainfall bursts between May and July across low-lying Accra basins. Citizens are advised to inspect household roof gutters and keep drainage easements clear.',
   'Emergency flood hotlines remain active 24/7 across municipal NADMO rapid response stations.',
   '["A joint seasonal forecast bulletin issued by the Ghana Meteorological Agency (GMet) and the National Disaster Management Organization (NADMO) urges households and market associations across coastal Greater Accra to complete roof, culvert, and electrical safety checks ahead of May.","Within Ablekuma Central, residents spotting blocked street gratings, fallen trees, or damaged utility lines can log GPS-tagged alerts directly via the Incident Desk for dispatch to the Municipal NADMO unit in Block C."]'::jsonb,
   '/images/leap.jpg',
   'National NADMO & GMet Joint Desk', 'Greater Accra Coastal Belt',
   'departments', 'Contact ABCMA NADMO Desk', 'published', false, '2026-03-01T09:00:00Z'),

  ('Ghana Enterprises Agency & GIFEC Open Digital Trade & Artisan MSME Support Window',
   'gea-gifec-open-digital-trade-artisan-msme-support', 'other', 'Community',
   'Registered artisans, spare parts retailers, seamstresses, and youth-led micro-enterprises holding valid municipal Business Operating Permits can apply for subsidized business formalization and digital bookkeeping training.',
   'The ABCMA Social Welfare and Central Administration desks are assisting eligible local entrepreneurs with introductory endorsement letters.',
   '["The Ghana Enterprises Agency (GEA), working in collaboration with GIFEC and Municipal Business Advisory desks, has opened applications for the 2026 Urban MSME Growth & Digital Commerce Support Window.","Eligible sole proprietors, fashion designers, automotive mechanics, and cold-chain traders in Ablekuma Central receive subsidized access to accounting software training, e-commerce onboarding, and equipment matching grants."]'::jsonb,
   '/images/acma_townhall_meeting_1794370609788.jpg',
   'Ghana Enterprises Agency & GIFEC Partner Desk', 'Greater Accra Business Hub',
   'service', 'Apply for Business Permit', 'published', false, '2026-02-22T09:00:00Z')
on conflict (slug) do nothing;

-- 6. Announcements & Public Notices
insert into public.announcements (title, description, category, audience, status, published_at)
select v.title, v.description, v.category, v.audience, v.status, v.published_at
from (values
  ('2026 Property Rate & Business Operating Permit Early Settlement Notice',
   'Commercial operators and landlords in Abossey Okai, Mataheko, and Lartebiokorshie are encouraged to verify bills online and settle via Mobile Money before March 31, 2026.',
   'Ratepayers Advisory', 'public', 'published', timezone('utc', now())),
  ('Pre-Rainy Season Drainage Clearance Advisory',
   'Residents are advised not to deposit refuse into open drains ahead of scheduled desilting operations by Works and NADMO teams across all 7 electoral areas.',
   'Sanitation Exercise', 'public', 'published', timezone('utc', now())),
  ('Food Vendors Mobile Medical Screening Schedule',
   'All commercial food preparers across Mataheko, Sukura, and Town Council Line markets should present their Ghana Card for 2026 Health Clearance certification.',
   'Public Notice', 'public', 'published', timezone('utc', now()))
) as v(title, description, category, audience, status, published_at)
where not exists (
  select 1 from public.announcements a where a.title = v.title
);

-- 7. Events & Activities (Town Halls & Civic Programs)
insert into public.events (title, description, venue, electoral_area, event_date, event_time, banner_url, agenda, event_status, status)
select v.title, v.description, v.venue, v.electoral_area, v.event_date::date, v.event_time, v.banner_url, v.agenda, v.event_status, v.status
from (values
  ('2026 Mid-Year Budget & Fee-Fixing Citizen Consultation',
   'Consultative assembly session reviewing the 2026 revised Fee-Fixing Resolution, audited IGF capital projects, and citizen feedback.',
   'Presbyterian Church Hall, Abossey Okai Central', 'Abossey Okai', '2026-04-15', '10:00 AM - 1:30 PM',
   '/images/acma_townhall_meeting_1794370609788.jpg',
   '["Presentation of 2026 Revised Fee-Fixing Resolution & Property Rates","Audited report on 2025 Internally Generated Funds (IGF) projects","Citizen open-floor feedback and business association dialogue","Briefing by Municipal Director of Urban Roads on ongoing drain works"]'::jsonb,
   'upcoming', 'published'),

  ('Town Council Line & Sukura Flood Mitigation & Drainage Hearing',
   'Open community hearing on pre-monsoon drainage desilting, buffer enforcement along Odaw channels, and volunteer sanitation recruitment.',
   'ABCMA Municipal Conference Auditorium, Lartebiokorshie', 'Town Council Line / Sukura', '2026-05-12', '10:30 AM - 1:00 PM',
   '/images/ablekuma_assembly_welcome_1794372179601.jpg',
   '["Pre-monsoon season drainage desilting masterplan review","Enforcement of 100-meter buffer zone along major Odaw-connected stormwater drains","Community sanitation taskforce volunteering recruitment"]'::jsonb,
   'upcoming', 'published'),

  ('Mataheko Youth Skills, Vocational Grants & Digital Literacy Forum',
   'Municipal youth vocational apprenticeship onboarding covering auto mechanics, fashion design, ICT coding, and NYA grant registration.',
   'Mataheko Community Centre Forecourt', 'Mataheko', '2026-06-06', '9:00 AM - 2:00 PM',
   '/images/leap.jpg',
   '["Rollout of ABCMA Youth Vocational Apprenticeship Scheme (auto mechanics, fashion, ICT)","Subsidized startup toolkits for accredited trade trainees","Registration desk for National Youth Authority & ABCMA Social Welfare support"]'::jsonb,
   'upcoming', 'published'),

  ('Abossey Okai Market Clean-Up & Sanitation Compliance Durbar',
   'Joint municipal sanitation operation and trader sensitisation across spare-parts lanes and communal skip transfer pads.',
   'Abossey Okai Central Lorry Park', 'Abossey Okai', '2026-05-24', '7:00 AM - 11:00 AM',
   '/images/abossey_okai_district_1794370608977.jpg',
   '["Drainage Desilting","Market Waste Skip Inspection","Food Vendor Permit Verification"]'::jsonb,
   'upcoming', 'published')
) as v(title, description, venue, electoral_area, event_date, event_time, banner_url, agenda, event_status, status)
where not exists (
  select 1 from public.events e where e.title = v.title and e.event_date = v.event_date::date
);

-- 8. Gallery Albums & Photographs (strictly idempotent on title / image_url)
insert into public.gallery_albums (title, description, category, cover_image_url, status)
select v.title, v.description, v.category, v.cover_image_url, v.status
from (values
  ('Municipal Civic Headquarters & Assemblies',
   'Official photographs of the Ablekuma Central Municipal Complex, legislative chamber, and public town halls.',
   'Civic Events', '/images/ablekuma_assembly_welcome_1794372179601.jpg', 'published'),
  ('Infrastructure, Drainage & Community Welfare',
   'Visual progress across Abossey Okai flood mitigation drains, commercial corridors, and Disability Common Fund programmes.',
   'Infrastructure', '/images/municipal_works_project_1794370610757.jpg', 'published')
) as v(title, description, category, cover_image_url, status)
where not exists (
  select 1 from public.gallery_albums ga where ga.title = v.title
);

insert into public.gallery_images (album_id, title, caption, category, image_url, is_featured, display_order, status)
select
  (select id from public.gallery_albums where title = v.album_title limit 1),
  v.title, v.caption, v.category, v.image_url, v.is_featured, v.display_order, v.status
from (values
  ('Municipal Civic Headquarters & Assemblies', 'ABCMA Civic Complex Exterior',
   'Ablekuma Central Municipal Assembly Headquarters at Lartebiokorshie, Accra.',
   'Civic Events', '/images/ablekuma_assembly_welcome_1794372179601.jpg', true, 1, 'published'),
  ('Municipal Civic Headquarters & Assemblies', 'General Assembly Chamber',
   'Legislative deliberations inside the ABCMA Assembly Chamber.',
   'Civic Events', '/images/assembly_chamber_backdrop_1794482218382.jpg', true, 2, 'published'),
  ('Municipal Civic Headquarters & Assemblies', 'Town Hall Stakeholder Engagement',
   'Citizens participating in participatory budgeting and development planning.',
   'Civic Events', '/images/acma_townhall_meeting_1794370609788.jpg', true, 3, 'published'),
  ('Infrastructure, Drainage & Community Welfare', 'Abossey Okai Stormwater Engineering Works',
   'Reinforced concrete culvert construction protecting commercial spare-parts corridors.',
   'Infrastructure', '/images/municipal_works_project_1794370610757.jpg', true, 4, 'published'),
  ('Infrastructure, Drainage & Community Welfare', 'Disability Common Fund Disbursement Ceremony',
   'Inclusive empowerment programme for Persons with Disabilities held at ABCMA forecourt.',
   'Civic Events', '/images/leap.jpg', false, 5, 'published'),
  ('Infrastructure, Drainage & Community Welfare', 'Abossey Okai Commercial Corridor & Sanitation',
   'Upgraded commercial district walkways and paved skip stations.',
   'Sanitation', '/images/abossey_okai_district_1794370608977.jpg', false, 6, 'published')
) as v(album_title, title, caption, category, image_url, is_featured, display_order, status)
where not exists (
  select 1 from public.gallery_images gi where gi.title = v.title and gi.image_url = v.image_url
);

-- 9. All 16 Official Gazetted Documents (idempotent on gazette_number + title)
insert into public.documents (title, description, category, gazette_number, year, file_name, file_size, department, key_provisions, status)
select v.title, v.description, v.category, v.gazette_number, v.year, v.file_name, v.file_size, v.department, v.key_provisions, v.status
from (values
  ('ABCMA Gazetted Fee-Fixing Resolution (2026 Fiscal Year)',
   'Statutory schedule of all rates, fees, fines, and licenses payable across commercial, residential, industrial, and transport categories in Ablekuma Central.',
   'Fee-Fixing', 'Ghana Local Government Bulletin No. 14 / ABCMA-2026', 2026,
   'ABCMA_2026_Gazetted_Fee_Fixing_Resolution.pdf', '3.8 MB', 'Finance & Budget Rating Directorate',
   '["Property rate impost schedules for 1st, 2nd, and 3rd Class residential and commercial zones.","Business Operating Permit (BOP) annual classifications for Abossey Okai spare parts dealers, pharmacies, hospitality, and MSMEs.","Prescribed mobile money (MoMo) and GH-Link electronic settlement channels with instant QR receipts."]'::jsonb, 'published'),

  ('ABCMA Environmental Sanitation & Noise Abatement Bye-Laws',
   'Regulations governing food safety, public health screening, commercial waste disposal obligations, quiet hours, and penalties for indiscriminate dumping.',
   'Bye-Laws', 'Local Government Instrument L.I. 2248', 2024,
   'ABCMA_Sanitation_Noise_Abatement_ByeLaws.pdf', '2.1 MB', 'Environmental Health & Sanitation Unit (EHSU)',
   '["Mandatory registration with accredited solid waste concessionaires for all households and commercial stores.","Decibel ceiling thresholds for religious centres, pubs, and event venues after 10:00 PM in residential quarters.","On-the-spot sanitation court summons procedures and administrative spot fines for open drain dumping."]'::jsonb, 'published'),

  ('2026 Annual Composite Budget & Internally Generated Funds Plan',
   'Approved municipal budget allocation across capital infrastructure, health, education, administration, and projected revenue streams.',
   'Budget', 'ABCMA-FIN-REP-2026-VOL1', 2026,
   'ABCMA_2026_Annual_Composite_Budget.pdf', '5.2 MB', 'Budget & Finance Unit',
   '["Capital expenditure allocations prioritizing Abossey Okai and Sukura flood mitigation storm drains.","Projected Internally Generated Funds (IGF) targets alongside District Assembly Common Fund (DACF) transfers.","Quarterly public accountability disclosure benchmarks aligned with the Public Financial Management Act (Act 921)."]'::jsonb, 'published'),

  ('National Competitive Tender: Desilting & Road Paving Lots 1 to 4',
   'Invitation for sealed bids from Ministry of Works and Housing registered contractors (Category D1/K1) for 2026 municipal projects.',
   'Tenders', 'ABCMA/PROC/NCT/2026/08', 2026,
   'ABCMA_NCT_2026_08_Drainage_Road_Paving_Tender.pdf', '1.4 MB', 'Procurement & Municipal Works Directorate',
   '["Eligibility requirements: Valid PPA registration, GRA Tax Clearance, SSNIT, and MWH Category D1/K1 certificates.","Bill of Quantities summary covering reinforced concrete U-drains, kerbs, and asphaltic surfacing lots.","Bid security submission rules and public tender opening schedule at Block A Conference Hall."]'::jsonb, 'published'),

  ('ABCMA Building Permitting & Physical Spatial Planning Bye-Laws',
   'Mandatory structural regulations for new commercial buildings, setback requirements along stormwater easements, and temporary structure licensing.',
   'Bye-Laws', 'L.I. 2380 / ABCMA-PPD-2025', 2025,
   'ABCMA_Building_Permitting_Spatial_ByeLaws.pdf', '2.8 MB', 'Physical Planning & Works Department',
   '["Prohibition of permanent or temporary structures encroaching on statutory storm drain reservations and road corridors.","30-day statutory Spatial Planning Committee review timeline for complete architectural & structural submissions.","Mandatory soil test and structural engineer endorsement for developments exceeding two storeys."]'::jsonb, 'published'),

  ('Market Tolls, Lorry Stations & Commercial Transport Operations Bye-Laws',
   'Prescribed daily toll rates for trotros, taxis, and hawkers across Abossey Okai, Flamingo, and Town Council Line terminals.',
   'Fee-Fixing', 'Bulletin No. 22 / ABCMA-TRANS-2026', 2026,
   'ABCMA_Market_Tolls_Transport_ByeLaws_2026.pdf', '1.9 MB', 'Transport & Revenue Operations Unit',
   '["Authorized market stall daily ticket denominations and monthly lockable store rent schedules.","Designated loading bay regulations for GPRTU, PROTOA, and cooperative commercial drivers.","Sticker renewal verification protocol along commercial spare parts loading zones."]'::jsonb, 'published'),

  ('2025 Audited Internally Generated Funds (IGF) Financial Performance Report',
   'Comprehensive financial statement and value-for-money audit of revenue collected and disbursed across municipal drainage and lighting.',
   'Budget', 'ABCMA-AUDIT-2025-FIN', 2026,
   'ABCMA_2025_Audited_IGF_Performance_Report.pdf', '4.6 MB', 'Internal Audit & Finance Directorate',
   '["Audited year-on-year IGF revenue growth breakdown across Property Rates, BOP, and Market Fees.","Capital project disbursement reconciliation and contractor retention account audit summary.","Internal Audit Committee compliance certifications per Ghana Audit Service standards."]'::jsonb, 'published'),

  ('Tender Invitation: Solid Waste Concessionaires & Communal Transfer Stations',
   'Bidding guidelines for accredited private waste management contractors to service domestic zones and market skips in Sukura and Gbortsui.',
   'Tenders', 'ABCMA/PROC/WM/2026/03', 2026,
   'ABCMA_Solid_Waste_Concessionaires_Tender_2026.pdf', '1.7 MB', 'Procurement & EHSU',
   '["Compactor fleet capacity minimums, GPS tracking compliance, and daily skip evacuation guarantees.","Environmental Protection Agency (EPA) operational clearance requirements for haulage contractors.","Service level penalty clauses for missed residential collection cycles."]'::jsonb, 'published'),

  ('ABCMA Public Health & Food Handlers Certification Bye-Laws',
   'Sanitary protocols requiring annual medical examinations, clean water source certification, and disinfestation for restaurants, bakeries, and chop bars.',
   'Bye-Laws', 'Local Government Bulletin No. 09 / ABCMA-EHSU', 2025,
   'ABCMA_Food_Handlers_Public_Health_ByeLaws.pdf', '2.3 MB', 'Environmental Health & Sanitation Unit',
   '["Annual typhoid, hepatitis, and general medical screening certification requirement for all food preparers.","Premises hygiene grading display mandate for restaurants, cold stores, and sachet water depots.","Routine quarterly fumigation and vector control verification."]'::jsonb, 'published'),

  ('2026 Composite Annual Procurement Plan for Educational & Medical Facilities',
   'Approved Public Procurement Authority (PPA) schedule of hospital beds, medical consumables, school desks, and IT equipment tenders.',
   'Tenders', 'ABCMA/PPA/APP/2026/01', 2026,
   'ABCMA_2026_Composite_Procurement_Plan.pdf', '3.1 MB', 'Procurement Unit',
   '["Procurement schedule for Lartebiokorshie Mother & Child Health Pavilion medical equipment.","Mono and dual classroom desk supply timelines for basic schools across Mataheko and Sukura.","E-GP portal submission guidelines for prospective domestic suppliers."]'::jsonb, 'published'),

  ('2026–2029 Medium Term Development Plan (MTDP) Executive Summary & Ward Matrix',
   'Four-year strategic development blueprint outlining priority infrastructure, climate resilience, education, and local economic interventions across all 7 electoral areas.',
   'Reports', 'NDPC / ABCMA-MPCU-2026', 2026,
   'ABCMA_MTDP_2026_2029_Executive_Summary.pdf', '6.4 MB', 'Municipal Planning Coordinating Unit (MPCU)',
   '["Ward-by-ward needs assessment compiled from public town hall consultations in all 7 electoral areas.","Multi-year stormwater drainage, solar streetlight expansion, and maternal healthcare capacity goals.","Monitoring and Evaluation (M&E) key performance indicators reported to NDPC."]'::jsonb, 'published'),

  ('ABCMA Client Service Charter & Statutory Service Turnaround Handbook',
   'Official citizen service standards detailing processing timelines, required documents, walk-in room numbers, and complaint escalation channels at Block A.',
   'Guides', 'OHLCS / ABCMA-CSC-2026', 2026,
   'ABCMA_Client_Service_Charter_2026.pdf', '1.6 MB', 'Central Administration & Client Service Unit',
   '["Guaranteed turnaround times: 3–5 days for BOP renewals, 21 days for Ordinance Marriage, 30 days for Building Permits.","Right to Information (RTI Act 989) formal request form and officer contact directory.","Zero-bribery and cashless digital payment charter protecting ratepayers."]'::jsonb, 'published'),

  ('Business Operating Permit (BOP) & Commercial Zoning Application Guide',
   'Step-by-step PDF handbook for traders, shopkeepers, auto spare-parts dealers, and corporate entities registering or renewing their annual BOP.',
   'Guides', 'ABCMA-REV-GUIDE-2026-02', 2026,
   'ABCMA_BOP_Application_Compliance_Guide.pdf', '1.8 MB', 'Revenue & Physical Planning Units',
   '["Checklist of required documents: Registrar General Certificate, Ghana Card, TIN, and GhanaPostGPS address.","Commercial zoning compatibility rules for workshops, warehouses, and retail stores.","Step-by-step instructions for online MoMo renewal and instant e-Tax Clearance download."]'::jsonb, 'published'),

  ('Building & Development Permit Architectural Submission Checklist',
   'Technical specification checklist for landowners, architects, and developers submitting residential or multi-storey commercial building plans for approval.',
   'Guides', 'ABCMA-PPD-CHECKLIST-2026', 2026,
   'ABCMA_Development_Permit_Submission_Checklist.pdf', '2.5 MB', 'Physical Planning & Works Directorate',
   '["Required architectural, structural, electrical, and fire-service endorsed drawing sets (4 copies).","Lands Commission land title / indenture search verification and block plan scale standards.","Mandatory EPA & Fire Certificate conditions for commercial, fuel station, or multi-storey complexes."]'::jsonb, 'published'),

  ('2026 General Assembly Town Hall Minutes & Citizens Resolutions Compendium',
   'Published minutes and formal policy resolutions adopted during the First Ordinary General Assembly sitting and public fee-fixing hearings.',
   'Reports', 'ABCMA-GA-MINUTES-2026-Q1', 2026,
   'ABCMA_2026_TownHall_Minutes_Resolutions.pdf', '3.2 MB', 'Office of the Presiding Member & Central Admin',
   '["Summary of citizen memoranda submitted by residents of Mataheko, Sukura, Abossey Okai, and Lartebiokorshie.","Approved Assembly recommendations on Abossey Okai traffic decongestion and market illumination.","Attendance roll of Elected & Government-Appointed Assembly Members and Sub-Committee chairs."]'::jsonb, 'published'),

  ('District Assembly Common Fund (DACF) & 3% Disability Support Guidelines',
   'Eligibility criteria, vetting committee schedule, and application requirements for Persons with Disabilities seeking business, medical, or educational grants.',
   'Reports', 'ABCMA-SWCD-PWD-2026', 2026,
   'ABCMA_3Percent_Disability_Fund_Guidelines.pdf', '1.5 MB', 'Social Welfare & Community Development',
   '["Application requirements: Ghana Card, PWD Federation verification, and itemized startup or assistive-aid request.","Priority support tracks covering vocational trade equipment, medical surgeries, and tertiary tuition.","Quarterly vetting calendar and Social Services Sub-Committee transparency audit procedures."]'::jsonb, 'published')
) as v(title, description, category, gazette_number, year, file_name, file_size, department, key_provisions, status)
where not exists (
  select 1 from public.documents d
  where d.gazette_number = v.gazette_number and d.title = v.title
);

-- 10. Starter Dynamic CMS Page (idempotent on unique slug)
insert into public.pages (
  title, slug, summary, content_html, featured_image_url, attachments, status, published_at
)
values (
  'Client Service Charter & Right to Information (RTI)',
  'client-service-charter',
  'Official turnaround timelines, desk contacts, and Right to Information Act 989 application guidelines for Ablekuma Central Municipal Assembly.',
  '<h2>Our Service Commitment</h2><p>Ablekuma Central Municipal Assembly (ABCMA) is committed to transparent, timely, and cashless local governance in accordance with the Local Governance Act 2016 (Act 936).</p><h3>Statutory Processing Timelines</h3><ul><li><strong>Business Operating Permit (BOP) Renewal:</strong> 3 – 5 Working Days (Instant digital receipt online)</li><li><strong>Building & Development Permit:</strong> 14 – 30 Working Days following Spatial Planning Committee review</li><li><strong>Ordinance & Customary Marriage Registration:</strong> 21 Days statutory notice period under Cap 127</li><li><strong>Environmental Health Screening Certificate:</strong> 48 Hours</li></ul><h3>Right to Information (RTI) Desk</h3><p>Formal RTI Act 989 requests may be submitted in person at Block A Client Service Centre, Lartebiokorshie or via email at <strong>info@abcma.gov.gh</strong>.</p>',
  '/images/ablekuma_assembly_welcome_1794372179601.jpg',
  '[]'::jsonb,
  'published',
  timezone('utc', now())
)
on conflict (slug) do nothing;
