-- Run this once in Supabase SQL editor.
-- If you use only publishable/anon key, keep the policies below enabled.

create table if not exists public.users (
  id uuid primary key,
  name text not null,
  email text unique,
  password_hash text,
  region text not null check (region in ('Almaty', 'Astana')),
  birth_date date not null,
  role text not null check (role in ('Participant', 'Coordinator')),
  photo_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.events (
  id uuid primary key,
  name text not null,
  description text not null,
  region text not null check (region in ('Almaty', 'Astana')),
  photo_url text not null,
  coordinator_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.joins (
  id uuid primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null references public.users(id) on delete cascade,
  shift text not null check (shift in ('Morning', 'Afternoon', 'Night')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  form_answers jsonb,
  joined_at timestamptz not null default now(),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  updated_at timestamptz,
  unique (event_id, participant_id)
);

create table if not exists public.event_forms (
  id uuid primary key,
  event_id uuid not null unique references public.events(id) on delete cascade,
  title text not null,
  is_enabled boolean not null default false,
  fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.event_groups (
  id uuid primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  coordinators_only boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (event_id, name)
);

create table if not exists public.event_group_members (
  id uuid primary key,
  group_id uuid not null references public.event_groups(id) on delete cascade,
  participant_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, participant_id)
);

create table if not exists public.event_group_messages (
  id uuid primary key,
  group_id uuid not null references public.event_groups(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.joins add column if not exists status text not null default 'pending';
alter table public.joins add column if not exists requested_at timestamptz not null default now();
alter table public.joins add column if not exists decided_at timestamptz;
alter table public.joins add column if not exists form_answers jsonb;
alter table public.users add column if not exists email text;
alter table public.users add column if not exists password_hash text;
alter table public.event_forms add column if not exists is_enabled boolean not null default false;
alter table public.event_groups add column if not exists coordinators_only boolean not null default false;
create unique index if not exists users_email_unique_idx on public.users (lower(email));
alter table public.joins drop constraint if exists joins_status_check;
alter table public.joins add constraint joins_status_check check (status in ('pending', 'approved', 'declined'));

with normalized as (
  select
    id,
    lower(regexp_replace(coalesce(name, ''), '[^a-zA-Z0-9]+', '', 'g')) as base_name
  from public.users
  where email is null or trim(email) = ''
),
ranked as (
  select
    id,
    case
      when base_name = '' then 'user'
      else base_name
    end as safe_base_name,
    row_number() over (
      partition by case when base_name = '' then 'user' else base_name end
      order by id
    ) as duplicate_idx
  from normalized
)
update public.users u
set email = case
  when r.duplicate_idx = 1 then concat(r.safe_base_name, '@mail.ms')
  else concat(r.safe_base_name, r.duplicate_idx::text, '@mail.ms')
end
from ranked r
where u.id = r.id;

update public.users
set password_hash = 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f'
where password_hash is null or trim(password_hash) = '';

alter table public.users enable row level security;
alter table public.events enable row level security;
alter table public.joins enable row level security;
alter table public.event_forms enable row level security;
alter table public.event_groups enable row level security;
alter table public.event_group_members enable row level security;
alter table public.event_group_messages enable row level security;

drop policy if exists "public users full access" on public.users;
drop policy if exists "public events full access" on public.events;
drop policy if exists "public joins full access" on public.joins;
drop policy if exists "public event_forms full access" on public.event_forms;
drop policy if exists "public event_groups full access" on public.event_groups;
drop policy if exists "public event_group_members full access" on public.event_group_members;
drop policy if exists "public event_group_messages full access" on public.event_group_messages;

create policy "public users full access"
on public.users
for all
to anon, authenticated
using (true)
with check (true);

create policy "public events full access"
on public.events
for all
to anon, authenticated
using (true)
with check (true);

create policy "public joins full access"
on public.joins
for all
to anon, authenticated
using (true)
with check (true);

create policy "public event_forms full access"
on public.event_forms
for all
to anon, authenticated
using (true)
with check (true);

create policy "public event_groups full access"
on public.event_groups
for all
to anon, authenticated
using (true)
with check (true);

create policy "public event_group_members full access"
on public.event_group_members
for all
to anon, authenticated
using (true)
with check (true);

create policy "public event_group_messages full access"
on public.event_group_messages
for all
to anon, authenticated
using (true)
with check (true);

-- Supabase Storage (for profile and event images)
insert into storage.buckets (id, name, public)
values ('ngo-assets', 'ngo-assets', true)
on conflict (id) do nothing;

drop policy if exists "public storage read" on storage.objects;
drop policy if exists "public storage insert" on storage.objects;
drop policy if exists "public storage update" on storage.objects;
drop policy if exists "public storage delete" on storage.objects;

create policy "public storage read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'ngo-assets');

create policy "public storage insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'ngo-assets');

create policy "public storage update"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'ngo-assets')
with check (bucket_id = 'ngo-assets');

create policy "public storage delete"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'ngo-assets');
