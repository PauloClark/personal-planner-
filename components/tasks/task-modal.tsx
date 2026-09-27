'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { priorities, type Task, type TaskInput } from '@/types/planner';
export function TaskModal({task, onSave, onClose}: {task?: Task; onSave: (input: TaskInput) => Promise<void>; onClose: () => void}) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault(); const data = new FormData(e.currentTarget); const title = String(data.get('title')).trim();
    if (!title) {setError('Please enter a task title.'); return;}
    setBusy(true); setError('');
    try {await onSave({title, description: String(data.get('description')).trim() || null, due_date: String(data.get('due_date')) || null, priority: data.get('priority') as TaskInput['priority'], status: data.get('status') as TaskInput['status']});} catch (err) {setError((err as Error).message);} finally {setBusy(false);}
  }
  return <Modal title={task ? 'Edit task' : 'One thing at a time'} onClose={onClose} busy={busy}><form onSubmit={submit}><fieldset disabled={busy} className="form-grid"><label className="full">Task title <span>*</span><input name="title" defaultValue={task?.title} placeholder="What would you like to get done?" required maxLength={200} autoFocus/></label><label className="full">Description<textarea name="description" defaultValue={task?.description ?? ''} rows={3} maxLength={5000} placeholder="A few helpful details…"/></label><label className="full">Due date<input type="date" name="due_date" defaultValue={task?.due_date ?? ''}/></label><label>Priority<select name="priority" defaultValue={task?.priority ?? 'Medium'}>{priorities.map(p => <option key={p}>{p}</option>)}</select></label><label>Status<select name="status" defaultValue={task?.status ?? 'pending'}><option value="pending">Pending</option><option value="completed">Completed</option></select></label></fieldset>{error && <p role="alert" className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="button" disabled={busy} onClick={onClose}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save task'}</button></div></form></Modal>;
}
