-- P17: Status Pembayaran HTM (lunas / belum_lunas), Hold Absensi, dan Voucher Terpadu (Makan & Photobooth 1x pakai).

-- 1. Tambahkan kolom baru pada tabel guests
alter table guests
  add column if not exists payment_status text not null default 'lunas'
    check (payment_status in ('lunas', 'belum_lunas')),
  add column if not exists hold_at timestamptz,
  add column if not exists voucher_code text unique,
  add column if not exists meal_redeemed_at timestamptz,
  add column if not exists meal_redeemed_by uuid references auth.users(id),
  add column if not exists photobooth_redeemed_at timestamptz,
  add column if not exists photobooth_redeemed_by uuid references auth.users(id);

-- Isi voucher_code otomatis untuk baris yang sudah ada
update guests
set voucher_code = 'RSNP-' || upper(substr(md5(id::text || 'resnaps-voucher'), 1, 8))
where voucher_code is null;

-- Trigger agar setiap tamu baru otomatis mendapat voucher_code unik bila belum diisi
create or replace function public.guests_set_voucher_code()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.voucher_code is null or btrim(new.voucher_code) = '' then
    new.voucher_code := 'RSNP-' || upper(substr(md5(coalesce(new.id::text, gen_random_uuid()::text) || 'resnaps-voucher'), 1, 8));
  end if;
  return new;
end
$$;

drop trigger if exists guests_voucher_code on guests;
create trigger guests_voucher_code
  before insert on guests
  for each row execute function public.guests_set_voucher_code();

-- 2. Perbarui view guest_status untuk menyertakan status ’ditahan’ (hold), HTM, dan voucher
drop view if exists guest_status;
create view guest_status with (security_invoker = true) as
select
  g.id                     as guest_id,
  g.full_name,
  g.category,
  g.payment_status,
  g.hold_at,
  g.voucher_code,
  g.meal_redeemed_at,
  g.photobooth_redeemed_at,
  ci.scanned_at            as checked_in_at,
  co.scanned_at            as checked_out_at,
  case
    when co.scanned_at is not null then 'sudah_pulang'
    when ci.scanned_at is not null then 'di_dalam'
    when g.hold_at is not null and g.payment_status = 'belum_lunas' then 'ditahan'
    else 'belum_hadir'
  end                      as status
from guests g
left join attendance_logs ci on ci.guest_id = g.id and ci.type = 'in'
left join attendance_logs co on co.guest_id = g.id and co.type = 'out';

grant select on guest_status to authenticated, service_role;

