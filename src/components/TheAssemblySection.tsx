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
  ArrowLeft
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
  const [activeTab, setActiveTab] = useState<'leadership' | 'members' | 'townhalls' | 'incidents' | 'departments'>('leadership');
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

  return (
    <section id="assembly" className="py-12 lg:py-16 bg-white border-b border-slate-200 min-h-screen">
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
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-emerald-700" />
              <span>Local Governance & Civic Mandate</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              The Assembly
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Meet the executive leadership, your elected Assembly Members across the 7 electoral areas, public town hall sessions, and citizen incident response system.
            </p>
          </div>

          {/* Interactive Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('leadership')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'leadership' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Leadership & MCE
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'members' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assembly Members ({assemblyMembers.length})
            </button>
            <button
              onClick={() => setActiveTab('townhalls')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'townhalls' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Town Halls & Hearings
            </button>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'incidents' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Citizen Incident Desk ({issues.length})
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'departments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Department Directory
            </button>
          </div>
        </div>

        {/* Tab 1: Leadership & Executive Overview */}
        {activeTab === 'leadership' && (
          <div className="space-y-8">
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                    <Landmark className="w-4 h-4" />
                    <span>Office of the Municipal Chief Executive (MCE)</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif-civic leading-snug">
                    "Building an Inclusive, Modern & Resilient Ablekuma Central for All Residents and Traders"
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Under the Local Governance Act 2016 (Act 936), Ablekuma Central Municipal Assembly serves as the planning authority, rating authority, and infrastructure driver for our 7 electoral areas. Our mandate is to eliminate bureaucratic delays, modernize local markets like Abossey Okai and Town Council Line, expand maternal clinics, and construct engineered storm drains that protect homes and livelihoods from seasonal floods.
                  </p>

                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <strong className="text-white block font-sans">Hon. Municipal Chief Executive</strong>
                        <span className="text-slate-400">Political & Administrative Head of ACMA</span>
                      </div>
                      <div>
                        <strong className="text-white block font-sans">Municipal Coordinating Director</strong>
                        <span className="text-slate-400">Head of Civil Service & Secretary to the Assembly</span>
                      </div>
                    </div>

                    {onReadLeadershipAddress && (
                      <button
                        onClick={onReadLeadershipAddress}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>Read More · Full 2026 MCE Policy Address</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-4 bg-slate-800/90 border border-slate-700 p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Core Assembly Principles
                  </h4>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Accountability:</strong> Transparent administration of public revenue, permits, and procurement.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Client-Focused:</strong> Rapid turnaround on BOP renewals, civil licenses, and building approvals.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Grassroots Democracy:</strong> Empowered Assembly Members and direct citizen participation.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Assembly Members Directory */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
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
              <div className="p-10 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
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
                    className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-emerald-600/40 hover:shadow-md transition-all space-y-3"
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
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm shadow-sm">
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

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700 font-mono">
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
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl px-4">
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
              <div className="w-full md:w-1/3 rounded-xl overflow-hidden shadow-lg border border-slate-700 shrink-0">
                <img
                  src="/src/assets/images/acma_townhall_meeting_1794370609788.jpg"
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
                  className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-all space-y-4"
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
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Area:</span>
                </div>
                <select
                  value={issueAreaFilter}
                  onChange={(e) => setIssueAreaFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800"
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
                  className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800"
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
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report Community Fault</span>
              </button>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
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
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
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
              <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl px-4">
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
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs hover:border-emerald-600/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
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

                    <div className="text-slate-600 mt-2 pt-2 border-t border-slate-200/80">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Director / Head:
                      </span>
                      <span className="font-medium text-slate-800">{dept.head}</span>
                      <span className="text-[10px] text-slate-500 block">{dept.headTitle}</span>
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
      </div>
    </section>
  );
};
