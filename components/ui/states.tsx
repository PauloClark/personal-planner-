import { CalendarDays, LoaderCircle } from 'lucide-react';
export function LoadingState() { return <div className="empty-state" role="status"><LoaderCircle className="spin" size={24}/><p>Getting your planner ready…</p></div>; }
export function EmptyState({title = 'A little room to breathe', description = 'Nothing planned here yet.', action}: {title?: string; description?: string; action?: React.ReactNode}) { return <div className="empty-state"><span className="empty-icon"><CalendarDays size={24}/></span><h3>{title}</h3><p>{description}</p>{action}</div>; }
