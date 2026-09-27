'use client';
import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PlannerEvent, Task, EventInput, TaskInput } from '@/types/planner';
import { EventModal, EventDetails } from '@/components/events/event-modal';
import { TaskModal } from '@/components/tasks/task-modal';
import { ConfirmationDialog } from '@/components/ui/modal';
import { plannerDate } from '@/lib/utils/recurrence';
type User = {id: string; email: string};
type Context = {
  user: User; now: number; events: PlannerEvent[]; tasks: Task[]; loading: boolean; loadError: string; refresh: () => Promise<void>;
  addEvent: (date?: string) => void; viewEvent: (event: PlannerEvent) => void; addTask: () => void; editTask: (task: Task) => void;
  completeTask: (task: Task) => Promise<void>; deleteTask: (task: Task) => void; logout: () => Promise<void>; signingOut: boolean;
};
const PlannerContext = createContext<Context | null>(null);
export function usePlanner() { const value = useContext(PlannerContext); if (!value) throw new Error('PlannerProvider is required'); return value; }
type Editor = {kind: 'event'; date: string; event?: PlannerEvent} | {kind: 'details'; event: PlannerEvent} | {kind: 'task'; task?: Task} | {kind: 'delete'; table: 'events' | 'tasks'; id: string; title: string} | null;
export function PlannerProvider({user, initialNow, children}: {user: User; initialNow: number; children: React.ReactNode}) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => { const update = () => setNow(Date.now()); const timer = setInterval(update, 30_000); window.addEventListener('focus', update); return () => {clearInterval(timer); window.removeEventListener('focus', update);}; }, []);
  const client = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editor, setEditor] = useState<Editor>(null);
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [notice, setNotice] = useState<{text: string; error: boolean} | null>(null);
  const notify = (text: string, error = false) => setNotice({text, error});
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 6000); return () => clearTimeout(timer); }, [notice]);
  const refresh = useCallback(async () => {
    try {
      // Paginate to avoid silently truncating a planner at Supabase's row limit.
      const readAll = async <T,>(table: 'events' | 'tasks', order: string): Promise<T[]> => {
        const result: T[] = [];
        for (let from = 0; ; from += 500) {
          const {data, error} = await client.from(table).select('*').eq('user_id', user.id).order(order).order('id').range(from, from + 499);
          if (error) throw error;
          result.push(...data as T[]);
          if (data.length < 500) return result;
        }
      };
      const [eventRows, taskRows] = await Promise.all([readAll<PlannerEvent>('events', 'event_date'), readAll<Task>('tasks', 'created_at')]);
      setEvents(eventRows); setTasks(taskRows.reverse()); setLoadError('');
    } catch { setLoadError('Could not load your planner. Check your connection and that supabase/schema.sql has been applied.'); }
    finally { setLoading(false); }
  }, [client, user.id]);
  useEffect(() => { const initialLoad = setTimeout(() => { void refresh(); }, 0); const onFocus = () => { void refresh(); }; window.addEventListener('focus', onFocus); return () => { clearTimeout(initialLoad); window.removeEventListener('focus', onFocus); }; }, [refresh]);
  async function mutate(table: 'events' | 'tasks', input: EventInput | TaskInput | {status: string}, id?: string, remove = false) {
    const query = remove ? client.from(table).delete().eq('id', id!).eq('user_id', user.id) : id ? client.from(table).update(input).eq('id', id).eq('user_id', user.id) : client.from(table).insert({...input, user_id: user.id});
    const {data, error} = await query.select('id').single();
    if (error || !data) throw new Error(error?.message ?? 'This item no longer exists. Refresh your planner.');
    await refresh();
  }
  async function saveEvent(input: EventInput) { if (editor?.kind !== 'event') return; await mutate('events', input, editor.event?.id); setEditor(null); notify('Event saved'); }
  async function saveTask(input: TaskInput) { if (editor?.kind !== 'task') return; await mutate('tasks', input, editor.task?.id); setEditor(null); notify('Task saved'); }
  async function completeTask(task: Task) { try { await mutate('tasks', {status: task.status === 'pending' ? 'completed' : 'pending'}, task.id); notify(task.status === 'pending' ? 'Task completed. Nicely done.' : 'Task reopened'); } catch (error) { notify((error as Error).message, true); } }
  async function completeEvent(event: PlannerEvent) { setBusy(true); try { await mutate('events', {status: 'completed'}, event.id); setEditor(null); notify('Event completed'); } catch (error) { notify((error as Error).message, true); } finally { setBusy(false); } }
  async function removeItem() { if (editor?.kind !== 'delete') return; setBusy(true); try { await mutate(editor.table, {status: ''}, editor.id, true); setEditor(null); notify('Deleted successfully'); } catch (error) { notify((error as Error).message, true); } finally { setBusy(false); } }
  async function logout() { setSigningOut(true); try { const {error} = await client.auth.signOut(); if (error) throw error; window.location.assign('/login'); } catch { notify('Could not sign out. Please try again.', true); setSigningOut(false); } }
  return <PlannerContext.Provider value={{user, now, events, tasks, loading, loadError, refresh, addEvent: (date = plannerDate()) => setEditor({kind:'event', date}), viewEvent: event => setEditor({kind:'details', event}), addTask: () => setEditor({kind:'task'}), editTask: task => setEditor({kind:'task', task}), completeTask, deleteTask: task => setEditor({kind:'delete', table:'tasks', id:task.id, title:task.title}), logout, signingOut}}>
    {children}
    {notice && <div role={notice.error ? 'alert' : 'status'} className={`toast ${notice.error ? 'error' : ''}`}><span>{notice.text}</span><button onClick={() => setNotice(null)} aria-label="Dismiss notification">×</button></div>}
    {editor?.kind === 'event' && <EventModal event={editor.event} date={editor.date} onSave={saveEvent} onClose={() => setEditor(null)}/>}
    {editor?.kind === 'task' && <TaskModal task={editor.task} onSave={saveTask} onClose={() => setEditor(null)}/>}
    {editor?.kind === 'details' && <EventDetails event={editor.event} busy={busy} onClose={() => setEditor(null)} onEdit={() => setEditor({kind:'event', event:events.find(event => event.id === editor.event.id) ?? {...editor.event, event_date: editor.event.series_start_date ?? editor.event.event_date}, date:editor.event.series_start_date ?? editor.event.event_date})} onComplete={() => void completeEvent(editor.event)} onDelete={() => setEditor({kind:'delete', table:'events', id:editor.event.id, title:editor.event.title + (editor.event.recurrence && editor.event.recurrence !== 'none' ? ' (entire recurring series)' : '')})}/>}
    {editor?.kind === 'delete' && <ConfirmationDialog title="Delete this item?" description={`“${editor.title}” will be permanently deleted. This cannot be undone.`} busy={busy} onConfirm={() => void removeItem()} onClose={() => setEditor(null)}/>}
  </PlannerContext.Provider>;
}
