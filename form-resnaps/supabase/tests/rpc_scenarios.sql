-- P03.9: skenario RPC (Postgres lokal, bukan Supabase). Gagal = exception (psql ON_ERROR_STOP).
-- Setiap skenario memakai tamu baru agar tidak saling mengunci. Seluruh perubahan di-rollback.
-- Jalankan: psql -v ON_ERROR_STOP=1 -f supabase/tests/rpc_scenarios.sql

\set ON_ERROR_STOP on
begin;

create or replace function pg_temp.expect(p_label text, p_got jsonb, p_want text) returns void
language plpgsql as $$
begin
  if p_got->>'code' is distinct from p_want then
    raise exception 'FAIL %: want %, got %', p_label, p_want, p_got;
  end if;
  raise notice 'PASS %: %', p_label, p_want;
end $$;

create or replace function pg_temp.expect_raise(p_label text, p_sql text, p_errcode text) returns void
language plpgsql as $$
declare v_state text;
begin
  execute p_sql;
  raise exception 'FAIL %: expected error %, got none', p_label, p_errcode;
exception when others then
  get stacked diagnostics v_state = returned_sqlstate;
  if v_state is distinct from p_errcode then
    raise exception 'FAIL %: want sqlstate %, got % (%)', p_label, p_errcode, v_state, sqlerrm;
  end if;
  raise notice 'PASS %: sqlstate %', p_label, p_errcode;
end $$;

update event_settings set value = 'true' where key in ('checkin_open', 'checkout_open');

insert into guests (full_name, category) values ('UJI A', 'uji') returning id as ga \gset
insert into guests (full_name, category) values ('UJI B', 'uji') returning id as gb \gset
insert into guests (full_name, category) values ('UJI C', 'uji') returning id as gc \gset
insert into guests (full_name, category) values ('UJI D', 'uji') returning id as gd \gset

-- 1. check_out tanpa in -> not_checked_in
select (start_scan_session('out', 1, 'h', 'ua')->>'id') as s1 \gset
select pg_temp.expect('checkout tanpa in', check_out(:'s1'::uuid, :'ga'::uuid, 'ua'), 'not_checked_in') \g /dev/null

-- 2. sesi mode out dipakai di check_in -> session_invalid
select pg_temp.expect('mode out di check_in', check_in(:'s1'::uuid, :'ga'::uuid, 'ua'), 'session_invalid') \g /dev/null

-- 3. check_in sukses; sesi yang sama dipakai lagi -> session_used
select (start_scan_session('in', 1, 'h', 'ua')->>'id') as s2 \gset
select pg_temp.expect('check_in pertama', check_in(:'s2'::uuid, :'ga'::uuid, 'ua'), 'ok') \g /dev/null
select pg_temp.expect('sesi dipakai dua kali', check_in(:'s2'::uuid, :'gb'::uuid, 'ua'), 'session_used') \g /dev/null

-- 4. already_in tidak mengonsumsi sesi (ga sudah masuk di skenario 3)
select (start_scan_session('in', 1, 'h', 'ua')->>'id') as s3 \gset
select pg_temp.expect('already_in', check_in(:'s3'::uuid, :'ga'::uuid, 'ua'), 'already_in') \g /dev/null
select pg_temp.expect('sesi utuh setelah already_in', check_in(:'s3'::uuid, :'gb'::uuid, 'ua'), 'ok') \g /dev/null

-- 5. sesi kedaluwarsa -> session_expired
select (start_scan_session('in', 1, 'h', 'ua')->>'id') as s4 \gset
update scan_sessions set expires_at = now() - interval '1 second' where id = :'s4'::uuid;
select pg_temp.expect('sesi kedaluwarsa', check_in(:'s4'::uuid, :'gc'::uuid, 'ua'), 'session_expired') \g /dev/null

-- 6. key_version basi -> session_invalid
select (start_scan_session('in', 1, 'h', 'ua')->>'id') as s5 \gset
update event_settings set value = '2' where key = 'qr_key_version';
select pg_temp.expect('key_version basi', check_in(:'s5'::uuid, :'gc'::uuid, 'ua'), 'session_invalid') \g /dev/null
update event_settings set value = '1' where key = 'qr_key_version';

-- 7. absen ditutup -> closed; sesi tidak terkonsumsi sehingga tetap bisa dipakai setelah dibuka
select (start_scan_session('in', 1, 'h', 'ua')->>'id') as s6 \gset
update event_settings set value = 'false' where key = 'checkin_open';
select pg_temp.expect('absen ditutup', check_in(:'s6'::uuid, :'gc'::uuid, 'ua'), 'closed') \g /dev/null
update event_settings set value = 'true' where key = 'checkin_open';
select pg_temp.expect('sesi utuh setelah closed', check_in(:'s6'::uuid, :'gc'::uuid, 'ua'), 'ok') \g /dev/null

-- 8. check_out sukses setelah in (ga sudah masuk)
select (start_scan_session('out', 1, 'h', 'ua')->>'id') as s7 \gset
select pg_temp.expect('check_out sukses', check_out(:'s7'::uuid, :'ga'::uuid, 'ua'), 'ok') \g /dev/null

-- 9. revoke_all_sessions: committee ditolak; admin berhasil; sesi lama tidak valid
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'committee@uji'),
  ('00000000-0000-0000-0000-00000000000b', 'admin@uji');
insert into committee_members (user_id, role) values
  ('00000000-0000-0000-0000-00000000000a', 'committee'),
  ('00000000-0000-0000-0000-00000000000b', 'admin');

select pg_temp.expect_raise('committee tidak boleh revoke',
  $q$select revoke_all_sessions('00000000-0000-0000-0000-00000000000a')$q$, '42501') \g /dev/null

select (start_scan_session('in', 1, 'h', 'ua')->>'id') as s_old \gset
select revoke_all_sessions('00000000-0000-0000-0000-00000000000b') \g /dev/null
select pg_temp.expect('sesi lama setelah revoke', check_in(:'s_old'::uuid, :'gd'::uuid, 'ua'), 'session_invalid') \g /dev/null
select pg_temp.expect('sesi baru dengan key baru', start_scan_session('in', 2, 'h', 'ua'), 'ok') \g /dev/null

-- 10. manual_attendance: non-panitia ditolak
select pg_temp.expect_raise('manual non-panitia ditolak',
  $q$select manual_attendance('00000000-0000-0000-0000-00000000000c'::uuid, 'in', '00000000-0000-0000-0000-00000000000c'::uuid)$q$, '42501') \g /dev/null

rollback;
\echo ALL SCENARIOS PASSED
