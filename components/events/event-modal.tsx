'use client';
import { useState } from 'react';
import { CalendarDays, Clock3, MapPin, Check, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { categories, priorities, recurrenceOptions, reminderOptions, type EventInput, type PlannerEvent } from '@/types/planner';
import { recurrenceLabel } from '@/lib/utils/recurrence';
import { formatDate, formatTime } from '@/lib/utils/date';
export function EventModal({event, date, onClose, onSave}: {event?: PlannerEvent; date: string; onClose: () => void; onSave: (input: EventInput) => Promise<void>}) {
  const [recurrence, setRecurrence] = useState(event?.recurrence ?? 'none');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    const title = String(data.get('title')).trim(); const start = String(data.get('start_time')); const end = String(data.get('end_time'));
    if (!title) {setError('Please enter an event title.'); return;}
    if (end && (!start || end <= start)) {setError('End time must be after start time on the same day.'); return;}
    const interval = recurrence === 'none' ? 1 : Number(data.get('recurrence_interval'));
    const until = recurrence === 'none' ? null : String(data.get('recurrence_end_date') || '') || null;
    if (!Number.isInteger(interval) || interval < 1 || interval > 999) {setError('Repeat interval must be a whole number from 1 to 999.'); return;}
    if (until && until < String(data.get('event_date'))) {setError('Repeat end date must be on or after the event date.'); return;}
    setBusy(true); setError('');
    try { await onSave({recurrence, recurrence_interval: interval, recurrence_end_date: until, reminder_minutes: data.get('reminder_minutes') ? Number(data.get('reminder_minutes')) : null, title, description: String(data.get('description')).trim() || null, event_date: String(data.get('event_date')), start_time: start || null, end_time: end || null, category: data.get('category') as EventInput['category'], priority: data.get('priority') as EventInput['priority'], location: String(data.get('location')).trim() || null, status: data.get('status') as EventInput['status']}); }
    catch (err) {setError((err as Error).message);} finally {setBusy(false);}
  }
  return <Modal title={event ? 'Edit event' : 'Make time for something'} onClose={onClose} busy={busy}><form onSubmit={submit}><fieldset disabled={busy} className="form-grid">
    <label className="full">Event title <span>*</span><input name="title" defaultValue={event?.title} placeholder="What’s on your calendar?" required maxLength={200} autoFocus/></label>
    <label className="full">Description<textarea name="description" defaultValue={event?.description ?? ''} placeholder="Notes, details, or a little reminder…" rows={3} maxLength={5000}/></label>
    <label className="full">Date <span>*</span><input name="event_date" type="date" defaultValue={event?.event_date ?? date} required/></label>
    <label>Start time<input name="start_time" type="time" defaultValue={event?.start_time?.slice(0,5) ?? ''}/></label><label>End time<input name="end_time" type="time" defaultValue={event?.end_time?.slice(0,5) ?? ''}/></label>
    <label>Category<select name="category" defaultValue={event?.category ?? 'Personal'}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
    <label>Priority<select name="priority" defaultValue={event?.priority ?? 'Medium'}>{priorities.map(c => <option key={c}>{c}</option>)}</select></label>
    <label>Location<input name="location" defaultValue={event?.location ?? ''} placeholder="Add a place or link" maxLength={500}/></label>
    <label>Status<select name="status" defaultValue={event?.status ?? 'upcoming'}><option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
    <label>Repeat<select name="recurrence" value={recurrence} onChange={e => setRecurrence(e.target.value as EventInput['recurrence'] ?? 'none')}>{recurrenceOptions.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
    <label>Reminder<select name="reminder_minutes" defaultValue={event?.reminder_minutes ?? ''}>{reminderOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    {recurrence !== 'none' && <><label>Repeat every ({({daily:'days', weekly:'weeks', monthly:'months', yearly:'years'} as const)[recurrence]})<input name="recurrence_interval" type="number" min={1} max={999} step={1} required defaultValue={event?.recurrence_interval ?? 1}/></label><label>Repeat until (optional)<input name="recurrence_end_date" type="date" defaultValue={event?.recurrence_end_date ?? ''}/></label><p className="muted full">The date sets the first occurrence. Months without that date are skipped. Changes apply to the entire series.</p></>}
    <p className="muted full">Times and reminders use Asia/Manila. All-day reminders count back from midnight.</p>
  </fieldset>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button" disabled={busy} onClick={onClose}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save event'}</button></div></form></Modal>;
}
export function EventDetails({event, onClose, onEdit, onComplete, onDelete, busy}: {event: PlannerEvent; onClose: () => void; onEdit: () => void; onComplete: () => void; onDelete: () => void; busy: boolean}) {
  return <Modal title={event.title} onClose={onClose} busy={busy}><div className="detail-badges"><span className={`category category-${event.category.toLowerCase()}`}>{event.category}</span><span className="badge">{event.priority} priority</span><span className="badge capitalize">{event.status}</span></div><div className="detail-line"><CalendarDays size={18}/>{formatDate(event.event_date, {weekday:'long', month:'long', day:'numeric', year:'numeric'})}</div><div className="detail-line"><Clock3 size={18}/>{formatTime(event.start_time)}{event.end_time && ` – ${formatTime(event.end_time)}`}</div><div className="detail-line"><MapPin size={18}/>{event.location || 'No location added'}</div><p className="muted">{recurrenceLabel(event)}{event.recurrence && event.recurrence !== 'none' && ' \u00b7 Editing, completing, or deleting affects the entire series.'}</p>{event.reminder_minutes != null && <p className="muted">Reminder: {reminderOptions.find(option => Number(option.value) === event.reminder_minutes)?.label}</p>}<p className="description">{event.description || 'No additional notes.'}</p><div className="modal-actions wrap"><button className="icon-button delete-button" title="Delete event" aria-label="Delete event" disabled={busy} onClick={onDelete}><Trash2 size={18}/></button><span className="spacer"/><button className="button" disabled={busy} onClick={onEdit}><Pencil size={16}/>Edit</button>{event.status !== 'completed' && <button className="button primary" disabled={busy} onClick={onComplete}><Check size={16}/>{busy ? 'Saving…' : 'Mark completed'}</button>}</div></Modal>;
}
