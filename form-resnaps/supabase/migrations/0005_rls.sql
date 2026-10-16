-- P03.6: RLS dan grant (§5.4).
-- anon: tidak ada akses. authenticated + committee_members: baca tabel tertentu saja.
-- Penulisan hanya lewat RPC (dipanggil server dengan service_role).

-- Fungsi pemeriksaan panitia untuk policy. Dibuat SECURITY DEFINER agar tidak
-- bergantung pada RLS committee_members itu sendiri.
create or replace function public.is_committee()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from committee_members where user_id = auth.uid())
$$;

-- Aktifkan RLS di semua tabel.
alter table guests            enable row level security;
alter table scan_sessions     enable row level security;
alter table attendance_logs   enable row level security;
alter table event_settings    enable row level security;
alter table committee_members enable row level security;
alter table audit_logs        enable row level security;

-- Policy baca untuk panitia.
create policy committee_read_guests on guests
  for select to authenticated using (is_committee());
create policy committee_read_attendance on attendance_logs
  for select to authenticated using (is_committee());
create policy committee_read_settings on event_settings
  for select to authenticated using (is_committee());
create policy committee_read_audit on audit_logs
  for select to authenticated using (is_committee());
create policy committee_read_self on committee_members
  for select to authenticated using (user_id = auth.uid());

-- scan_sessions: tanpa policy → tidak terbaca anon/authenticated (hanya service_role).

-- Cabut semua hak default, lalu berikan yang diizinkan saja.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant select on guests, attendance_logs, event_settings, audit_logs to authenticated;
grant select on committee_members to authenticated;
grant select on guest_status to authenticated;

-- Policy memanggil is_committee() sebagai role authenticated; EXECUTE wajib diberikan.
grant execute on function is_committee() to authenticated;

-- Fungsi hanya untuk server (service_role). Trigger & helper tidak perlu dipanggil klien.
grant execute on function
  start_scan_session(attendance_type, int, text, text),
  search_guests(text, attendance_type, int),
  check_in(uuid, uuid, text),
  check_out(uuid, uuid, text),
  manual_attendance(uuid, attendance_type, uuid),
  undo_attendance(uuid, attendance_type, uuid, text),
  revoke_all_sessions(uuid)
to service_role;

-- service_role perlu akses penuh ke tabel untuk server (import, export, scan_sessions).
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Default untuk objek baru di masa depan: jangan beri anon/authenticated akses.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from public, anon, authenticated;
