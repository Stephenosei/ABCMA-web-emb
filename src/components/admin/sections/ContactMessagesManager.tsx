import React, { useState, useEffect, useCallback } from 'react';
import {
  Inbox,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { supabase, logAdminActivity } from '../../../lib/supabase';
import { CmsContactMessage } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { ConfirmDialog } from '../ConfirmDialog';
import { toSafeErrorMessage } from '../../../utils/security';

interface ContactMessagesManagerProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const SMS_STATUS_LABELS: Record<CmsContactMessage['sms_status'], string> = {
  sent: 'SMS Sent',
  failed: 'SMS Failed',
  processing: 'Processing',
  pending: 'Pending',
};

const SMS_STATUS_CLASSES: Record<CmsContactMessage['sms_status'], string> = {
  sent: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  failed: 'bg-rose-50 text-rose-800 border-rose-200',
  processing: 'bg-amber-50 text-amber-800 border-amber-200',
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
};

const INQUIRY_STATUS_CLASSES: Record<CmsContactMessage['inquiry_status'], string> = {
  new: 'bg-blue-50 text-blue-800 border-blue-200',
  in_review: 'bg-amber-50 text-amber-800 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const ContactMessagesManager: React.FC<ContactMessagesManagerProps> = ({ notify }) => {
  const { adminProfile, canPublishOrDelete } = useAuth();
  const [messages, setMessages] = useState<CmsContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingMigration, setMissingMigration] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [smsFilter, setSmsFilter] = useState<'all' | CmsContactMessage['sms_status']>('all');
  const [inquiryFilter, setInquiryFilter] = useState<'all' | CmsContactMessage['inquiry_status']>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CmsContactMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setMissingMigration(false);

    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const msg = error.message || '';
      if (
        error.code === 'PGRST205' ||
        error.code === '42P01' ||
        /contact_messages/i.test(msg)
      ) {
        setMissingMigration(true);
        setMessages([]);
      } else {
        notify(toSafeErrorMessage(error, 'Failed to load contact enquiries.'), 'error');
      }
    } else {
      setMessages((data || []) as CmsContactMessage[]);
    }
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleUpdateInquiryStatus = async (
    item: CmsContactMessage,
    nextStatus: CmsContactMessage['inquiry_status']
  ) => {
    if (!supabase || !adminProfile) return;
    if (!canPublishOrDelete) {
      notify('Only Content Administrators and Super Administrators can update enquiry status.', 'error');
      return;
    }

    setUpdatingId(item.id);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ inquiry_status: nextStatus })
        .eq('id', item.id);

      if (error) throw error;

      await logAdminActivity({
        adminId: adminProfile.id,
        adminEmail: adminProfile.email,
        adminName: adminProfile.full_name,
        action: 'UPDATE_CONTACT_ENQUIRY_STATUS',
        entityType: 'contact_messages',
        entityId: item.id,
        entityLabel: `${item.ticket_reference} (${item.inquiry_status} → ${nextStatus})`,
        previousValues: { inquiry_status: item.inquiry_status },
        updatedValues: { inquiry_status: nextStatus },
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, inquiry_status: nextStatus } : m))
      );
      notify(`Enquiry ${item.ticket_reference} updated to ${nextStatus.replace('_', ' ')}.`);
    } catch (err) {
      notify(toSafeErrorMessage(err, 'Unable to update enquiry status.'), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!supabase || !adminProfile || !deleteTarget) return;
    if (!canPublishOrDelete) {
      notify('Only Content Administrators and Super Administrators can delete enquiries.', 'error');
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      await logAdminActivity({
        adminId: adminProfile.id,
        adminEmail: adminProfile.email,
        adminName: adminProfile.full_name,
        action: 'DELETE_CONTACT_ENQUIRY',
        entityType: 'contact_messages',
        entityId: deleteTarget.id,
        entityLabel: `${deleteTarget.ticket_reference} (${deleteTarget.full_name})`,
      });

      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      notify(`Enquiry ${deleteTarget.ticket_reference} deleted.`);
      setDeleteTarget(null);
    } catch (err) {
      notify(toSafeErrorMessage(err, 'Unable to delete contact enquiry.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredMessages = messages.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.ticket_reference.toLowerCase().includes(q) ||
      item.full_name.toLowerCase().includes(q) ||
      item.phone_number.toLowerCase().includes(q) ||
      (item.normalized_phone || '').toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      item.recipient_unit.toLowerCase().includes(q);

    const matchesSms = smsFilter === 'all' || item.sms_status === smsFilter;
    const matchesInquiry = inquiryFilter === 'all' || item.inquiry_status === inquiryFilter;
    return matchesSearch && matchesSms && matchesInquiry;
  });

  const stats = {
    total: messages.length,
    smsSent: messages.filter((m) => m.sms_status === 'sent').length,
    smsFailed: messages.filter((m) => m.sms_status === 'failed').length,
    newEnquiries: messages.filter((m) => m.inquiry_status === 'new').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-emerald-700" />
            <span>Contact Enquiries &amp; SMS Delivery Logs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review citizen messages submitted via Contact Us and track automated mNotify SMS confirmations.
          </p>
        </div>

        <button
          type="button"
          onClick={loadMessages}
          disabled={loading}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Enquiries</span>
        </button>
      </div>

      {/* Missing Migration Warning */}
      {missingMigration && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-1.5">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Contact Enquiries Database Migration Pending</span>
          </div>
          <p className="text-amber-900 leading-relaxed">
            The <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">public.contact_messages</code> table has not been provisioned yet. Apply{' '}
            <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">005_abcma_contact_messages_sms.sql</code> in Supabase SQL Editor and deploy the{' '}
            <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">send-contact-sms</code> Edge Function.
          </p>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">Total Enquiries</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {loading ? '—' : stats.total}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">SMS Confirmations Sent</div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {loading ? '—' : stats.smsSent}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">SMS Delivery Failures</div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
            {loading ? '—' : stats.smsFailed}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">New Unreviewed</div>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
            {loading ? '—' : stats.newEnquiries}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ticket reference, citizen name, phone, subject, or directorate..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={smsFilter}
            onChange={(e) => setSmsFilter(e.target.value as typeof smsFilter)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800"
            aria-label="Filter by SMS status"
          >
            <option value="all">All SMS Statuses</option>
            <option value="sent">SMS Sent</option>
            <option value="failed">SMS Failed</option>
            <option value="pending">SMS Pending</option>
            <option value="processing">SMS Processing</option>
          </select>

          <select
            value={inquiryFilter}
            onChange={(e) => setInquiryFilter(e.target.value as typeof inquiryFilter)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800"
            aria-label="Filter by enquiry triage status"
          >
            <option value="all">All Triage Statuses</option>
            <option value="new">New</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Enquiries List */}
      {loading ? (
        <div className="p-10 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
          Loading citizen contact enquiries...
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="p-10 bg-white border border-slate-200 rounded-xl text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-800">No Contact Enquiries Found</div>
          <p className="text-xs text-slate-500">
            {messages.length === 0
              ? 'Submitted Contact Us enquiries and their mNotify SMS delivery records will appear here.'
              : 'No enquiries match your active search or status filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {item.ticket_reference}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${SMS_STATUS_CLASSES[item.sms_status]}`}
                      >
                        {item.sms_status === 'sent' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : item.sms_status === 'failed' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{SMS_STATUS_LABELS[item.sms_status]}</span>
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase ${INQUIRY_STATUS_CLASSES[item.inquiry_status]}`}
                      >
                        {item.inquiry_status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{item.subject}</h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">{item.full_name}</span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-emerald-700" />
                        {item.phone_number}
                        {item.normalized_phone && item.normalized_phone !== item.phone_number
                          ? ` (${item.normalized_phone})`
                          : ''}
                      </span>
                      {item.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {item.email}
                        </span>
                      )}
                      <span className="text-slate-500">To: {item.recipient_unit}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mr-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleString()}
                    </span>

                    <select
                      disabled={!canPublishOrDelete || updatingId === item.id}
                      value={item.inquiry_status}
                      onChange={(e) =>
                        handleUpdateInquiryStatus(
                          item,
                          e.target.value as CmsContactMessage['inquiry_status']
                        )
                      }
                      className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 disabled:opacity-50"
                      aria-label={`Update status for ${item.ticket_reference}`}
                    >
                      <option value="new">New</option>
                      <option value="in_review">In Review</option>
                      <option value="resolved">Resolved</option>
                      <option value="archived">Archived</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      {expanded ? 'Hide Details' : 'View Details'}
                    </button>

                    {canPublishOrDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer"
                        title="Delete enquiry"
                        aria-label={`Delete enquiry ${item.ticket_reference}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200/80 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                  {item.message}
                </p>

                {expanded && (
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-800 block">SMS Sent Timestamp</span>
                      <span className="font-mono">
                        {item.sms_sent_at ? new Date(item.sms_sent_at).toLocaleString() : 'Not sent'}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Dispatch Attempts / Provider ID
                      </span>
                      <span className="font-mono">
                        {item.sms_attempts} attempt(s)
                        {item.sms_provider_id ? ` · ${item.sms_provider_id}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block">SMS Delivery Note</span>
                      <span className={item.sms_error ? 'text-rose-700 font-medium' : 'text-slate-600'}>
                        {item.sms_error || (item.sms_status === 'sent' ? 'Accepted by mNotify gateway.' : '—')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Contact Enquiry"
        message={
          deleteTarget
            ? `Permanently delete enquiry ${deleteTarget.ticket_reference} from ${deleteTarget.full_name}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete Enquiry"
        variant="danger"
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
};
