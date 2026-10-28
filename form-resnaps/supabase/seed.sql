-- P03.8 / P17: data DEV saja (±30 tamu dummy, termasuk Kating/Tamu dengan status HTM belum_lunas).
-- Idempoten: dilewati bila batch 'seed-dev' sudah ada.

insert into guests (full_name, category, contact, payment_status, import_batch)
select v.full_name, v.category, v.contact, v.payment_status, 'seed-dev'
from (values
  ('Anindya Putri Maharani',                 'Divisi Dokumentasi', '0812000000001', 'lunas'),
  ('Bagas Pratama',                          'Divisi Acara',       '0812000000002', 'lunas'),
  ('Bagas Pratama',                          'Divisi Media',       '0812000000003', 'lunas'),
  ('Citra Lestari',                          'Kating Angkatan 2023', null,          'belum_lunas'),
  ('Dewi Anggraini',                         'Divisi Konsumsi',    '0812000000005', 'lunas'),
  ('Eko Prasetyo',                           'Kating Angkatan 2022', null,          'belum_lunas'),
  ('Fajar Nugroho',                          'Divisi Acara',       '0812000000007', 'lunas'),
  ('Gita Ayu Saraswati',                     'Divisi Dokumentasi', null,            'lunas'),
  ('Hendra Wijaya',                          'Angkatan 2024',      '0812000000009', 'lunas'),
  ('Intan Permata Sari',                     'Divisi Media',       null,            'lunas'),
  ('Joko Susilo',                            'Kating / Alumni',    null,            'belum_lunas'),
  ('Kartika Dewi',                           'Divisi Konsumsi',    null,            'lunas'),
  ('Lukas Hartono',                          'Kating Angkatan 2023', null,          'belum_lunas'),
  ('Maya Safitri',                           'Divisi Acara',       null,            'lunas'),
  ('Nicolas Chandra',                        'Kating / Alumni',    null,            'belum_lunas'),
  ('Oktaviani Rahayu',                       'Divisi Media',       null,            'lunas'),
  ('Putu Ardana Wirawan',                    'Kating Angkatan 2022', null,          'belum_lunas'),
  ('Qonita Azzahra',                         'Divisi Dokumentasi', null,            'lunas'),
  ('Rizky Firmansyah',                       'Angkatan 2024',      null,            'lunas'),
  ('Sri Wahyuningsih',                       'Divisi Konsumsi',    null,            'lunas'),
  ('Teguh Santoso',                          'Divisi Acara',       null,            'lunas'),
  ('Umi Kalsum',                             'Alumni',             null,            'lunas'),
  ('Vincentius Adi Nugraha Putra Hadiwijaya','Kating Angkatan 2023', null,          'belum_lunas'),
  ('Wulan Sari',                             'Divisi Media',       null,            'lunas'),
  ('Yohanes Setiawan',                       'Divisi Dokumentasi', null,            'lunas'),
  ('Zahra Amelia',                           'Angkatan 2024',      null,            'lunas'),
  ('Ádhitya Gunawan',                        'Divisi Acara',       null,            'lunas'),
  ('Ñoel Ramírez',                           'Alumni',             null,            'lunas'),
  ('Ratna Juwita',                           'Divisi Konsumsi',    null,            'lunas'),
  ('Dimas Aditya',                           'Kating Angkatan 2022', null,          'belum_lunas'),
  ('Salsabila Nur',                          'Divisi Media',       null,            'lunas')
) as v(full_name, category, contact, payment_status)
where not exists (select 1 from guests where import_batch = 'seed-dev');
