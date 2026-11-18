import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  CmsAnnouncement,
  CmsEvent,
  CmsGalleryAlbum,
  CmsGalleryImage,
  CmsNavigationItem,
  CmsPage,
  CmsStaffProfile,
  CmsWebsiteSettings,
} from '../types/cms';
import {
  GazettedDocument,
  MunicipalDepartment,
  MunicipalNewsItem,
  TownHallMeeting,
} from '../types';
import {
  GAZETTED_DOCUMENTS,
  MUNICIPAL_DEPARTMENTS,
  MUNICIPAL_NEWS,
  TOWN_HALLS,
} from '../data/mockData';

export const DEFAULT_WEBSITE_SETTINGS: CmsWebsiteSettings = {
  id: 1,
  site_title: 'Ablekuma Central Municipal Assembly',
  site_description:
    'Official municipal assembly portal for public service delivery, permits, property & business rates billing, and citizen community engagement in Greater Accra, Ghana.',
  logo_url: '/assets/aistudio/abcma_logo_74f7cef4.jpeg',
  favicon_url: '/assets/aistudio/abcma_logo_74f7cef4.jpeg',
  hero_heading: 'Ablekuma Central Municipal Assembly',
  hero_subheading: 'Akwaaba · Official Digital Portal',
  welcome_message:
    'Welcoming residents, corporate institutions, and commercial traders across Abossey Okai, Lartebiokorshie, Mataheko, Sukura, Town Council Line, Gbortsui, and Mabrouk. Pay property rates, renew Business Operating Permits, review capital projects, and engage your local government.',
  hero_image_url: '/images/ablekuma_assembly_welcome_1794372179601.jpg',
  homepage_banners: [],
  homepage_highlights: [],
  homepage_cta: {
    primaryLabel: 'Open Services Page',
    primaryTarget: 'service',
    secondaryLabel: 'Explore All News & Activities',
    secondaryTarget: 'news',
  },
  homepage_stats: [
    { label: 'Electoral Areas in ABCMA', value: '7' },
    { label: 'Active Municipal Departments', value: '10' },
    { label: 'Registered Commercial Businesses', value: '4,280+' },
    { label: 'Instant MoMo & Card Gateway', value: '24/7' },
  ],
  contact_phones: ['0302-228-900', '0302-228-901'],
  contact_emails: ['info@abcma.gov.gh', 'support@abcma.gov.gh'],
  office_location: 'Municipal Assembly Complex, Lartebiokorshie, Accra',
  postal_address: 'P.O. Box GP 19401, Accra Central, Ghana',
  gps_address: 'GA-140-2210',
  working_hours: 'Monday – Friday: 8:00 AM – 5:00 PM (GMT)',
  google_maps_url: 'https://maps.google.com/?q=Lartebiokorshie+Accra',
  social_links: { facebook: '', twitter: '', instagram: '', youtube: '' },
  footer_text:
    'Serving the residents, commercial trading zones, and communities of Ablekuma Central under the Local Governance Act 2016 (Act 936).',
  copyright_text:
    '© 2026 Ablekuma Central Municipal Assembly (ABCMA). Republic of Ghana. All statutory rights reserved.',
  seo_metadata: {
    keywords: 'Ablekuma Central Municipal Assembly, ABCMA, Accra, Local Government Ghana',
    ogImage: '/images/ablekuma_assembly_welcome_1794372179601.jpg',
  },
  status: 'published',
  updated_at: new Date().toISOString(),
};

export const DEFAULT_NAVIGATION_ITEMS: CmsNavigationItem[] = [
  { id: 'nav-home', label: 'Home', target_type: 'section', target_value: 'home', parent_id: null, sort_order: 1, is_visible: true, created_at: '', updated_at: '' },
  { id: 'nav-news', label: 'News', target_type: 'section', target_value: 'news', parent_id: null, sort_order: 2, is_visible: true, created_at: '', updated_at: '' },
  { id: 'nav-departments', label: 'Departments', target_type: 'section', target_value: 'departments', parent_id: null, sort_order: 3, is_visible: true, created_at: '', updated_at: '' },
  { id: 'nav-service', label: 'Service', target_type: 'section', target_value: 'service', parent_id: null, sort_order: 4, is_visible: true, created_at: '', updated_at: '' },
  { id: 'nav-projects', label: 'Projects', target_type: 'section', target_value: 'projects', parent_id: null, sort_order: 5, is_visible: true, created_at: '', updated_at: '' },
  { id: 'nav-documents', label: 'Documents', target_type: 'section', target_value: 'documents', parent_id: null, sort_order: 6, is_visible: true, created_at: '', updated_at: '' },
  { id: 'nav-gallery', label: 'Gallery', target_type: 'section', target_value: 'gallery', parent_id: null, sort_order: 7, is_visible: true, created_at: '', updated_at: '' },
  { id: 'nav-assembly', label: 'The Assembly', target_type: 'section', target_value: 'assembly', parent_id: null, sort_order: 8, is_visible: true, created_at: '', updated_at: '' },
];

