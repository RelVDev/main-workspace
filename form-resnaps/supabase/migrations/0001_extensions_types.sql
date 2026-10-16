-- P03.2: ekstensi dan enum

create extension if not exists pg_trgm;
create extension if not exists unaccent;

create type attendance_type   as enum ('in', 'out');
create type attendance_source as enum ('qr', 'manual');
