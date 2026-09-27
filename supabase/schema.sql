-- Run in a new Supabase project's SQL Editor. Safe to run again.
begin;
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  description text check (length(description) <= 5000),
  event_date date not null,
  start_time time,
  end_time time,
  category text not null default 'Personal' check (category in ('Personal','Work','School','Appointment','Bills','Important','Other')),
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  location text check (length(location) <= 500),
  status text not null default 'upcoming' check (status in ('upcoming','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_event_times check (end_time is null or (start_time is not null and end_time > start_time))
);
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  description text check (length(description) <= 5000),
  due_date date,
  priority text not null default 'Medium' check (priority in ('Low','Medium','High')),
  status text not null default 'pending' check (status in ('pending','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists events_user_date_idx on public.events(user_id, event_date);
create index if not exists tasks_user_status_idx on public.tasks(user_id, status);
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists events_updated_at on public.events;
create trigger events_updated_at before update on public.events for each row execute function public.set_updated_at();
drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
alter table public.events enable row level security;
alter table public.tasks enable row level security;
revoke all on public.events, public.tasks from anon;
grant select, insert, update, delete on public.events, public.tasks to authenticated;
drop policy if exists events_select_own on public.events;
drop policy if exists events_insert_own on public.events;
drop policy if exists events_update_own on public.events;
drop policy if exists events_delete_own on public.events;
create policy events_select_own on public.events for select to authenticated using ((select auth.uid()) = user_id);
create policy events_insert_own on public.events for insert to authenticated with check ((select auth.uid()) = user_id);
create policy events_update_own on public.events for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy events_delete_own on public.events for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists tasks_select_own on public.tasks;
drop policy if exists tasks_insert_own on public.tasks;
drop policy if exists tasks_update_own on public.tasks;
drop policy if exists tasks_delete_own on public.tasks;
create policy tasks_select_own on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy tasks_insert_own on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy tasks_update_own on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy tasks_delete_own on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);
commit;

-- Version 2: additive, safe for existing events and existing RLS policies.
begin;
alter table public.events
  add column if not exists recurrence text not null default 'none' check (recurrence in ('none','daily','weekly','monthly','yearly')),
  add column if not exists recurrence_interval integer not null default 1 check (recurrence_interval between 1 and 999),
  add column if not exists recurrence_end_date date,
  add column if not exists reminder_minutes integer check (reminder_minutes in (10,30,60,1440));
alter table public.events drop constraint if exists valid_recurrence_end;
alter table public.events add constraint valid_recurrence_end check (recurrence_end_date is null or recurrence_end_date >= event_date);
commit;
