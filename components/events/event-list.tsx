'use client';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import { usePlanner } from '@/components/planner-provider';
import type { PlannerEvent } from '@/types/planner';
import { formatDate, formatTime, localDate } from '@/lib/utils/date';
import { EmptyState } from '@/components/ui/states';
export function EventList({events, schedule = false}: {events: PlannerEvent[]; schedule?: boolean}) {
  const {viewEvent} = usePlanner();
  if (!events.length) return <EmptyState title={schedule ? 'A clear day ahead' : 'Your next chapter is open'} description={schedule ? 'No events today. Enjoy the breathing room.' : 'Add an event and find it here.'}/>;
  return <div className="event-list">{events.map(event => <button key={`${event.id}:${event.event_date}`} className="event-list-item" onClick={() => viewEvent(event)}>{schedule ? <div className="schedule-time">{formatTime(event.start_time)}</div> : <div className="event-date"><span>{formatDate(event.event_date, {month:'short'})}</span><strong>{localDate(event.event_date).getDate()}</strong></div>}<span className={`event-stripe dot-${event.category.toLowerCase()}`}/><div className="event-list-info"><strong>{event.title}</strong><span>{schedule ? event.location || event.category : <><Clock3 size={12}/>{formatTime(event.start_time)}</>}</span></div><ArrowUpRight size={16} className="muted"/></button>)}</div>;
}
