import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AdminDirectoryMember,
  AdminNotification,
  AdminNotificationCategory,
  AdminNotificationPreferences,
  AdminNotificationPriority,
  AdminSectionId,
  AdminTask,
  AdminTaskStatus,
  AdminTaskType,
} from '../types/cms';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { sanitizePlainText, toSafeErrorMessage } from '../utils/security';
import {
  canAdminViewNotificationClientGuard,
  dedupeAndSortNotifications,
  isMigrationMissingError,
  shouldDisplayNotificationForPreferences,
} from '../utils/notifications';

export interface CreateTaskInput {
  title: string;
  description: string;
  task_type: AdminTaskType;
  priority: AdminNotificationPriority;
  status?: AdminTaskStatus;
  due_at: string | null;
  assigned_to: string | null;
  action_section: AdminSectionId;
  related_entity_type?: string;
  related_entity_id?: string;
  related_entity_label?: string;
}

export interface UpdateTaskPatch {
  title?: string;
  description?: string;
  task_type?: AdminTaskType;
  status?: AdminTaskStatus;
  priority?: AdminNotificationPriority;
  due_at?: string | null;
  assigned_to?: string | null;
  action_section?: AdminSectionId;
}

interface NotificationsContextValue {
  notifications: AdminNotification[];
  allEligibleNotifications: AdminNotification[];
  unreadCount: number;
  hiddenByPreferencesCount: number;
  tasks: AdminTask[];
  adminDirectory: AdminDirectoryMember[];
  preferences: AdminNotificationPreferences;
  loading: boolean;
  migrationMissing: boolean;
  realtimeConnected: boolean;
  lastSyncedAt: string | null;
  refreshAll: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<{ ok: boolean; error?: string }>;
  markAllAsRead: (category?: AdminNotificationCategory | null) => Promise<{ ok: boolean; error?: string }>;
  updatePreferences: (
    patch: Partial<
      Pick<
        AdminNotificationPreferences,
        | 'receive_task_notifications'
        | 'receive_co_admin_activities'
        | 'receive_publishing_notifications'
        | 'receive_system_alerts'
      >
    >
  ) => Promise<{ ok: boolean; error?: string }>;
  createTask: (input: CreateTaskInput) => Promise<{ ok: boolean; error?: string; task?: AdminTask }>;
  updateTask: (taskId: string, patch: UpdateTaskPatch) => Promise<{ ok: boolean; error?: string }>;
  deleteTask: (taskId: string) => Promise<{ ok: boolean; error?: string }>;
}

