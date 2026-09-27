'use client';
import { useState } from 'react';
import { Check, Pencil, Trash2, CalendarDays } from 'lucide-react';
import { usePlanner } from '@/components/planner-provider';
import type { Task } from '@/types/planner';
import { plannerDate } from '@/lib/utils/recurrence';
import { formatDate } from '@/lib/utils/date';
export function TaskCard({task, compact = false}: {task: Task; compact?: boolean}) {
  const {completeTask, editTask, deleteTask, now} = usePlanner(); const [busy, setBusy] = useState(false);
  const done = task.status === 'completed'; const overdue = !done && task.due_date && task.due_date < plannerDate(new Date(now));
  return <article className={`task-card ${done ? 'task-done' : ''}`}><button className="task-check" disabled={busy} aria-label={`${done ? 'Reopen' : 'Complete'} ${task.title}`} aria-pressed={done} onClick={async () => {setBusy(true); await completeTask(task); setBusy(false);}}>{done && <Check size={14}/>}</button><div className="task-info"><button className="task-title" onClick={() => editTask(task)}>{task.title}</button>{!compact && task.description && <p>{task.description}</p>}<div className="task-meta">{task.due_date ? <span className={overdue ? 'overdue' : ''}><CalendarDays size={12}/>{formatDate(task.due_date)}{overdue ? ' · Overdue' : ''}</span> : <span>No due date</span>}<span className={`priority priority-${task.priority.toLowerCase()}`}><i/>{task.priority}</span></div></div>{!compact && <div className="task-actions"><button className="icon-button" aria-label={`Edit ${task.title}`} onClick={() => editTask(task)}><Pencil size={16}/></button><button className="icon-button delete-button" aria-label={`Delete ${task.title}`} onClick={() => deleteTask(task)}><Trash2 size={16}/></button></div>}</article>;
}