interface CmsContextValue {
  settings: CmsWebsiteSettings;
  navigation: CmsNavigationItem[];
  pages: CmsPage[];
  news: MunicipalNewsItem[];
  announcements: CmsAnnouncement[];
  departments: MunicipalDepartment[];
  staffProfiles: CmsStaffProfile[];
  events: CmsEvent[];
  townHallsFromEvents: TownHallMeeting[];
  albums: CmsGalleryAlbum[];
  galleryImages: CmsGalleryImage[];
  documents: GazettedDocument[];
  loading: boolean;
  lastSyncedAt: string | null;
  refreshPublicContent: () => Promise<void>;
}

const CmsContext = createContext<CmsContextValue | undefined>(undefined);

function formatDisplayDate(iso?: string | null): string {
  if (!iso) return 'March 2026';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatEventDate(iso?: string | null): string {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CmsWebsiteSettings>(DEFAULT_WEBSITE_SETTINGS);
  const [navigation, setNavigation] = useState<CmsNavigationItem[]>(DEFAULT_NAVIGATION_ITEMS);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [news, setNews] = useState<MunicipalNewsItem[]>(MUNICIPAL_NEWS);
  const [announcements, setAnnouncements] = useState<CmsAnnouncement[]>([]);
  const [departments, setDepartments] = useState<MunicipalDepartment[]>(MUNICIPAL_DEPARTMENTS);
  const [staffProfiles, setStaffProfiles] = useState<CmsStaffProfile[]>([]);
  const [events, setEvents] = useState<CmsEvent[]>([]);
  const [albums, setAlbums] = useState<CmsGalleryAlbum[]>([]);
  const [galleryImages, setGalleryImages] = useState<CmsGalleryImage[]>([]);
  const [documents, setDocuments] = useState<GazettedDocument[]>(GAZETTED_DOCUMENTS);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const syncDocumentHead = useCallback((nextSettings: CmsWebsiteSettings) => {
    if (typeof document === 'undefined') return;
    if (nextSettings.site_title) {
      document.title = nextSettings.site_title;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && nextSettings.site_description) {
      metaDesc.setAttribute('content', nextSettings.site_description);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && nextSettings.site_title) {
      ogTitle.setAttribute('content', nextSettings.site_title);
    }
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && nextSettings.site_description) {
      ogDesc.setAttribute('content', nextSettings.site_description);
    }
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && nextSettings.favicon_url) {
      favicon.setAttribute('href', nextSettings.favicon_url);
    }
  }, []);

  const refreshPublicContent = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nowIso = new Date().toISOString();

      const [
        settingsRes,
        navRes,
        pagesRes,
        newsRes,
        annRes,
        deptRes,
        staffRes,
        eventsRes,
        albumsRes,
        imagesRes,
        docsRes,
      ] = await Promise.all([
        supabase.from('website_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('navigation_items').select('*').eq('is_visible', true).order('sort_order', { ascending: true }),
        supabase.from('pages').select('*').eq('status', 'published').order('updated_at', { ascending: false }),
        supabase.from('news').select('*').or(`status.eq.published,and(status.eq.scheduled,scheduled_at.lte.${nowIso})`).order('published_at', { ascending: false }),
        supabase.from('announcements').select('*').eq('status', 'published').eq('audience', 'public').order('published_at', { ascending: false }),
        supabase.from('departments').select('*').eq('status', 'published').order('display_order', { ascending: true }),
        supabase.from('staff_profiles').select('*').eq('status', 'published').eq('is_public', true).order('display_order', { ascending: true }),
        supabase.from('events').select('*').eq('status', 'published').order('event_date', { ascending: true }),
        supabase.from('gallery_albums').select('*').eq('status', 'published').order('created_at', { ascending: false }),
        supabase.from('gallery_images').select('*').eq('status', 'published').order('display_order', { ascending: true }),
        supabase.from('documents').select('*').eq('status', 'published').order('created_at', { ascending: false }),
      ]);

      if (settingsRes.data && settingsRes.data.status === 'published') {
        const mergedSettings: CmsWebsiteSettings = {
          ...DEFAULT_WEBSITE_SETTINGS,
          ...settingsRes.data,
          homepage_banners: Array.isArray(settingsRes.data.homepage_banners)
            ? settingsRes.data.homepage_banners
            : [],
          homepage_highlights: Array.isArray(settingsRes.data.homepage_highlights)
            ? settingsRes.data.homepage_highlights
            : [],
          homepage_stats:
            Array.isArray(settingsRes.data.homepage_stats) && settingsRes.data.homepage_stats.length > 0
              ? settingsRes.data.homepage_stats
              : DEFAULT_WEBSITE_SETTINGS.homepage_stats,
          contact_phones:
            Array.isArray(settingsRes.data.contact_phones) && settingsRes.data.contact_phones.length > 0
              ? settingsRes.data.contact_phones
              : DEFAULT_WEBSITE_SETTINGS.contact_phones,
          contact_emails:
            Array.isArray(settingsRes.data.contact_emails) && settingsRes.data.contact_emails.length > 0
              ? settingsRes.data.contact_emails
              : DEFAULT_WEBSITE_SETTINGS.contact_emails,
        };
        setSettings(mergedSettings);
        syncDocumentHead(mergedSettings);
      }

      if (navRes.data && navRes.data.length > 0) {
        setNavigation(navRes.data as CmsNavigationItem[]);
      }

      if (pagesRes.data) {
        setPages(pagesRes.data as CmsPage[]);
      }

      if (newsRes.data && newsRes.data.length > 0) {
        const mappedNews: MunicipalNewsItem[] = newsRes.data.map((row) => {
          const fullStoryArr = Array.isArray(row.full_story) ? row.full_story : [];
          const wordCount = [row.excerpt, row.content, ...fullStoryArr].join(' ').split(/\s+/).length;
          const readMins = Math.max(2, Math.round(wordCount / 180));
          return {
            id: row.id,
            title: row.title,
            newsScope: row.news_scope === 'other' ? 'other' : 'local',
            category: row.category || 'Notice',
            date: formatDisplayDate(row.published_at || row.created_at),
            excerpt: row.excerpt,
            content: row.content || row.excerpt,
            fullStory: fullStoryArr,
            author: row.author_name || 'ABCMA Information Desk',
            location: row.location || undefined,
            imageUrl: row.featured_image_url || '/images/acma_civic_headquarters_1794370608615.jpg',
            readTime: `${readMins} min read`,
            badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-700/50',
            targetPage: row.target_page || 'news',
            targetLabel: row.target_label || 'Read More',
            isFeaturedHomepage: Boolean(row.is_featured_homepage),
          };
        });
        setNews(mappedNews);
      }

      if (annRes.data) {
        const now = Date.now();
        const activeAnns = (annRes.data as CmsAnnouncement[]).filter(
          (a) => !a.expires_at || new Date(a.expires_at).getTime() >= now
        );
        setAnnouncements(activeAnns);
      }

      if (deptRes.data && deptRes.data.length > 0) {
        const mappedDepts: MunicipalDepartment[] = deptRes.data.map((d) => ({
          id: d.id,
          name: d.name,
          shortCode: d.short_code,
          category: d.category,
          head: d.head_name,
          headTitle: d.head_title,
          room: d.room,
          phone: d.phone,
          email: d.email,
          description: d.description,
          coreFunctions: Array.isArray(d.core_functions) ? d.core_functions : [],
          servicesOffered: Array.isArray(d.services_offered) ? d.services_offered : [],
          operatingHours: d.operating_hours,
          headImageUrl: d.head_image_url || undefined,
          bannerImageUrl: d.banner_image_url || undefined,
        }));
        setDepartments(mappedDepts);
      }

      if (staffRes.data) {
        setStaffProfiles(staffRes.data as CmsStaffProfile[]);
      }

      if (eventsRes.data) {
        setEvents(eventsRes.data as CmsEvent[]);
      }

      if (albumsRes.data) {
        setAlbums(albumsRes.data as CmsGalleryAlbum[]);
      }

      if (imagesRes.data) {
        setGalleryImages(imagesRes.data as CmsGalleryImage[]);
      }

      if (docsRes.data && docsRes.data.length > 0) {
        const mappedDocs: GazettedDocument[] = docsRes.data.map((doc) => ({
          id: doc.id,
          title: doc.title,
          category: doc.category,
          gazetteNumber: doc.gazette_number,
          year: doc.year,
          fileSize: doc.file_size,
          summary: doc.description,
          fileName: doc.file_name,
          fileUrl: doc.file_url || undefined,
          department: doc.department || undefined,
          keyProvisions: Array.isArray(doc.key_provisions) ? doc.key_provisions : [],
        }));
        setDocuments(mappedDocs);
      }

      setLastSyncedAt(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, [syncDocumentHead]);

  useEffect(() => {
    refreshPublicContent();
  }, [refreshPublicContent]);

  const townHallsFromEvents: TownHallMeeting[] =
    events.length > 0
      ? events
          .filter((ev) => ev.event_status !== 'cancelled')
          .map((ev) => ({
            id: ev.id,
            title: ev.title,
            date: formatEventDate(ev.event_date),
            time: ev.event_time,
            venue: ev.venue,
            electoralArea: ev.electoral_area || 'All Electoral Areas',
            agenda: Array.isArray(ev.agenda) ? ev.agenda : [],
            rsvpsCount: 0,
          }))
      : TOWN_HALLS;

  return (
    <CmsContext.Provider
      value={{
        settings,
        navigation,
        pages,
        news,
        announcements,
        departments,
        staffProfiles,
        events,
        townHallsFromEvents,
        albums,
        galleryImages,
        documents,
        loading,
        lastSyncedAt,
        refreshPublicContent,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
};

export function useCms(): CmsContextValue {
  const ctx = useContext(CmsContext);
  if (!ctx) {
    throw new Error('useCms must be used inside CmsProvider');
  }
  return ctx;
}
