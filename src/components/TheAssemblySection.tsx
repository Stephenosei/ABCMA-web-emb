import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Users,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  Search,
  Filter,
  CheckCircle,
  PlusCircle,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Compass,
  Target,
  Clock,
  Send,
  Building2,
  Hammer,
  HeartHandshake,
  Briefcase
} from 'lucide-react';
import { AssemblyMember, TownHallMeeting, CitizenIssue, MunicipalDepartment } from '../types';
import { MUNICIPAL_DEPARTMENTS } from '../data/mockData';
import { Pagination } from './Pagination';

interface TheAssemblySectionProps {
  assemblyMembers: AssemblyMember[];
  townHalls: TownHallMeeting[];
  issues: CitizenIssue[];
  onOpenReportModal: () => void;
  onOpenMemoModal: (meeting: TownHallMeeting) => void;
  onOpenTrackModal: (code: string) => void;
  onSelectDepartment?: (department: MunicipalDepartment) => void;
  isStandalonePage?: boolean;
  onNavigateHome?: () => void;
  onReadLeadershipAddress?: () => void;
}

interface CoreFunctionItem {
  code: string;
  title: string;
  description: string;
  leadUnit: string;
}

const CORE_ASSEMBLY_FUNCTIONS: CoreFunctionItem[] = [
  {
    code: '01',
    title: 'Overall Municipal Development & Spatial Planning',
    description:
      'Formulate and execute medium-term development plans, annual composite budgets, and spatial zoning schemes across all 7 electoral areas under Act 936.',
    leadUnit: 'Development Planning & Physical Planning',
  },
  {
    code: '02',
    title: 'Municipal Infrastructure, Roads & Storm Drainage',
    description:
      'Construct, rehabilitate, and maintain local access roads, covered U-drains, market stalls, classrooms, and primary municipal health facilities.',
    leadUnit: 'Municipal Works Department',
  },
  {
    code: '03',
    title: 'Local Revenue Mobilization & Fiscal Accountability',
    description:
      'Assess and collect property rates, Business Operating Permits (BOP), and market tolls in strict compliance with gazetted fee-fixing resolutions.',
    leadUnit: 'Finance & Budget Rating Units',
  },
  {
    code: '04',
    title: 'Public Health, Sanitation & Waste Governance',
    description:
      'Safeguard environmental cleanliness through scheduled refuse evacuation, drain desilting, market hygiene inspections, and food-vendor health certification.',
    leadUnit: 'Environmental Health & Sanitation',
  },
  {
    code: '05',
    title: 'Social Welfare, Education & Vulnerable Support',
    description:
      'Administer social protection programs, persons with disability (PWD) allocations, child welfare interventions, and community livelihood initiatives.',
    leadUnit: 'Social Welfare & Community Development',
  },
  {
    code: '06',
    title: 'Local Economic Development & Bye-Law Enforcement',
    description:
      'Support traders and MSMEs across Abossey Okai and local markets while enforcing municipal bye-laws, public order, and civic safety.',
    leadUnit: 'Central Administration & Municipal Guard',
  },
];

