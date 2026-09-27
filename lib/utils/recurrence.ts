import type { PlannerEvent } from '@/types/planner';

const DAY = 86_400_000;
// Date-only arithmetic uses UTC so DST and host timezone cannot shift a recurrence.
export function civilDate(value: string): Date { return new Date(`${value}T00:00:00Z`); }
export function shiftDate(value: string, days: number): string {
  const date = civilDate(value); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10);
}
export function plannerDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Manila', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function occursOn(event: PlannerEvent, date: string): boolean {
  const start = event.series_start_date ?? event.event_date;
  if (date < start) return false;
  if (!event.recurrence || event.recurrence === 'none') return date === start;
  if (event.recurrence_end_date && date > event.recurrence_end_date) return false;
  const interval = event.recurrence_interval ?? 1;
  if (!Number.isInteger(interval) || interval < 1) return false;
  const first = civilDate(start), current = civilDate(date);
  const days = Math.round((current.getTime() - first.getTime()) / DAY);
  if (event.recurrence === 'daily') return days % interval === 0;
  if (event.recurrence === 'weekly') return days % (7 * interval) === 0;
  const months = (current.getUTCFullYear() - first.getUTCFullYear()) * 12 + current.getUTCMonth() - first.getUTCMonth();
  // Skip months without the original day (including Feb 29 in non-leap years).
  if (current.getUTCDate() !== first.getUTCDate()) return false;
  if (event.recurrence === 'monthly') return months % interval === 0;
  return event.recurrence === 'yearly' && months % (12 * interval) === 0;
}
export function expandEvents(events: PlannerEvent[], from: string, to: string): PlannerEvent[] {
  const result: PlannerEvent[] = [];
  if (from > to) return result;
  const days = (civilDate(to).getTime() - civilDate(from).getTime()) / DAY;
  if (!Number.isFinite(days) || days > 370) throw new Error('Select a calendar range of at most one year.');
  for (let date = from; date <= to; date = shiftDate(date, 1)) {
    for (const event of events) if (occursOn(event, date)) result.push({...event, series_start_date: event.series_start_date ?? event.event_date, event_date: date});
  }
  return result.sort((a,b) => a.event_date.localeCompare(b.event_date) || (a.start_time ?? '').localeCompare(b.start_time ?? '') || a.title.localeCompare(b.title, 'en-US'));
}
export function recurrenceLabel(event: PlannerEvent): string {
  if (!event.recurrence || event.recurrence === 'none') return 'Does not repeat';
  const units = {daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year'};
  const count = event.recurrence_interval ?? 1;
  return `Every ${count} ${units[event.recurrence]}${count === 1 ? '' : 's'}${event.recurrence_end_date ? ` through ${event.recurrence_end_date}` : ''}`;
}
