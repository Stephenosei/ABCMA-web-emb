/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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

import { ServiceApplicationModal } from './components/ServiceApplicationModal';
import { CitizenReportModal } from './components/CitizenReportModal';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { OfficialReceiptModal } from './components/OfficialReceiptModal';
import { TownHallMemoModal } from './components/TownHallMemoModal';
import { TrackModal } from './components/TrackModal';
import { DepartmentDetailModal } from './components/DepartmentDetailModal';

import {
  INITIAL_SERVICES,
  INITIAL_BILLS,
  INITIAL_ISSUES,
  ASSEMBLY_MEMBERS,
  TOWN_HALLS,
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

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');

  // Application Data States (persistent in memory during session)
  const [bills, setBills] = useState<BillRecord[]>(INITIAL_BILLS);
  const [issues, setIssues] = useState<CitizenIssue[]>(INITIAL_ISSUES);
  const [services] = useState<MunicipalService[]>(INITIAL_SERVICES);
  const [projects] = useState(MUNICIPAL_PROJECTS);
  const [townHalls] = useState(TOWN_HALLS);
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

  const handleOpenDepartmentDetail = (dept: MunicipalDepartment) => {
    setSelectedDepartment(dept);
    setDepartmentModalOpen(true);
  };

  // Toast alert state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
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

  const handleServiceSubmitted = (code: string, serviceTitle: string) => {
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
    // Update bill in state
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
      receiptNumber: bill.receiptNumber || 'ACMA-REC-2026-004812',
      billNumber: bill.billNumber,
      taxpayerName: bill.taxpayerName,
      billType: bill.type,
      amountPaidGHS: bill.amountPaidGHS || bill.amountDueGHS,
      paymentMethod: 'mtn_momo',
      phoneNumberOrCard: bill.phone,
      timestamp: bill.lastPaymentDate || '14 Feb 2026 11:42 AM',
      referenceId: 'GH-TXN-VERIFIED-9912',
      status: 'successful',
      qrCodeToken: `https://acma.gov.gh/verify/${bill.receiptNumber}`,
    };
    setActiveTransaction(mockTx);
    setReceiptBill(bill);
    setReceiptModalOpen(true);
  };

  const handleOpenMemoModal = (meeting: TownHallMeeting) => {
    setSelectedMeetingForMemo(meeting);
    setMemoModalOpen(true);
  };

  useEffect(() => {
    const syncHash = () => {
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

    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const handleOpenTrackModal = (code?: string) => {
    setInitialTrackCode(code);
    setTrackModalOpen(true);
  };

  const handleNavigate = (pageId: string) => {
    setActiveSection(pageId);
    window.location.hash = `#${pageId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProjectDossier = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveSection('project-dossier');
    window.location.hash = `#project-dossier-${projectId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col relative text-slate-900 selection:bg-emerald-200 selection:text-emerald-950 bg-slate-100">
      {/* Lively Multi-Layer Civic Assembly Backdrop featuring Authentic Assembly Pictures */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        {/* Assembly Chamber In-Session Background Picture */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.22] scale-105 transition-all duration-700"
          style={{
            backgroundImage: `url('/images/assembly_chamber_backdrop_1794482218382.jpg')`,
            backgroundAttachment: 'fixed',
          }}
        />
        {/* Civic Plaza & Community Atmosphere Secondary Wash */}
        <div
          className="absolute inset-0 bg-cover bg-bottom bg-no-repeat opacity-[0.14] mix-blend-overlay"
          style={{
            backgroundImage: `url('/images/acma_civic_plaza_bg_1794482218453.jpg')`,
            backgroundAttachment: 'fixed',
          }}
        />
        {/* Lively Ambient Civic Tint with Warm Emerald, Sunlight Amber, and Crisp Soft Tone */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/70 via-slate-50/75 to-amber-50/70 backdrop-blur-[0.5px]" />
        {/* Subtle Decorative Civic Guilloche / Dot Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:28px_28px] opacity-15" />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar with active tab highlighting */}
      <Header
        onOpenTrackModal={handleOpenTrackModal}
        activeSection={activeSection}
        setActiveSection={handleNavigate}
      />

      {/* Multi-Page Container: Only the currently active open page is rendered */}
      <main className="flex-1">
        {/* 1. Home Page */}
        {activeSection === 'home' && (
          <Hero
            onNavigate={handleNavigate}
            onOpenTrackModal={handleOpenTrackModal}
            onOpenReportModal={() => setReportModalOpen(true)}
            onOpenServiceModal={handleOpenServiceModal}
            onSelectDepartment={handleOpenDepartmentDetail}
            onOpenProjectDossier={handleOpenProjectDossier}
          />
        )}

        {/* 2. Departments Open Page */}
        {activeSection === 'departments' && (
          <DepartmentsPage
            onNavigate={handleNavigate}
            onSelectDepartment={handleOpenDepartmentDetail}
            onOpenServiceModal={handleOpenServiceModal}
            onOpenReportModal={() => setReportModalOpen(true)}
          />
        )}

        {/* 3. Service Open Page: Public Services & Rates */}
        {activeSection === 'service' && (
          <div className="bg-transparent min-h-screen py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              {/* Breadcrumb Navigation */}
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

              {/* Cross-Page Connect Link */}
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

        {/* 4. Projects Open Page */}
        {activeSection === 'projects' && (
          <ProjectsTracker
            projects={projects}
            isStandalonePage={true}
            onNavigateHome={() => handleNavigate('home')}
            onOpenProjectDossier={handleOpenProjectDossier}
          />
        )}

        {/* 5. Documents Open Page */}
        {activeSection === 'documents' && (
          <DocumentsSection
            isStandalonePage={true}
            onNavigateHome={() => handleNavigate('home')}
            onDocumentDownloaded={(title) => showToast(`Downloaded: ${title}`)}
          />
        )}

        {/* 6. The Assembly Open Page */}
        {activeSection === 'assembly' && (
          <TheAssemblySection
            assemblyMembers={assemblyMembers}
            townHalls={townHalls}
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

        {/* 7. Leadership Address Open Page */}
        {activeSection === 'leadership-address' && (
          <LeadershipAddressPage
            onNavigate={handleNavigate}
            onOpenReportModal={() => setReportModalOpen(true)}
            onOpenMemoModal={() => handleOpenMemoModal(townHalls[0])}
          />
        )}

        {/* 8. Project Dossier Open Page */}
        {activeSection === 'project-dossier' && (
          <ProjectDossierPage
            projectId={selectedProjectId}
            onNavigate={handleNavigate}
            onOpenReportModal={() => setReportModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenTrackModal={() => handleOpenTrackModal()}
        onOpenReportModal={() => setReportModalOpen(true)}
        onOpenServiceModal={handleOpenServiceModal}
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
