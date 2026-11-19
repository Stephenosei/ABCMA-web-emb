import {
  AdminNotification,
  AdminNotificationPreferences,
  AdminRoleSlug,
  AdminSectionId,
} from '../types/cms';

export type NotificationVisualTone = 'urgent' | 'pending' | 'completed' | 'update';

const VALID_ADMIN_SECTIONS: ReadonlySet<string> = new Set([
  'overview',
  'notifications',
  'tasks',
  'pages',
  'news',
  'announcements',
  'departments',
  'staff',
  'projects',
  'events',
  'gallery',
  'documents',
  'homepage',
  'navigation',
  'contact',
  'enquiries',
  'settings',
  'media',
  'security',
  'admins',
  'logs',
]);

/**
 * Resolve a stored notification action_url (e.g. '/admin/projects') to an internal AdminSectionId.
 */
export function parseAdminSectionFromActionUrl(actionUrl?: string | null): AdminSectionId {
  if (!actionUrl || typeof actionUrl !== 'string') return 'notifications';
  const cleaned = actionUrl.trim().replace(/\/+$/, '');
  if (cleaned === '/admin' || cleaned === '/admin/overview') return 'overview';
  if (cleaned.startsWith('/admin/')) {
    const candidate = cleaned.slice('/admin/'.length).split('/')[0];
    if (VALID_ADMIN_SECTIONS.has(candidate)) {
      return candidate as AdminSectionId;
    }
  }
  return 'notifications';
}

/**
 * Client-side defense-in-depth mirror of Supabase RLS for notification visibility.
 */
export function canAdminViewNotificationClientGuard(
  notif: AdminNotification,
  adminId: string | null,
  roleSlug: AdminRoleSlug | null
): boolean {
  if (!adminId || !roleSlug) return false;
  if (notif.audience_type === 'all_admins') return true;
  if (notif.audience_type === 'personal') return notif.recipient_id === adminId;
  if (notif.audience_type === 'role') return notif.recipient_role === roleSlug;
  return false;
}

/**
 * Filter notifications by administrator preferences.
 * CRITICAL POLICY: Urgent notifications (security alerts, overdue urgent tasks, critical alerts)
 * can NEVER be silently disabled by user preferences.
 */
export function shouldDisplayNotificationForPreferences(
  notif: AdminNotification,
  prefs: AdminNotificationPreferences | null | undefined
): boolean {
  if (notif.priority === 'urgent') {
    return true;
  }
  if (notif.category === 'system_alert' && notif.event_type === 'security_alert') {
    return true;
  }
  if (!prefs) return true;

  switch (notif.category) {
    case 'task':
      return prefs.receive_task_notifications;
    case 'co_admin_activity':
      return prefs.receive_co_admin_activities;
    case 'website_update':
      return prefs.receive_publishing_notifications;
    case 'system_alert':
      return prefs.receive_system_alerts;
    default:
      return true;
  }
}

/**
 * Visual color & status tone mapping:
 * - Red (urgent): urgent priority or security alerts
 * - Green (completed): completed tasks
 * - Orange/Amber (pending): pending, approaching, overdue, approval requested, or task updates
 * - Blue (update): website updates, co-admin activity, informational alerts
 */
export function getNotificationVisualTone(notif: AdminNotification): NotificationVisualTone {
  if (notif.priority === 'urgent' || notif.event_type === 'security_alert') {
    return 'urgent';
  }
  if (notif.event_type === 'task_completed') {
    return 'completed';
  }
  if (notif.category === 'task') {
    return 'pending';
  }
  return 'update';
}

/**
 * Detect Supabase / PostgREST errors indicating migration 006 tables have not been created yet.
 */
export function isMigrationMissingError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const maybeErr = err as { code?: string; message?: string; details?: string };
  const code = String(maybeErr.code || '').toUpperCase();
  const text = `${maybeErr.message || ''} ${maybeErr.details || ''}`.toLowerCase();

  if (code === 'PGRST205' || code === '42P01' || code === '42883') return true;
  return (
    text.includes('could not find the table') ||
    text.includes('schema cache') ||
    (text.includes('relation') && text.includes('does not exist'))
  );
}

/**
 * Deduplicate notifications by id and sort newest first.
 */
export function dedupeAndSortNotifications(items: AdminNotification[]): AdminNotification[] {
  const map = new Map<string, AdminNotification>();
  for (const item of items) {
    if (!item?.id) continue;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else {
      map.set(item.id, {
        ...existing,
        ...item,
        is_read: item.is_read ?? existing.is_read,
        read_at: item.read_at ?? existing.read_at,
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function formatRelativeNotificationTime(isoTimestamp: string, nowMs = Date.now()): string {
  const ts = new Date(isoTimestamp).getTime();
  if (Number.isNaN(ts)) return 'Just now';

  const diffSec = Math.max(0, Math.floor((nowMs - ts) / 1000));
  if (diffSec < 60) return 'Just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(isoTimestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatNotificationDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
