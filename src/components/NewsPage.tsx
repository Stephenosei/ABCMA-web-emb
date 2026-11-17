import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Search,
  ArrowLeft,
  ArrowRight,
  Calendar,
  User,
  MapPin,
  Clock,
  Globe,
  Landmark
} from 'lucide-react';
import { MUNICIPAL_NEWS } from '../data/mockData';
import { MunicipalNewsItem } from '../types';
import { Pagination } from './Pagination';

interface NewsPageProps {
  onNavigate: (page: string) => void;
  selectedArticleId?: string | null;
  onSelectArticleId?: (id: string | null) => void;
}

export const NewsPage: React.FC<NewsPageProps> = ({
  onNavigate,
  selectedArticleId = null,
  onSelectArticleId,
}) => {
  const [scopeFilter, setScopeFilter] = useState<'all' | 'local' | 'other'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(selectedArticleId);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    setInternalSelectedId(selectedArticleId ?? null);
  }, [selectedArticleId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, categoryFilter, searchQuery]);

  const activeArticleId = onSelectArticleId ? selectedArticleId : internalSelectedId;

  const handleOpenArticle = (id: string | null) => {
    if (onSelectArticleId) {
      onSelectArticleId(id);
    } else {
      setInternalSelectedId(id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedArticle: MunicipalNewsItem | undefined = activeArticleId
    ? MUNICIPAL_NEWS.find((item) => item.id === activeArticleId)
    : undefined;

  const filteredNews = MUNICIPAL_NEWS.filter((item) => {
    const matchesScope = scopeFilter === 'all' || item.newsScope === scopeFilter;
    const matchesCat =
      categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.excerpt.toLowerCase().includes(q) ||
      item.author.toLowerCase().includes(q) ||
      (item.location && item.location.toLowerCase().includes(q));
    return matchesScope && matchesCat && matchesQuery;
  });

  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE) || 1;
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const localCount = MUNICIPAL_NEWS.filter((n) => n.newsScope === 'local').length;
  const otherCount = MUNICIPAL_NEWS.filter((n) => n.newsScope === 'other').length;

  // Full Editorial Article Detail View when user clicks "Read More"
  if (selectedArticle) {
    const relatedStories = MUNICIPAL_NEWS.filter(
      (n) => n.id !== selectedArticle.id && n.newsScope === selectedArticle.newsScope
    ).slice(0, 3);

    return (
      <section className="py-10 lg:py-14 bg-transparent min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-600 flex-wrap">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-emerald-800 transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <button
              onClick={() => handleOpenArticle(null)}
              className="hover:text-emerald-800 transition-colors cursor-pointer"
            >
              News & Assembly Activities
            </button>
            <span>/</span>
            <span className="text-slate-900 font-semibold truncate max-w-xs">
              {selectedArticle.title}
            </span>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => handleOpenArticle(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-all cursor-pointer min-h-[40px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All News</span>
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="text-xs font-semibold text-slate-600 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              Return to Home Page
            </button>
          </div>

          <article className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl overflow-hidden shadow-xl">
            {/* Hero Image Banner */}
            <div className="relative h-64 sm:h-80 bg-slate-900 overflow-hidden">
              {selectedArticle.imageUrl && (
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-300">
                  <span>
                    {selectedArticle.newsScope === 'local'
                      ? 'Local News · Ablekuma Central Activity'
                      : 'Other News · Regional & National Update'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedArticle.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedArticle.date}</span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif-civic leading-snug text-white">
                  {selectedArticle.title}
                </h1>
              </div>
            </div>

            {/* Article Metadata Strip */}
            <div className="px-6 sm:px-10 py-4 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  {selectedArticle.author}
                </span>
                {selectedArticle.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    {selectedArticle.location}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedArticle.date}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {selectedArticle.readTime}
                </span>
              </div>
            </div>

            {/* Article Body */}
            <div className="p-6 sm:p-10 space-y-5 text-slate-700 leading-relaxed text-sm sm:text-base max-w-none">
              <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed font-serif-civic">
                {selectedArticle.excerpt}
              </p>

              <div className="border-t border-slate-200 pt-5 space-y-4">
                {(selectedArticle.fullStory && selectedArticle.fullStory.length > 0
                  ? selectedArticle.fullStory
                  : [selectedArticle.content]
                ).map((para, idx) => (
                  <p key={idx} className="text-sm sm:text-base text-slate-700 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>

              {/* Action Bridge */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  Official Public Communication · Ablekuma Central Municipal Assembly (ABCMA)
                </div>
                <button
                  onClick={() => onNavigate(selectedArticle.targetPage)}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[40px]"
                >
                  <span>{selectedArticle.targetLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>

          {/* Related Stories */}
          {relatedStories.length > 0 && (
            <div className="pt-4 space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                More {selectedArticle.newsScope === 'local' ? 'Local Assembly Activities' : 'Regional & Partner News'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedStories.map((rel) => (
                  <div
                    key={rel.id}
                    className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-emerald-600/40 hover:shadow-md transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-slate-500 font-medium">
                        {rel.category} · {rel.date}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {rel.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{rel.excerpt}</p>
                    </div>
                    <button
                      onClick={() => handleOpenArticle(rel.id)}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer self-start pt-1"
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  const featuredLead = !searchQuery && currentPage === 1 && filteredNews.length > 0 ? filteredNews[0] : null;
  const gridItems = featuredLead ? paginatedNews.filter((item) => item.id !== featuredLead.id) : paginatedNews;

  return (
    <section id="news" className="py-12 lg:py-16 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-emerald-800 transition-colors cursor-pointer"
            >
              Home
            </button>
            <span>/</span>
            <span className="text-slate-800 font-semibold">
              News & Municipal Assembly Activities
            </span>
          </nav>

          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/85 backdrop-blur-sm border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Page Header + Search */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Newspaper className="w-4 h-4 text-emerald-700" />
              <span>Press Releases, Ward Works & Bulletins</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Assembly News & Public Activities
            </h1>
            <p className="text-sm text-slate-700 mt-1 max-w-2xl">
              Follow official activities inside Ablekuma Central Municipal Assembly alongside Greater Accra regional updates and national local governance notices.
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search news, location, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-white/90 backdrop-blur-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>

        {/* Scope & Category Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Primary Scope Selector: All | Local News | Other News */}
          <div className="flex items-center gap-1 p-1 bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-xl overflow-x-auto max-w-full shadow-sm">
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                scopeFilter === 'all'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Newspaper className="w-3.5 h-3.5" />
              <span>All News ({MUNICIPAL_NEWS.length})</span>
            </button>
            <button
              onClick={() => setScopeFilter('local')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                scopeFilter === 'local'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Local News ({localCount})</span>
            </button>
            <button
              onClick={() => setScopeFilter('other')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                scopeFilter === 'other'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Other News ({otherCount})</span>
            </button>
          </div>

          {/* Topic Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-xl overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'All News' },
              { id: 'notice', label: 'Notices' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Lead Story */}
        {featuredLead && (
          <div className="bg-slate-900 text-white rounded-3xl overflow-hidden shadow-xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-5 relative min-h-[240px] bg-slate-950 overflow-hidden">
              {featuredLead.imageUrl && (
                <img
                  src={featuredLead.imageUrl}
                  alt={featuredLead.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
            </div>

            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <span>
                    {featuredLead.newsScope === 'local' ? 'Local News · Featured Activity' : 'Other News · Featured Update'}
                  </span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span className="text-amber-400">{featuredLead.category}</span>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span className="text-slate-300 font-normal">{featuredLead.date}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold font-serif-civic leading-snug text-white">
                  {featuredLead.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {featuredLead.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  <strong className="text-slate-200">{featuredLead.author}</strong>
                  {featuredLead.location && <span> · {featuredLead.location}</span>}
                </div>

                <button
                  onClick={() => handleOpenArticle(featuredLead.id)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow transition-colors inline-flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap min-h-[40px]"
                >
                  <span>Read More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* News Cards Grid */}
        {filteredNews.length === 0 ? (
          <div className="p-12 text-center bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl space-y-2">
            <Newspaper className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No news stories match your filters</h3>
            <p className="text-xs text-slate-500">
              Try switching between All News, Local News, and Other News or clearing your search keywords.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridItems.map((item) => (
              <article
                key={item.id}
                className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-emerald-600/50 hover:shadow-xl transition-all group"
              >
                <div>
                  <div className="relative h-44 bg-slate-900 overflow-hidden">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-medium text-white">
                      <span>{item.newsScope === 'local' ? 'Local News' : 'Other News'}</span>
                      <span className="font-mono text-slate-200">{item.date}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                      <span>{item.category}</span>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className="text-slate-500 font-normal">{item.readTime}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {item.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-slate-200/80 flex items-center justify-between gap-2 bg-slate-50/70">
                  <span className="text-[11px] text-slate-500 truncate max-w-[60%]">
                    {item.author}
                  </span>

                  <button
                    onClick={() => handleOpenArticle(item.id)}
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap transition-colors"
                  >
                    <span>Read More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredNews.length > ITEMS_PER_PAGE && (
          <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl px-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredNews.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 260, behavior: 'smooth' });
              }}
              itemName="news bulletins"
            />
          </div>
        )}
      </div>
    </section>
  );
};
