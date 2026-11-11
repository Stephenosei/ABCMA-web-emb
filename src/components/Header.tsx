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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      {/* Civic Operational Utility Strip */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-amber-400">Republic of Ghana</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span>Greater Accra Region</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="hidden sm:inline">Lartebiokorshie Municipal Complex</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Emergency / Hotline: <strong className="text-white font-mono">0302-228-900</strong></span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 text-left text-slate-900 hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-900 flex items-center justify-center text-amber-400 font-bold shadow-sm">
            <Landmark className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 block leading-tight">
              Ablekuma Central Municipal Assembly
            </span>
            <span className="text-[11px] font-medium text-emerald-800 tracking-wider uppercase block">
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
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onOpenTrackModal()}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Search className="w-4 h-4 text-amber-300" />
            <span>Track Application / Bill</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-md focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-800 rounded-md"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTrackModal();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-900 bg-emerald-50 rounded-lg border border-emerald-200"
            >
              <Search className="w-4 h-4" />
              Track Any Permit / Report
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
