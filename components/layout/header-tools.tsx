'use client';
import { useMemo, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { usePlanner } from '@/components/planner-provider';
import { Modal } from '@/components/ui/modal';
import { formatDate, formatTime } from '@/lib/utils/date';
import { getReminders } from '@/lib/utils/reminders';
import { plannerDate } from '@/lib/utils/recurrence';

export function HeaderTools() {
  const {events, tasks, now, loading, loadError, viewEvent, editTask} = usePlanner();
  const [panel, setPanel] = useState<'search' | 'notifications' | null>(null);
  const [query, setQuery] = useState('');
  const reminders = useMemo(() => getReminders(events, tasks, now), [events, tasks, now]);
  const dueCount = reminders.filter(reminder => reminder.urgent).length;
  const search = query.trim().toLowerCase();
  const eventResults = search ? events.filter(event => [event.title, event.description, event.location].some(value => value?.toLowerCase().includes(search))) : [];
  const taskResults = search ? tasks.filter(task => [task.title, task.description].some(value => value?.toLowerCase().includes(search))) : [];
  const today = plannerDate(new Date(now));
  return <div className="header-tools">
    <button className="icon-button" aria-label="Search events and tasks" title="Search events and tasks" onClick={() => {setQuery(''); setPanel('search');}}><Search size={19}/></button>
    <button className="icon-button notification-bell" aria-label={`Notifications, ${dueCount} reminders or deadlines due`} title="Reminders and deadlines" onClick={() => setPanel('notifications')}><Bell size={19}/>{dueCount > 0 && <span className="notification-count">{dueCount > 99 ? '99+' : dueCount}</span>}</button>
    {panel === 'search' && <Modal title="Search your planner" onClose={() => setPanel(null)}><label className="search-field"><Search size={17}/><input autoFocus type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search events and tasks" aria-label="Search events and tasks"/></label><div className="planner-results" aria-live="polite">
      {loading ? <p className="muted">Loading your planner…</p> : loadError ? <p role="alert">{loadError}</p> : !search ? <p className="muted">Find an event by title, description, or location, or a task by title or description.</p> : <><p className="muted">{eventResults.length + taskResults.length} results</p>{eventResults.map(event => <button className="planner-result" key={`event:${event.id}`} onClick={() => {setPanel(null); viewEvent(event);}}><span className="badge">Event</span><strong>{event.title}</strong><span>{formatDate(event.event_date)} · {formatTime(event.start_time)}{event.recurrence && event.recurrence !== 'none' ? ' · Recurring series' : ''}</span>{event.location && <span>{event.location}</span>}</button>)}{taskResults.map(task => <button className="planner-result" key={`task:${task.id}`} onClick={() => {setPanel(null); editTask(task);}}><span className="badge">Task</span><strong>{task.title}</strong><span>{task.due_date ? `Due ${formatDate(task.due_date)}` : 'No due date'} · {task.status}</span></button>)}{!eventResults.length && !taskResults.length && <p className="muted">No matches. Try a different word.</p>}</>}
    </div></Modal>}
    {panel === 'notifications' && <Modal title="Reminders & deadlines" onClose={() => setPanel(null)}><p className="muted">Upcoming reminders for the next 7 days, plus overdue tasks. Updates while the app is open. All times are in Manila.</p><div className="planner-results">
      {loading ? <p className="muted">Loading reminders…</p> : loadError ? <p role="alert">{loadError}</p> : !reminders.length ? <p className="muted">You’re all caught up. No reminders or deadlines coming up.</p> : reminders.map(reminder => <button key={reminder.id} className="planner-result" onClick={() => {setPanel(null); if (reminder.event) viewEvent(reminder.event); else if (reminder.task) editTask(reminder.task);}}><span className="badge">{reminder.event ? (reminder.urgent ? 'Reminder due' : 'Upcoming reminder') : reminder.task!.due_date! < today ? 'Overdue task' : reminder.task!.due_date === today ? 'Task due today' : 'Task deadline'}</span><strong>{reminder.title}</strong>{reminder.event ? <><span>{formatDate(reminder.event.event_date)} · {formatTime(reminder.event.start_time)}</span><span>Reminder: {new Intl.DateTimeFormat('en-US', {month:'short', day:'numeric', hour:'numeric', minute:'2-digit', timeZone:'Asia/Manila'}).format(reminder.at)}</span></> : <span>Due {formatDate(reminder.task!.due_date!)}</span>}</button>)}
    </div></Modal>}
  </div>;
}
