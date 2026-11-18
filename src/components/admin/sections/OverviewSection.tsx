import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper,
  FileCode2,
  Building2,
  Megaphone,
  Calendar,
  Plus,
  Bell,
  ArrowRight,
  Clock,
  Activity,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AdminSectionId, CmsActivityLog, CmsAnnouncement } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';

interface OverviewSectionProps {
  onNavigateSection: (section: AdminSectionId) => void;
}

interface DashboardStats {
  publishedNews: number;
  draftNews: number;
  totalPages: number;
  draftPages: number;
  totalDepartments: number;
  publishedAnnouncements: number;
  totalEvents: number;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ onNavigateSection }) => {
  const { adminProfile, roleSlug } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    publishedNews: 0,
    draftNews: 0,
    totalPages: 0,
    draftPages: 0,
    totalDepartments: 0,
    publishedAnnouncements: 0,
    totalEvents: 0,
  });
  const [recentLogs, setRecentLogs] = useState<CmsActivityLog[]>([]);
  const [expiringAnnouncements, setExpiringAnnouncements] = useState<CmsAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [newsRes, pagesRes, deptRes, annRes, eventsRes, logsRes] = await Promise.all([
        supabase.from('news').select('id, status'),
        supabase.from('pages').select('id, status'),
        supabase.from('departments').select('id'),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('id'),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(8),
      ]);

      const newsRows = (newsRes.data || []) as Array<{ id: string; status: string }>;
      const pageRows = (pagesRes.data || []) as Array<{ id: string; status: string }>;
      const annRows = (annRes.data || []) as CmsAnnouncement[];

      const now = Date.now();
      const soon = now + 7 * 24 * 60 * 60 * 1000;
      const expiring = annRows.filter(
        (a) =>
          a.status === 'published' &&
          a.expires_at &&
          new Date(a.expires_at).getTime() >= now &&
          new Date(a.expires_at).getTime() <= soon
      );

      setStats({
        publishedNews: newsRows.filter((n) => n.status === 'published').length,
        draftNews: newsRows.filter((n) => n.status === 'draft').length,
        totalPages: pageRows.length,
        draftPages: pageRows.filter((p) => p.status === 'draft').length,
        totalDepartments: (deptRes.data || []).length,
        publishedAnnouncements: annRows.filter((a) => a.status === 'published').length,
        totalEvents: (eventsRes.data || []).length,
      });

      setExpiringAnnouncements(expiring);
      setRecentLogs((logsRes.data || []) as CmsActivityLog[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const kpiCards = [
    {
      label: 'Published News',
      value: stats.publishedNews,
      sub: `${stats.draftNews} drafts`,
      icon: Newspaper,
      section: 'news' as AdminSectionId,
    },
    {
      label: 'Website Pages',
      value: stats.totalPages,
      sub: `${stats.draftPages} drafts`,
      icon: FileCode2,
      section: 'pages' as AdminSectionId,
    },
    {
      label: 'Departments',
      value: stats.totalDepartments,
      sub: 'Statutory directorates',
      icon: Building2,
      section: 'departments' as AdminSectionId,
    },
    {
      label: 'Announcements',
      value: stats.publishedAnnouncements,
      sub: 'Active public notices',
      icon: Megaphone,
      section: 'announcements' as AdminSectionId,
    },
    {
      label: 'Events & Activities',
      value: stats.totalEvents,
      sub: 'Scheduled & past',
      icon: Calendar,
      section: 'events' as AdminSectionId,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Welcome back, {adminProfile?.full_name || 'Administrator'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ABCMA Content Management Overview · Role: <span className="font-semibold text-emerald-800">{adminProfile?.role?.name || roleSlug}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateSection('news')}
            className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Article</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('announcements')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Megaphone className="w-3.5 h-3.5 text-emerald-700" />
            <span>Post Notice</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('documents')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onNavigateSection(card.section)}
              className="text-left bg-white border border-slate-200 hover:border-emerald-700 rounded-xl p-4 transition-colors cursor-pointer flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <Icon className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {loading ? '—' : card.value}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{card.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Two-Column Lower Section: Notifications + Quick Links, and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Notifications & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Notifications Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-700" />
                <span>Editorial Notifications</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">Live Checks</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {stats.draftNews > 0 || stats.draftPages > 0 ? (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-2">
                  <span>
                    <strong>{stats.draftNews}</strong> news & <strong>{stats.draftPages}</strong> pages saved as drafts awaiting review.
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigateSection(stats.draftNews > 0 ? 'news' : 'pages')}
                    className="font-bold text-amber-900 underline cursor-pointer shrink-0"
                  >
                    Review
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
                  No unpublished news or page drafts pending review.
                </div>
              )}

              {expiringAnnouncements.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
                  <div className="font-semibold text-slate-900">
                    {expiringAnnouncements.length} Announcement(s) expiring within 7 days:
                  </div>
                  {expiringAnnouncements.slice(0, 2).map((a) => (
                    <div key={a.id} className="text-[11px] text-slate-500 truncate">
                      · {a.title} (expires {new Date(a.expires_at!).toLocaleDateString()})
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Quick Content Controls</h2>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {[
                { label: 'Edit Homepage Hero', section: 'homepage' as AdminSectionId },
                { label: 'Menu & Navigation', section: 'navigation' as AdminSectionId },
                { label: 'Photo Gallery', section: 'gallery' as AdminSectionId },
                { label: 'Media Library', section: 'media' as AdminSectionId },
                { label: 'Contact Details', section: 'contact' as AdminSectionId },
                { label: 'Site & SEO Settings', section: 'settings' as AdminSectionId },
              ].map((item) => (
                <button
                  key={item.section}
                  type="button"
                  onClick={() => onNavigateSection(item.section)}
                  className="p-3 text-left rounded-lg border border-slate-200 hover:border-emerald-700 hover:bg-emerald-50/40 text-slate-800 font-medium flex items-center justify-between gap-1 cursor-pointer transition-colors"
                >
                  <span className="truncate">{item.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Administrative Activity Logs */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-700" />
              <span>Recent Administrative Activity</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigateSection('logs')}
              className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
            >
              View Full Audit Log
            </button>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
              No administrative actions recorded yet. Edits, uploads, and status updates appear here automatically.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {log.action} · {log.entity_type}
                    </div>
                    <div className="text-slate-600 truncate">{log.entity_label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      By {log.admin_name} ({log.admin_email})
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
