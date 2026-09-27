'use client';
import Link from 'next/link';
import { Plus, CalendarDays, ListTodo, ArrowUpRight, CheckCheck, CalendarClock } from 'lucide-react';
import { usePlanner } from '@/components/planner-provider';
import { PageHeader } from '@/components/layout/page-header';
import { MonthCalendar } from '@/components/calendar/month-calendar';
import { EventList } from '@/components/events/event-list';
import { TaskCard } from '@/components/tasks/task-card';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { expandEvents, shiftDate } from '@/lib/utils/recurrence';
const headerDateFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Manila' });
const headerPartsFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Manila' });
function SummaryCard({label, value, icon: Icon, note}: {label:string; value:number; icon:typeof CalendarDays; note:string}) { return <div className="summary-card"><div className="summary-label">{label}<Icon size={18}/></div><div className="summary-value">{String(value).padStart(2,'0')}<span>{note}</span></div></div>; }
export default function Dashboard() {
  const {events, tasks, addEvent, addTask, loading, now: timestamp} = usePlanner();
  const now = new Date(timestamp);
  const parts = headerPartsFormatter.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)!.value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  const hour = Number(part('hour'));
  const occurrences = expandEvents(events, today, shiftDate(today, 90));
  const todayEvents = occurrences.filter(e => e.event_date === today && e.status !== 'cancelled').sort((a,b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));
  const upcoming = occurrences.filter(e => e.event_date > today && e.status === 'upcoming').sort((a,b) => a.event_date.localeCompare(b.event_date) || (a.start_time ?? '').localeCompare(b.start_time ?? ''));
  const pending = tasks.filter(t => t.status === 'pending');
  return <><PageHeader eyebrow={headerDateFormatter.format(now).toUpperCase()} title={`Good ${hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'}.`} description="A fresh perspective on everything you have planned." action={<button className="button primary" onClick={() => addEvent()}><Plus size={18}/>Quick add event</button>}/>
    {loading ? <LoadingState/> : <><div className="summary-grid"><SummaryCard label="Today's events" value={todayEvents.length} icon={CalendarDays} note="on your schedule"/><SummaryCard label="Pending tasks" value={pending.length} icon={ListTodo} note="one step at a time"/><SummaryCard label="Upcoming events" value={upcoming.length} icon={CalendarClock} note="on the horizon"/><SummaryCard label="Completed tasks" value={tasks.length-pending.length} icon={CheckCheck} note="a little progress"/></div>
    <div className="dashboard-grid"><div className="dashboard-main"><MonthCalendar compact/><section className="panel"><div className="section-heading"><div><h2>Recent tasks</h2><p>Small steps, meaningful progress.</p></div><Link className="text-link" href="/tasks">View all <ArrowUpRight size={15}/></Link></div>{tasks.length ? tasks.slice(0,3).map(t => <TaskCard key={t.id} task={t} compact/>) : <EmptyState title="Start with one small thing" description="Keep your to-dos close, and your mind clear." action={<button className="button" onClick={addTask}><Plus size={15}/>Add a task</button>}/>}</section></div>
    <aside className="agenda"><section className="panel"><div className="section-heading"><div><span className="eyebrow">TODAY</span><h2>Your schedule <span className="count">{todayEvents.length}</span></h2></div><span className="today-date">{Number(part('day'))}</span></div><EventList events={todayEvents} schedule/></section><section className="panel"><div className="section-heading"><h2>Coming up</h2><Link href="/calendar" className="icon-button" aria-label="View calendar"><ArrowUpRight size={18}/></Link></div><EventList events={upcoming.slice(0,4)}/></section><div className="daily-note"><span className="eyebrow">A GENTLE REMINDER</span><p>You don’t have to do it all.<br/>Just the things that matter.</p><span className="note-line"/></div></aside></div></>}
  </>;
}
