export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function localDate(value: string) { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d, 12); }
export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) { return new Date(`${value}T00:00:00+08:00`).toLocaleDateString('en-US', {...options, timeZone: 'Asia/Manila'}); }
export function formatTime(value: string | null) { if (!value) return 'All day'; const [hours, minutes] = value.split(':').map(Number); const date = new Date(Date.UTC(2000, 0, 1, hours - 8, minutes)); return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' }); }
export function monthDays(month: Date) { const first = new Date(month.getFullYear(), month.getMonth(), 1, 12); const offset = (first.getDay() + 6) % 7; return Array.from({length: 42}, (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - offset + i, 12)); }
