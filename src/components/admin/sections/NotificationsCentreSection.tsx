import React, { useState, useMemo } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Search,
  SlidersHorizontal,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Globe,
  Activity,
  ShieldAlert,
  ExternalLink,
  Lock,
  Database,
} from 'lucide-react';
import {
  AdminNotification,
  AdminNotificationCategory,
  AdminNotificationPriority,
  AdminSectionId,
} from '../../../types/cms';
import { useNotifications } from '../../../context/NotificationsContext';
import {
  formatNotificationDateTime,
  formatRelativeNotificationTime,
  getNotificationVisualTone,
  parseAdminSectionFromActionUrl,
} from '../../../utils/notifications';

interface NotificationsCentreSectionProps {
  onNavigateSection: (section: AdminSectionId) => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

type NotificationTab =
  | 'all'
  | 'unread'
  | 'task'
  | 'website_update'
  | 'co_admin_activity'
  | 'system_alert';

type DateRangeFilter = 'all' | 'today' | '7d' | '30d';

const TABS: Array<{ id: NotificationTab; label: string }> = [
  { id: 'all', label: 'All Notifications' },
  { id: 'unread', label: 'Unread' },
  { id: 'task', label: 'Tasks' },
  { id: 'website_update', label: 'Website Updates' },
  { id: 'co_admin_activity', label: 'Co-Admin Activities' },
  { id: 'system_alert', label: 'System Alerts' },
];

function getBadgeStyles(notif: AdminNotification) {
  const tone = getNotificationVisualTone(notif);
  switch (tone) {
    case 'urgent':
      return {
        cardAccent: 'border-l-4 border-l-rose-600',
        iconBox: 'bg-rose-50 border-rose-200 text-rose-700',
        priorityBadge: 'bg-rose-100 text-rose-800 border-rose-200',
        toneLabel: 'Urgent',
      };
    case 'completed':
      return {
        cardAccent: 'border-l-4 border-l-emerald-600',
        iconBox: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        priorityBadge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        toneLabel: 'Completed',
      };
    case 'pending':
      return {
        cardAccent: 'border-l-4 border-l-amber-500',
        iconBox: 'bg-amber-50 border-amber-200 text-amber-700',
        priorityBadge: 'bg-amber-100 text-amber-800 border-amber-200',
        toneLabel: 'Task Action',
      };
    default:
      return {
        cardAccent: 'border-l-4 border-l-blue-600',
        iconBox: 'bg-blue-50 border-blue-200 text-blue-700',
        priorityBadge: 'bg-blue-100 text-blue-800 border-blue-200',
        toneLabel: 'Update',
      };
  }
}

function renderCategoryIcon(notif: AdminNotification) {
  const tone = getNotificationVisualTone(notif);
  if (tone === 'urgent') {
    return notif.category === 'system_alert' ? (
      <ShieldAlert className="w-5 h-5" />
    ) : (
      <AlertTriangle className="w-5 h-5" />
    );
  }
  if (tone === 'completed') {
    return <CheckCircle2 className="w-5 h-5" />;
  }
  if (tone === 'pending') {
    return <Clock className="w-5 h-5" />;
  }
  if (notif.category === 'website_update') {
    return <Globe className="w-5 h-5" />;
  }
  return <Activity className="w-5 h-5" />;
}

export const NotificationsCentreSection: React.FC<NotificationsCentreSectionProps> = ({
  onNavigateSection,
  notify,
}) => {
  const {
    notifications,
    unreadCount,
    hiddenByPreferencesCount,
    preferences,
    loading,
    migrationMissing,
    realtimeConnected,
    refreshAll,
    markAsRead,
    markAllAsRead,
    updatePreferences,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | AdminNotificationPriority>('all');
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [busyMarkAll, setBusyMarkAll] = useState(false);

  const urgentUnreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read && n.priority === 'urgent').length,
    [notifications]
  );