export const TheAssemblySection: React.FC<TheAssemblySectionProps> = ({
  assemblyMembers,
  townHalls,
  issues,
  onOpenReportModal,
  onOpenMemoModal,
  onOpenTrackModal,
  onSelectDepartment,
  isStandalonePage = false,
  onNavigateHome,
  onReadLeadershipAddress,
}) => {
  const [activeTab, setActiveTab] = useState<
    'leadership' | 'members' | 'townhalls' | 'incidents' | 'departments' | 'contact'
  >('leadership');
  const [memberSearch, setMemberSearch] = useState('');
  const [rsvpdMeetings, setRsvpdMeetings] = useState<Record<string, boolean>>({});

  // Incident feed filters
  const [issueAreaFilter, setIssueAreaFilter] = useState('all');
  const [issueStatusFilter, setIssueStatusFilter] = useState('all');

  // Pagination states
  const [memberPage, setMemberPage] = useState(1);
  const MEMBERS_PER_PAGE = 4;

  const [incidentPage, setIncidentPage] = useState(1);
  const INCIDENTS_PER_PAGE = 4;

  // Contact Us interactive state
  const [contactName, setContactName] = useState('');
  const [contactPhoneOrEmail, setContactPhoneOrEmail] = useState('');
  const [contactUnit, setContactUnit] = useState('Client Service Unit / Central Administration');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmittedRef, setContactSubmittedRef] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  useEffect(() => {
    setMemberPage(1);
  }, [memberSearch]);

  useEffect(() => {
    setIncidentPage(1);
  }, [issueAreaFilter, issueStatusFilter]);

  const electoralAreas = [
    'all',
    'Abossey Okai',
    'Lartebiokorshie',
    'Mataheko',
    'Gbortsui',
    'Sukura',
    'Town Council Line',
    'Mabrouk',
  ];

  const filteredMembers = assemblyMembers.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.electoralArea.toLowerCase().includes(q) ||
      m.committee.toLowerCase().includes(q)
    );
  });

  const totalMemberPages = Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE) || 1;
  const paginatedMembers = filteredMembers.slice(
    (memberPage - 1) * MEMBERS_PER_PAGE,
    memberPage * MEMBERS_PER_PAGE
  );

  const filteredIssues = issues.filter((iss) => {
    const matchArea = issueAreaFilter === 'all' || iss.electoralArea === issueAreaFilter;
    const matchStatus = issueStatusFilter === 'all' || iss.status === issueStatusFilter;
    return matchArea && matchStatus;
  });

  const totalIncidentPages = Math.ceil(filteredIssues.length / INCIDENTS_PER_PAGE) || 1;
  const paginatedIssues = filteredIssues.slice(
    (incidentPage - 1) * INCIDENTS_PER_PAGE,
    incidentPage * INCIDENTS_PER_PAGE
  );

  const handleToggleRsvp = (meetingId: string) => {
    setRsvpdMeetings((prev) => ({ ...prev, [meetingId]: !prev[meetingId] }));
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhoneOrEmail.trim() || !contactSubject.trim() || !contactMessage.trim()) {
      setContactError('Please fill in your name, contact details, subject, and inquiry message.');
      return;
    }
    setContactError(null);
    const refNumber = `ACMA-INQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setContactSubmittedRef(refNumber);
  };

  const handleResetContactForm = () => {
    setContactName('');
    setContactPhoneOrEmail('');
    setContactSubject('');
    setContactMessage('');
    setContactSubmittedRef(null);
    setContactError(null);
  };

  const getStatusBadge = (status: CitizenIssue['status']) => {
    switch (status) {
      case 'submitted':
        return <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">Submitted · In Review</span>;
      case 'assigned':
        return <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">Assigned to Unit</span>;
      case 'in_progress':
        return <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium">Field Crew on Site</span>;
      case 'resolved':
        return <span className="text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium">Resolved & Verified</span>;
    }
  };

  const renderContactUsModule = () => (
    <div id="assembly-contact" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Column: Direct Municipal Complex & Hotlines */}
      <div className="lg:col-span-5 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-lg flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            <Building2 className="w-4 h-4" />
            <span>Contact Us · Citizen Desk</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-serif-civic text-white leading-snug">
            Reach Ablekuma Central Municipal Assembly
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Have an enquiry regarding permits, property billing, council resolutions, or ward services? Visit our Civic Complex in Lartebiokorshie or contact our Client Service Unit directly.
          </p>

          <div className="space-y-3.5 pt-2 text-xs text-slate-200 border-t border-slate-800">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Municipal Assembly Complex</strong>
                <span className="text-slate-300">Lartebiokorshie Main Road, Accra, Greater Accra</span>
                <span className="block text-emerald-400 font-mono text-[11px] mt-0.5">
                  GhanaPostGPS: GA-140-2210
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Official Hotlines & Client Desk</strong>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5 font-mono">
                  <a href="tel:0302228900" className="hover:text-emerald-300 transition-colors underline underline-offset-2">
                    0302-228-900
                  </a>
                  <span className="text-slate-500">/</span>
                  <a href="tel:0302228901" className="hover:text-emerald-300 transition-colors underline underline-offset-2">
                    0302-228-901
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Official Electronic Mail</strong>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                  <a href="mailto:info@acma.gov.gh" className="hover:text-emerald-300 transition-colors underline underline-offset-2">
                    info@acma.gov.gh
                  </a>
                  <span className="text-slate-500">·</span>
                  <a href="mailto:support@acma.gov.gh" className="hover:text-emerald-300 transition-colors underline underline-offset-2">
                    support@acma.gov.gh
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Municipal Operating Hours</strong>
                <span className="text-slate-300">Monday – Friday: 8:00 AM – 5:00 PM (GMT)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            Need urgent drainage, sanitation, or streetlamp repairs?
          </span>
          <button
            type="button"
            onClick={onOpenReportModal}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Log Field Fault</span>
          </button>
        </div>
      </div>

      {/* Right Column: Interactive Inquiry Form */}
      <div className="lg:col-span-7 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
        {contactSubmittedRef ? (
          <div className="my-auto py-8 text-center space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Inquiry Registered
              </div>
              <h4 className="text-xl font-bold text-slate-900">
                Thank you, {contactName}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Your message has been routed to <strong>{contactUnit}</strong>. A Client Service Officer will respond via <strong>{contactPhoneOrEmail}</strong> within 1 business day.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-700">
              Reference Ticket: <strong className="text-slate-950">{contactSubmittedRef}</strong>
            </div>
            <button
              type="button"
              onClick={handleResetContactForm}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Send Another Inquiry
            </button>
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Send a Direct Message to the Assembly
                </h4>
                <p className="text-xs text-slate-600">
                  Routed straight to our Central Administration & Right to Information (RTI) desk.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md shrink-0 whitespace-nowrap">
                24-Hour Response SLA
              </span>
            </div>

            {contactError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
                {contactError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Samuel Nii Odartey"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number or Email *
                </label>
                <input
                  type="text"
                  value={contactPhoneOrEmail}
                  onChange={(e) => setContactPhoneOrEmail(e.target.value)}
                  placeholder="e.g. 024 412 8890 or email"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Recipient Office / Directorate
                </label>
                <select
                  value={contactUnit}
                  onChange={(e) => setContactUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                >
                  <option value="Client Service Unit / Central Administration">
                    Client Service Unit / Central Administration
                  </option>
                  <option value="Office of the Municipal Chief Executive (MCE)">
                    Office of the Municipal Chief Executive (MCE)
                  </option>
                  <option value="Office of the Municipal Coordinating Director (MCD)">
                    Office of the Municipal Coordinating Director (MCD)
                  </option>
                  {MUNICIPAL_DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name} ({dept.shortCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="e.g. BOP Certificate Follow-up / RTI Request"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Message / Inquiry Details *
              </label>
              <textarea
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Describe your inquiry, electoral area, or reference number..."
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-500">
                Protected under the Data Protection Act & Right to Information Act 989.
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[40px]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Official Message</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <section id="assembly" className="py-12 lg:py-16 bg-transparent min-h-screen">
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
                The Assembly & Democratic Governance
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
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-emerald-700" />
              <span>Local Governance & Civic Mandate</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              The Assembly
            </h1>
            <p className="text-sm text-slate-700 mt-1 max-w-2xl">
              Explore our municipal vision, mission, and statutory core functions, meet executive leadership and elected Assembly Members across the 7 electoral areas, or contact our Citizen Desk directly.
            </p>
          </div>

          {/* Interactive Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-xl overflow-x-auto max-w-full shadow-sm">
            <button
              onClick={() => setActiveTab('leadership')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'leadership'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              Mandate & Leadership
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              Assembly Members ({assemblyMembers.length})
            </button>
            <button
              onClick={() => setActiveTab('townhalls')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'townhalls'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              Town Halls
            </button>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'incidents'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              Incident Desk ({issues.length})
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'departments'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              Departments
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'contact'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              Contact Us
            </button>
          </div>
        </div>

        {/* Tab 1: Mandate, Assembly Picture, Vision & Mission, Core Functions, Leadership & Contact */}
        {activeTab === 'leadership' && (
          <div className="space-y-10">
            {/* 1A. Assembly Building Showcase & Executive Leadership Hero */}
            <div className="bg-slate-900 text-white rounded-3xl overflow-hidden shadow-xl border border-slate-800">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Assembly Building Architectural Photograph */}
                <div className="lg:col-span-5 relative min-h-[260px] sm:min-h-[320px] bg-slate-950 overflow-hidden">
                  <img
                    src="/images/ablekuma_assembly_welcome_1794372179601.jpg"
                    alt="Ablekuma Central Municipal Assembly Civic Headquarters in Lartebiokorshie"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
                      Civic Headquarters · Est. 2019 (L.I. 2376)
                    </div>
                    <div className="text-sm font-bold text-white">
                      Ablekuma Central Municipal Assembly Complex
                    </div>
                    <div className="text-xs text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Lartebiokorshie, Greater Accra · GA-140-2210</span>
                    </div>
                  </div>
                </div>

                {/* Executive Overview & MCE Showcase */}
                <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                      <Landmark className="w-4 h-4" />
                      <span>Office of the Municipal Chief Executive (MCE)</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif-civic leading-snug">
                      "Building an Inclusive, Modern & Resilient Ablekuma Central for All Residents and Traders"
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Carved out under Legislative Instrument (L.I. 2376) and governed by the Local Governance Act, 2016 (Act 936), Ablekuma Central Municipal Assembly serves as the highest political, planning, rating, and development authority across our 7 vibrant electoral areas.
                    </p>
                  </div>

                  {/* Leadership Row with MCE Portrait */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src="/images/acma_mce_portrait_1794438674697.jpg"
                        alt="Hon. Frank Nkansah, Municipal Chief Executive"
                        referrerPolicy="no-referrer"
                        className="w-12 h-14 rounded-xl object-cover border border-emerald-500/50 bg-slate-800 shrink-0"
                      />
                      <div className="text-xs">
                        <strong className="text-white block font-sans text-sm">Hon. Frank Nkansah</strong>
                        <span className="text-emerald-400 font-medium block">Municipal Chief Executive (MCE)</span>
                        <span className="text-slate-400">Assisted by the Municipal Coordinating Director</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {onReadLeadershipAddress && (
                        <button
                          onClick={onReadLeadershipAddress}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                        >
                          <span>2026 Policy Address</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('assembly-contact');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Contact Us</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 1B. Official Vision & Mission Statements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 block">
                        Long-Term Direction
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">Our Vision</h3>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-slate-800 font-serif-civic leading-relaxed">
                    "To become a model urban municipality in Greater Accra—environmentally clean, economically vibrant, well-planned, and driven by accountable, technology-enabled civic service delivery for every resident."
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Strategic Horizon 2026–2030</span>
                  <span className="text-emerald-800 font-semibold">Ablekuma Central</span>
                </div>
              </div>

              <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 block">
                        Institutional Purpose
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">Our Mission</h3>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-slate-800 font-serif-civic leading-relaxed">
                    "The Ablekuma Central Municipal Assembly exists to improve the quality of life of its inhabitants through the mobilization of resources, effective spatial planning, provision of essential socio-economic infrastructure, and inclusive grassroots governance."
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Local Governance Act, 2016 (Act 936)</span>
                  <span className="text-amber-800 font-semibold">Client Charter</span>
                </div>
              </div>
            </div>

            {/* 1C. Listed Statutory Core Functions of the Assembly */}
            <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-emerald-800 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Statutory Mandate · Act 936</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Core Functions of the Municipal Assembly
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                    In accordance with Section 12 of the Local Governance Act, 2016 (Act 936), ACMA discharges six foundational responsibilities across the municipality.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('departments')}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span>View Implementing Directorates</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {CORE_ASSEMBLY_FUNCTIONS.map((fn, index) => {
                  const icons = [Landmark, Hammer, Briefcase, ShieldCheck, HeartHandshake, Users];
                  const IconComp = icons[index % icons.length];
                  return (
                    <div
                      key={fn.code}
                      className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between space-y-3 hover:border-emerald-600/40 hover:shadow-md transition-all"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            FN-{fn.code}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {fn.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {fn.description}
                        </p>
                      </div>
                      <div className="pt-2.5 border-t border-slate-200/80 text-[11px] font-medium text-emerald-800">
                        Lead: {fn.leadUnit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 1D. Assembly Chamber & Civic Premises Gallery Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900 shadow-sm min-h-[210px]">
                <img
                  src="/images/acma_civic_headquarters_1794370608615.jpg"
                  alt="Ablekuma Central Municipal Administration Block"
                  referrerPolicy="no-referrer"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                    Administration & Client Center
                  </div>
                  <div className="text-sm font-bold">
                    Central Registry, Permits & Revenue Hall
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900 shadow-sm min-h-[210px]">
                <img
                  src="/images/assembly_chamber_backdrop_1794482218382.jpg"
                  alt="Ablekuma Central General Assembly Legislative Chamber"
                  referrerPolicy="no-referrer"
                  className="w-full h-56 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                    General Assembly Hall
                  </div>
                  <div className="text-sm font-bold">
                    Deliberative Chamber for Bye-Laws & Fee-Fixing Sessions
                  </div>
                </div>
              </div>
            </div>

            {/* 1E. Contact Us Feature right on The Assembly overview */}
            {renderContactUsModule()}
          </div>
        )}

        {/* Tab 2: Assembly Members Directory */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/85 backdrop-blur-md border border-slate-200/80 p-4 rounded-xl">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Elected Representatives of the 7 Electoral Areas
                </h4>
                <p className="text-xs text-slate-600">
                  Connect with your ward representative to discuss community infrastructure, local security, and sanitation needs.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name or electoral area..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="p-10 text-center bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-xl space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Assembly Members Found</h4>
                <p className="text-xs text-slate-500">
                  No representative matches "{memberSearch}". Try searching for another name or electoral area.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {paginatedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-xl p-5 hover:border-emerald-600/40 hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                          {member.electoralArea}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-0.5">
                          {member.name}
                        </h4>
                        <span className="text-xs text-slate-500">{member.title}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 text-sm shadow-sm shrink-0">
                        {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1.5 border-t border-slate-200 pt-2.5">
                      <div>
                        <strong className="text-slate-800">Assembly Committee:</strong>{' '}
                        <span>{member.committee}</span>
                      </div>
                      <div>
                        <strong className="text-slate-800">Ward Office Hours:</strong>{' '}
                        <span>{member.officeHours}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{member.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 font-sans text-[11px]">
                        <Mail className="w-3 h-3" />
                        <span>{member.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredMembers.length > 0 && (
              <div className="mt-4 bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-xl px-4">
                <Pagination
                  currentPage={memberPage}
                  totalPages={totalMemberPages}
                  totalItems={filteredMembers.length}
                  itemsPerPage={MEMBERS_PER_PAGE}
                  onPageChange={setMemberPage}
                  itemName="assembly members"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Town Halls & Hearings */}
        {activeTab === 'townhalls' && (
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/3 rounded-xl overflow-hidden shadow-lg border border-slate-700 shrink-0 bg-slate-950">
                <img
                  src="/images/acma_townhall_meeting_1794370609788.jpg"
                  alt="Ablekuma Central Town Hall Consultation"
                  referrerPolicy="no-referrer"
                  className="w-full h-44 object-cover"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                  Participatory Democracy & Public Consultation
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">
                  Attend Assembly Sessions & Fee Hearings
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Join fellow residents and business owners in deliberating the 2026 municipal budget, local drainage priorities, and fee-fixing resolutions. Citizens may also lodge formal memos directly to the Assembly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {townHalls.map((meeting) => (
                <div
                  key={meeting.id}
                  className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-all space-y-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{meeting.date}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                      {meeting.title}
                    </h4>

                    <div className="text-xs text-slate-600 space-y-1 mb-4">
                      <div><strong>Time:</strong> {meeting.time}</div>
                      <div><strong>Venue:</strong> {meeting.venue}</div>
                      <div><strong>Focus Zone:</strong> {meeting.electoralArea}</div>
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Consultation Agenda:
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {meeting.agenda.map((ag, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-700 font-bold">•</span>
                            <span>{ag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleRsvp(meeting.id)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        rsvpdMeetings[meeting.id]
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {rsvpdMeetings[meeting.id] ? '✓ RSVP Confirmed' : `RSVP (${meeting.rsvpsCount})`}
                    </button>

                    <button
                      onClick={() => onOpenMemoModal(meeting)}
                      className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Submit Memo</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Citizen Incident Desk */}
        {activeTab === 'incidents' && (
          <div className="space-y-6">
            <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Area:</span>
                </div>
                <select
                  value={issueAreaFilter}
                  onChange={(e) => setIssueAreaFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 flex-1 sm:flex-none min-w-[140px]"
                >
                  {electoralAreas.map((area) => (
                    <option key={area} value={area}>
                      {area === 'all' ? 'All Electoral Areas' : area}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span>Status:</span>
                </div>
                <select
                  value={issueStatusFilter}
                  onChange={(e) => setIssueStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 flex-1 sm:flex-none min-w-[120px]"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <button
                onClick={onOpenReportModal}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer min-h-[40px] shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report Community Fault</span>
              </button>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="p-10 text-center bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-xl space-y-2">
                <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No Incident Reports Match Your Filters</h4>
                <p className="text-xs text-slate-500">
                  Try selecting "All Electoral Areas" or "All Statuses" to view registered incidents.
                </p>
                <button
                  onClick={() => {
                    setIssueAreaFilter('all');
                    setIssueStatusFilter('all');
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-xl p-5 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                          <strong className="text-slate-900">{issue.trackingCode}</strong>
                          <span>·</span>
                          <span>{issue.dateReported}</span>
                        </div>
                        {getStatusBadge(issue.status)}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1.5">
                        {issue.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {issue.description}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{issue.landmark} ({issue.electoralArea})</span>
                      </div>

                      {issue.resolutionNotes && (
                        <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 space-y-0.5">
                          <div className="font-semibold text-slate-900 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Municipal Action Note:</span>
                          </div>
                          <p className="text-slate-600">{issue.resolutionNotes}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">
                        Assigned: {issue.departmentAssigned}
                      </span>
                      <button
                        onClick={() => onOpenTrackModal(issue.trackingCode)}
                        className="text-emerald-800 hover:text-emerald-950 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Track Progress</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredIssues.length > 0 && (
              <div className="mt-4 bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-xl px-4">
                <Pagination
                  currentPage={incidentPage}
                  totalPages={totalIncidentPages}
                  totalItems={filteredIssues.length}
                  itemsPerPage={INCIDENTS_PER_PAGE}
                  onPageChange={setIncidentPage}
                  itemName="incident reports"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Department Directory */}
        {activeTab === 'departments' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Administrative Directorates & Specialized Units
                </h4>
                <p className="text-xs text-slate-600">
                  Operating from the Municipal Assembly Complex, Lartebiokorshie, Accra.
                </p>
              </div>
              <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                10 Active Municipal Directorates
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MUNICIPAL_DEPARTMENTS.map((dept) => (
                <div
                  key={dept.id}
                  onClick={() => onSelectDepartment?.(dept)}
                  className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs hover:border-emerald-600/50 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {dept.shortCode}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {dept.room.split(',')[0]}
                      </span>
                    </div>

                    <h5 className="font-bold text-slate-900 text-sm leading-snug">
                      {dept.name}
                    </h5>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      {dept.description}
                    </p>

                    <div className="flex items-center gap-2.5 mt-2.5 pt-2.5 border-t border-slate-200/80">
                      {dept.headImageUrl ? (
                        <img
                          src={dept.headImageUrl}
                          alt={dept.head}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover border border-emerald-600/40 shadow-sm shrink-0 bg-slate-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {dept.shortCode.slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-400 block text-[9px] uppercase font-semibold">
                          Director / Head:
                        </span>
                        <strong className="font-bold text-slate-900 block text-xs truncate">{dept.head}</strong>
                        <span className="text-[10px] text-slate-500 block truncate">{dept.headTitle}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Phone className="w-3 h-3 text-emerald-700" />
                      <span>{dept.phone}</span>
                    </div>
                    <span className="text-emerald-800 font-semibold inline-flex items-center gap-1">
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Dedicated Contact Us Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-lg">
              <img
                src="/images/acma_civic_headquarters_1794370608615.jpg"
                alt="Ablekuma Central Municipal Assembly Complex Exterior"
                referrerPolicy="no-referrer"
                className="w-full h-48 sm:h-56 object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent flex items-center p-6 sm:p-8">
                <div className="max-w-xl space-y-2 text-white">
                  <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                    Client Service & Public Enquiries
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold font-serif-civic">
                    Ablekuma Central Municipal Complex · Contact Desk
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Connect with our directorates, schedule an appointment with the Right to Information officer, or submit an official enquiry online.
                  </p>
                </div>
              </div>
            </div>

            {renderContactUsModule()}
          </div>
        )}
      </div>
    </section>
  );
};
