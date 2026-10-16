-- P03.7: default event_settings (§5.1, P03.7). Aman diulang (on conflict do nothing).

insert into event_settings (key, value) values
  ('checkin_open',         'false'::jsonb),
  ('checkout_open',        'false'::jsonb),
  ('qr_window_seconds',    '30'::jsonb),
  ('qr_grace_windows',     '1'::jsonb),
  ('session_ttl_seconds',  '600'::jsonb),
  ('qr_key_version',       '1'::jsonb),
  ('verification_mode',    'false'::jsonb),
  ('event_name',           '"RE:SNAPS — Closing Party CHRYSALIS"'::jsonb),
  ('event_date',           'null'::jsonb)
on conflict (key) do nothing;
