import React, { useState, useEffect } from 'react';
import { MunicipalProject } from '../types';
import {
  CheckCircle2,
  TrendingUp,
  Calendar,
  MapPin,
  Building,
  MessageSquare,
  ThumbsUp,
  ArrowLeft,
  ArrowRight,
  HardHat,
  ShieldCheck
} from 'lucide-react';
import { Pagination } from './Pagination';

interface ProjectsTrackerProps {
  projects: MunicipalProject[];
  onOpenProjectDossier?: (projectId: string) => void;
  onNavigateHome?: () => void;
  isStandalonePage?: boolean;
}

export const ProjectsTracker: React.FC<ProjectsTrackerProps> = ({
  projects,
  onOpenProjectDossier,
  onNavigateHome,
  isStandalonePage = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'In Progress' | 'Near Completion' | 'Commissioned'>('All');
  const [feedbackSent, setFeedbackSent] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  const filteredProjects =
    activeFilter === 'All'
      ? projects
      : projects.filter((p) => p.status === activeFilter);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE) || 1;
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSendFeedback = (projectId: string) => {
    setFeedbackSent((prev) => ({ ...prev, [projectId]: true }));
  };

  return (
    <section id="projects" className="py-12 lg:py-16 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb Navigation when Standalone Page */}
        {isStandalonePage && (
          <div className="mb-6 space-y-4">
            <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <button
                onClick={onNavigateHome}
                className="hover:text-emerald-800 transition-colors cursor-pointer"
              >
                Home
              </button>
              <span>/</span>
              <span className="text-slate-800 font-semibold">
                Capital Projects & Development Tracker
              </span>
            </nav>

            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/85 backdrop-blur-sm border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <HardHat className="w-4 h-4 text-emerald-700" />
              <span>Infrastructure & Capital Investments</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Active Municipal Projects Tracker
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Track the progress, budget allocation, contractor milestones, and site photos of ongoing roads, drainage, healthcare, and educational works across Ablekuma Central.
            </p>
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-lg shadow-sm overflow-x-auto max-w-full scrollbar-none">
            {(['All', 'In Progress', 'Near Completion', 'Commissioned'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer shrink-0 min-h-[36px] ${
                  activeFilter === filter
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {paginatedProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-600/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Project Image Header */}
                <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-100">
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur text-white text-xs font-semibold">
                    {project.status}
                  </div>
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-emerald-950/85 backdrop-blur text-emerald-300 text-xs font-mono font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{project.electoralArea}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {project.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Progress Bar with Tabular Percentage */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">Engineering Completion:</span>
                      <span className="font-mono tabular-nums text-emerald-800">
                        {project.percentageComplete}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-emerald-700 rounded-full transition-all duration-700"
                        style={{ width: `${project.percentageComplete}%` }}
                      />
                    </div>
                  </div>

                  {/* Metadata Specs Grid */}
                  <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Approved Budget
                      </span>
                      <span className="font-mono font-semibold text-slate-800">{project.budgetGHS}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Target Handover
                      </span>
                      <span className="text-slate-800 font-medium">{project.estimatedCompletion}</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                        Funding Source & Contractor
                      </span>
                      <span className="text-slate-700 font-medium block">{project.fundingSource}</span>
                      <span className="text-slate-500 text-[11px]">Contractor: {project.contractor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Citizen Project Feedback & Read More footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => onOpenProjectDossier?.(project.id)}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Read More · Full Project Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleSendFeedback(project.id)}
                  className={`w-full sm:w-auto text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    feedbackSent[project.id]
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{feedbackSent[project.id] ? 'Feedback Logged' : 'Citizen Commendation'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12 bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/80 p-8">
            <HardHat className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">No projects found in this category</h4>
            <p className="text-xs text-slate-500 mt-1">
              Select "All" to view all ongoing and commissioned civil works.
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="mt-8 bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-sm px-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProjects.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }}
            itemName="municipal projects"
          />
        </div>

        {/* Cross-Page Navigation Bridges */}
        <div className="mt-14 p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Need to contact the supervising Works Department or check building permits?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Civil projects are supervised by the ACMA Works Department and Physical Planning Directorate under municipal legislative oversight.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                window.location.hash = '#departments';
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Read More on Departments (Works & Planning)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
