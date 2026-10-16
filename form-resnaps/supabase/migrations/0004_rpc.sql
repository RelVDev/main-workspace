-- P03.5: fungsi RPC (§5.3). Semua SECURITY DEFINER dengan search_path terkunci.
-- Setiap fungsi mengembalikan jsonb { "code": "...", ... }. Kode mengikuti §5.3.
-- Validasi selalu sebelum mutasi; kegagalan tidak pernah mengonsumsi sesi.

-- ---------- helper ----------

create or replace function public.normalize_name(p text)
returns text
language sql
stable
set search_path = public, extensions, pg_temp
as $$
  select lower(unaccent(regexp_replace(btrim(coalesce(p, '')), '\s+', ' ', 'g')))
$$;

-- Menjaga name_search selalu konsisten dengan full_name (dipakai juga oleh import).
create or replace function public.guests_set_name_search()
returns trigger
language plpgsql
set search_path = public, extensions, pg_temp
as $$
begin
  new.full_name   := regexp_replace(btrim(new.full_name), '\s+', ' ', 'g');
  new.name_search := normalize_name(new.full_name);
  return new;
end
$$;

create trigger guests_name_search
  before insert or update of full_name on guests
  for each row execute function public.guests_set_name_search();

create or replace function public.setting_text(p_key text)
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select value #>> '{}' from event_settings where key = p_key
$$;

-- Melempar error 42501 bila aktor bukan panitia (atau bukan admin bila p_admin).
create or replace function public.assert_committee(p_actor uuid, p_admin boolean default false)
returns void
language plpgsql
stable
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from committee_members m
    where m.user_id = p_actor
      and (not p_admin or m.role = 'admin')
  ) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
end
$$;

-- ---------- sesi scan ----------