  const taskUnreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read && n.category === 'task').length,
    [notifications]
  );

  const coAdminUnreadCount = useMemo(
    () =>
      notifications.filter(
        (n) =>
          !n.is_read && (n.category === 'co_admin_activity' || n.category === 'website_update')
      ).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = Date.now();

    return notifications.filter((n) => {
      if (activeTab === 'unread' && n.is_read) return false;
      if (
        activeTab !== 'all' &&
        activeTab !== 'unread' &&
        n.category !== (activeTab as AdminNotificationCategory)
      ) {
        return false;
      }

      if (priorityFilter !== 'all' && n.priority !== priorityFilter) {
        return false;
      }

      if (dateFilter !== 'all') {
        const createdMs = new Date(n.created_at).getTime();
        if (dateFilter === 'today') {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          if (createdMs < todayStart.getTime()) return false;
        } else if (dateFilter === '7d') {
          if (now - createdMs > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (dateFilter === '30d') {
          if (now - createdMs > 30 * 24 * 60 * 60 * 1000) return false;
        }
      }

      if (q) {
        const haystack = `${n.title} ${n.description} ${n.actor_name} ${n.affected_section} ${n.related_entity_label}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [notifications, activeTab, priorityFilter, dateFilter, searchQuery]);

  const handleMarkSingleRead = async (notifId: string) => {
    const res = await markAsRead(notifId);
    if (!res.ok) {
      notify(res.error || 'Could not mark notification as read.', 'error');
    }
  };

  const handleMarkAllVisible = async () => {
    setBusyMarkAll(true);
    try {
      const targetCategory: AdminNotificationCategory | null =
        activeTab === 'task' ||
        activeTab === 'website_update' ||
        activeTab === 'co_admin_activity' ||
        activeTab === 'system_alert'
          ? activeTab
          : null;
      const res = await markAllAsRead(targetCategory);
      if (!res.ok) {
        notify(res.error || 'Could not mark notifications as read.', 'error');
      } else {
        notify('Notifications marked as read.');
      }
    } finally {
      setBusyMarkAll(false);
    }
  };

  const handleTogglePreference = async (
    key:
      | 'receive_task_notifications'
      | 'receive_co_admin_activities'
      | 'receive_publishing_notifications'
      | 'receive_system_alerts',
    value: boolean
  ) => {
    const res = await updatePreferences({ [key]: value });
    if (!res.ok) {
      notify(res.error || 'Failed to update notification preferences.', 'error');
    } else {
      notify('Notification preferences saved.');
    }
  };

  const handleOpenDestination = async (notif: AdminNotification) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    onNavigateSection(parseAdminSectionFromActionUrl(notif.action_url));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Admin Notification Centre
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                realtimeConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  realtimeConnected ? 'bg-emerald-600' : 'bg-slate-400'
                }`}
              />
              {realtimeConnected ? 'Realtime Active' : 'Connecting...'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Monitor task assignments, approval requests, co-admin website changes, and security alerts in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPreferences((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-xl cursor-pointer ${
              showPreferences
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>
          <button
            type="button"
            onClick={handleMarkAllVisible}
            disabled={busyMarkAll || unreadCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl cursor-pointer disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>{busyMarkAll ? 'Updating...' : 'Mark All as Read'}</span>
          </button>
        </div>
      </div>

      {/* Migration Setup Notice */}
      {migrationMissing && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex items-start gap-3.5">
          <Database className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h2 className="text-sm font-bold text-amber-950">
              Database Migration Required for Centralized Notifications
            </h2>
            <p className="text-xs text-amber-900 leading-relaxed">
              The notification and task tables have not been provisioned in Supabase yet. Run{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-100 font-mono text-[11px]">
                supabase/migrations/006_abcma_admin_notifications_tasks.sql
              </code>{' '}
              in your Supabase SQL Editor, then click Refresh.
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Total Unread
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{unreadCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Pending review in inbox</div>
        </div>
        <div className="bg-white rounded-2xl border border-rose-200 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wide">
            Urgent Alerts
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{urgentUnreadCount}</div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">Security &amp; overdue alerts</div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
            Task Alerts
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{taskUnreadCount}</div>
          <div className="text-[11px] text-amber-700/80 mt-0.5">Assignments &amp; approvals</div>
        </div>
        <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
            Co-Admin &amp; Site Updates
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{coAdminUnreadCount}</div>
          <div className="text-[11px] text-blue-700/80 mt-0.5">Publishing &amp; CMS activity</div>
        </div>
      </div>

      {/* Preferences Panel */}
      {showPreferences && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Administrator Notification Preferences
              </h2>
              <p className="text-xs text-slate-500">
                Choose which notification categories appear in your dashboard feed.
              </p>
            </div>
            {hiddenByPreferencesCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                {hiddenByPreferencesCount} muted by current filters
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <label className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-900">Task &amp; Approval Notifications</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Task assignments, approaching deadlines, completions, and review requests.
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.receive_task_notifications}
                onChange={(e) =>
                  void handleTogglePreference('receive_task_notifications', e.target.checked)
                }
                className="w-4 h-4 accent-emerald-700 mt-0.5 cursor-pointer"
              />
            </label>

            <label className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-900">Co-Admin Activity Updates</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Changes by other administrators across staff, departments, accounts, and drafts.
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.receive_co_admin_activities}
                onChange={(e) =>
                  void handleTogglePreference('receive_co_admin_activities', e.target.checked)
                }
                className="w-4 h-4 accent-emerald-700 mt-0.5 cursor-pointer"
              />
            </label>

            <label className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-900">Publishing &amp; Website Updates</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Published news, projects, announcements, pages, and website settings updates.
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.receive_publishing_notifications}
                onChange={(e) =>
                  void handleTogglePreference('receive_publishing_notifications', e.target.checked)
                }
                className="w-4 h-4 accent-emerald-700 mt-0.5 cursor-pointer"
              />
            </label>

            <label className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-slate-900">General System Alerts</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Informational system notices (does not suppress urgent alerts).
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.receive_system_alerts}
                onChange={(e) =>
                  void handleTogglePreference('receive_system_alerts', e.target.checked)
                }
                className="w-4 h-4 accent-emerald-700 mt-0.5 cursor-pointer"
              />
            </label>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200">
            <Lock className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-rose-900 leading-relaxed">
              <strong>Security Policy Enforced:</strong> Urgent security alerts (account lockouts, blocked access, failed reauthentication) and urgent overdue alerts are always delivered regardless of personal category preferences.
            </div>
          </div>
        </div>
      )}

      {/* Main Notification Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Category Tabs */}
        <div className="px-4 pt-3 border-b border-slate-200 flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const tabUnread =
              tab.id === 'all'
                ? unreadCount
                : tab.id === 'unread'
                ? unreadCount
                : notifications.filter((n) => !n.is_read && n.category === tab.id).length;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                  active
                    ? 'border-emerald-800 text-emerald-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {tabUnread > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tabUnread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Filters Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by title, administrator, or section..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as 'all' | AdminNotificationPriority)
              }
              aria-label="Filter by priority"
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent Only</option>
              <option value="high">High Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateRangeFilter)}
              aria-label="Filter by date range"
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">Any Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="divide-y divide-slate-100">
          {filteredNotifications.length === 0 ? (
            <div className="py-14 px-6 text-center space-y-2">
              <Bell className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No matching notifications</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try clearing your search or priority filters, or check back as tasks and website activities occur.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const badge = getBadgeStyles(notif);
              const unread = !notif.is_read;
              const targetSection = parseAdminSectionFromActionUrl(notif.action_url);

              return (
                <div
                  key={notif.id}
                  className={`p-4 sm:p-5 ${badge.cardAccent} transition-colors ${
                    unread ? 'bg-slate-50/90' : 'bg-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${badge.iconBox}`}
                      >
                        {renderCategoryIcon(notif)}
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {unread && (
                            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                          )}
                          <h3
                            className={`text-sm ${
                              unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                            }`}
                          >
                            {notif.title}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${badge.priorityBadge}`}
                          >
                            {notif.priority === 'urgent' ? 'Urgent' : badge.toneLabel}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                            {notif.audience_type === 'personal'
                              ? 'Direct to You'
                              : notif.audience_type === 'role'
                              ? `Role: ${(notif.recipient_role || '').replace('_', ' ')}`
                              : 'All Admins'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{notif.description}</p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                          <span>
                            Actor: <strong className="text-slate-700">{notif.actor_name}</strong>
                          </span>
                          {notif.affected_section && (
                            <span>
                              Section:{' '}
                              <strong className="text-slate-700">{notif.affected_section}</strong>
                            </span>
                          )}
                          <span title={formatNotificationDateTime(notif.created_at)}>
                            {formatRelativeNotificationTime(notif.created_at)} ·{' '}
                            {formatNotificationDateTime(notif.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleOpenDestination(notif)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                      >
                        <span>
                          {targetSection === 'notifications' ? 'View Details' : 'Open Section'}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                      </button>

                      {unread ? (
                        <button
                          type="button"
                          onClick={() => void handleMarkSingleRead(notif.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark as Read</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 px-2">Read</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
