-- WARNING: Development-only reset script.
-- This deletes all current users, events, joins, forms, groups, and group members.
-- Run in Supabase SQL Editor only when you want a clean start.

begin;

-- Remove dependent data first (explicit order for clarity).
delete from public.event_group_members;
delete from public.event_group_messages;
delete from public.event_groups;
delete from public.event_forms;
delete from public.joins;
delete from public.events;
delete from public.users;

commit;

-- Optional check
-- select
--   (select count(*) from public.users) as users_count,
--   (select count(*) from public.events) as events_count,
--   (select count(*) from public.joins) as joins_count,
--   (select count(*) from public.event_forms) as forms_count,
--   (select count(*) from public.event_groups) as groups_count,
--   (select count(*) from public.event_group_members) as group_members_count;
