-- P03.8: data DEV saja (±30 tamu dummy). JANGAN dijalankan di production (P14.2).
-- Idempoten: dilewati bila batch 'seed-dev' sudah ada.
-- Mencakup: 2 nama kembar beda kategori, nama beraksen, nama panjang.

insert into guests (full_name, category, contact, import_batch)
select v.full_name, v.category, v.contact, 'seed-dev'
from (values
  ('Anindya Putri Maharani',                 'Divisi Dokumentasi', '0812000000001'),
  ('Bagas Pratama',                          'Divisi Acara',       '0812000000002'),
  ('Bagas Pratama',                          'Divisi Media',       '0812000000003'),
  ('Citra Lestari',                          'Angkatan 2023',      null),
  ('Dewi Anggraini',                         'Divisi Konsumsi',    '0812000000005'),
  ('Eko Prasetyo',                           'Angkatan 2022',      null),
  ('Fajar Nugroho',                          'Divisi Acara',       '0812000000007'),
  ('Gita Ayu Saraswati',                     'Divisi Dokumentasi', null),
  ('Hendra Wijaya',                          'Angkatan 2024',      '0812000000009'),
  ('Intan Permata Sari',                     'Divisi Media',       null),
  ('Joko Susilo',                            'Alumni',             null),
  ('Kartika Dewi',                           'Divisi Konsumsi',    null),
  ('Lukas Hartono',                          'Angkatan 2023',      null),
  ('Maya Safitri',                           'Divisi Acara',       null),
  ('Nicolas Chandra',                        'Alumni',             null),
  ('Oktaviani Rahayu',                       'Divisi Media',       null),
  ('Putu Ardana Wirawan',                    'Angkatan 2022',      null),
  ('Qonita Azzahra',                         'Divisi Dokumentasi', null),
  ('Rizky Firmansyah',                       'Angkatan 2024',      null),
  ('Sri Wahyuningsih',                       'Divisi Konsumsi',    null),
  ('Teguh Santoso',                          'Divisi Acara',       null),
  ('Umi Kalsum',                             'Alumni',             null),
  ('Vincentius Adi Nugraha Putra Hadiwijaya','Angkatan 2023',      null),
  ('Wulan Sari',                             'Divisi Media',       null),
  ('Yohanes Setiawan',                       'Divisi Dokumentasi', null),
  ('Zahra Amelia',                           'Angkatan 2024',      null),
  ('Ádhitya Gunawan',                        'Divisi Acara',       null),
  ('Ñoel Ramírez',                           'Alumni',             null),
  ('Ratna Juwita',                           'Divisi Konsumsi',    null),
  ('Dimas Aditya',                           'Angkatan 2022',      null),
  ('Salsabila Nur',                          'Divisi Media',       null)
) as v(full_name, category, contact)
where not exists (select 1 from guests where import_batch = 'seed-dev');
