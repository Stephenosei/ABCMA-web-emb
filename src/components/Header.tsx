import React, { useState } from 'react';
import { Search, Phone, ShieldCheck, MapPin, Menu, X, Landmark } from 'lucide-react';

interface HeaderProps {
  onOpenTrackModal: (initialCode?: string) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTrackModal,
  activeSection,
  setActiveSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'departments', label: 'Departments' },
    { id: 'service', label: 'Service' },
    { id: 'projects', label: 'Projects' },
    { id: 'documents', label: 'Documents' },
    { id: 'assembly', label: 'The Assembly' },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    window.location.hash = `#${id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            <span className="hidden xs:inline text-slate-300">Lartebiokorshie Municipal Complex</span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 text-slate-300 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Hotline: <strong className="text-white font-mono">0302-228-900</strong></span>
            </div>
            <span aria-hidden="true" className="text-slate-600 hidden md:inline">|</span>
            <span className="hidden md:inline text-slate-400">Mon - Fri: 8:00 AM - 5:00 PM</span>
          </div>
        </div>
      </div>

      {/* Main Top Navigation conforming strictly to Top Bar Contract:
          Zone 1: Single text element wordmark
          Zone 2: 4-5 clean single-line nav links
          Zone 3: 1 primary action */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2 sm:gap-2.5 text-left text-slate-900 hover:text-emerald-800 transition-colors shrink min-w-0 group cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-900 flex items-center justify-center text-amber-400 font-bold shadow-sm shrink-0">
            <Landmark className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <span className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-slate-900 block leading-tight truncate">
              Ablekuma Central <span className="hidden xs:inline">Municipal Assembly</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-emerald-800 tracking-wider uppercase block truncate">
              Greater Accra, Ghana
            </span>
          </div>
        </button>

        {/* Zone 2: Single-line Text Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-700">
          {navLinks.map((link) => {
            const isActive =
              activeSection === link.id ||
              (link.id === 'assembly' && activeSection === 'leadership-address') ||
              (link.id === 'projects' && activeSection === 'project-dossier');

            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 relative py-1 cursor-pointer ${
                  isActive
                    ? 'text-emerald-800 font-bold'
                    : 'text-slate-700'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => onOpenTrackModal()}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[36px]"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">Track Application / Bill</span>
            <span className="sm:hidden">Track</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const isActive =
              activeSection === link.id ||
              (link.id === 'assembly' && activeSection === 'leadership-address') ||
              (link.id === 'projects' && activeSection === 'project-dossier');

            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`block w-full text-left px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors cursor-pointer min-h-[44px] flex items-center ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900 font-bold border-l-4 border-emerald-700 pl-3'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-800'
                }`}
              >
                {link.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
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
          </div>
        </div>
      )}
    </header>
  );
};
