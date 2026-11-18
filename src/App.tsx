/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { BillingSection } from './components/BillingSection';
import { ProjectsTracker } from './components/ProjectsTracker';
import { DocumentsSection } from './components/DocumentsSection';
import { TheAssemblySection } from './components/TheAssemblySection';
import { Footer } from './components/Footer';

import { DepartmentsPage } from './components/DepartmentsPage';
import { LeadershipAddressPage } from './components/LeadershipAddressPage';
import { ProjectDossierPage } from './components/ProjectDossierPage';
import { NewsPage } from './components/NewsPage';
import { GalleryPage } from './components/GalleryPage';
import { DynamicCmsPage } from './components/DynamicCmsPage';

import { ServiceApplicationModal } from './components/ServiceApplicationModal';
import { CitizenReportModal } from './components/CitizenReportModal';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { OfficialReceiptModal } from './components/OfficialReceiptModal';
import { TownHallMemoModal } from './components/TownHallMemoModal';
import { TrackModal } from './components/TrackModal';
import { DepartmentDetailModal } from './components/DepartmentDetailModal';

import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AdminDashboardApp } from './components/admin/AdminDashboardApp';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CmsProvider, useCms } from './context/CmsContext';
import { AdminSectionId } from './types/cms';

import {
  INITIAL_SERVICES,
  INITIAL_BILLS,
  INITIAL_ISSUES,
  ASSEMBLY_MEMBERS,
  MUNICIPAL_PROJECTS,
} from './data/mockData';
import {
  BillRecord,
  CitizenIssue,
  MunicipalService,
  PaymentTransaction,
  TownHallMeeting,
  MunicipalDepartment,
} from './types';
import { CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';

const ADMIN_SECTION_IDS: readonly AdminSectionId[] = [
  'overview',
  'pages',
  'news',
  'announcements',
  'departments',
  'staff',
  'events',
  'gallery',
  'documents',
  'homepage',
  'navigation',
  'contact',
  'settings',
  'media',
  'admins',
  'logs',
];

function parseAdminSectionFromPath(currentPath: string): AdminSectionId {
  const clean = currentPath.replace(/\/+$/, '') || '/';
  if (clean === '/admin' || clean === '/admin/overview') return 'overview';
  if (clean.startsWith('/admin/')) {
    const candidate = clean.slice('/admin/'.length).split('/')[0] as AdminSectionId;
    if (ADMIN_SECTION_IDS.includes(candidate)) {
      return candidate;
    }
  }
  return 'overview';
}

function AppRouterAndPortal() {
  const { isAuthenticatedAdmin, loading: authLoading, profileVerifying } = useAuth();
  const { townHallsFromEvents, refreshPublicContent } = useCms();

  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');
  const [activeSection, setActiveSection] = useState('home');
  const [activeCmsSlug, setActiveCmsSlug] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);

  // Interactive citizen portal states
  const [bills, setBills] = useState<BillRecord[]>(INITIAL_BILLS);
  const [issues, setIssues] = useState<CitizenIssue[]>(INITIAL_ISSUES);
  const [services] = useState<MunicipalService[]>(INITIAL_SERVICES);
  const [projects] = useState(MUNICIPAL_PROJECTS);
  const [assemblyMembers] = useState(ASSEMBLY_MEMBERS);

  // Modals
  const [selectedService, setSelectedService] = useState<MunicipalService | null>(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<BillRecord | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<PaymentTransaction | null>(null);
  const [receiptBill, setReceiptBill] = useState<BillRecord | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedMeetingForMemo, setSelectedMeetingForMemo] = useState<TownHallMeeting | null>(null);
  const [memoModalOpen, setMemoModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [initialTrackCode, setInitialTrackCode] = useState<string | undefined>(undefined);
  const [selectedDepartment, setSelectedDepartment] = useState<MunicipalDepartment | null>(null);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const navigatePath = useCallback((nextPath: string, replace = false) => {
    if (replace) {
      window.history.replaceState({}, '', nextPath);
    } else {
      window.history.pushState({}, '', nextPath);
    }
    setPathname(window.location.pathname || '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigatePublic = useCallback(() => {
    void refreshPublicContent();
    navigatePath('/');
  }, [refreshPublicContent, navigatePath]);

  const handleRedirectLogin = useCallback(() => {
    const current = window.location.pathname || '/admin';
    const target =
      current.startsWith('/admin') && current !== '/admin/login'
        ? `/admin/login?redirect=${encodeURIComponent(current)}`
        : '/admin/login';
    navigatePath(target, true);
  }, [navigatePath]);

  const handleLoginSuccess = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect');
    const target =
      redirectParam && redirectParam.startsWith('/admin') && redirectParam !== '/admin/login'
        ? redirectParam
        : '/admin';
    navigatePath(target, true);
  }, [navigatePath]);

  const handleSelectAdminSection = useCallback((section: AdminSectionId) => {
    const nextPath = section === 'overview' ? '/admin' : `/admin/${section}`;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
      setPathname(nextPath);
    }
  }, []);

  const handleOpenAdminPortal = useCallback(() => {
    if (authLoading || profileVerifying || isAuthenticatedAdmin) {
      navigatePath('/admin');
    } else {
      navigatePath('/admin/login');
    }
  }, [authLoading, profileVerifying, isAuthenticatedAdmin, navigatePath]);

  // Redirect already-authenticated admins away from /admin/login
  useEffect(() => {
    if (pathname === '/admin/login' && !authLoading && !profileVerifying && isAuthenticatedAdmin) {
      handleLoginSuccess();
    }
  }, [pathname, authLoading, profileVerifying, isAuthenticatedAdmin, handleLoginSuccess]);

  // Sync URL pathname & hash on browser navigation
  useEffect(() => {
    const syncRoute = () => {
      const currentPath = window.location.pathname || '/';
      setPathname(currentPath);

      if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
        return;
      }

      if (currentPath.startsWith('/page/')) {
        const slug = currentPath.slice('/page/'.length).replace(/\/+$/, '');
        setActiveCmsSlug(slug);
        setActiveSection('cms-page');
        return;
      }

      setActiveCmsSlug(null);
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) {
        if (hash.startsWith('project-dossier-')) {
          const id = hash.replace('project-dossier-', '');
          setSelectedProjectId(id);
          setActiveSection('project-dossier');
        } else {
          setActiveSection(hash);
        }
      } else {
        setActiveSection('home');
      }
    };

    syncRoute();
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenDepartmentDetail = (dept: MunicipalDepartment) => {
    setSelectedDepartment(dept);
    setDepartmentModalOpen(true);
  };

  const handleOpenServiceModal = (serviceId?: string) => {
    if (serviceId) {
      const match = services.find((s) => s.id === serviceId) || services[0];
      setSelectedService(match);
    } else {
      setSelectedService(services[0]);
    }
    setServiceModalOpen(true);
  };

  const handleServiceSubmitted = (code: string) => {
    showToast(`Application successfully registered! Tracking code: ${code}`);
  };

  const handleIssueReported = (newIssue: CitizenIssue) => {
    setIssues((prev) => [newIssue, ...prev]);
    showToast(`Incident report lodged: ${newIssue.trackingCode}`);
  };

  const handleOpenPaymentGateway = (bill: BillRecord) => {
    setSelectedBillForPayment(bill);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (transaction: PaymentTransaction, updatedBill: BillRecord) => {
    setBills((prev) =>
      prev.map((b) => (b.id === updatedBill.id ? updatedBill : b))
    );
    setActiveTransaction(transaction);
    setReceiptBill(updatedBill);
    setPaymentModalOpen(false);
    setReceiptModalOpen(true);
    showToast(`Payment of GHS ${transaction.amountPaidGHS.toFixed(2)} settled successfully!`);
  };

  const handleViewExistingReceipt = (bill: BillRecord) => {
    const mockTx: PaymentTransaction = {
      receiptNumber: bill.receiptNumber || 'ABCMA-REC-2026-004812',
      billNumber: bill.billNumber,
      taxpayerName: bill.taxpayerName,
      billType: bill.type,
      amountPaidGHS: bill.amountPaidGHS || bill.amountDueGHS,
      paymentMethod: 'mtn_momo',
      phoneNumberOrCard: bill.phone,
      timestamp: bill.lastPaymentDate || '14 Feb 2026 11:42 AM',
      referenceId: 'GH-TXN-VERIFIED-9912',
      status: 'successful',
      qrCodeToken: `https://abcma.gov.gh/verify/${bill.receiptNumber}`,
    };
    setActiveTransaction(mockTx);
    setReceiptBill(bill);
    setReceiptModalOpen(true);
  };

  const handleOpenMemoModal = (meeting: TownHallMeeting) => {
    setSelectedMeetingForMemo(meeting);
    setMemoModalOpen(true);
  };

  const handleOpenTrackModal = (code?: string) => {
    setInitialTrackCode(code);
    setTrackModalOpen(true);
  };

  const handleNavigate = (pageId: string) => {
    if (pageId === 'news') {
      setSelectedNewsId(null);
    }
    setActiveCmsSlug(null);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', `/#${pageId}`);
      setPathname('/');
    } else {
      window.location.hash = `#${pageId}`;
    }
    setActiveSection(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCmsPage = (slug: string) => {
    const cleanSlug = slug.replace(/^\/+/, '');
    setActiveCmsSlug(cleanSlug);
    setActiveSection('cms-page');
    window.history.pushState({}, '', `/page/${cleanSlug}`);
    setPathname(`/page/${cleanSlug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNewsArticle = (newsId: string) => {
    setSelectedNewsId(newsId);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/#news');
      setPathname('/');
    } else {
      window.location.hash = '#news';
    }
    setActiveSection('news');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProjectDossier = (projectId: string) => {
    setSelectedProjectId(projectId);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', `/#project-dossier-${projectId}`);
      setPathname('/');
    } else {
      window.location.hash = `#project-dossier-${projectId}`;
    }
    setActiveSection('project-dossier');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dedicated Admin Login Route (/admin/login)
  if (pathname === '/admin/login') {
    return (
      <AdminLoginPage
        onNavigatePublic={handleNavigatePublic}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Protected Admin CMS Dashboard Routes (/admin and /admin/*)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const activeAdminSection = parseAdminSectionFromPath(pathname);
    return (
      <AdminDashboardApp
        activeSection={activeAdminSection}
        onSelectSection={handleSelectAdminSection}
        onNavigatePublic={handleNavigatePublic}
        onRedirectLogin={handleRedirectLogin}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative text-slate-900 selection:bg-emerald-200 selection:text-emerald-950 bg-slate-100">
      {/* Lively Multi-Layer Civic Assembly Backdrop featuring Authentic Assembly Pictures */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.22] scale-105 transition-all duration-700"
          style={{
            backgroundImage: `url('/images/assembly_chamber_backdrop_1794482218382.jpg')`,
            backgroundAttachment: 'fixed',
          }}
        />
        <div
          className="absolute inset-0 bg-cover bg-bottom bg-no-repeat opacity-[0.14] mix-blend-overlay"
          style={{
            backgroundImage: `url('/images/acma_civic_plaza_bg_1794482218453.jpg')`,
            backgroundAttachment: 'fixed',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/70 via-slate-50/75 to-amber-50/70 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:28px_28px] opacity-15" />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Header
        onOpenTrackModal={handleOpenTrackModal}
        activeSection={activeSection}
        setActiveSection={handleNavigate}
        onOpenCmsPage={handleOpenCmsPage}
        activeCmsSlug={activeCmsSlug}
        onOpenAdmin={handleOpenAdminPortal}
        isAuthenticatedAdmin={isAuthenticatedAdmin}
      />

      {/* Multi-Page Container */}
      <main className="flex-1">
        {activeSection === 'cms-page' && activeCmsSlug && (
          <DynamicCmsPage slug={activeCmsSlug} onNavigate={handleNavigate} />
        )}

        {activeSection === 'home' && (
          <Hero
            onNavigate={handleNavigate}
            onOpenTrackModal={handleOpenTrackModal}
            onOpenReportModal={() => setReportModalOpen(true)}
            onOpenServiceModal={handleOpenServiceModal}
            onSelectDepartment={handleOpenDepartmentDetail}
            onOpenProjectDossier={handleOpenProjectDossier}
            onOpenNewsArticle={handleOpenNewsArticle}
          />
        )}

        {activeSection === 'news' && (
          <NewsPage
            onNavigate={handleNavigate}
            selectedArticleId={selectedNewsId}
            onSelectArticleId={setSelectedNewsId}
          />
        )}

        {activeSection === 'departments' && (
          <DepartmentsPage
            onNavigate={handleNavigate}
            onSelectDepartment={handleOpenDepartmentDetail}
            onOpenServiceModal={handleOpenServiceModal}
            onOpenReportModal={() => setReportModalOpen(true)}
          />
        )}

        {activeSection === 'service' && (
          <div className="bg-transparent min-h-screen py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="mb-6 space-y-4">
                <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <button
                    onClick={() => handleNavigate('home')}
                    className="hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    Home
                  </button>
                  <span>/</span>
                  <span className="text-slate-800 font-semibold">
                    Public Services, Commercial Permits & Rates Billing
                  </span>
                </nav>

                <button
                  onClick={() => handleNavigate('home')}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:border-emerald-300 shadow-sm transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Home</span>
                </button>
              </div>

              <ServicesSection
                services={services}
                onOpenServiceModal={handleOpenServiceModal}
              />

              <div className="mt-12">
                <BillingSection
                  bills={bills}
                  onOpenPaymentGateway={handleOpenPaymentGateway}
                  onViewReceipt={handleViewExistingReceipt}
                />
              </div>

              <div className="mt-12 p-6 sm:p-8 bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    Want to review the official statutory fees approved by the Assembly?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                    Download the complete 2026 Gazetted Fee-Fixing Resolution and local environmental sanitation bye-laws.
                  </p>
                </div>
                <button
                  onClick={() => handleNavigate('documents')}
                  className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <span>Read More on Gazetted Documents</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'projects' && (
          <ProjectsTracker
            projects={projects}
            isStandalonePage={true}
            onNavigateHome={() => handleNavigate('home')}
            onOpenProjectDossier={handleOpenProjectDossier}
          />
        )}

        {activeSection === 'documents' && (
          <DocumentsSection
            isStandalonePage={true}
            onNavigateHome={() => handleNavigate('home')}
            onDocumentDownloaded={(title) => showToast(`Downloaded: ${title}`)}
          />
        )}

        {activeSection === 'gallery' && <GalleryPage onNavigate={handleNavigate} />}

        {activeSection === 'assembly' && (
          <TheAssemblySection
            assemblyMembers={assemblyMembers}
            townHalls={townHallsFromEvents}
            issues={issues}
            isStandalonePage={true}
            onNavigateHome={() => handleNavigate('home')}
            onReadLeadershipAddress={() => handleNavigate('leadership-address')}
            onOpenReportModal={() => setReportModalOpen(true)}
            onOpenMemoModal={handleOpenMemoModal}
            onOpenTrackModal={handleOpenTrackModal}
            onSelectDepartment={handleOpenDepartmentDetail}
          />
        )}

        {activeSection === 'leadership-address' && (
          <LeadershipAddressPage
            onNavigate={handleNavigate}
            onOpenReportModal={() => setReportModalOpen(true)}
            onOpenMemoModal={() => handleOpenMemoModal(townHallsFromEvents[0])}
          />
        )}

        {activeSection === 'project-dossier' && (
          <ProjectDossierPage
            projectId={selectedProjectId}
            onNavigate={handleNavigate}
            onOpenReportModal={() => setReportModalOpen(true)}
          />
        )}
      </main>

      <Footer
        onNavigate={handleNavigate}
        onOpenTrackModal={() => handleOpenTrackModal()}
        onOpenReportModal={() => setReportModalOpen(true)}
        onOpenServiceModal={handleOpenServiceModal}
        onOpenAdmin={handleOpenAdminPortal}
        isAuthenticatedAdmin={isAuthenticatedAdmin}
      />

      {/* Interactive Modals */}
      <ServiceApplicationModal
        service={selectedService}
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onSubmitted={handleServiceSubmitted}
      />

      <CitizenReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onIssueReported={handleIssueReported}
      />

      <PaymentGatewayModal
        bill={selectedBillForPayment}
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <OfficialReceiptModal
        transaction={activeTransaction}
        bill={receiptBill}
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
      />

      <TownHallMemoModal
        meeting={selectedMeetingForMemo}
        isOpen={memoModalOpen}
        onClose={() => setMemoModalOpen(false)}
        onSubmitted={(subj) => showToast(`Memo on "${subj}" submitted for Assembly hearing!`)}
      />

      <TrackModal
        isOpen={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        initialCode={initialTrackCode}
        bills={bills}
        issues={issues}
        onOpenPaymentGateway={handleOpenPaymentGateway}
        onViewReceipt={handleViewExistingReceipt}
      />

      <DepartmentDetailModal
        department={selectedDepartment}
        isOpen={departmentModalOpen}
        onClose={() => setDepartmentModalOpen(false)}
        onOpenServiceModal={handleOpenServiceModal}
        onOpenReportModal={() => setReportModalOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CmsProvider>
        <AppRouterAndPortal />
      </CmsProvider>
    </AuthProvider>
  );
}

