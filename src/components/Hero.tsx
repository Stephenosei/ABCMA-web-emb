import React, { useState } from 'react';
import {
  CreditCard,
  FileText,
  AlertTriangle,
  Users,
  ArrowRight,
  Search,
  ShieldCheck,
  Building2,
  Cpu,
  UserCheck,
  Wrench,
  HeartHandshake,
  MapPin,
  Clock,
  Phone,
  Maximize2,
  Sparkles,
  TrendingUp,
  Landmark,
  HardHat,
  Download,
  CheckCircle2,
  ChevronRight,
  Bell,
  Newspaper,
  Calendar,
  Eye,
  X
} from 'lucide-react';
import { MUNICIPAL_DEPARTMENTS, MUNICIPAL_PROJECTS, MUNICIPAL_NEWS } from '../data/mockData';
import { MunicipalDepartment, MunicipalNewsItem } from '../types';
import { Pagination } from './Pagination';

interface HeroProps {
  onNavigate: (page: string) => void;
  onOpenTrackModal: (code?: string) => void;
  onOpenReportModal: () => void;
  onOpenServiceModal: (serviceId?: string) => void;
  onSelectDepartment: (dept: MunicipalDepartment) => void;
  onOpenProjectDossier: (projectId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onNavigate,
  onOpenTrackModal,
  onOpenReportModal,
  onOpenServiceModal,
  onSelectDepartment,
  onOpenProjectDossier,
}) => {
  const [quickSearchInput, setQuickSearchInput] = useState('');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [activeNewsCategory, setActiveNewsCategory] = useState<string>('all');
  const [previewNewsItem, setPreviewNewsItem] = useState<MunicipalNewsItem | null>(null);

  // Pagination for What's New bulletins
  const [currentNewsPage, setCurrentNewsPage] = useState(1);
  const NEWS_PER_PAGE = 3;

  const assemblyImagePath = '/src/assets/images/ablekuma_assembly_welcome_1794372179601.jpg';
  const mcePortraitPath = '/src/assets/images/acma_mce_portrait_1794438674697.jpg';
  const featuredProject = MUNICIPAL_PROJECTS[0]; // Abossey Okai Stormwater Channel

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearchInput.trim()) {
      onOpenTrackModal(quickSearchInput.trim());
    } else {
      onOpenTrackModal();
    }
  };

  const handleNewsCategoryChange = (catId: string) => {
    setActiveNewsCategory(catId);
    setCurrentNewsPage(1);
  };

  const filteredNews =
    activeNewsCategory === 'all'
      ? MUNICIPAL_NEWS
      : MUNICIPAL_NEWS.filter((n) => n.category.toLowerCase() === activeNewsCategory.toLowerCase());

  const totalNewsPages = Math.ceil(filteredNews.length / NEWS_PER_PAGE) || 1;
  const paginatedNews = filteredNews.slice(
    (currentNewsPage - 1) * NEWS_PER_PAGE,
    currentNewsPage * NEWS_PER_PAGE
  );

  const handleNewsPageChange = (page: number) => {
    setCurrentNewsPage(page);
    const elem = document.getElementById('whats-new');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-slate-900 text-white" id="home">
      {/* =========================================================================
          1. HERO WELCOME SECTION WITH THE ASSEMBLY BUILDING PICTURE BIGGER BEHIND
          ========================================================================= */}
      <section className="relative overflow-hidden border-b border-slate-800 pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* BIG ASSEMBLY BUILDING PICTURE SPREAD ACROSS THE ENTIRE HERO BACKGROUND */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={assemblyImagePath}
            alt="Ablekuma Central Municipal Assembly Civic Headquarters"
            className="w-full h-full object-cover object-center filter brightness-95 contrast-105 scale-100 transition-transform duration-1000 ease-out"
          />
          {/* Measured gradient scrims that showcase the building clearly while ensuring high text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top Breadcrumb Badge */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-semibold shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Republic of Ghana</span>
              <span className="text-emerald-700">·</span>
              <span>Greater Accra Region</span>
              <span className="text-emerald-700">·</span>
              <span>Local Governance Act 2016 (Act 936)</span>
            </div>

            <button
              onClick={() => setImageModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Enlarge Assembly Photo</span>
            </button>
          </div>

          {/* Grid Layout: Left Welcome Narrative, Right Building Highlight Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div>
                <span className="text-amber-400 font-bold uppercase tracking-wider text-xs sm:text-sm block mb-2 drop-shadow">
                  Akwaaba · Official Digital Portal
                </span>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] drop-shadow-md">
                  Ablekuma Central <br />
                  <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                    Municipal Assembly
                  </span>
                </h1>
              </div>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl drop-shadow">
                Welcoming residents, corporate institutions, and commercial traders across{' '}
                <strong className="text-white font-semibold">
                  Abossey Okai, Lartebiokorshie, Mataheko, Sukura, Town Council Line, Gbortsui, and Mabrouk
                </strong>
                . Pay property rates, renew Business Operating Permits, review capital projects, and engage your local government.
              </p>

              {/* Instant Search / Tracking Input Box */}
              <form
                onSubmit={handleQuickSearchSubmit}
                className="flex flex-col sm:flex-row items-stretch gap-2.5 p-2 bg-slate-950/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl max-w-xl"
              >
                <div className="flex-1 flex items-center gap-3 px-3.5 py-2.5 bg-white rounded-xl text-slate-900">
                  <Search className="w-5 h-5 text-emerald-800 shrink-0" />
                  <input
                    type="text"
                    value={quickSearchInput}
                    onChange={(e) => setQuickSearchInput(e.target.value)}
                    placeholder="Enter Bill No. (e.g. PROP-2026-4019) or Tracking Code..."
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  <span>Lookup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Direct Jump Buttons to Open Pages */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                <span className="text-slate-300 font-medium">Quick Open Pages:</span>
                <a
                  href="#whats-new"
                  className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>What's New</span>
                </a>
                <button
                  onClick={() => onNavigate('departments')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Departments</span>
                </button>
                <button
                  onClick={() => onNavigate('service')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Services & Rates</span>
                </button>
                <button
                  onClick={() => onNavigate('projects')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <HardHat className="w-3.5 h-3.5 text-amber-400" />
                  <span>Projects Tracker</span>
                </button>
                <button
                  onClick={() => onNavigate('documents')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Gazette Records</span>
                </button>
              </div>
            </div>

            {/* Right Column (4 Cols): Glassmorphic Building Highlight Card */}
            <div className="lg:col-span-4">
              <div className="bg-slate-950/80 backdrop-blur-md border border-white/20 p-5 rounded-3xl shadow-2xl space-y-3.5">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Assembly Complex</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                    Open Today
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    Ablekuma Central Municipal Headquarters
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Housing the Executive Chambers, Central Administration, HR, MIS, and Client Service Center.
                  </p>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-xs space-y-1.5 text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Lartebiokorshie, Greater Accra</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Mon - Fri: 8:00 AM – 5:00 PM</span>
                  </div>
                </div>

                <button
                  onClick={() => setImageModalOpen(true)}
                  className="w-full py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Inspect Full-Resolution Building Photo</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Primary Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-12">
            {/* Card 1: Pay Bills & Rates */}
            <div
              onClick={() => onNavigate('service')}
              className="group p-5 bg-slate-900/90 hover:bg-slate-900 rounded-2xl border border-slate-700/80 hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg flex flex-col justify-between backdrop-blur"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400 mb-3.5 group-hover:scale-105 transition-transform">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-base font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                  Pay Rates & Bills
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Instant mobile money & card payments for Property Rates, BOP, and Market Tolls.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:underline">
                <span>Open Services Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 2: Departments */}
            <div
              onClick={() => onNavigate('departments')}
              className="group p-5 bg-slate-900/90 hover:bg-slate-900 rounded-2xl border border-slate-700/80 hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg flex flex-col justify-between backdrop-blur"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400 mb-3.5 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-base font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                  Municipal Departments
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Central Admin, HR, MIS, Works, Social Welfare & all 10 statutory directorates.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:underline">
                <span>Open Departments Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 3: Projects Tracker */}
            <div
              onClick={() => onNavigate('projects')}
              className="group p-5 bg-slate-900/90 hover:bg-slate-900 rounded-2xl border border-slate-700/80 hover:border-amber-500/50 transition-all cursor-pointer shadow-lg flex flex-col justify-between backdrop-blur"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-amber-950 border border-amber-700/50 flex items-center justify-center text-amber-400 mb-3.5 group-hover:scale-105 transition-transform">
                  <HardHat className="w-5 h-5" />
                </div>
                <h2 className="text-base font-semibold text-white mb-1 group-hover:text-amber-300 transition-colors">
                  Capital Projects Tracker
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Track ongoing drainage channels, polyclinic pavilion, and road resurfacing works.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:underline">
                <span>Open Projects Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 4: Community & Assembly */}
            <div
              onClick={() => onNavigate('assembly')}
              className="group p-5 bg-slate-900/90 hover:bg-slate-900 rounded-2xl border border-slate-700/80 hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg flex flex-col justify-between backdrop-blur"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-700/50 flex items-center justify-center text-emerald-400 mb-3.5 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-base font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                  The Assembly Hub
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Contact elected Assembly Members across the 7 wards and view Town Hall dates.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:underline">
                <span>Open Assembly Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column KPI Trust Strip */}
        <div className="relative z-10 border-t border-slate-800 bg-slate-950/90 py-5 mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-white">7</div>
              <div className="text-xs text-slate-400 mt-1">Electoral Areas in ACMA</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-emerald-400">10</div>
              <div className="text-xs text-slate-400 mt-1">Active Municipal Departments</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-amber-400">4,280+</div>
              <div className="text-xs text-slate-400 mt-1">Registered Commercial Businesses</div>
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-bold font-mono tabular-nums text-white">24/7</div>
              <div className="text-xs text-slate-400 mt-1">Instant MoMo & Card Gateway</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. EXECUTIVE LEADERSHIP SPOTLIGHT FEATURING THE MCE PICTURE
          ========================================================================= */}
      <section className="py-14 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10">
              {/* Left Column: MCE Official Portrait Picture */}
              <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="relative group">
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-amber-400 to-emerald-500 rounded-3xl blur-md opacity-60 group-hover:opacity-100 transition duration-500" />
                  <div className="relative w-56 sm:w-64 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-2xl bg-slate-900">
                    <img
                      src={mcePortraitPath}
                      alt="Hon. Kwaku Addo Mensah, Municipal Chief Executive of Ablekuma Central"
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-3 text-left">
                      <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                        Hon. Kwaku Addo Mensah
                      </div>
                      <div className="text-[10px] text-slate-300">
                        Municipal Chief Executive (MCE)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 font-semibold">
                  <Landmark className="w-4 h-4" />
                  <span>Political & Administrative Head · ACMA</span>
                </div>
              </div>

              {/* Right Column: Executive Message & Vision with Read More */}
              <div className="lg:col-span-8 space-y-5">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Office of the Municipal Chief Executive (MCE)</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white font-serif-civic leading-snug">
                    "Building an Inclusive, Modern & Resilient Ablekuma Central for All Residents and Commercial Traders"
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Under the Local Governance Act 2016 (Act 936), Ablekuma Central Municipal Assembly serves as both supreme planning authority and the driver of local economic transformation. My administration is dedicated to ending seasonal flood hazards across Abossey Okai through engineered storm drainage, completing the modern mother and child health pavilion at Lartebiokorshie polyclinic, expanding digital revenue collection through MIS, and directly supporting persons with disabilities (PWDs).
                </p>

                {/* Key Commitments Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Rapid engineered stormwater drainage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>24/7 automated MoMo rate settlement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Maternal healthcare & polyclinic upgrade</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Grassroots town hall consultations</span>
                  </div>
                </div>

                {/* Read More Action Bar */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-slate-400">
                    <span className="block font-medium text-slate-300">Delivered at the General Assembly Session</span>
                    <span>Accra Metropolitan Area · 2026 Policy Directive</span>
                  </div>

                  <button
                    onClick={() => onNavigate('leadership-address')}
                    className="px-5 py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
                  >
                    <span>Read More · Full 2026 MCE Strategic Policy Address</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. "WHAT'S NEW" / MUNICIPAL NEWS & PUBLIC BULLETINS
          ========================================================================= */}
      <section className="py-14 bg-slate-900 text-white border-b border-slate-800" id="whats-new">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1.5">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>What's New in Ablekuma Central</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Official Municipal Bulletins & Announcements
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Stay updated on statutory compliance windows, infrastructure handovers, town hall schedules, and public health campaigns across the municipality.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'All News' },
                { id: 'notice', label: 'Notices' },
                { id: 'infrastructure', label: 'Works' },
                { id: 'welfare', label: 'Welfare' },
                { id: 'assembly', label: 'Assembly' },
                { id: 'health', label: 'Health' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleNewsCategoryChange(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    activeNewsCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* News Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedNews.map((item) => (
              <div
                key={item.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all shadow-md flex flex-col justify-between group hover:bg-slate-850"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${item.badgeColor}`}>
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {item.date}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug mb-2.5">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                    {item.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewNewsItem(item)}
                    className="text-xs text-slate-400 hover:text-white font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Read Brief</span>
                  </button>

                  <button
                    onClick={() => onNavigate(item.targetPage)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 cursor-pointer group-hover:underline"
                  >
                    <span>{item.targetLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls for What's New */}
          <div className="mt-6">
            <Pagination
              currentPage={currentNewsPage}
              totalPages={totalNewsPages}
              totalItems={filteredNews.length}
              itemsPerPage={NEWS_PER_PAGE}
              onPageChange={handleNewsPageChange}
              itemName="bulletins"
              darkTheme={true}
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. DEPARTMENTS SPOTLIGHT WITH "READ MORE"
          ========================================================================= */}
      <section className="py-14 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">
                Decentralized Administration
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Municipal Directorates & Key Departments
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                Statutory directorates established under Act 936 to serve residents, traders, and investors:
              </p>
            </div>

            <button
              onClick={() => onNavigate('departments')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>Read More on Departments Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Department Cards Grid (Central Admin, HR, MIS, Works, Social Welfare) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {MUNICIPAL_DEPARTMENTS.slice(0, 5).map((dept) => (
              <div
                key={dept.id}
                onClick={() => onSelectDepartment(dept)}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col justify-between hover:bg-slate-850 transition-all cursor-pointer group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-700/50">
                      {dept.shortCode}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {dept.room.split(',')[0]}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug mb-1">
                    {dept.name}
                  </h4>

                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                    {dept.description}
                  </p>

                  <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 mb-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Head:</span>
                    <span className="text-slate-200 font-medium">{dept.head}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-emerald-400 font-semibold group-hover:underline">
                  <span>Read More Details</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>Also operating: <strong>Physical Planning, Finance & Revenue, Environmental Health, NADMO Desk, and Agriculture</strong>.</span>
            <button
              onClick={() => onNavigate('departments')}
              className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Read More on Full Directorate Directory Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. CAPITAL INFRASTRUCTURE WORKS SPOTLIGHT WITH "READ MORE"
          ========================================================================= */}
      <section className="py-14 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-amber-400" />
                <span>Featured Capital Works Investment</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Active Infrastructure Project Spotlight
              </h3>
            </div>

            <button
              onClick={() => onNavigate('projects')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>Read More on Projects Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800">
            <div className="lg:col-span-5 aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900 relative border border-slate-700">
              <img
                src={featuredProject.imageUrl}
                alt={featuredProject.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur text-xs font-semibold text-amber-400">
                {featuredProject.status} · {featuredProject.percentageComplete}% Completed
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-mono text-emerald-400 block">
                {featuredProject.electoralArea} Electoral Area · Budget: {featuredProject.budgetGHS}
              </span>

              <h4 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {featuredProject.title}
              </h4>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {featuredProject.description}
              </p>

              <div className="space-y-1.5 max-w-md">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Construction Milestone:</span>
                  <span className="font-mono text-emerald-400">{featuredProject.percentageComplete}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${featuredProject.percentageComplete}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onOpenProjectDossier(featuredProject.id)}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>Read More · Full Project Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onNavigate('projects')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  <span>View All 4 Municipal Projects</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. GAZETTE DOCUMENTS & COMMERCIAL PERMITS SPOTLIGHT WITH "READ MORE"
          ========================================================================= */}
      <section className="py-14 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">
                <FileText className="w-4 h-4" />
                <span>Public Records & Gazetted Resolutions</span>
              </div>
              <h4 className="text-base font-bold text-white mb-1.5">
                2026 Gazetted Fee-Fixing Resolution & Composite Budget
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Statutory schedule of rates, commercial business fees, and market tolls officially gazetted in the Ghana Local Government Bulletin for the 2026 fiscal year.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Bulletin No. 14 / ACMA</span>
              <button
                onClick={() => onNavigate('documents')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Read More on Documents Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">
                <CreditCard className="w-4 h-4" />
                <span>Public Services & Commercial Clearances</span>
              </div>
              <h4 className="text-base font-bold text-white mb-1.5">
                Business Operating Permits (BOP) & Civil Licensing
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Renew or apply for commercial operating permits, marriage notices under Cap 127, building plan clearances, and food vendor health screening.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Instant MoMo Gateway</span>
              <button
                onClick={() => onNavigate('service')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Read More on Services Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LIGHTBOX: HIGH-RES ASSEMBLY BUILDING PHOTO
          ========================================================================= */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          onClick={() => setImageModalOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Ablekuma Central Municipal Assembly (ACMA) Complex
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lartebiokorshie, Greater Accra Region · Civic Headquarters & Assembly Chambers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImageModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>

            <div className="relative bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={assemblyImagePath}
                alt="Ablekuma Central Municipal Assembly Complex"
                className="w-full h-auto max-h-[75vh] object-contain"
              />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <strong className="text-white">Municipal Assembly Headquarters:</strong> Accommodates the Offices of the MCE, Central Administration, HR, MIS, Works Department, Physical Planning, and the Assembly Hall.
              </div>
              <button
                onClick={() => {
                  setImageModalOpen(false);
                  onNavigate('departments');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shrink-0 cursor-pointer"
              >
                Open Departments Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: WHAT'S NEW BULLETIN BRIEF
          ========================================================================= */}
      {previewNewsItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setPreviewNewsItem(null)}
        >
          <div
            className="relative max-w-xl w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-5 text-white shadow-2xl animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${previewNewsItem.badgeColor}`}>
                    {previewNewsItem.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{previewNewsItem.date}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {previewNewsItem.title}
                </h3>
              </div>

              <button
                onClick={() => setPreviewNewsItem(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 text-slate-300 leading-relaxed">
              <p>{previewNewsItem.excerpt}</p>
              <p className="pt-2 border-t border-slate-800 text-slate-400">{previewNewsItem.content}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Published by: <strong>{previewNewsItem.author}</strong></span>
              <span>{previewNewsItem.readTime}</span>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setPreviewNewsItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const target = previewNewsItem.targetPage;
                  setPreviewNewsItem(null);
                  onNavigate(target);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
              >
                <span>{previewNewsItem.targetLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