-- 3. Perbarui fungsi check_in agar menahan absensi (payment_hold) bila payment_status = 'belum_lunas'
create or replace function public.check_in(p_session_id uuid, p_guest_id uuid, p_ua text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  s        scan_sessions%rowtype;
  g        guests%rowtype;
  v_at     timestamptz;
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

  select * into g from guests where id = p_guest_id for update;
  if not found then
    return jsonb_build_object('code', 'not_found');
  end if;

  -- Jika tamu belum lunas HTM, tahan status absen (hold) sampai diizinkan panitia
  if g.payment_status = 'belum_lunas' then
    update guests
       set hold_at = coalesce(hold_at, now())
     where id = p_guest_id
     returning hold_at into v_at;

    update scan_sessions set consumed_at = now(), guest_id = p_guest_id where id = p_session_id;
    return jsonb_build_object(
      'code', 'payment_hold',
      'hold_at', v_at,
      'voucher_code', g.voucher_code
    );
  end if;

  insert into attendance_logs (guest_id, type, source, session_id, user_agent)
  values (p_guest_id, 'in', 'qr', p_session_id, left(p_ua, 300))
  on conflict (guest_id, type) do nothing
  returning scanned_at into v_at;

  if not found then
    select scanned_at into v_at from attendance_logs
      where guest_id = p_guest_id and type = 'in';
    return jsonb_build_object('code', 'already_in', 'scanned_at', v_at, 'voucher_code', g.voucher_code);
  end if;

  update guests set hold_at = null where id = p_guest_id;
  update scan_sessions set consumed_at = now(), guest_id = p_guest_id where id = p_session_id;
  return jsonb_build_object('code', 'ok', 'scanned_at', v_at, 'voucher_code', g.voucher_code);
end
$$;

-- 4. Fungsi RPC untuk Panitia: Lunasi HTM & Setujui Masuk tamu yang sedang ditahan (hold)
create or replace function public.approve_guest_checkin(
  p_guest_id uuid,
  p_actor    uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  g    guests%rowtype;
  v_at timestamptz;
begin
  perform assert_committee(p_actor);

  select * into g from guests where id = p_guest_id for update;
  if not found then
    return jsonb_build_object('code', 'not_found');
  end if;

  update guests
     set payment_status = 'lunas',
         hold_at = null
   where id = p_guest_id;

  insert into attendance_logs (guest_id, type, source, actor)
  values (p_guest_id, 'in', 'qr', p_actor)
  on conflict (guest_id, type) do update set scanned_at = attendance_logs.scanned_at
  returning scanned_at into v_at;

  insert into audit_logs (actor, action, target_guest, meta)
  values (p_actor, 'approve_hold_checkin', p_guest_id, jsonb_build_object(
    'payment_status', 'lunas',
    'scanned_at', v_at
  ));

  return jsonb_build_object(
    'code', 'ok',
    'scanned_at', v_at,
    'voucher_code', g.voucher_code
  );
end
$$;

-- 5. Fungsi RPC untuk Panitia: Ubah status pembayaran HTM (lunas / belum_lunas)
create or replace function public.set_guest_payment_status(
  p_guest_id uuid,
  p_status   text,
  p_actor    uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform assert_committee(p_actor);

  if p_status not in ('lunas', 'belum_lunas') then
    return jsonb_build_object('code', 'invalid_input');
  end if;

  update guests
     set payment_status = p_status,
         hold_at = case when p_status = 'lunas' then null else hold_at end
   where id = p_guest_id;

  if not found then
    return jsonb_build_object('code', 'not_found');
  end if;

  insert into audit_logs (actor, action, target_guest, meta)
  values (p_actor, 'set_payment_status', p_guest_id, jsonb_build_object('payment_status', p_status));

  return jsonb_build_object('code', 'ok', 'payment_status', p_status);
end
$$;

-- 6. Fungsi RPC untuk Panitia: Scan & Tukar Voucher (meal / photobooth) maksimal 1x pakai per jenis
create or replace function public.redeem_guest_voucher(
  p_code  text,
  p_kind  text,
  p_actor uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  g     guests%rowtype;
  v_now timestamptz := now();
begin
  perform assert_committee(p_actor);

  if p_kind not in ('meal', 'photobooth') then
    return jsonb_build_object('code', 'invalid_input');
  end if;

  select * into g from guests
   where upper(voucher_code) = upper(btrim(p_code))
      or id::text = btrim(p_code)
   for update;

  if not found then
    return jsonb_build_object('code', 'voucher_invalid');
  end if;

  if g.payment_status = 'belum_lunas' then
    return jsonb_build_object('code', 'payment_hold', 'full_name', g.full_name, 'category', g.category);
  end if;

  if not exists (select 1 from attendance_logs where guest_id = g.id and type = 'in') then
    return jsonb_build_object('code', 'not_checked_in', 'full_name', g.full_name, 'category', g.category);
  end if;

  if p_kind = 'meal' then
    if g.meal_redeemed_at is not null then
      return jsonb_build_object(
        'code', 'voucher_already_used',
        'kind', 'meal',
        'redeemed_at', g.meal_redeemed_at,
        'full_name', g.full_name,
        'category', g.category
      );
    end if;

    update guests set meal_redeemed_at = v_now, meal_redeemed_by = p_actor where id = g.id;
  else
    if g.photobooth_redeemed_at is not null then
      return jsonb_build_object(
        'code', 'voucher_already_used',
        'kind', 'photobooth',
        'redeemed_at', g.photobooth_redeemed_at,
        'full_name', g.full_name,
        'category', g.category
      );
    end if;

    update guests set photobooth_redeemed_at = v_now, photobooth_redeemed_by = p_actor where id = g.id;
  end if;

  insert into audit_logs (actor, action, target_guest, meta)
  values (p_actor, 'redeem_voucher_' || p_kind, g.id, jsonb_build_object(
    'kind', p_kind,
    'voucher_code', g.voucher_code,
    'redeemed_at', v_now
  ));

  return jsonb_build_object(
    'code', 'ok',
    'kind', p_kind,
    'guest_id', g.id,
    'full_name', g.full_name,
    'category', g.category,
    'voucher_code', g.voucher_code,
    'redeemed_at', v_now,
    'meal_redeemed_at', case when p_kind = 'meal' then v_now else g.meal_redeemed_at end,
    'photobooth_redeemed_at', case when p_kind = 'photobooth' then v_now else g.photobooth_redeemed_at end
  );
end
$$;

grant execute on function
  approve_guest_checkin(uuid, uuid),
  set_guest_payment_status(uuid, text, uuid),
  redeem_guest_voucher(text, text, uuid)
to service_role;
