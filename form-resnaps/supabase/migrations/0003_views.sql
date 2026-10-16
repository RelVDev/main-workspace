-- P03.4: view status tamu (§5.2). security_invoker agar RLS tabel dasar berlaku.

create view guest_status with (security_invoker = true) as
select
  g.id          as guest_id,
  g.full_name,
  g.category,
  ci.scanned_at as checked_in_at,
  co.scanned_at as checked_out_at,
  case
    when co.scanned_at is not null then 'sudah_pulang'
    when ci.scanned_at is not null then 'di_dalam'
    else 'belum_hadir'
  end           as status
from guests g
left join attendance_logs ci on ci.guest_id = g.id and ci.type = 'in'
left join attendance_logs co on co.guest_id = g.id and co.type = 'out';
