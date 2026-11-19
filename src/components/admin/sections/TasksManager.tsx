import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  ExternalLink,
  X,
  Database,
  UserCheck,
} from 'lucide-react';
import {
  AdminNotificationPriority,
  AdminSectionId,
  AdminTask,
  AdminTaskStatus,
  AdminTaskType,
} from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationsContext';
import { ConfirmDialog } from '../ConfirmDialog';
import { formatNotificationDateTime } from '../../../utils/notifications';

interface TasksManagerProps {
  onNavigateSection: (section: AdminSectionId) => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

type TaskFilterTab =
  | 'all'
  | 'mine'
  | 'pending_overdue'
  | 'needs_review'
  | 'completed'
  | 'created_by_me';

const TASK_TYPE_OPTIONS: Array<{ value: AdminTaskType; label: string }> = [
  { value: 'general', label: 'General Task' },
  { value: 'approval_request', label: 'Approval Request' },
  { value: 'content_review', label: 'Content Review' },
  { value: 'project_action', label: 'Project Action' },
  { value: 'system_maintenance', label: 'System Maintenance' },
];

const TASK_STATUS_OPTIONS: Array<{ value: AdminTaskStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'needs_review', label: 'Needs Review / Approval' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS: Array<{ value: AdminNotificationPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const LINKED_SECTION_OPTIONS: Array<{ value: AdminSectionId; label: string }> = [
  { value: 'tasks', label: 'Tasks & Approvals' },
  { value: 'projects', label: 'Projects' },
  { value: 'news', label: 'News and Articles' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'pages', label: 'Website Pages' },
  { value: 'documents', label: 'Documents and Downloads' },
  { value: 'events', label: 'Events and Activities' },
  { value: 'enquiries', label: 'Contact Enquiries' },
  { value: 'settings', label: 'Website Settings' },
];

function isTaskOverdue(task: AdminTask): boolean {
  if (!task.due_at) return false;
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  return new Date(task.due_at).getTime() < Date.now();
}

function isTaskApproaching(task: AdminTask): boolean {
  if (!task.due_at) return false;
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  const diff = new Date(task.due_at).getTime() - Date.now();
  return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
}

function toLocalDatetimeInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export const TasksManager: React.FC<TasksManagerProps> = ({ onNavigateSection, notify }) => {
  const { adminProfile, isSuperAdmin } = useAuth();
  const {
    tasks,
    adminDirectory,
    migrationMissing,
    createTask,
    updateTask,
    deleteTask,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<TaskFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | AdminNotificationPriority>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<AdminTask | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<AdminTaskType>('general');
  const [priority, setPriority] = useState<AdminNotificationPriority>('normal');
  const [status, setStatus] = useState<AdminTaskStatus>('pending');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [actionSection, setActionSection] = useState<AdminSectionId>('tasks');

  const [deleteTarget, setDeleteTarget] = useState<AdminTask | null>(null);
  const [deleting, setDeleting] = useState(false);

  const adminNameLookup = useMemo(() => {
    const map: Record<string, { full_name: string; role_name: string }> = {};
    for (const member of adminDirectory) {
      map[member.id] = { full_name: member.full_name, role_name: member.role_name };
    }
    return map;
  }, [adminDirectory]);

  const counts = useMemo(() => {
    let open = 0;
    let attention = 0;
    let approval = 0;
    let completed = 0;

    for (const t of tasks) {
      if (t.status === 'completed') {
        completed++;
      } else if (t.status !== 'cancelled') {
        open++;
        if (isTaskOverdue(t) || isTaskApproaching(t) || t.priority === 'urgent') {
          attention++;
        }
        if (t.status === 'needs_review' || t.task_type === 'approval_request') {
          approval++;
        }
      }
    }
    return { open, attention, approval, completed };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (activeTab === 'mine' && t.assigned_to !== adminProfile?.id) return false;
      if (activeTab === 'created_by_me' && t.created_by !== adminProfile?.id) return false;
      if (
        activeTab === 'needs_review' &&
        t.status !== 'needs_review' &&
        t.task_type !== 'approval_request'
      ) {
        return false;
      }
      if (activeTab === 'completed' && t.status !== 'completed') return false;
      if (
        activeTab === 'pending_overdue' &&
        (t.status === 'completed' ||
          t.status === 'cancelled' ||
          (t.status !== 'pending' && !isTaskOverdue(t) && !isTaskApproaching(t)))
      ) {
        return false;
      }

      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      if (q) {
        const assigneeName = t.assigned_to ? adminNameLookup[t.assigned_to]?.full_name || '' : '';
        const haystack = `${t.title} ${t.description} ${assigneeName} ${t.action_section}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [tasks, activeTab, priorityFilter, searchQuery, adminProfile?.id, adminNameLookup]);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setTaskType('general');
    setPriority('normal');
    setStatus('pending');
    setAssignedTo('');
    setDueAt('');
    setActionSection('tasks');
    setModalOpen(true);
  };

  const openEditModal = (task: AdminTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setTaskType(task.task_type);
    setPriority(task.priority);
    setStatus(task.status);
    setAssignedTo(task.assigned_to || '');
    setDueAt(toLocalDatetimeInputValue(task.due_at));
    setActionSection((task.action_section as AdminSectionId) || 'tasks');
    setModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      notify('Enter a task title.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingTask) {
        const res = await updateTask(editingTask.id, {
          title: title.trim(),
          description: description.trim(),
          task_type: taskType,
          priority,
          status,
          assigned_to: assignedTo || null,
          due_at: dueAt ? new Date(dueAt).toISOString() : null,
          action_section: actionSection,
        });
        if (!res.ok) {
          notify(res.error || 'Could not update task.', 'error');
          return;
        }
        notify('Task updated and notifications dispatched.');
      } else {
        const res = await createTask({
          title: title.trim(),
          description: description.trim(),
          task_type: taskType,
          priority,
          status: taskType === 'approval_request' ? 'needs_review' : status,
          assigned_to: assignedTo || null,
          due_at: dueAt ? new Date(dueAt).toISOString() : null,
          action_section: actionSection,
        });
        if (!res.ok) {
          notify(res.error || 'Could not create task.', 'error');
          return;
        }
        notify('Task created and administrator notifications sent.');
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusChange = async (task: AdminTask, nextStatus: AdminTaskStatus) => {
    const res = await updateTask(task.id, { status: nextStatus });
    if (!res.ok) {
      notify(res.error || 'Could not update task status.', 'error');
    } else {
      notify(
        nextStatus === 'completed'
          ? 'Task marked as completed.'
          : 'Task status updated.'
      );
    }
  };

  const handleQuickPriorityChange = async (
    task: AdminTask,
    nextPriority: AdminNotificationPriority
  ) => {
    const res = await updateTask(task.id, { priority: nextPriority });
    if (!res.ok) {
      notify(res.error || 'Could not update task priority.', 'error');
    } else {
      notify('Task priority updated.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteTask(deleteTarget.id);
      if (!res.ok) {
        notify(res.error || 'Unable to delete task.', 'error');
      } else {
        notify('Task removed.');
      }
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const canDeleteTask = (task: AdminTask) =>
    isSuperAdmin ||
    (task.created_by === adminProfile?.id &&
      (task.status === 'pending' || task.status === 'cancelled'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Admin Tasks &amp; Approvals
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Assign administrative tasks, request editorial approvals, and track deadlines with automatic real-time notifications.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={migrationMissing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer disabled:opacity-50 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Task / Approval Request</span>
        </button>
      </div>

      {migrationMissing && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex items-start gap-3.5">
          <Database className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-amber-950">Migration 006 Required</h2>
            <p className="text-xs text-amber-900">
              Run{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-100 font-mono text-[11px]">
                supabase/migrations/006_abcma_admin_notifications_tasks.sql
              </code>{' '}
              to enable task assignment and approval workflows.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Open Tasks
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{counts.open}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active across workflow</div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
            Deadline / Urgent
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{counts.attention}</div>
          <div className="text-[11px] text-amber-700/80 mt-0.5">Overdue, due soon or urgent</div>
        </div>
        <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
            Needs Approval
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{counts.approval}</div>
          <div className="text-[11px] text-blue-700/80 mt-0.5">Awaiting review sign-off</div>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
            Completed
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{counts.completed}</div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5">Finished tasks</div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter Tabs */}
        <div className="px-4 pt-3 border-b border-slate-200 flex items-center gap-1 overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All Visible' },
              { id: 'mine', label: 'Assigned to Me' },
              { id: 'pending_overdue', label: 'Pending & Overdue' },
              { id: 'needs_review', label: 'Needs Approval' },
              { id: 'completed', label: 'Completed' },
              { id: 'created_by_me', label: 'Created by Me' },
            ] as Array<{ id: TaskFilterTab; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-800 text-emerald-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Priority */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title, assignee, or section..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as 'all' | AdminNotificationPriority)
            }
            aria-label="Filter tasks by priority"
            className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Task List */}
        <div className="divide-y divide-slate-100">
          {filteredTasks.length === 0 ? (
            <div className="py-14 px-6 text-center space-y-2">
              <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No tasks match your filter</p>
              <p className="text-xs text-slate-500">
                Create a new task or approval request to assign work and notify administrators.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const overdue = isTaskOverdue(task);
              const approaching = isTaskApproaching(task);
              const assignee = task.assigned_to ? adminNameLookup[task.assigned_to] : null;
              const creator = task.created_by ? adminNameLookup[task.created_by] : null;

              const leftBorder =
                task.status === 'completed'
                  ? 'border-l-emerald-600'
                  : overdue || task.priority === 'urgent'
                  ? 'border-l-rose-600'
                  : 'border-l-amber-500';

              return (
                <div
                  key={task.id}
                  className={`p-4 sm:p-5 border-l-4 ${leftBorder} hover:bg-slate-50/70 transition-colors`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>

                        {overdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue
                          </span>
                        )}

                        {!overdue && approaching && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                            <Clock className="w-3 h-3" />
                            Due Within 24h
                          </span>
                        )}

                        {task.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                          {task.task_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          Assignee:{' '}
                          <strong className="text-slate-800">
                            {assignee ? `${assignee.full_name} (${assignee.role_name})` : 'Unassigned / Review Queue'}
                          </strong>
                        </span>
                        {creator && (
                          <span>
                            Created by: <strong className="text-slate-700">{creator.full_name}</strong>
                          </span>
                        )}
                        {task.due_at && (
                          <span className={overdue ? 'text-rose-700 font-semibold' : ''}>
                            Deadline: {formatNotificationDateTime(task.due_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          void handleQuickStatusChange(task, e.target.value as AdminTaskStatus)
                        }
                        aria-label={`Change status for ${task.title}`}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 cursor-pointer"
                      >
                        {TASK_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={task.priority}
                        onChange={(e) =>
                          void handleQuickPriorityChange(
                            task,
                            e.target.value as AdminNotificationPriority
                          )
                        }
                        aria-label={`Change priority for ${task.title}`}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800 cursor-pointer"
                      >
                        {PRIORITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} Priority
                          </option>
                        ))}
                      </select>

                      {task.action_section && task.action_section !== 'tasks' && (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigateSection(task.action_section as AdminSectionId)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Open linked CMS section"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="capitalize">{task.action_section}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(task)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                        title="Edit task"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {canDeleteTask(task) && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(task)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create / Edit Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editingTask ? 'Edit Administrative Task' : 'Create Task / Approval Request'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Review & Publish Q2 Sanitation Infrastructure Report"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instructions / Details
                </label>
                <textarea
                  rows={3}
                  maxLength={1500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide clear context, review notes, or deliverables expected..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Task Type
                  </label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as AdminTaskType)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    {TASK_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as AdminNotificationPriority)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign To Administrator
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="">Unassigned / Editorial Review Queue</option>
                    {adminDirectory.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} · {member.role_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deadline (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Linked CMS Section
                  </label>
                  <select
                    value={actionSection}
                    onChange={(e) => setActionSection(e.target.value as AdminSectionId)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    {LINKED_SECTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {editingTask && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as AdminTaskStatus)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                    >
                      {TASK_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingTask ? 'Save Changes' : 'Create & Notify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Administrative Task"
        message={`Are you sure you want to delete "${deleteTarget?.title || ''}"? Existing notifications referencing this task will remain in history.`}
        confirmLabel="Delete Task"
        variant="danger"
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
