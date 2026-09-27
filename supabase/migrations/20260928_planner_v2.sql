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
