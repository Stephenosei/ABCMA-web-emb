import React, { useState } from 'react';
import { MunicipalService, ServiceCategory } from '../types';
import {
  Briefcase,
  Building2,
  HeartHandshake,
  Trash2,
  Construction,
  Clock,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Download,
  Info
} from 'lucide-react';

interface ServicesSectionProps {
  services: MunicipalService[];
  onOpenServiceModal: (serviceId?: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onOpenServiceModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedServiceForInfo, setSelectedServiceForInfo] = useState<MunicipalService | null>(null);

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'business', label: 'Business & BOP' },
    { id: 'permits', label: 'Building & Planning' },
    { id: 'civil', label: 'Marriage & Civil' },
    { id: 'sanitation', label: 'Health & Sanitation' },
    { id: 'works', label: 'Works & Roads' },
  ];

  const filteredServices =
    activeCategory === 'all'
      ? services
      : services.filter((s) => s.category === activeCategory);

  const getCategoryIcon = (category: ServiceCategory) => {
    switch (category) {
      case 'business':
        return <Briefcase className="w-5 h-5 text-emerald-700" />;
      case 'permits':
        return <Building2 className="w-5 h-5 text-emerald-700" />;
      case 'civil':
        return <HeartHandshake className="w-5 h-5 text-emerald-700" />;
      case 'sanitation':
        return <Trash2 className="w-5 h-5 text-emerald-700" />;
      case 'works':
        return <Construction className="w-5 h-5 text-emerald-700" />;
      default:
        return <Briefcase className="w-5 h-5 text-emerald-700" />;
    }
  };

  return (
    <section id="service" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header with unboxed metadata discipline */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-1.5">
              Public Service Delivery Desk
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Statutory Services, Permits & Civil Registration
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Apply online for municipal permits, licenses, and civil certifications issued under the Local Governance Act 2016 (Act 936).
            </p>
          </div>

          {/* Interactive Filter Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-emerald-600/40 hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100/70 border border-emerald-200 flex items-center justify-center">
                    {getCategoryIcon(service.category)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{service.processingTime}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5 group-hover:text-emerald-900 transition-colors">
                  {service.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {service.description}
                </p>

                {/* Key Requirements Highlights */}
                <div className="border-t border-slate-200 pt-3 mb-4">
                  <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Key Requirements Checklist:
                  </div>
                  <ul className="space-y-1.5">
                    {service.requirements.slice(0, 3).map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{req}</span>
                      </li>
                    ))}
                  </ul>
                  {service.requirements.length > 3 && (
                    <button
                      onClick={() => setSelectedServiceForInfo(service)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium mt-1 cursor-pointer"
                    >
                      +{service.requirements.length - 3} more requirements
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedServiceForInfo(service)}
                  className="px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  View Details
                </button>
                <button
                  onClick={() => onOpenServiceModal(service.id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Informational Assistance Callout */}
        <div className="mt-12 bg-slate-100 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-300 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                Need Help with Development Plans or Business Zoning?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Visit the ACMA Client Service Unit at the Lartebiokorshie Head Office, or book a free technical pre-application consultation with the Town Planning Officer.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onOpenServiceModal('srv-building-permit')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Book Planning Consultation
            </button>
          </div>
        </div>
      </div>

      {/* Service Detail Modal */}
      {selectedServiceForInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-widest">
                  ACMA Service Overview
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedServiceForInfo.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedServiceForInfo(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <XCloseIcon />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {selectedServiceForInfo.description}
            </p>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Statutory Fee Guideline:</span>
                <span className="font-semibold text-slate-900">{selectedServiceForInfo.statutoryFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Processing Time:</span>
                <span className="font-semibold text-slate-900">{selectedServiceForInfo.processingTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Supervising Directorate:</span>
                <span className="font-semibold text-slate-900">{selectedServiceForInfo.department}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                All Required Documents & Prerequisites
              </div>
              <ul className="space-y-2">
                {selectedServiceForInfo.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedServiceForInfo(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const s = selectedServiceForInfo;
                  setSelectedServiceForInfo(null);
                  onOpenServiceModal(s.id);
                }}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                Start Online Application
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const XCloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
