import type { PlannerEvent, Task } from '@/types/planner';
import { expandEvents, plannerDate, shiftDate } from './recurrence';
export type Reminder = {id: string; title: string; at: number; urgent: boolean; event?: PlannerEvent; task?: Task};
export function getReminders(events: PlannerEvent[], tasks: Task[], now: number): Reminder[] {
  const today = plannerDate(new Date(now));
  const horizon = now + 7 * 86_400_000;
  const result: Reminder[] = [];
  const occurrences = expandEvents(events.filter(event => event.status === 'upcoming' && event.reminder_minutes != null), shiftDate(today, -1), shiftDate(today, 8));
  for (const event of occurrences) {
    const start = new Date(`${event.event_date}T${event.start_time ?? '00:00:00'}+08:00`).getTime();
    const at = start - event.reminder_minutes! * 60_000;
    const expiry = event.start_time ? (event.end_time ? new Date(`${event.event_date}T${event.end_time}+08:00`).getTime() : start + 3_600_000) : new Date(`${shiftDate(event.event_date, 1)}T00:00:00+08:00`).getTime();
    if (at <= horizon && expiry > now) result.push({id:`event:${event.id}:${event.event_date}`, title:event.title, at, urgent:at <= now, event});
  }
  for (const task of tasks) {
    if (task.status !== 'pending' || !task.due_date || task.due_date > shiftDate(today, 7)) continue;
    const at = new Date(`${task.due_date}T00:00:00+08:00`).getTime();
    result.push({id:`task:${task.id}`, title:task.title, at, urgent:task.due_date <= today, task});
  }
  return result.sort((a,b) => Number(b.urgent) - Number(a.urgent) || a.at - b.at || a.id.localeCompare(b.id));
}
