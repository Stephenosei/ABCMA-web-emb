import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Cpu,
  UserCheck,
  Wrench,
  HeartHandshake,
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Filter
} from 'lucide-react';
import { MunicipalDepartment } from '../types';
import { MUNICIPAL_DEPARTMENTS } from '../data/mockData';
import { Pagination } from './Pagination';

interface DepartmentsPageProps {
  onNavigate: (page: string) => void;
  onSelectDepartment: (dept: MunicipalDepartment) => void;
  onOpenServiceModal: (serviceId?: string) => void;
  onOpenReportModal: () => void;
}

export const DepartmentsPage: React.FC<DepartmentsPageProps> = ({
  onNavigate,
  onSelectDepartment,
  onOpenServiceModal,
  onOpenReportModal,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'admin' | 'technical' | 'social' | 'finance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const DEPTS_PER_PAGE = 6;

  // Reset to page 1 whenever search query or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchQuery]);

  const filteredDepts = MUNICIPAL_DEPARTMENTS.filter((dept) => {
    const matchesCat = categoryFilter === 'all' || dept.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      dept.name.toLowerCase().includes(q) ||
      dept.shortCode.toLowerCase().includes(q) ||
      dept.head.toLowerCase().includes(q) ||
      dept.description.toLowerCase().includes(q) ||
      dept.servicesOffered.some((s) => s.toLowerCase().includes(q)) ||
      dept.coreFunctions.some((f) => f.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  const totalPages = Math.ceil(filteredDepts.length / DEPTS_PER_PAGE) || 1;
  const paginatedDepts = filteredDepts.slice(
    (currentPage - 1) * DEPTS_PER_PAGE,
    currentPage * DEPTS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-emerald-800 transition-colors cursor-pointer"
          >
            Home
          </button>
          <span>/</span>
          <span className="text-slate-800 font-semibold">
            Municipal Directorates & Departments
          </span>
        </nav>

        {/* Back Button & Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-all cursor-pointer mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>

            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Decentralized Governance Structure · Local Governance Act 2016 (Act 936)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Municipal Directorates & Key Departments
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Explore the 10 statutory directorates of Ablekuma Central Municipal Assembly, including <strong>Central Admin</strong>, <strong>HR</strong>, <strong>MIS</strong>, <strong>Works</strong>, and <strong>Social Welfare</strong>. Click "Read More" on any directorate to review its mandate, officer in charge, and public service protocols.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Central Admin, HR, MIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl mb-8 overflow-x-auto shadow-sm max-w-full">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Directorates ({MUNICIPAL_DEPARTMENTS.length})
          </button>
          <button
            onClick={() => setCategoryFilter('admin')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'admin'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Central Admin & HR
          </button>
          <button
            onClick={() => setCategoryFilter('technical')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'technical'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Works, MIS & Tech
          </button>
          <button
            onClick={() => setCategoryFilter('social')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'social'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Social Welfare & Agriculture
          </button>
          <button
            onClick={() => setCategoryFilter('finance')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              categoryFilter === 'finance'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Finance & Revenue
          </button>
        </div>

        {/* Department Grid */}
        {filteredDepts.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Directorates Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No municipal departments match your search "{searchQuery}" or category filter. Try clearing filters or searching for terms like "Admin", "HR", "MIS", or "Works".
            </p>
            <button
              onClick={() => {
                setCategoryFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedDepts.map((dept) => (
              <div
                key={dept.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-600/40 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header Tag */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {dept.shortCode}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {dept.room.split(',')[0]}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                    {dept.name}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                    {dept.description}
                  </p>

                  {/* Director Profile Box */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 mb-4 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                      Director / Head of Directorate:
                    </span>
                    <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                      {dept.head}
                    </span>
                    <span className="text-slate-500 text-[11px]">{dept.headTitle}</span>
                  </div>

                  {/* Core Functions bullet points */}
                  <div className="space-y-1.5 mb-4 text-xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                      Statutory Responsibilities:
                    </span>
                    <ul className="space-y-1 text-slate-600 text-xs">
                      {dept.coreFunctions.slice(0, 2).map((fn, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{fn}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Footer: Read More & Direct Phone */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{dept.phone}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-sans">
                      {dept.operatingHours.split('(')[0]}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectDepartment(dept)}
                    className="w-full py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Read More Details & Mandate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar for Departments */}
        {filteredDepts.length > 0 && (
          <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm px-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredDepts.length}
              itemsPerPage={DEPTS_PER_PAGE}
              onPageChange={handlePageChange}
              itemName="directorates"
            />
          </div>
        )}

        {/* Cross-Page Connect Links at bottom */}
        <div className="mt-14 p-6 sm:p-8 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-emerald-950">
              Need assistance with Public Permits, Road Faults or Assembly Decisions?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-800 max-w-2xl">
              Each directorate operates in tandem with our public services portal, capital projects tracker, and legislative assembly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('service')}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Read More on Services & Permits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigate('projects')}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Read More on Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
