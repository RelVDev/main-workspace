-- P05.9: rate limit fixed-window berbasis Postgres. Tanpa layanan eksternal; aman di Vercel serverless.
-- Kunci: "s:{sessionId}" (utama, ketat) atau "ip:{hash}" (longgar, D15).

create table if not exists rate_limits (
  key           text        not null,
  window_start  timestamptz not null,
  hits          int         not null default 0,
  primary key (key, window_start)
);

alter table rate_limits enable row level security;
revoke all on rate_limits from anon, authenticated;

-- Menaikkan penghitung jendela berjalan dan mengembalikan true bila masih di bawah batas.
-- Atomik: satu statement INSERT ... ON CONFLICT.
create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_start timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits  int;
begin
  insert into rate_limits (key, window_start, hits)
  values (p_key, v_start, 1)
  on conflict (key, window_start) do update set hits = rate_limits.hits + 1
  returning hits into v_hits;

  -- Bersihkan jendela lama sesekali (murah: indeks pada primary key).
  if random() < 0.01 then
    delete from rate_limits where window_start < now() - interval '1 hour';
  end if;

  return v_hits <= p_limit;
end
$$;

revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;
