import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Edit3, Trash2, Eye, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { supabase, logAdminActivity } from '../../../lib/supabase';
import { CmsEvent } from '../../../types/cms';
import { useAuth } from '../../../context/AuthContext';
import { useCms } from '../../../context/CmsContext';
import { MediaPickerModal } from '../MediaPickerModal';
import { PreviewModal } from '../PreviewModal';
import { ConfirmDialog } from '../ConfirmDialog';

interface EventsManagerProps {
  notify: (msg: string, type?: 'success' | 'error') => void;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  venue: 'ABCMA Municipal Conference Auditorium, Lartebiokorshie',
  electoral_area: 'All Electoral Areas',
  event_date: new Date().toISOString().slice(0, 10),
  event_time: '10:00 AM - 1:00 PM',
  banner_url: '',
  agendaText: '',
  event_status: 'upcoming' as CmsEvent['event_status'],
  status: 'published' as 'draft' | 'published',
};

export const EventsManager: React.FC<EventsManagerProps> = ({ notify }) => {
  const { adminProfile, canPublishOrDelete } = useAuth();
  const { refreshPublicContent } = useCms();

  const [events, setEvents] = useState<CmsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    action: 'delete' | 'unpublish';
    event: CmsEvent;
  } | null>(null);

  const loadEvents = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });
    if (error) notify(error.message, 'error');
    else if (data) setEvents(data as CmsEvent[]);
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleOpenNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const handleOpenEdit = (ev: CmsEvent) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      description: ev.description,
      venue: ev.venue,
      electoral_area: ev.electoral_area || 'All Electoral Areas',
      event_date: ev.event_date,
      event_time: ev.event_time,
      banner_url: ev.banner_url || '',
      agendaText: Array.isArray(ev.agenda) ? ev.agenda.join('\n') : '',
      event_status: ev.event_status,
      status: ev.status,
    });
    setFormOpen(true);
  };

  const saveEvent = async (targetStatus: 'draft' | 'published') => {
    if (!supabase || !adminProfile) return;
    if (!form.title.trim() || !form.venue.trim() || !form.event_date) {
      notify('Event title, venue, and date are required.', 'error');
      return;
    }
    if (targetStatus === 'published' && !canPublishOrDelete) {
      notify('Editors can save drafts only.', 'error');
      return;
    }

    setSaving(true);
    const agenda = form.agendaText
      .split('\n')
      .map((a) => a.trim())
      .filter(Boolean);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || form.title.trim(),
      venue: form.venue.trim(),
      electoral_area: form.electoral_area.trim(),
      event_date: form.event_date,
      event_time: form.event_time.trim(),
      banner_url: form.banner_url || null,
      agenda,
      event_status: form.event_status,
      status: targetStatus,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('events').update(payload).eq('id', editingId);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UPDATE_EVENT',
          entityType: 'events',
          entityId: editingId,
          entityLabel: payload.title,
          updatedValues: { event_status: payload.event_status, status: targetStatus },
        });
      } else {
        const { data, error } = await supabase.from('events').insert(payload).select('id').single();
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'CREATE_EVENT',
          entityType: 'events',
          entityId: data?.id || '',
          entityLabel: payload.title,
          updatedValues: { event_date: payload.event_date, status: targetStatus },
        });
      }

      notify(`Event "${payload.title}" saved.`);
      setFormOpen(false);
      await loadEvents();
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save event.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget || !supabase || !adminProfile) return;
    const { action, event } = confirmTarget;
    setSaving(true);
    try {
      if (action === 'delete') {
        const { error } = await supabase.from('events').delete().eq('id', event.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'DELETE_EVENT',
          entityType: 'events',
          entityId: event.id,
          entityLabel: event.title,
        });
        notify(`Removed event "${event.title}".`);
      } else {
        const { error } = await supabase
          .from('events')
          .update({ status: 'draft' })
          .eq('id', event.id);
        if (error) throw error;
        await logAdminActivity({
          adminId: adminProfile.id,
          adminEmail: adminProfile.email,
          adminName: adminProfile.full_name,
          action: 'UNPUBLISH_EVENT',
          entityType: 'events',
          entityId: event.id,
          entityLabel: event.title,
        });
        notify(`Unpublished event "${event.title}".`);
      }
      setConfirmTarget(null);
      await loadEvents();
      await refreshPublicContent();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Operation failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (formOpen) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {editingId ? 'Edit Event / Activity' : 'Create Municipal Event'}
            </h1>
            <p className="text-xs text-slate-500">
              Upcoming and completed events display inside The Assembly Town Halls & Activities hub.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer"
          >
            Back to Events
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Event Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Event Date *</label>
              <input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm((prev) => ({ ...prev, event_date: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Time Window *</label>
              <input
                type="text"
                value={form.event_time}
                onChange={(e) => setForm((prev) => ({ ...prev, event_time: e.target.value }))}
                placeholder="10:00 AM - 1:30 PM"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Venue *</label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm((prev) => ({ ...prev, venue: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Electoral Area</label>
              <input
                type="text"
                value={form.electoral_area}
                onChange={(e) => setForm((prev) => ({ ...prev, electoral_area: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Activity Lifecycle</label>
              <select
                value={form.event_status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    event_status: e.target.value as CmsEvent['event_status'],
                  }))
                }
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {form.banner_url ? (
                <img
                  src={form.banner_url}
                  alt="Event banner"
                  referrerPolicy="no-referrer"
                  className="w-20 h-14 rounded-lg object-cover border border-slate-200"
                />
              ) : (
                <div className="w-20 h-14 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <div className="text-xs">
                <div className="font-semibold text-slate-800">Event Banner Image</div>
                <div className="text-[11px] text-slate-500">Shown on event detail cards</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="px-3.5 py-1.5 bg-white border border-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Upload / Pick Banner
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Event Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Key Agenda Items (One per line)
            </label>
            <textarea
              rows={3}
              value={form.agendaText}
              onChange={(e) => setForm((prev) => ({ ...prev, agendaText: e.target.value }))}
              placeholder="Opening remarks by Presiding Member&#10;Public Budget Q&A"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={() => saveEvent('draft')}
                className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
              >
                Save as Draft
              </button>
              {canPublishOrDelete && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => saveEvent('published')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingId && form.status === 'published' ? 'Save Changes' : 'Publish Event'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <MediaPickerModal
          isOpen={pickerOpen}
          acceptKind="image"
          defaultFolder="events"
          onClose={() => setPickerOpen(false)}
          onSelect={(asset) => {
            setForm((prev) => ({ ...prev, banner_url: asset.public_url }));
            setPickerOpen(false);
          }}
        />

        <PreviewModal
          isOpen={previewOpen}
          title={form.title}
          subtitle={`${form.event_status.toUpperCase()} · ${form.electoral_area}`}
          imageUrl={form.banner_url || null}
          metaTags={[
            { label: 'Date & Time', value: `${form.event_date} · ${form.event_time}` },
            { label: 'Venue', value: form.venue },
          ]}
          paragraphs={[form.description]}
          onClose={() => setPreviewOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Events & Activities</h1>
          <p className="text-xs text-slate-500">
            Schedule town halls, public consultations, and mark events completed or cancelled.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Event</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-900">No events scheduled</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Event & Venue</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Lifecycle</th>
                  <th className="py-3 px-4">Publish Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{ev.title}</div>
                      <div className="text-[11px] text-slate-500">{ev.venue}</div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      <div>{ev.event_date}</div>
                      <div className="text-[11px] text-slate-500">{ev.event_time}</div>
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold text-slate-700">
                      {ev.event_status}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          ev.status === 'published' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {ev.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ev)}
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canPublishOrDelete && ev.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'unpublish', event: ev })}
                            className="px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                          >
                            Unpublish
                          </button>
                        )}
                        {canPublishOrDelete && (
                          <button
                            type="button"
                            onClick={() => setConfirmTarget({ action: 'delete', event: ev })}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirmTarget)}
        title={confirmTarget?.action === 'delete' ? 'Remove Cancelled/Old Event?' : 'Unpublish Event?'}
        message={`Are you sure you want to ${confirmTarget?.action} "${confirmTarget?.event.title}"?`}
        confirmLabel={confirmTarget?.action === 'delete' ? 'Delete' : 'Unpublish'}
        variant={confirmTarget?.action === 'delete' ? 'danger' : 'warning'}
        busy={saving}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};
