export type AdminRoleSlug = 'super_admin' | 'content_admin' | 'editor';

export interface AdminRole {
  id: string;
  slug: AdminRoleSlug;
  name: string;
  description: string;
  created_at: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string;
  role_id: string;
  department: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  role?: AdminRole;
}

export interface PageAttachment {
  name: string;
  url: string;
  size?: string;
}

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content_html: string;
  featured_image_url: string | null;
  attachments: PageAttachment[];
  status: 'draft' | 'published';
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsNewsArticle {
  id: string;
  title: string;
  slug: string;
  news_scope: 'local' | 'other';
  category: string;
  excerpt: string;
  content: string;
  full_story: string[];
  featured_image_url: string | null;
  author_name: string;
  location: string | null;
  target_page: string | null;
  target_label: string | null;
  status: 'draft' | 'scheduled' | 'published';
  is_featured_homepage: boolean;
  published_at: string | null;
  scheduled_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsAnnouncement {
  id: string;
  title: string;
  description: string;
  category: string;
  audience: 'public' | 'internal';
  attachment_url: string | null;
  attachment_name: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  expires_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsDepartment {
  id: string;
  slug: string;
  name: string;
  short_code: string;
  category: 'admin' | 'technical' | 'social' | 'finance' | 'planning';
  head_name: string;
  head_title: string;
  head_image_url: string | null;
  banner_image_url: string | null;
  room: string;
  phone: string;
  email: string;
  description: string;
  core_functions: string[];
  services_offered: string[];
  operating_hours: string;
  display_order: number;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface CmsStaffProfile {
  id: string;
  full_name: string;
  position_title: string;
  department_id: string | null;
  department_name: string | null;
  biography: string;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  is_management: boolean;
  is_public: boolean;
  display_order: number;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface CmsEvent {
  id: string;
  title: string;
  description: string;
  venue: string;
  electoral_area: string | null;
  event_date: string;
  event_time: string;
  banner_url: string | null;
  agenda: string[];
  event_status: 'upcoming' | 'completed' | 'cancelled';
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface CmsGalleryAlbum {
  id: string;
  title: string;
  description: string | null;
  category: string;
  cover_image_url: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface CmsGalleryImage {
  id: string;
  album_id: string | null;
  title: string;
  caption: string | null;
  category: string;
  image_url: string;
  is_featured: boolean;
  display_order: number;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface CmsDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  gazette_number: string;
  year: number;
  audience?: 'public' | 'internal';
  storage_bucket?: string;
  storage_path?: string | null;
  file_url: string | null;
  file_name: string;
  file_size: string;
  department: string | null;
  key_provisions: string[];
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface CmsNavigationItem {
  id: string;
  label: string;
  target_type: 'section' | 'page' | 'external';
  target_value: string;
  parent_id: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomepageBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  ctaTarget: string;
}

export interface HomepageHighlight {
  id: string;
  title: string;
  description: string;
  badge: string;
  targetPage: string;
}

export interface HomepageStat {
  label: string;
  value: string;
}

export interface HomepageCtaConfig {
  primaryLabel: string;
  primaryTarget: string;
  secondaryLabel: string;
  secondaryTarget: string;
}

export interface SocialLinksConfig {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
}

export interface SeoMetadataConfig {
  keywords?: string;
  ogImage?: string;
}

export interface CmsWebsiteSettings {
  id: number;
  site_title: string;
  site_description: string;
  logo_url: string;
  favicon_url: string;
  hero_heading: string;
  hero_subheading: string;
  welcome_message: string;
  hero_image_url: string;
  homepage_banners: HomepageBanner[];
  homepage_highlights: HomepageHighlight[];
  homepage_cta: HomepageCtaConfig;
  homepage_stats: HomepageStat[];
  contact_phones: string[];
  contact_emails: string[];
  office_location: string;
  postal_address: string;
  gps_address: string;
  working_hours: string;
  google_maps_url: string;
  social_links: SocialLinksConfig;
  footer_text: string;
  copyright_text: string;
  seo_metadata: SeoMetadataConfig;
  status: 'draft' | 'published';
  updated_at: string;
}

export interface CmsMediaAsset {
  id: string;
  file_name: string;
  file_path: string;
  public_url: string;
  mime_type: string;
  file_size: number;
  folder: string;
  alt_text: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export type ProjectStatus = 'Planned' | 'Ongoing' | 'Completed' | 'Suspended';

export interface CmsProject {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  featured_image_url: string | null;
  gallery_images: string[];
  category: string;
  department_id: string | null;
  department_name: string;
  location: string;
  start_date: string | null;
  expected_completion_date: string | null;
  actual_completion_date: string | null;
  project_status: ProjectStatus;
  publication_status: 'draft' | 'published';
  progress_percentage: number;
  budget_ghs: string;
  funding_source: string;
  contractor: string;
  display_order: number;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsActivityLog {
  id: string;
  admin_id: string | null;
  admin_email: string;
  admin_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string;
  outcome?: 'success' | 'failure' | 'blocked';
  metadata?: Record<string, unknown> | null;
  previous_values: Record<string, unknown> | null;
  updated_values: Record<string, unknown> | null;
  created_at: string;
}

export interface CmsContactMessage {
  id: string;
  ticket_reference: string;
  full_name: string;
  phone_number: string;
  normalized_phone: string | null;
  email: string;
  recipient_unit: string;
  subject: string;
  message: string;
  inquiry_status: 'new' | 'in_review' | 'resolved' | 'archived';
  sms_status: 'pending' | 'processing' | 'sent' | 'failed';
  sms_sent_at: string | null;
  sms_error: string | null;
  sms_provider_id: string | null;
  sms_attempts: number;
  created_at: string;
  updated_at: string;
}

export type AdminSectionId =
  | 'overview'
  | 'pages'
  | 'news'
  | 'announcements'
  | 'departments'
  | 'staff'
  | 'projects'
  | 'events'
  | 'gallery'
  | 'documents'
  | 'homepage'
  | 'navigation'
  | 'contact'
  | 'enquiries'
  | 'settings'
  | 'media'
  | 'security'
  | 'admins'
  | 'logs';
