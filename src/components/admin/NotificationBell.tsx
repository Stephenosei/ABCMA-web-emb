import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Activity,
  Globe,
  ShieldAlert,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import { AdminNotification, AdminSectionId } from '../../types/cms';
import { useNotifications } from '../../context/NotificationsContext';
import {
  formatRelativeNotificationTime,
  getNotificationVisualTone,
  parseAdminSectionFromActionUrl,
} from '../../utils/notifications';

interface NotificationBellProps {
  onNavigateSection: (section: AdminSectionId) => void;
}

function renderToneIcon(notif: AdminNotification) {
  const tone = getNotificationVisualTone(notif);
  if (tone === 'urgent') {
    return notif.category === 'system_alert' ? (
      <ShieldAlert className="w-4 h-4 text-rose-600" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-rose-600" />
    );
  }
  if (tone === 'completed') {
    return <CheckCircle2 className="w-4 h-4 text-emerald-700" />;
  }
  if (tone === 'pending') {
    return <Clock className="w-4 h-4 text-amber-700" />;
  }
  if (notif.category === 'website_update') {
    return <Globe className="w-4 h-4 text-blue-700" />;
  }
  return <Activity className="w-4 h-4 text-blue-700" />;
}

function getToneClasses(notif: AdminNotification) {
  const tone = getNotificationVisualTone(notif);
  switch (tone) {
    case 'urgent':
      return {
        iconBox: 'bg-rose-50 border-rose-200',
        pill: 'bg-rose-100 text-rose-800 border-rose-200',
        border: 'border-l-rose-600',
      };
    case 'completed':
      return {
        iconBox: 'bg-emerald-50 border-emerald-200',
        pill: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        border: 'border-l-emerald-600',
      };
    case 'pending':
      return {
        iconBox: 'bg-amber-50 border-amber-200',
        pill: 'bg-amber-100 text-amber-800 border-amber-200',
        border: 'border-l-amber-500',
      };
    default:
      return {
        iconBox: 'bg-blue-50 border-blue-200',
        pill: 'bg-blue-100 text-blue-800 border-blue-200',
        border: 'border-l-blue-600',
      };
  }
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigateSection }) => {
  const { notifications, unreadCount, migrationMissing, markAsRead, markAllAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const latestItems = notifications.slice(0, 8);

  const handleOpenNotification = async (notif: AdminNotification) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    setOpen(false);
    onNavigateSection(parseAdminSectionFromActionUrl(notif.action_url));
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute right-3 sm:right-0 top-14 sm:top-full sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-[25rem] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  disabled={markingAll}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{markingAll ? 'Marking...' : 'Mark All Read'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[24rem] overflow-y-auto divide-y divide-slate-100">
            {migrationMissing ? (
              <div className="p-5 text-center space-y-2">
                <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-800">
                  Notification System Setup Pending
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Apply migration 006 in Supabase to activate real-time task and co-admin alerts.
                </p>
              </div>
            ) : latestItems.length === 0 ? (
              <div className="p-6 text-center space-y-1.5">
                <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No notifications yet</p>
                <p className="text-[11px] text-slate-500">
                  Task assignments, approvals, and co-admin updates will appear here in real time.
                </p>
              </div>
            ) : (
              latestItems.map((notif) => {
                const styles = getToneClasses(notif);
                const unread = !notif.is_read;
                return (
                  <div
                    key={notif.id}
                    onClick={() => void handleOpenNotification(notif)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        void handleOpenNotification(notif);
                      }
                    }}
                    className={`p-3.5 border-l-4 ${styles.border} transition-colors cursor-pointer ${
                      unread ? 'bg-slate-50/90 hover:bg-slate-100/80' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${styles.iconBox}`}
                      >
                        {renderToneIcon(notif)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-xs leading-snug ${
                              unread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                            }`}
                          >
                            {notif.title}
                          </p>
                          {unread && (
                            <span
                              className="w-2 h-2 rounded-full bg-rose-600 shrink-0 mt-1"
                              title="Unread notification"
                            />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {notif.description}
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border capitalize ${styles.pill}`}
                            >
                              {notif.category.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {formatRelativeNotificationTime(notif.created_at)}
                            </span>
                          </div>
                          {unread && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void markAsRead(notif.id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer shrink-0"
                            >
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>Mark Read</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3.5 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onNavigateSection('tasks');
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Tasks</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onNavigateSection('notifications');
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
            >
              <span>View All Notifications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
