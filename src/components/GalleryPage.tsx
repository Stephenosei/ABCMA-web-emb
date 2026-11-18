import React, { useState, useEffect, useMemo } from 'react';
import {
  Images,
  ArrowLeft,
  FolderOpen,
  Sparkles,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { CmsGalleryImage } from '../types/cms';
import { Pagination } from './Pagination';

interface GalleryPageProps {
  onNavigate: (page: string) => void;
}

const DEFAULT_CIVIC_IMAGES: CmsGalleryImage[] = [
  {
    id: 'default-gal-1',
    album_id: 'default-album-civic',
    title: 'Ablekuma Central Municipal Assembly Civic Headquarters',
    caption: 'Main administration complex housing the Office of the MCE, Central Administration, HR, and Client Service Desk at Lartebiokorshie.',
    category: 'Civic Infrastructure',
    image_url: '/images/ablekuma_assembly_welcome_1794372179601.jpg',
    is_featured: true,
    display_order: 1,
    status: 'published',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'default-gal-2',
    album_id: 'default-album-civic',
    title: 'General Assembly Legislative Chamber',
    caption: 'Deliberative hall where Hon. Assembly Members convene quarterly General Assembly sessions and statutory fee-fixing hearings.',
    category: 'Governance & Sessions',
    image_url: '/images/assembly_chamber_backdrop_1794482218382.jpg',
    is_featured: true,
    display_order: 2,
    status: 'published',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'default-gal-3',
    album_id: 'default-album-civic',
    title: 'Town Hall & Stakeholder Budget Consultation',
    caption: 'Participatory civic engagement with traders, traditional authorities, and residents across all 7 electoral areas.',
    category: 'Community Engagement',
    image_url: '/images/acma_townhall_meeting_1794370609788.jpg',
    is_featured: false,
    display_order: 3,
    status: 'published',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'default-gal-4',
    album_id: 'default-album-civic',
    title: 'Municipal Administration & Revenue Hall',
    caption: 'Front-facing public service hall supporting property rates verification, BOP renewals, and civil licensing.',
    category: 'Civic Infrastructure',
    image_url: '/images/acma_civic_headquarters_1794370608615.jpg',
    is_featured: false,
    display_order: 4,
    status: 'published',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'default-gal-5',
    album_id: 'default-album-civic',
    title: 'Civic Plaza & Public Forecourt',
    caption: 'Landscaped municipal forecourt hosting national commemorative ceremonies and community outreach drives.',
    category: 'Community Engagement',
    image_url: '/images/acma_civic_plaza_bg_1794482218453.jpg',
    is_featured: false,
    display_order: 5,
    status: 'published',
    created_at: '',
    updated_at: '',
  },
];

export const GalleryPage: React.FC<GalleryPageProps> = ({ onNavigate }) => {
  const { albums, galleryImages } = useCms();
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxImage, setLightboxImage] = useState<CmsGalleryImage | null>(null);
  const ITEMS_PER_PAGE = 9;

  const activeImages = galleryImages.length > 0 ? galleryImages : DEFAULT_CIVIC_IMAGES;
  const activeAlbums =
    albums.length > 0
      ? albums
      : [
          {
            id: 'default-album-civic',
            title: 'Civic Premises & Governance Archive',
            description: 'Official architectural, legislative, and community consultation photography of ABCMA.',
            category: 'Governance',
            cover_image_url: '/images/ablekuma_assembly_welcome_1794372179601.jpg',
            status: 'published' as const,
            created_at: '',
            updated_at: '',
          },
        ];

  const categories = useMemo(() => {
    const unique = Array.from(new Set(activeImages.map((img) => img.category).filter(Boolean)));
    return ['all', ...unique];
  }, [activeImages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAlbumId, selectedCategory, searchQuery]);

  const filteredImages = activeImages.filter((img) => {
    const matchesAlbum = selectedAlbumId === 'all' || img.album_id === selectedAlbumId;
    const matchesCat = selectedCategory === 'all' || img.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      img.title.toLowerCase().includes(q) ||
      (img.caption && img.caption.toLowerCase().includes(q)) ||
      img.category.toLowerCase().includes(q);
    return matchesAlbum && matchesCat && matchesQuery;
  });

  const featuredImages = activeImages.filter((img) => img.is_featured);
  const totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE) || 1;
  const paginatedImages = filteredImages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const albumNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    activeAlbums.forEach((alb) => {
      map[alb.id] = alb.title;
    });
    return map;
  }, [activeAlbums]);

  const currentLightboxIndex = lightboxImage
    ? filteredImages.findIndex((i) => i.id === lightboxImage.id)
    : -1;

  const handleStepLightbox = (direction: -1 | 1) => {
    if (currentLightboxIndex < 0 || filteredImages.length === 0) return;
    const nextIdx = (currentLightboxIndex + direction + filteredImages.length) % filteredImages.length;
    setLightboxImage(filteredImages[nextIdx]);
  };

  return (
    <section id="gallery" className="py-12 lg:py-16 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Breadcrumb */}
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-emerald-800 transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Photo Gallery & Civic Media</span>
          </nav>

          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/85 backdrop-blur-sm border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Page Title & Search */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Images className="w-4 h-4 text-emerald-700" />
              <span>Visual Archive · Ablekuma Central</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Municipal Photo Gallery & Albums
            </h1>
            <p className="text-sm text-slate-700 mt-1 max-w-2xl">
              Explore official photographs of Assembly sessions, community town halls, capital infrastructure milestones, and civic facilities across Ablekuma Central.
            </p>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search photos or captions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white/90 backdrop-blur-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
            />
          </div>
        </div>

        {/* Albums Strip */}
        {activeAlbums.length > 0 && (
          <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <FolderOpen className="w-4 h-4 text-emerald-700" />
              <span>Photo Albums</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedAlbumId('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedAlbumId === 'all'
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                }`}
              >
                All Albums ({activeImages.length})
              </button>
              {activeAlbums.map((alb) => (
                <button
                  key={alb.id}
                  onClick={() => setSelectedAlbumId(alb.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedAlbumId === alb.id
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  {alb.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured Spotlight Banner (only on unfiltered view) */}
        {selectedAlbumId === 'all' &&
          selectedCategory === 'all' &&
          !searchQuery.trim() &&
          featuredImages.length > 0 && (
            <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>Featured Assembly Highlights</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {featuredImages.slice(0, 2).map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setLightboxImage(img)}
                    className="group relative h-60 rounded-2xl overflow-hidden border border-slate-700 cursor-pointer bg-slate-950"
                  >
                    <img
                      src={img.image_url}
                      alt={img.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 space-y-1">
                      <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                        {img.category}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                        {img.title}
                      </h3>
                      {img.caption && (
                        <p className="text-xs text-slate-300 line-clamp-2">{img.caption}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-xl overflow-x-auto max-w-full shadow-sm">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Photo Grid */}
        {filteredImages.length === 0 ? (
          <div className="p-12 text-center bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl space-y-2">
            <Images className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No photographs match your filter</h3>
            <p className="text-xs text-slate-500">
              Try selecting All Albums or clearing your search keywords.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedImages.map((img) => (
              <div
                key={img.id}
                onClick={() => setLightboxImage(img)}
                className="group bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-600/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="relative h-56 bg-slate-900 overflow-hidden">
                  <img
                    src={img.image_url}
                    alt={img.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />
                  <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-950/70 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-medium text-white">
                    <span className="text-emerald-300 font-semibold">{img.category}</span>
                    {img.album_id && albumNameMap[img.album_id] && (
                      <span className="text-slate-200 truncate max-w-[55%]">
                        {albumNameMap[img.album_id]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                    {img.title}
                  </h3>
                  {img.caption && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {img.caption}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredImages.length > ITEMS_PER_PAGE && (
          <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl px-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredImages.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 180, behavior: 'smooth' });
              }}
              itemName="photographs"
            />
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  {lightboxImage.category}
                  {lightboxImage.album_id && albumNameMap[lightboxImage.album_id]
                    ? ` · ${albumNameMap[lightboxImage.album_id]}`
                    : ''}
                </div>
                <h3 className="text-sm font-bold text-white truncate">{lightboxImage.title}</h3>
              </div>

              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer shrink-0"
                aria-label="Close lightbox"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-slate-950 flex items-center justify-center max-h-[72vh]">
              <img
                src={lightboxImage.image_url}
                alt={lightboxImage.title}
                referrerPolicy="no-referrer"
                className="w-full h-auto max-h-[72vh] object-contain"
              />

              {filteredImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleStepLightbox(-1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white border border-white/20 cursor-pointer"
                    aria-label="Previous photograph"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepLightbox(1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white border border-white/20 cursor-pointer"
                    aria-label="Next photograph"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {lightboxImage.caption && (
              <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 leading-relaxed">
                {lightboxImage.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
