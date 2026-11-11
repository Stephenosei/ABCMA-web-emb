import React from 'react';
import {
  ArrowLeft,
  Landmark,
  ShieldCheck,
  Calendar,
  Building2,
  CheckCircle2,
  FileText,
  Users,
  HardHat,
  ArrowRight,
  MapPin,
  ExternalLink
} from 'lucide-react';

interface LeadershipAddressPageProps {
  onNavigate: (page: string) => void;
  onOpenReportModal: () => void;
  onOpenMemoModal?: () => void;
}

export const LeadershipAddressPage: React.FC<LeadershipAddressPageProps> = ({
  onNavigate,
  onOpenReportModal,
}) => {
  return (
    <div className="bg-slate-50 min-h-screen py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Home</span>
          </button>
          <span>/</span>
          <button
            onClick={() => onNavigate('assembly')}
            className="hover:text-emerald-800 transition-colors cursor-pointer"
          >
            The Assembly
          </button>
          <span>/</span>
          <span className="text-slate-800 font-semibold truncate">
            MCE 2026 Strategic Policy Address
          </span>
        </nav>

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Main Article Card */}
        <article className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-10 relative">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3">
              <Landmark className="w-4 h-4" />
              <span>Office of the Municipal Chief Executive (MCE)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-4 leading-tight font-serif-civic">
              "Building an Inclusive, Modern & Resilient Ablekuma Central for All Residents and Commercial Traders"
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Delivered at General Assembly Session · 2026 Fiscal Year</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Municipal Complex Auditorium, Lartebiokorshie</span>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="p-6 sm:p-10 space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
            {/* Opening Excerpt with MCE Portrait */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200">
              <div className="sm:col-span-4 shrink-0 flex flex-col items-center sm:items-start">
                <img
                  src="/src/assets/images/acma_mce_portrait_1794438674697.jpg"
                  alt="Hon. Kwaku Addo Mensah, Municipal Chief Executive"
                  className="w-36 aspect-[3/4] object-cover rounded-xl border-2 border-emerald-700 shadow-md"
                />
                <span className="text-xs font-bold text-slate-900 mt-2">Hon. Kwaku Addo Mensah</span>
                <span className="text-[11px] text-emerald-800 font-medium">Municipal Chief Executive (MCE)</span>
              </div>
              <div className="sm:col-span-8 text-emerald-950 text-sm leading-relaxed font-medium space-y-2">
                <p>
                  "Under the Local Governance Act 2016 (Act 936), Ablekuma Central Municipal Assembly serves as both the supreme planning authority and the engine of local economic progress. We are committed to transparency, rapid infrastructure completion, and equal civic dignity across all 7 electoral areas."
                </p>
                <div className="text-xs text-emerald-800 font-semibold pt-1">
                  Republic of Ghana · Greater Accra Region
                </div>
              </div>
            </div>

            {/* Executive Message */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight font-serif-civic">
                1. Strategic Focus: Flood Mitigation & Drainage Infrastructure
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                For decades, seasonal downpours posed severe flood hazards to our commercial core in <strong>Abossey Okai</strong>, as well as residential quarters in <strong>Sukura</strong> and <strong>Town Council Line</strong>. Under our 2025/2026 Capital Works Plan, we have committed over GHS 4.25 Million into constructing heavy-duty reinforced concrete U-drains and twin-cell culverts.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Our Municipal Works Department is working closely with the Ministry of Roads and Highways to ensure these channels connect seamlessly into the Odaw stormwater basin, safeguarding commercial shops and private households from flash floods.
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Want to see the progress of our drainage works?</span>
                <button
                  onClick={() => onNavigate('projects')}
                  className="text-emerald-800 hover:text-emerald-950 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Read More on Projects Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight font-serif-civic">
                2. Modernizing Public Health & Maternal Care
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                No expectant mother or infant in Ablekuma Central should travel miles for specialized emergency obstetric care. The <strong>Lartebiokorshie Mother & Child Health Pavilion</strong> is now over 92% complete, housing ultrasound diagnostics, surgical theater suites, and a 10-incubator neonatal unit.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight font-serif-civic">
                3. Digital Service Transformation via MIS Directorate
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Through our Management Information Systems (MIS) Department, we are eliminating manual bureaucracy. Citizens can now calculate, verify, and pay their Property Rates, Business Operating Permits (BOP), and Market Tolls instantly via mobile money (MTN MoMo, Telecel Cash, AT Money) and receive verifiable digital receipts.
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Learn more about our MIS & digital initiatives:</span>
                <button
                  onClick={() => onNavigate('departments')}
                  className="text-emerald-800 hover:text-emerald-950 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Read More on Departments Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight font-serif-civic">
                4. Social Welfare & Disability Empowerment
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Our Department of Social Welfare & Community Development continues to distribute the statutory 3% District Assembly Common Fund to Persons with Disabilities (PWDs), equipping over 180 beneficiaries with startup toolkits, motorized tricycles, and educational grants in the past fiscal cycle.
              </p>
            </section>

            {/* Official Sign-off */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-400">Authored by</div>
                <div className="text-sm font-bold text-slate-900 mt-1">Hon. Municipal Chief Executive</div>
                <div className="text-slate-600">Political & Administrative Head · ACMA</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-400">Countersigned by</div>
                <div className="text-sm font-bold text-slate-900 mt-1">Municipal Coordinating Director</div>
                <div className="text-slate-600">Head of Civil Service & Assembly Secretariat</div>
              </div>
            </div>

            {/* Cross-Page Connect Links */}
            <div className="pt-6 border-t border-slate-200 bg-emerald-50/50 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 p-6 sm:p-10 rounded-b-3xl">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">
                Explore Connected Municipal Portals:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => onNavigate('departments')}
                  className="p-3 bg-white border border-emerald-200 rounded-xl hover:border-emerald-600 text-left transition-all cursor-pointer shadow-sm group"
                >
                  <Building2 className="w-4 h-4 text-emerald-700 mb-1" />
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                    Municipal Departments
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Central Admin, HR, MIS, Works, Social Welfare & more
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('projects')}
                  className="p-3 bg-white border border-emerald-200 rounded-xl hover:border-emerald-600 text-left transition-all cursor-pointer shadow-sm group"
                >
                  <HardHat className="w-4 h-4 text-emerald-700 mb-1" />
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                    Infrastructure Projects
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Track roads, clinics & drainage progress
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('documents')}
                  className="p-3 bg-white border border-emerald-200 rounded-xl hover:border-emerald-600 text-left transition-all cursor-pointer shadow-sm group"
                >
                  <FileText className="w-4 h-4 text-emerald-700 mb-1" />
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                    Gazetted Documents
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Download 2026 Fee-Fixing & Bye-Laws
                  </div>
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
