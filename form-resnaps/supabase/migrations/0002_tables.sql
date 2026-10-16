-- P03.3: tabel inti (§5.1). scan_sessions sebelum attendance_logs.

create table guests (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null check (char_length(full_name) between 1 and 120),
  name_search   text not null,          -- lower + unaccent + trim + spasi tunggal
  category      text,                   -- divisi / angkatan / grup (pembeda nama kembar)
  contact       text,                   -- opsional, tidak pernah dikirim ke tamu
  notes         text,
  import_batch  text,
  created_at    timestamptz not null default now()
);
create index guests_name_trgm on guests using gin (name_search gin_trgm_ops);

-- satu scan QR = satu sesi
create table scan_sessions (
  id           uuid primary key default gen_random_uuid(),
  mode         attendance_type not null,       -- ditentukan token QR, bukan URL
  key_version  int not null,                   -- salinan event_settings.qr_key_version saat dibuat
  issued_at    timestamptz not null default now(),
  expires_at   timestamptz not null,
  consumed_at  timestamptz,                    -- terisi saat absen sukses (sekali pakai)
  guest_id     uuid references guests(id),
  ip_hash      text,                           -- hash + salt, bukan IP mentah
  user_agent   text
);
create index scan_sessions_expires on scan_sessions (expires_at);

create table attendance_logs (
  id          uuid primary key default gen_random_uuid(),
  guest_id    uuid not null references guests(id) on delete cascade,
  type        attendance_type not null,
  scanned_at  timestamptz not null default now(),
  source      attendance_source not null default 'qr',
  session_id  uuid references scan_sessions(id),   -- null jika manual
  actor       uuid references auth.users(id),      -- terisi jika manual oleh panitia
  user_agent  text,
  unique (guest_id, type)                          -- 1 masuk + 1 pulang per tamu
);
create index attendance_logs_scanned_at on attendance_logs (scanned_at);

create table event_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

create table committee_members (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'committee' check (role in ('admin','committee')),
  created_at  timestamptz not null default now()
);

create table audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor        uuid references auth.users(id),
  action       text not null,
  target_guest uuid references guests(id) on delete set null,
  meta         jsonb,
  created_at   timestamptz not null default now()
);
