'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { usePlanner } from '@/components/planner-provider';
import { dateKey, formatDate, formatTime, localDate, monthDays } from '@/lib/utils/date';
import { civilDate, expandEvents, plannerDate, shiftDate } from '@/lib/utils/recurrence';
import { categories, priorities, type PlannerEvent } from '@/types/planner';

type View = 'month' | 'week' | 'day';
export function MonthCalendar({compact = false}: {compact?: boolean}) {
  const {events, addEvent, viewEvent, now} = usePlanner();
  const [selected, setSelected] = useState(() => plannerDate(new Date(now)));
  const [view, setView] = useState<View>('month');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const today = plannerDate(new Date(now));
  const month = localDate(selected);
  const weekStart = shiftDate(selected, -((civilDate(selected).getUTCDay() + 6) % 7));
  const days = view === 'month' ? monthDays(month).map(day => dateKey(day)) : view === 'week' ? Array.from({length:7}, (_, i) => shiftDate(weekStart, i)) : [selected];
  const visible = expandEvents(events.filter(event => (!category || event.category === category) && (!priority || event.priority === priority) && (!status || event.status === status)), days[0], days[days.length - 1]);
  function move(delta: number) {
    if (view === 'month') setSelected(dateKey(new Date(month.getFullYear(), month.getMonth() + delta, 1, 12)));
    else setSelected(shiftDate(selected, delta * (view === 'week' ? 7 : 1)));
  }
  function eventButton(event: PlannerEvent) {
    return <button key={`${event.id}:${event.event_date}`} onClick={() => viewEvent(event)} title={`${event.title} · ${formatTime(event.start_time)} · ${event.status}`} className={`calendar-event category-${event.category.toLowerCase()} event-${event.status}`}><span className="event-dot"/><span className="event-title">{event.title}</span>{!compact && <span className="event-time">{formatTime(event.start_time)}{view !== 'month' && event.end_time ? ` – ${formatTime(event.end_time)}` : ''}</span>}</button>;
  }
  const heading = view === 'month' ? formatDate(selected, {month:'long', year:'numeric'}) : view === 'week' ? `${formatDate(days[0], {month:'short', day:'numeric'})} – ${formatDate(days[6])}` : formatDate(selected, {weekday:'long', month:'long', day:'numeric', year:'numeric'});
  return <section className={`panel calendar-panel ${compact ? 'compact-calendar' : ''}`} aria-label={`${view} calendar`}>
    <div className="calendar-toolbar"><div className="month-title"><h2>{heading}</h2><span className="badge capitalize">{view} view</span></div><div className="calendar-controls">
      {!compact && <select aria-label="Calendar view" value={view} onChange={e => setView(e.target.value as View)}><option value="month">Month</option><option value="week">Week</option><option value="day">Day</option></select>}
      <button className="button today-button" onClick={() => setSelected(plannerDate())}>Today</button><button className="icon-button" aria-label={`Previous ${view}`} onClick={() => move(-1)}><ChevronLeft size={19}/></button><button className="icon-button" aria-label={`Next ${view}`} onClick={() => move(1)}><ChevronRight size={19}/></button>
    </div></div>
    {!compact && <div className="calendar-filter v2-filters"><label>Selected date<input type="date" value={selected} onChange={e => {if (e.target.value) setSelected(e.target.value);}}/></label><label>Category<select value={category} onChange={e => setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Priority<select value={priority} onChange={e => setPriority(e.target.value)}><option value="">All priorities</option>{priorities.map(p => <option key={p}>{p}</option>)}</select></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><button className="button" onClick={() => {setCategory(''); setPriority(''); setStatus('');}}>Clear filters</button></div>}
    {view === 'month' ? <><div className="weekday-row">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d}>{d}</div>)}</div><div className="calendar-grid">{days.map(key => {
      const day = localDate(key); const dayEvents = visible.filter(e => e.event_date === key);
      return <div key={key} className={`calendar-cell ${day.getMonth() !== month.getMonth() ? 'outside' : ''} ${key === today ? 'is-today' : ''}`}><button className="day-button" aria-label={`Add event on ${formatDate(key)}`} onClick={() => addEvent(key)}><span className="day-number">{day.getDate()}</span><Plus size={13} className="day-plus"/></button><div className="day-events">{dayEvents.slice(0,3).map(eventButton)}{dayEvents.length > 3 && <details className="more-events"><summary>+{dayEvents.length - 3} more</summary><div>{dayEvents.slice(3).map(eventButton)}</div></details>}</div></div>;
    })}</div></> : <div className={`calendar-agenda calendar-${view}`}>{days.map(key => <section className={`agenda-day ${key === today ? 'is-today' : ''}`} key={key}><div className="agenda-day-heading"><button className="text-link" onClick={() => {setSelected(key); setView('day');}}>{formatDate(key, {weekday:'short', month:'short', day:'numeric'})}</button><button className="icon-button" aria-label={`Add event on ${formatDate(key)}`} onClick={() => addEvent(key)}><Plus size={16}/></button></div><div className="day-events">{visible.filter(event => event.event_date === key).map(eventButton)}{!visible.some(event => event.event_date === key) && <p className="muted">No events</p>}</div></section>)}</div>}
    {!compact && !visible.length && <p className="calendar-empty" role="status">No events in this view{category || priority || status ? ' match your filters' : ''}.</p>}
    <div className="calendar-legend">{categories.slice(0, compact ? 4 : undefined).map(c => <span key={c}><i className={`color-dot dot-${c.toLowerCase()}`}/>{c}</span>)}<span className="calendar-hint">Select a date to add an event · Manila time</span></div>
  </section>;
}