create or replace function public.start_scan_session(
  p_mode        attendance_type,
  p_key_version int,
  p_ip_hash     text,
  p_ua          text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ttl     int := coalesce(setting_text('session_ttl_seconds')::int, 600);
  v_current int := setting_text('qr_key_version')::int;
  v_id      uuid;
  v_exp     timestamptz;
begin
  if p_key_version is distinct from v_current then
    return jsonb_build_object('code', 'token_revoked');
  end if;

  if setting_text(case when p_mode = 'in' then 'checkin_open' else 'checkout_open' end)
       is distinct from 'true' then
    return jsonb_build_object('code', 'closed');
  end if;

  insert into scan_sessions (mode, key_version, expires_at, ip_hash, user_agent)
  values (p_mode, p_key_version, now() + make_interval(secs => v_ttl), p_ip_hash, left(p_ua, 300))
  returning id, expires_at into v_id, v_exp;

  return jsonb_build_object('code', 'ok', 'id', v_id, 'expires_at', v_exp);
end
$$;

-- ---------- pencarian ----------

-- Mode dikirim dari sesi oleh server, bukan dari URL.
create or replace function public.search_guests(
  p_query text,
  p_mode  attendance_type,
  p_limit int default 8
)
returns table (id uuid, full_name text, category text)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select g.id, g.full_name, g.category
  from guests g
  where char_length(normalize_name(p_query)) >= 2
    and g.name_search like
        '%' || replace(replace(replace(normalize_name(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
    and case p_mode
          when 'in' then not exists (
            select 1 from attendance_logs a where a.guest_id = g.id and a.type = 'in')
          when 'out' then exists (
            select 1 from attendance_logs a where a.guest_id = g.id and a.type = 'in')
            and not exists (
            select 1 from attendance_logs a where a.guest_id = g.id and a.type = 'out')
        end
  order by similarity(g.name_search, normalize_name(p_query)) desc, g.name_search
  limit least(greatest(coalesce(p_limit, 8), 1), 8)
$$;

-- ---------- absen dari sesi ----------

-- Urutan validasi: sesi ada & mode → key_version → belum dikonsumsi → belum kedaluwarsa
-- → absen dibuka → tamu ada → belum absen. Hanya sukses yang mengonsumsi sesi.
create or replace function public.check_in(p_session_id uuid, p_guest_id uuid, p_ua text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  s     scan_sessions%rowtype;
  v_at  timestamptz;
begin
  select * into s from scan_sessions where id = p_session_id for update;
  if not found or s.mode <> 'in' then
    return jsonb_build_object('code', 'session_invalid');
  end if;
  if s.key_version is distinct from setting_text('qr_key_version')::int then
    return jsonb_build_object('code', 'session_invalid');
  end if;
  if s.consumed_at is not null then
    return jsonb_build_object('code', 'session_used');
  end if;
  if s.expires_at <= now() then
    return jsonb_build_object('code', 'session_expired');
  end if;
  if setting_text('checkin_open') is distinct from 'true' then
    return jsonb_build_object('code', 'closed');
  end if;
  if not exists (select 1 from guests where id = p_guest_id) then
    return jsonb_build_object('code', 'not_found');
  end if;

  insert into attendance_logs (guest_id, type, source, session_id, user_agent)
  values (p_guest_id, 'in', 'qr', p_session_id, left(p_ua, 300))
  on conflict (guest_id, type) do nothing
  returning scanned_at into v_at;

  if not found then
    select scanned_at into v_at from attendance_logs
      where guest_id = p_guest_id and type = 'in';
    return jsonb_build_object('code', 'already_in', 'scanned_at', v_at);
  end if;

  update scan_sessions set consumed_at = now(), guest_id = p_guest_id where id = p_session_id;
  return jsonb_build_object('code', 'ok', 'scanned_at', v_at);
end
$$;

create or replace function public.check_out(p_session_id uuid, p_guest_id uuid, p_ua text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  s     scan_sessions%rowtype;
  v_at  timestamptz;
begin
  select * into s from scan_sessions where id = p_session_id for update;
  if not found or s.mode <> 'out' then
    return jsonb_build_object('code', 'session_invalid');
  end if;
  if s.key_version is distinct from setting_text('qr_key_version')::int then
    return jsonb_build_object('code', 'session_invalid');
  end if;
  if s.consumed_at is not null then
    return jsonb_build_object('code', 'session_used');
  end if;
  if s.expires_at <= now() then
    return jsonb_build_object('code', 'session_expired');
  end if;
  if setting_text('checkout_open') is distinct from 'true' then
    return jsonb_build_object('code', 'closed');
  end if;
  if not exists (select 1 from guests where id = p_guest_id) then
    return jsonb_build_object('code', 'not_found');
  end if;
  if not exists (select 1 from attendance_logs where guest_id = p_guest_id and type = 'in') then
    return jsonb_build_object('code', 'not_checked_in');
  end if;

  insert into attendance_logs (guest_id, type, source, session_id, user_agent)
  values (p_guest_id, 'out', 'qr', p_session_id, left(p_ua, 300))
  on conflict (guest_id, type) do nothing
  returning scanned_at into v_at;

  if not found then
    select scanned_at into v_at from attendance_logs
      where guest_id = p_guest_id and type = 'out';
    return jsonb_build_object('code', 'already_out', 'scanned_at', v_at);
  end if;

  update scan_sessions set consumed_at = now(), guest_id = p_guest_id where id = p_session_id;
  return jsonb_build_object('code', 'ok', 'scanned_at', v_at);
end
$$;

-- ---------- operasi panitia (tanpa sesi) ----------

create or replace function public.manual_attendance(
  p_guest_id uuid,
  p_type     attendance_type,
  p_actor    uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_at timestamptz;
begin
  perform assert_committee(p_actor);

  if not exists (select 1 from guests where id = p_guest_id) then
    return jsonb_build_object('code', 'not_found');
  end if;
  if p_type = 'out' and not exists (
       select 1 from attendance_logs where guest_id = p_guest_id and type = 'in') then
    return jsonb_build_object('code', 'not_checked_in');
  end if;

  insert into attendance_logs (guest_id, type, source, actor)
  values (p_guest_id, p_type, 'manual', p_actor)
  on conflict (guest_id, type) do nothing
  returning scanned_at into v_at;

  if not found then
    return jsonb_build_object('code', case when p_type = 'in' then 'already_in' else 'already_out' end);
  end if;

  insert into audit_logs (actor, action, target_guest, meta)
  values (p_actor, 'manual_attendance', p_guest_id, jsonb_build_object('type', p_type));

  return jsonb_build_object('code', 'ok', 'scanned_at', v_at);
end
$$;

-- Hapus satu log. Tidak boleh menghapus 'in' bila 'out' sudah ada (kode: already_out).
-- Tidak ada log untuk dihapus → not_found. Alasan wajib.
create or replace function public.undo_attendance(
  p_guest_id uuid,
  p_type     attendance_type,
  p_actor    uuid,
  p_reason   text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_removed attendance_logs%rowtype;
begin
  perform assert_committee(p_actor);

  if btrim(coalesce(p_reason, '')) = '' then
    raise exception 'reason_required' using errcode = '22023';
  end if;

  if p_type = 'in' and exists (
       select 1 from attendance_logs where guest_id = p_guest_id and type = 'out') then
    return jsonb_build_object('code', 'already_out');
  end if;

  delete from attendance_logs
  where guest_id = p_guest_id and type = p_type
  returning * into v_removed;

  if not found then
    return jsonb_build_object('code', 'not_found');
  end if;

  insert into audit_logs (actor, action, target_guest, meta)
  values (p_actor, 'undo_attendance', p_guest_id, jsonb_build_object(
    'type', p_type,
    'reason', btrim(p_reason),
    'previous_source', v_removed.source,
    'previous_scanned_at', v_removed.scanned_at
  ));

  return jsonb_build_object('code', 'ok');
end
$$;

-- Naikkan qr_key_version dan hangus-kan semua sesi aktif. Hanya admin.
create or replace function public.revoke_all_sessions(p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_new int;
begin
  perform assert_committee(p_actor, true);

  update event_settings
     set value = to_jsonb(setting_text('qr_key_version')::int + 1), updated_at = now()
   where key = 'qr_key_version'
  returning (value #>> '{}')::int into v_new;

  update scan_sessions set expires_at = now() where expires_at > now();

  insert into audit_logs (actor, action, meta)
  values (p_actor, 'revoke_sessions', jsonb_build_object('new_key_version', v_new));

  return jsonb_build_object('code', 'ok', 'key_version', v_new);
end
$$;
