import React, { useState } from 'react';
import { Search, Phone, Menu, X, ChevronDown, ShieldCheck } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { CmsNavigationItem } from '../types/cms';
import { sanitizeUrl } from '../utils/security';

interface HeaderProps {
  onOpenTrackModal: (initialCode?: string) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onOpenCmsPage?: (slug: string) => void;
  activeCmsSlug?: string | null;
  onOpenAdmin?: () => void;
  isAuthenticatedAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTrackModal,
  activeSection,
  setActiveSection,
  onOpenCmsPage,
  activeCmsSlug = null,
  onOpenAdmin,
  isAuthenticatedAdmin = false,
}) => {
  const { settings, navigation } = useCms();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const adminHref = isAuthenticatedAdmin ? '/admin' : '/admin/login';

  const visibleItems = navigation.filter((n) => n.is_visible);
  const topLevelItems = visibleItems.filter((n) => !n.parent_id);

  const getChildren = (parentId: string) =>
    visibleItems.filter((n) => n.parent_id === parentId);

  const isItemActive = (item: CmsNavigationItem): boolean => {
    if (item.target_type === 'page') {
      return activeSection === 'cms-page' && activeCmsSlug === item.target_value;
    }
    if (item.target_type === 'section') {
      return (
        activeSection === item.target_value ||
        (item.target_value === 'assembly' && activeSection === 'leadership-address') ||
        (item.target_value === 'projects' && activeSection === 'project-dossier')
      );
    }
    return false;
  };

  const handleItemAction = (item: CmsNavigationItem) => {
    setMobileMenuOpen(false);
    setOpenDropdownId(null);

    if (item.target_type === 'page' && onOpenCmsPage) {
      onOpenCmsPage(item.target_value);
      return;
    }

    if (item.target_type === 'section') {
      setActiveSection(item.target_value);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const primaryPhone = settings.contact_phones[0] || '0302-228-900';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      {/* Civic Operational Utility Strip */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs overflow-x-auto whitespace-nowrap scrollbar-none">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span className="font-semibold text-amber-400">Republic of Ghana</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>Greater Accra</span>
            <span aria-hidden="true" className="text-slate-500 hidden xs:inline">·</span>
            <span className="hidden xs:inline text-slate-300 truncate max-w-[260px]">
              {settings.office_location}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 text-slate-300 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Hotline: <strong className="text-white font-mono">{primaryPhone}</strong>
              </span>
            </div>
            <span aria-hidden="true" className="text-slate-600 hidden md:inline">|</span>
            <span className="hidden md:inline text-slate-400 truncate max-w-[240px]">
              {settings.working_hours}
            </span>
            <span aria-hidden="true" className="text-slate-600">|</span>
            <a
              href={adminHref}
              onClick={(e) => {
                if (onOpenAdmin) {
                  e.preventDefault();
                  onOpenAdmin();
                }
              }}
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-300 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{isAuthenticatedAdmin ? 'Admin Dashboard' : 'Admin Portal'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Top Navigation */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-5">
        {/* Brand Wordmark */}
        <button
          onClick={() => setActiveSection('home')}
          className="flex items-center gap-2.5 sm:gap-3 text-left text-slate-900 hover:text-emerald-800 transition-colors shrink min-w-0 group cursor-pointer"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border border-emerald-700/25 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
            <img
              src={
                sanitizeUrl(settings.logo_url || '', {
                  allowRelative: true,
                  allowHash: false,
                  allowMailtoTel: false,
                }) || '/assets/aistudio/abcma_logo_74f7cef4.jpeg'
              }
              alt={`${settings.site_title} Crest`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain scale-[1.42] transition-transform duration-300 group-hover:scale-[1.48]"
            />
          </div>
          <div className="min-w-0">
            <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 block leading-tight truncate">
              {settings.site_title}
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-emerald-800 tracking-wider uppercase block truncate">
              Greater Accra, Ghana
            </span>
          </div>
        </button>

        {/* Single-line Desktop Nav Links with optional dropdown children */}
        <nav className="hidden lg:flex items-center gap-3 xl:gap-5 text-[13px] xl:text-sm font-medium text-slate-700">
          {topLevelItems.map((item) => {
            const children = getChildren(item.id);
            const active = isItemActive(item) || children.some(isItemActive);

            if (item.target_type === 'external' && children.length === 0) {
              const safeHref = sanitizeUrl(item.target_value, {
                allowRelative: false,
                allowHash: false,
                allowMailtoTel: false,
              });
              if (!safeHref) return null;
              return (
                <a
                  key={item.id}
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 py-1 text-slate-700"
                >
                  {item.label}
                </a>
              );
            }

            if (children.length > 0) {
              const isOpen = openDropdownId === item.id;
              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setOpenDropdownId(item.id)}
                  onMouseLeave={() => setOpenDropdownId(null)}
                >
                  <button
                    type="button"
                    onClick={() => handleItemAction(item)}
                    className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 relative py-1 cursor-pointer inline-flex items-center gap-1 ${
                      active ? 'text-emerald-800 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="absolute left-0 top-full pt-1.5 w-52 z-50">
                      <div className="bg-white border border-slate-200 rounded-xl shadow-xl py-1.5">
                        {children.map((child) =>
                          child.target_type === 'external' ? (
                            (() => {
                              const safeChildHref = sanitizeUrl(child.target_value, {
                                allowRelative: false,
                                allowHash: false,
                                allowMailtoTel: false,
                              });
                              if (!safeChildHref) return null;
                              return (
                                <a
                                  key={child.id}
                                  href={safeChildHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                                >
                                  {child.label}
                                </a>
                              );
                            })()
                          ) : (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => handleItemAction(child)}
                              className={`block w-full text-left px-3.5 py-2 text-xs font-medium cursor-pointer ${
                                isItemActive(child)
                                  ? 'bg-emerald-50 text-emerald-900 font-bold'
                                  : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900'
                              }`}
                            >
                              {child.label}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleItemAction(item)}
                className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 relative py-1 cursor-pointer ${
                  active ? 'text-emerald-800 font-bold' : 'text-slate-700'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Track Action + Mobile Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => onOpenTrackModal()}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[36px]"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">Track Application / Bill</span>
            <span className="sm:hidden">Track</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 shadow-lg">
          {topLevelItems.map((item) => {
            const active = isItemActive(item);
            const children = getChildren(item.id);
            return (
              <div key={item.id} className="space-y-1">
                {item.target_type === 'external' ? (
                  (() => {
                    const safeHref = sanitizeUrl(item.target_value, {
                      allowRelative: false,
                      allowHash: false,
                      allowMailtoTel: false,
                    });
                    if (!safeHref) return null;
                    return (
                      <a
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full text-left px-3.5 py-2.5 text-sm font-medium rounded-xl text-slate-700 hover:bg-slate-50 hover:text-emerald-800 min-h-[44px] flex items-center"
                      >
                        {item.label}
                      </a>
                    );
                  })()
                ) : (
                  <button
                    onClick={() => handleItemAction(item)}
                    className={`block w-full text-left px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center ${
                      active
                        ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-800'
                    }`}
                  >
                    {item.label}
                  </button>
                )}

                {children.length > 0 && (
                  <div className="pl-4 space-y-1">
                    {children.map((child) =>
                      child.target_type === 'external' ? (
                        (() => {
                          const safeChildHref = sanitizeUrl(child.target_value, {
                            allowRelative: false,
                            allowHash: false,
                            allowMailtoTel: false,
                          });
                          if (!safeChildHref) return null;
                          return (
                            <a
                              key={child.id}
                              href={safeChildHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-3 py-2 text-xs font-medium text-slate-600 hover:text-emerald-800 rounded-lg"
                            >
                              {child.label}
                            </a>
                          );
                        })()
                      ) : (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => handleItemAction(child)}
                          className={`block w-full text-left px-3 py-2 text-xs font-medium rounded-lg cursor-pointer ${
                            isItemActive(child)
                              ? 'bg-emerald-50 text-emerald-900 font-bold'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-800'
                          }`}
                        >
                          {child.label}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTrackModal();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 rounded-xl border border-emerald-200 transition-colors cursor-pointer min-h-[44px]"
            >
              <Search className="w-4 h-4 text-emerald-700" />
              <span>Track Any Permit / Report</span>
            </button>
            <a
              href={adminHref}
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (onOpenAdmin) {
                  e.preventDefault();
                  onOpenAdmin();
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-100 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors min-h-[44px]"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isAuthenticatedAdmin ? 'Admin Dashboard' : 'Admin Portal'}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

