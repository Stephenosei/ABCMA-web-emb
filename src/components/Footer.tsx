import React from 'react';
import { Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { useCms } from '../context/CmsContext';
import { sanitizeUrl } from '../utils/security';

interface FooterProps {
  onNavigate: (section: string) => void;
  onOpenTrackModal: () => void;
  onOpenReportModal: () => void;
  onOpenServiceModal: (id?: string) => void;
  onOpenAdmin?: () => void;
  isAuthenticatedAdmin?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenTrackModal,
  onOpenReportModal,
  onOpenServiceModal,
  onOpenAdmin,
  isAuthenticatedAdmin = false,
}) => {
  const { settings } = useCms();
  const adminHref = isAuthenticatedAdmin ? '/admin' : '/admin/login';

  const socialItems = [
    { key: 'facebook', label: 'Facebook', url: settings.social_links?.facebook },
    { key: 'twitter', label: 'X / Twitter', url: settings.social_links?.twitter },
    { key: 'instagram', label: 'Instagram', url: settings.social_links?.instagram },
    { key: 'youtube', label: 'YouTube', url: settings.social_links?.youtube },
  ]
    .map((s) => ({
      ...s,
      url: sanitizeUrl(s.url || '', {
        allowRelative: false,
        allowHash: false,
        allowMailtoTel: false,
      }),
    }))
    .filter((s): s is { key: string; label: string; url: string } => Boolean(s.url));

  return (
    <footer className="bg-slate-950/90 backdrop-blur-md text-slate-300 border-t border-slate-800/80 relative z-10">
      {/* Upper Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: Brand & Civic Mandate */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white border-2 border-emerald-500/40 shadow-md overflow-hidden flex items-center justify-center shrink-0">
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
                  className="w-full h-full object-contain scale-[1.42]"
                />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                {settings.site_title}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {settings.footer_text}
            </p>
            <div className="text-xs text-slate-400 space-y-1 pt-1 font-mono">
              <div>GhanaPostGPS: {settings.gps_address}</div>
              {settings.postal_address && <div>{settings.postal_address}</div>}
            </div>
            {socialItems.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {socialItems.map((s) => (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-[11px] font-semibold text-slate-300 hover:text-emerald-400 transition-colors"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
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
                  onClick={() => onNavigate('news')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Municipal News & Activities
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
                  onClick={() => onNavigate('gallery')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Photo Gallery & Civic Media
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('documents')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Gazetted Documents & Downloads
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
                <span>{settings.office_location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Hotline: {settings.contact_phones.join(' / ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{settings.contact_emails.join(' / ')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 block mb-0.5">
                Municipal Operating Hours:
              </span>
              <span>{settings.working_hours}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-900 bg-slate-950/90 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>{settings.copyright_text}</div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <span>Local Governance Act 2016</span>
            <span aria-hidden="true">·</span>
            <span>Right to Information (RTI Act 989)</span>
            <span aria-hidden="true">·</span>
            <span>Public Financial Management Act (Act 921)</span>
            <span aria-hidden="true">·</span>
            <a
              href={adminHref}
              onClick={(e) => {
                if (onOpenAdmin) {
                  e.preventDefault();
                  onOpenAdmin();
                }
              }}
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-amber-300 font-semibold transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAuthenticatedAdmin ? 'Admin Dashboard' : 'Admin Portal'}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

