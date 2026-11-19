import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  TrendingUp,
  ThumbsUp,
  ArrowRight,
  AlertTriangle,
  HardHat,
  Building2,
  FolderKanban,
  Images,
} from 'lucide-react';
import { MunicipalProject } from '../types';
import { useCms } from '../context/CmsContext';

interface ProjectDossierPageProps {
  projectId?: string;
  onNavigate: (page: string) => void;
  onOpenProjectDossier?: (projectId: string) => void;
  onOpenReportModal: () => void;
}

export const ProjectDossierPage: React.FC<ProjectDossierPageProps> = ({
  projectId,
  onNavigate,
  onOpenProjectDossier,
  onOpenReportModal,
}) => {
  const { projects } = useCms();
  const [feedbackSent, setFeedbackSent] = useState(false);

  const project: MunicipalProject | undefined =
    projects.find((p) => p.id === projectId || p.slug === projectId) || projects[0];

  if (!project) {
    return (
      <div className="bg-transparent min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <HardHat className="w-10 h-10 text-slate-400 mx-auto" />
            <h1 className="text-lg font-bold text-slate-900">Project Dossier Unavailable</h1>
            <p className="text-xs sm:text-sm text-slate-600">
              This project may have been unpublished or removed by the Municipal Assembly administrator.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Projects Tracker</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const galleryImages = (project.galleryImages || []).filter(Boolean);

  return (
    <div className="bg-transparent min-h-screen py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-emerald-800 transition-colors cursor-pointer"
          >
            Home
          </button>
          <span>/</span>
          <button
            onClick={() => onNavigate('projects')}
            className="hover:text-emerald-800 transition-colors cursor-pointer"
          >
            Projects
          </button>
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-none">
            {project.title}
          </span>
        </nav>

        {/* Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => onNavigate('projects')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/85 backdrop-blur-sm border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Projects</span>
          </button>

          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            Status: {project.status}
          </span>
        </div>

        {/* Main Dossier Card */}
        <article className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-3xl overflow-hidden shadow-xl">
          {/* Featured Image */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
            <img
              src={project.imageUrl}
              alt={project.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/90 border border-emerald-400/40 text-xs font-medium text-emerald-300 mb-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{project.electoralArea} Electoral Area</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-snug">
                {project.title}
              </h1>
            </div>
          </div>

          {/* Dossier Body */}
          <div className="p-6 sm:p-10 space-y-8">
            {/* Progress Gauge Strip */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  <span>Physical Construction Milestone:</span>
                </span>
                <span className="text-emerald-800 font-mono text-base font-extrabold">
                  {project.percentageComplete}% Completed
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-700"
                  style={{ width: `${project.percentageComplete}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                <span>Site Mobilization: {project.startDate}</span>
                <span>
                  {project.actualCompletionDate
                    ? `Actual Completion: ${project.actualCompletionDate}`
                    : `Target Handover: ${project.estimatedCompletion}`}
                </span>
              </div>
            </div>

            {/* Project Summary */}
            <section className="space-y-3">
              <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Civil Engineering Overview &amp; Community Need
              </h2>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {project.fullDescription || project.description}
              </p>
            </section>

            {/* Financial & Contractual Specifications */}
            <section className="space-y-4">
              <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Approved Fiscal &amp; Contractor Dossier
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                    Total Contract Budget
                  </span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {project.budgetGHS}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Statutory allocation verified by Municipal Finance Directorate
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                    Funding Vehicle
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {project.fundingSource}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    GoG District Assembly Common Fund &amp; ABCMA Internally Generated Funds
                  </p>
                </div>

                {(project.category || project.department) && (
                  <>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <FolderKanban className="w-3 h-3 text-emerald-700" />
                        <span>Project Category</span>
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {project.category || 'Infrastructure'}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-slate-400 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <Building2 className="w-3 h-3 text-emerald-700" />
                        <span>Responsible Department</span>
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {project.department || 'Works Department'}
                      </span>
                    </div>
                  </>
                )}

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl sm:col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                    Certified Civil Engineering Contractor
                  </span>
                  <span className="text-sm font-bold text-slate-900 block">
                    {project.contractor}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Category D1/K1 certified contractor supervised by {project.department || 'ABCMA Works Department'}.
                  </p>
                </div>
              </div>
            </section>

            {/* Additional Project Gallery Images (shown when present) */}
            {galleryImages.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Images className="w-4 h-4 text-emerald-700" />
                  <span>Project Site Progress Gallery</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {galleryImages.map((imgUrl, idx) => (
                    <div
                      key={`${imgUrl}-${idx}`}
                      className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                    >
                      <img
                        src={imgUrl}
                        alt={`${project.title} progress photo ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Citizen Commendation & Feedback Box */}
            <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div>
                <strong className="text-slate-900 text-sm block">Citizen Monitoring &amp; Feedback</strong>
                <span className="text-slate-600">
                  Are you a resident or shopkeeper near this project site? Share your on-site observations.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setFeedbackSent(true)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    feedbackSent
                      ? 'bg-emerald-700 text-white shadow'
                      : 'bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{feedbackSent ? 'Commendation Received' : 'Approve Progress'}</span>
                </button>

                <button
                  onClick={onOpenReportModal}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Report Snag / Delay</span>
                </button>
              </div>
            </div>

            {/* Connected Other Projects with Read More */}
            {projects.filter((p) => p.id !== project.id).length > 0 && (
              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">
                  Other Municipal Projects:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects
                    .filter((p) => p.id !== project.id)
                    .slice(0, 2)
                    .map((other) => (
                      <div
                        key={other.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                            {other.electoralArea} · {other.percentageComplete}% Completed
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                            {other.title}
                          </h4>
                        </div>

                        <button
                          onClick={() => {
                            if (onOpenProjectDossier) {
                              onOpenProjectDossier(other.id);
                            } else {
                              window.location.hash = `#projects`;
                              onNavigate('projects');
                            }
                          }}
                          className="text-xs text-emerald-800 hover:text-emerald-950 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>View Project Dossier</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};
