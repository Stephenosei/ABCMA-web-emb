import React from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  UserCheck,
  CheckCircle2,
  FileText,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { MunicipalDepartment } from '../types';

interface DepartmentDetailModalProps {
  department: MunicipalDepartment | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenServiceModal?: (serviceId?: string) => void;
  onOpenReportModal?: () => void;
}

export const DepartmentDetailModal: React.FC<DepartmentDetailModalProps> = ({
  department,
  isOpen,
  onClose,
  onOpenServiceModal,
  onOpenReportModal,
}) => {
  if (!isOpen || !department) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Civic Crest / Brand */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1.5">
            <Building2 className="w-4 h-4" />
            <span>ACMA Directorate & Department Directory</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {department.name}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
              {department.shortCode}
            </span>
          </div>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {department.description}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Key Administration Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 border border-slate-200/80 p-4 rounded-xl text-xs">
            <div className="flex items-center gap-3.5 sm:col-span-2 p-3 bg-white/80 border border-slate-200/80 rounded-xl shadow-xs">
              {department.headImageUrl ? (
                <img
                  src={department.headImageUrl}
                  alt={department.head}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-600/70 shadow-sm shrink-0"
                />
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className="text-slate-400 uppercase tracking-wider text-[10px] block font-semibold">
                  Department Head / Director
                </span>
                <strong className="text-slate-900 font-sans block text-sm sm:text-base">
                  {department.head}
                </strong>
                <span className="text-slate-600 text-xs block">{department.headTitle}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider text-[10px] block font-semibold">
                  Office Location
                </span>
                <strong className="text-slate-900 font-sans block text-sm">
                  {department.room}
                </strong>
                <span className="text-slate-600 text-xs">ACMA Municipal Complex, Lartebiokorshie</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider text-[10px] block font-semibold">
                  Operating Hours
                </span>
                <strong className="text-slate-900 font-sans block text-sm">
                  {department.operatingHours}
                </strong>
                <span className="text-slate-600 text-xs">Working Days (Except Holidays)</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider text-[10px] block font-semibold">
                  Direct Line & Email
                </span>
                <strong className="text-slate-900 font-mono block text-xs">
                  {department.phone}
                </strong>
                <span className="text-slate-600 text-xs">{department.email}</span>
              </div>
            </div>
          </div>

          {/* Core Mandate & Functions */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Statutory Mandate & Core Functions (Act 936)</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-xl p-4">
              {department.coreFunctions.map((fn, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{fn}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Public Services Offered */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Public Services Delivered to Citizens & Businesses</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {department.servicesOffered.map((srv, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 flex items-start gap-2 hover:border-emerald-600/40 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                  <span className="font-medium">{srv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Quick Links */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-emerald-950">
                Need to transact with {department.shortCode}?
              </h4>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Our client desk handles walk-ins and digital inquiries daily.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${department.phone.replace(/[^0-9+]/g, '')}`}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 shadow-sm flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>Call Desk</span>
              </a>

              {department.shortCode === 'Works' && onOpenReportModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenReportModal();
                  }}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <span>Report Works Issue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {(department.shortCode === 'Central Admin' ||
                department.shortCode === 'Finance' ||
                department.shortCode === 'Physical Planning' ||
                department.shortCode === 'EHSU') &&
                onOpenServiceModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenServiceModal(
                        department.shortCode === 'Central Admin'
                          ? 'srv-marriage'
                          : department.shortCode === 'Works'
                          ? 'srv-building-permit'
                          : 'srv-bop'
                      );
                    }}
                    className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <span>Apply Online</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>Ablekuma Central Municipal Assembly · Accra, Ghana</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
