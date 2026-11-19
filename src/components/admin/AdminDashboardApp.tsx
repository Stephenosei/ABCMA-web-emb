import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileCode2,
  Newspaper,
  Megaphone,
  Building2,
  Users,
  Calendar,
  Images,
  FileText,
  Home,
  Navigation,
  PhoneCall,
  Settings,
  ShieldCheck,
  ScrollText,
  LogOut,
  HardDrive,
  HardHat,
  ExternalLink,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AdminSectionId } from '../../types/cms';
import { useAuth } from '../../context/AuthContext';
import { OverviewSection } from './sections/OverviewSection';
import { PagesManager } from './sections/PagesManager';
import { NewsManager } from './sections/NewsManager';
import { AnnouncementsManager } from './sections/AnnouncementsManager';
import { DepartmentsManager } from './sections/DepartmentsManager';
import { StaffManager } from './sections/StaffManager';
import { ProjectsManager } from './sections/ProjectsManager';
import { EventsManager } from './sections/EventsManager';
import { GalleryManager } from './sections/GalleryManager';
import { DocumentsManager } from './sections/DocumentsManager';
import { HomepageNavigationManager } from './sections/HomepageNavigationManager';
import { ContactSettingsManager } from './sections/ContactSettingsManager';
import { MediaLibraryManager } from './sections/MediaLibraryManager';
import { AdminsAndLogsManager } from './sections/AdminsAndLogsManager';

interface AdminDashboardAppProps {
  activeSection?: AdminSectionId;
  onSelectSection?: (section: AdminSectionId) => void;
  onNavigatePublic: () => void;
  onRedirectLogin: () => void;
}

interface NavGroupItem {
  id: AdminSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SIDEBAR_ITEMS: NavGroupItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pages', label: 'Manage Pages', icon: FileCode2 },
  { id: 'news', label: 'News and Articles', icon: Newspaper },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'staff', label: 'Management and Staff', icon: Users },
  { id: 'projects', label: 'Projects', icon: HardHat },
  { id: 'events', label: 'Events and Activities', icon: Calendar },
  { id: 'gallery', label: 'Photo Gallery', icon: Images },
  { id: 'documents', label: 'Documents and Downloads', icon: FileText },
  { id: 'homepage', label: 'Homepage Management', icon: Home },
  { id: 'navigation', label: 'Navigation Management', icon: Navigation },
  { id: 'contact', label: 'Contact Information', icon: PhoneCall },
  { id: 'settings', label: 'Website Settings', icon: Settings },
  { id: 'media', label: 'Media Library', icon: HardDrive },
  { id: 'admins', label: 'Administrator Accounts', icon: ShieldCheck },
  { id: 'logs', label: 'Activity Logs', icon: ScrollText },
];

export const AdminDashboardApp: React.FC<AdminDashboardAppProps> = ({
  activeSection: controlledSection,
  onSelectSection,
  onNavigatePublic,
  onRedirectLogin,
}) => {
  const {
    session,
    adminProfile,
    roleSlug,
    loading,
    profileVerifying,
    authError,
    isAuthenticatedAdmin,
    signOut,
  } = useAuth();
  const [localSection, setLocalSection] = useState<AdminSectionId>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const redirectedRef = React.useRef(false);

  const activeSection = controlledSection ?? localSection;
  const isCheckingAuth = loading || profileVerifying;

  useEffect(() => {
    if (isCheckingAuth) return;

    if (isAuthenticatedAdmin) {
      redirectedRef.current = false;
      return;
    }

    // Only auto-redirect unauthenticated visitors (no session) once.
    if (!session && !redirectedRef.current) {
      redirectedRef.current = true;
      onRedirectLogin();
    }
  }, [isCheckingAuth, isAuthenticatedAdmin, session, onRedirectLogin]);

  const notify = React.useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 4500);
  }, []);

  const handleLogout = React.useCallback(async () => {
    redirectedRef.current = true;
    await signOut();
    onRedirectLogin();
  }, [signOut, onRedirectLogin]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="text-xs font-semibold text-slate-600">
          Verifying ABCMA Administrator Session...
        </div>
      </div>
    );
  }

  if (!isAuthenticatedAdmin) {
    if (session) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex items-start gap-2.5 text-rose-800">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-900">Administrator Access Denied</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {authError ||
                    'Your session could not be matched to an active administrator profile.'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onNavigatePublic}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Public Website
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg cursor-pointer"
              >
                Sign Out &amp; Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const selectSection = (id: AdminSectionId) => {
    setLocalSection(id);
    if (onSelectSection) {
      onSelectSection(id);
    }
    setMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-900">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2 ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* Persistent Left Sidebar (256px) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white border border-emerald-500/40 overflow-hidden flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/abcma_logo_74f7cef4.jpeg"
                alt="ABCMA Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain scale-[1.42]"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">ABCMA Admin CMS</div>
              <div className="text-[10px] font-mono text-emerald-400 truncate">
                {adminProfile?.role?.name || roleSlug}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                  active
                    ? 'bg-emerald-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-300' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <div className="px-2 text-[11px] text-slate-400 truncate">
            {adminProfile?.email}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-950/60 hover:text-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs font-semibold text-slate-500">
              Ablekuma Central Municipal Assembly ·{' '}
              <span className="text-slate-900">
                {SIDEBAR_ITEMS.find((i) => i.id === activeSection)?.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onNavigatePublic}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
              <span>View Public Website</span>
            </button>
          </div>
        </header>

        {/* Active Module Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeSection === 'overview' && (
            <OverviewSection onNavigateSection={selectSection} />
          )}
          {activeSection === 'pages' && <PagesManager notify={notify} />}
          {activeSection === 'news' && <NewsManager notify={notify} />}
          {activeSection === 'announcements' && <AnnouncementsManager notify={notify} />}
          {activeSection === 'departments' && <DepartmentsManager notify={notify} />}
          {activeSection === 'staff' && <StaffManager notify={notify} />}
          {activeSection === 'projects' && <ProjectsManager notify={notify} />}
          {activeSection === 'events' && <EventsManager notify={notify} />}
          {activeSection === 'gallery' && <GalleryManager notify={notify} />}
          {activeSection === 'documents' && <DocumentsManager notify={notify} />}
          {activeSection === 'homepage' && (
            <HomepageNavigationManager mode="homepage" notify={notify} />
          )}
          {activeSection === 'navigation' && (
            <HomepageNavigationManager mode="navigation" notify={notify} />
          )}
          {activeSection === 'contact' && (
            <ContactSettingsManager mode="contact" notify={notify} />
          )}
          {activeSection === 'settings' && (
            <ContactSettingsManager mode="settings" notify={notify} />
          )}
          {activeSection === 'media' && <MediaLibraryManager notify={notify} />}
          {activeSection === 'admins' && (
            <AdminsAndLogsManager mode="admins" notify={notify} />
          )}
          {activeSection === 'logs' && (
            <AdminsAndLogsManager mode="logs" notify={notify} />
          )}
        </main>
      </div>
    </div>
  );
};