const DEFAULT_PREFERENCES = (adminId = ''): AdminNotificationPreferences => ({
  admin_id: adminId,
  receive_task_notifications: true,
  receive_co_admin_activities: true,
  receive_publishing_notifications: true,
  receive_system_alerts: true,
  updated_at: new Date().toISOString(),
});

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDashboardAccessGranted, adminProfile, roleSlug } = useAuth();

  const [rawNotifications, setRawNotifications] = useState<AdminNotification[]>([]);
  const [readMap, setReadMap] = useState<Record<string, string>>({});
  const [preferences, setPreferences] = useState<AdminNotificationPreferences>(() =>
    DEFAULT_PREFERENCES('')
  );
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [adminDirectory, setAdminDirectory] = useState<AdminDirectoryMember[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [migrationMissing, setMigrationMissing] = useState<boolean>(false);
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);
  const adminId = adminProfile?.id ?? null;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadAllData = useCallback(async () => {
    if (!supabase || !isDashboardAccessGranted || !adminId) {
      return;
    }

    setLoading(true);
    try {
      // Trigger server-side deadline & overdue sweep first (idempotent)
      const syncRes = await supabase.rpc('sync_task_deadline_notifications');
      if (syncRes.error && isMigrationMissingError(syncRes.error)) {
        if (mountedRef.current) {
          setMigrationMissing(true);
          setLoading(false);
        }
        return;
      }

      const [notifRes, readsRes, prefsRes, tasksRes, dirRes] = await Promise.all([
        supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('admin_notification_reads')
          .select('notification_id, read_at')
          .eq('admin_id', adminId),
        supabase
          .from('admin_notification_preferences')
          .select('*')
          .eq('admin_id', adminId)
          .maybeSingle(),
        supabase
          .from('admin_tasks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.rpc('list_active_admin_directory'),
      ]);

      const anyMissing = [notifRes.error, readsRes.error, prefsRes.error, tasksRes.error].some(
        (err) => isMigrationMissingError(err)
      );

      if (anyMissing) {
        if (mountedRef.current) {
          setMigrationMissing(true);
          setLoading(false);
        }
        return;
      }

      if (!mountedRef.current) return;

      setMigrationMissing(false);

      if (!notifRes.error && Array.isArray(notifRes.data)) {
        setRawNotifications(dedupeAndSortNotifications(notifRes.data as AdminNotification[]));
      }

      if (!readsRes.error && Array.isArray(readsRes.data)) {
        const nextReads: Record<string, string> = {};
        for (const row of readsRes.data as Array<{ notification_id: string; read_at: string }>) {
          nextReads[row.notification_id] = row.read_at;
        }
        setReadMap(nextReads);
      }

      if (!prefsRes.error) {
        if (prefsRes.data) {
          setPreferences(prefsRes.data as AdminNotificationPreferences);
        } else {
          const initialPrefs = DEFAULT_PREFERENCES(adminId);
          setPreferences(initialPrefs);
          void supabase
            .from('admin_notification_preferences')
            .upsert(
              {
                admin_id: adminId,
                receive_task_notifications: true,
                receive_co_admin_activities: true,
                receive_publishing_notifications: true,
                receive_system_alerts: true,
              },
              { onConflict: 'admin_id' }
            );
        }
      }

      if (!tasksRes.error && Array.isArray(tasksRes.data)) {
        setTasks(tasksRes.data as AdminTask[]);
      }

      if (!dirRes.error && Array.isArray(dirRes.data)) {
        setAdminDirectory(dirRes.data as AdminDirectoryMember[]);
      }

      setLastSyncedAt(new Date().toISOString());
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [isDashboardAccessGranted, adminId]);

  useEffect(() => {
    if (!isDashboardAccessGranted || !adminId || !supabase) {
      setRawNotifications([]);
      setReadMap({});
      setTasks([]);
      setAdminDirectory([]);
      setRealtimeConnected(false);
      return;
    }

    void loadAllData();

    const sb = supabase;
    const channel = sb
      .channel(`abcma_admin_notifications_${adminId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        (payload) => {
          const incoming = payload.new as AdminNotification;
          if (!incoming?.id) return;
          if (!canAdminViewNotificationClientGuard(incoming, adminId, roleSlug)) return;

          setRawNotifications((prev) => dedupeAndSortNotifications([incoming, ...prev]).slice(0, 200));
          setLastSyncedAt(new Date().toISOString());
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notification_reads',
          filter: `admin_id=eq.${adminId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as { notification_id?: string; read_at?: string };
            if (row?.notification_id) {
              setReadMap((prev) => ({
                ...prev,
                [row.notification_id as string]: row.read_at || new Date().toISOString(),
              }));
            }
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as { notification_id?: string };
            if (oldRow?.notification_id) {
              setReadMap((prev) => {
                const next = { ...prev };
                delete next[oldRow.notification_id as string];
                return next;
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const created = payload.new as AdminTask;
            if (!created?.id) return;
            setTasks((prev) => {
              const exists = prev.some((t) => t.id === created.id);
              const merged = exists
                ? prev.map((t) => (t.id === created.id ? created : t))
                : [created, ...prev];
              return merged.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as AdminTask;
            if (!updated?.id) return;
            setTasks((prev) => {
              const exists = prev.some((t) => t.id === updated.id);
              return exists ? prev.map((t) => (t.id === updated.id ? updated : t)) : [updated, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id?: string };
            if (deleted?.id) {
              setTasks((prev) => prev.filter((t) => t.id !== deleted.id));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_notification_preferences',
          filter: `admin_id=eq.${adminId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const nextPrefs = payload.new as AdminNotificationPreferences;
            if (nextPrefs?.admin_id) {
              setPreferences(nextPrefs);
            }
          }
        }
      )
      .subscribe((status) => {
        if (mountedRef.current) {
          setRealtimeConnected(status === 'SUBSCRIBED');
        }
      });

    // Periodic server-side check every 5 minutes for tasks crossing approaching (24h) or overdue threshold
    const deadlineInterval = window.setInterval(() => {
      if (!migrationMissing && sb) {
        void sb.rpc('sync_task_deadline_notifications');
      }
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(deadlineInterval);
      setRealtimeConnected(false);
      void sb.removeChannel(channel);
    };
  }, [isDashboardAccessGranted, adminId, roleSlug, loadAllData, migrationMissing]);

  const allEligibleNotifications = useMemo(() => {
    return rawNotifications
      .filter((n) => canAdminViewNotificationClientGuard(n, adminId, roleSlug))
      .map((n) => ({
        ...n,
        is_read: Boolean(readMap[n.id]),
        read_at: readMap[n.id] ?? null,
      }));
  }, [rawNotifications, readMap, adminId, roleSlug]);

  const notifications = useMemo(() => {
    return allEligibleNotifications.filter((n) =>
      shouldDisplayNotificationForPreferences(n, preferences)
    );
  }, [allEligibleNotifications, preferences]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const hiddenByPreferencesCount = useMemo(
    () => Math.max(0, allEligibleNotifications.length - notifications.length),
    [allEligibleNotifications.length, notifications.length]
  );

  const markAsRead = useCallback(
    async (notificationId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!supabase || !adminId) {
        return { ok: false, error: 'Not authenticated.' };
      }
      if (readMap[notificationId]) {
        return { ok: true };
      }

      const nowIso = new Date().toISOString();
      setReadMap((prev) => ({ ...prev, [notificationId]: nowIso }));

      const { error } = await supabase.from('admin_notification_reads').upsert(
        {
          notification_id: notificationId,
          admin_id: adminId,
          read_at: nowIso,
        },
        { onConflict: 'notification_id,admin_id' }
      );

      if (error) {
        setReadMap((prev) => {
          const next = { ...prev };
          delete next[notificationId];
          return next;
        });
        return {
          ok: false,
          error: toSafeErrorMessage(error.message, 'Unable to mark notification as read.'),
        };
      }
      return { ok: true };
    },
    [adminId, readMap]
  );

  const markAllAsRead = useCallback(
    async (
      category: AdminNotificationCategory | null = null
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!supabase || !adminId) {
        return { ok: false, error: 'Not authenticated.' };
      }

      const nowIso = new Date().toISOString();
      const targetIds = allEligibleNotifications
        .filter((n) => !n.is_read && (!category || n.category === category))
        .map((n) => n.id);

      if (targetIds.length === 0) {
        return { ok: true };
      }

      const prevSnapshot = { ...readMap };
      setReadMap((prev) => {
        const next = { ...prev };
        for (const id of targetIds) {
          next[id] = nowIso;
        }
        return next;
      });

      const { error } = await supabase.rpc('mark_all_notifications_read', {
        p_category: category || null,
      });

      if (error) {
        setReadMap(prevSnapshot);
        return {
          ok: false,
          error: toSafeErrorMessage(error.message, 'Unable to mark notifications as read.'),
        };
      }

      return { ok: true };
    },
    [adminId, allEligibleNotifications, readMap]
  );

  const updatePreferences = useCallback(
    async (
      patch: Partial<
        Pick<
          AdminNotificationPreferences,
          | 'receive_task_notifications'
          | 'receive_co_admin_activities'
          | 'receive_publishing_notifications'
          | 'receive_system_alerts'
        >
      >
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!supabase || !adminId) {
        return { ok: false, error: 'Not authenticated.' };
      }

      const next: AdminNotificationPreferences = {
        ...preferences,
        ...patch,
        admin_id: adminId,
        updated_at: new Date().toISOString(),
      };

      const prevSnapshot = preferences;
      setPreferences(next);

      const { error } = await supabase.from('admin_notification_preferences').upsert(
        {
          admin_id: adminId,
          receive_task_notifications: next.receive_task_notifications,
          receive_co_admin_activities: next.receive_co_admin_activities,
          receive_publishing_notifications: next.receive_publishing_notifications,
          receive_system_alerts: next.receive_system_alerts,
        },
        { onConflict: 'admin_id' }
      );

      if (error) {
        setPreferences(prevSnapshot);
        return {
          ok: false,
          error: toSafeErrorMessage(error.message, 'Unable to save notification preferences.'),
        };
      }
      return { ok: true };
    },
    [adminId, preferences]
  );

  const createTask = useCallback(
    async (
      input: CreateTaskInput
    ): Promise<{ ok: boolean; error?: string; task?: AdminTask }> => {
      if (!supabase || !adminId) {
        return { ok: false, error: 'Not authenticated.' };
      }

      const cleanTitle = sanitizePlainText(input.title, 160);
      if (!cleanTitle) {
        return { ok: false, error: 'Task title is required.' };
      }

      const payload = {
        title: cleanTitle,
        description: sanitizePlainText(input.description, 1500),
        task_type: input.task_type,
        status: input.status || (input.task_type === 'approval_request' ? 'needs_review' : 'pending'),
        priority: input.priority,
        due_at: input.due_at ? new Date(input.due_at).toISOString() : null,
        assigned_to: input.assigned_to || null,
        created_by: adminId,
        action_section: input.action_section || 'tasks',
        related_entity_type: input.related_entity_type || (input.action_section !== 'tasks' ? input.action_section : ''),
        related_entity_id: input.related_entity_id || '',
        related_entity_label: sanitizePlainText(input.related_entity_label || cleanTitle, 160),
      };

      const { data, error } = await supabase
        .from('admin_tasks')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        return {
          ok: false,
          error: toSafeErrorMessage(error.message, 'Unable to create administrative task.'),
        };
      }

      const created = data as AdminTask;
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === created.id);
        return exists ? prev : [created, ...prev];
      });

      // Immediately sync deadline notifications in case the admin created a due-soon task
      void supabase.rpc('sync_task_deadline_notifications');

      return { ok: true, task: created };
    },
    [adminId]
  );

  const updateTask = useCallback(
    async (taskId: string, patch: UpdateTaskPatch): Promise<{ ok: boolean; error?: string }> => {
      if (!supabase || !adminId) {
        return { ok: false, error: 'Not authenticated.' };
      }

      const cleanPatch: Record<string, unknown> = {};
      if (patch.title !== undefined) cleanPatch.title = sanitizePlainText(patch.title, 160);
      if (patch.description !== undefined) {
        cleanPatch.description = sanitizePlainText(patch.description, 1500);
      }
      if (patch.task_type !== undefined) cleanPatch.task_type = patch.task_type;
      if (patch.status !== undefined) cleanPatch.status = patch.status;
      if (patch.priority !== undefined) cleanPatch.priority = patch.priority;
      if (patch.due_at !== undefined) {
        cleanPatch.due_at = patch.due_at ? new Date(patch.due_at).toISOString() : null;
      }
      if (patch.assigned_to !== undefined) cleanPatch.assigned_to = patch.assigned_to || null;
      if (patch.action_section !== undefined) {
        cleanPatch.action_section = patch.action_section;
        cleanPatch.related_entity_type =
          patch.action_section !== 'tasks' ? patch.action_section : '';
      }

      const { data, error } = await supabase
        .from('admin_tasks')
        .update(cleanPatch)
        .eq('id', taskId)
        .select('*')
        .single();

      if (error) {
        return {
          ok: false,
          error: toSafeErrorMessage(error.message, 'Unable to update task.'),
        };
      }

      const updated = data as AdminTask;
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      void supabase.rpc('sync_task_deadline_notifications');

      return { ok: true };
    },
    [adminId]
  );

  const deleteTask = useCallback(
    async (taskId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!supabase || !adminId) {
        return { ok: false, error: 'Not authenticated.' };
      }

      const { error } = await supabase.from('admin_tasks').delete().eq('id', taskId);
      if (error) {
        return {
          ok: false,
          error: toSafeErrorMessage(error.message, 'Unable to delete task.'),
        };
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      return { ok: true };
    },
    [adminId]
  );

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        allEligibleNotifications,
        unreadCount,
        hiddenByPreferencesCount,
        tasks,
        adminDirectory,
        preferences,
        loading,
        migrationMissing,
        realtimeConnected,
        lastSyncedAt,
        refreshAll: loadAllData,
        markAsRead,
        markAllAsRead,
        updatePreferences,
        createTask,
        updateTask,
        deleteTask,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside NotificationsProvider');
  }
  return ctx;
}
