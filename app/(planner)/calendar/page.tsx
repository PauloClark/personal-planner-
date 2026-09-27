'use client';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { MonthCalendar } from '@/components/calendar/month-calendar';
import { usePlanner } from '@/components/planner-provider';
import { LoadingState } from '@/components/ui/states';
export default function CalendarPage() { const {addEvent, loading} = usePlanner(); return <><PageHeader eyebrow="THE BIG PICTURE" title="Your calendar" description="A place for your plans, big and small." action={<button className="button primary" onClick={() => addEvent()}><Plus size={18}/>Add event</button>}/>{loading ? <LoadingState/> : <MonthCalendar/>}</>; }
