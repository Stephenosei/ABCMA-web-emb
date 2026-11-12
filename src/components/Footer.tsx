import React from 'react';
import { Landmark, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (section: string) => void;
  onOpenTrackModal: () => void;
  onOpenReportModal: () => void;
  onOpenServiceModal: (id?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenTrackModal,
  onOpenReportModal,
  onOpenServiceModal,
}) => {
  return (
    <footer className="bg-slate-950/90 backdrop-blur-md text-slate-300 border-t border-slate-800/80 relative z-10">
      {/* Upper Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Brand & Civic Mandate */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center text-amber-400 font-bold">
                <Landmark className="w-4 h-4 text-amber-300" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                Ablekuma Central Municipal Assembly
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Serving the residents, commercial trading zones, and communities of Ablekuma Central under the Local Governance Act 2016 (Act 936).
            </p>
            <div className="text-xs text-slate-400 space-y-1 pt-1 font-mono">
              <div>GhanaPostGPS: GA-140-2210</div>
              <div>Digital Portal Version 2026.1</div>
            </div>
          </div>

          {/* Col 2: Public Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              Public Services
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onOpenServiceModal('srv-bop')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Business Operating Permits (BOP)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenServiceModal('srv-building-permit')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Building & Planning Clearances
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenServiceModal('srv-marriage')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Marriage & Civil Certifications
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenServiceModal('srv-sanitation-waste')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Environmental Health Screening
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('service')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Property Rates Settlement
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: The Assembly & Public Records */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              The Assembly & Documents
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={onOpenReportModal}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Report a Community Fault
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTrackModal}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Track Existing Application / Ticket
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('assembly')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Assembly Members Directory
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('departments')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Directorates & Departments Directory
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('projects')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Municipal Capital Projects Tracker
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('documents')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Gazetted 2026 Fee-Fixing Resolution
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Rapid Assistance & Emergency Desks */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              Contact & Emergency Hotlines
            </h4>
            <div className="text-xs text-slate-400 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Municipal Assembly Complex, Lartebiokorshie, Accra</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Hotline: 0302-228-900 / 0302-228-901</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>info@acma.gov.gh / support@acma.gov.gh</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 block mb-0.5">Municipal Operating Hours:</span>
              <span>Monday – Friday: 8:00 AM – 5:00 PM (GMT)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-900 bg-slate-950/90 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © 2026 Ablekuma Central Municipal Assembly (ACMA). Republic of Ghana. All statutory rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Local Governance Act 2016</span>
            <span aria-hidden="true">·</span>
            <span>Right to Information (RTI Act 989)</span>
            <span aria-hidden="true">·</span>
            <span>Public Financial Management Act (Act 921)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
