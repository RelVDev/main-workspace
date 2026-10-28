-- P03.8 / P17: data DEV saja (±30 tamu dummy, termasuk Kating/Tamu dengan status HTM belum_lunas & data alergi makanan).
-- Idempoten: dilewati bila batch 'seed-dev' sudah ada.

insert into guests (full_name, category, contact, payment_status, allergies, import_batch)
select v.full_name, v.category, v.contact, v.payment_status, v.allergies, 'seed-dev'
from (values
  ('Anindya Putri Maharani',                 'Divisi Dokumentasi', '0812000000001', 'lunas',       'Seafood (Udang & Kepiting)'),
  ('Bagas Pratama',                          'Divisi Acara',       '0812000000002', 'lunas',       null),
  ('Bagas Pratama',                          'Divisi Media',       '0812000000003', 'lunas',       null),
  ('Citra Lestari',                          'Kating Angkatan 2023', null,          'belum_lunas', 'Kacang Tanah & Kacang Mede'),
  ('Dewi Anggraini',                         'Divisi Konsumsi',    '0812000000005', 'lunas',       'Susu Sapi / Olahan Dairy (Intoleransi Laktosa)'),
  ('Eko Prasetyo',                           'Kating Angkatan 2022', null,          'belum_lunas', 'Telur Ayam'),
  ('Fajar Nugroho',                          'Divisi Acara',       '0812000000007', 'lunas',       null),
  ('Gita Ayu Saraswati',                     'Divisi Dokumentasi', null,            'lunas',       'Seafood (Cumi & Kerang)'),
  ('Hendra Wijaya',                          'Angkatan 2024',      '0812000000009', 'lunas',       null),
  ('Intan Permata Sari',                     'Divisi Media',       null,            'lunas',       null),
  ('Joko Susilo',                            'Kating / Alumni',    null,            'belum_lunas', 'Makanan Pedas / Cabai (Maag Kronis)'),
  ('Kartika Dewi',                           'Divisi Konsumsi',    null,            'lunas',       null),
  ('Lukas Hartono',                          'Kating Angkatan 2023', null,          'belum_lunas', null),
  ('Maya Safitri',                           'Divisi Acara',       null,            'lunas',       'Gluten / Tepung Terigu'),
  ('Nicolas Chandra',                        'Kating / Alumni',    null,            'belum_lunas', 'Seafood (Ikan Laut & Udang)'),
  ('Oktaviani Rahayu',                       'Divisi Media',       null,            'lunas',       null),
  ('Putu Ardana Wirawan',                    'Kating Angkatan 2022', null,          'belum_lunas', null),
  ('Qonita Azzahra',                         'Divisi Dokumentasi', null,            'lunas',       'Kacang-kacangan & Wijen'),
  ('Rizky Firmansyah',                       'Angkatan 2024',      null,            'lunas',       null),
  ('Sri Wahyuningsih',                       'Divisi Konsumsi',    null,            'lunas',       null),
  ('Teguh Santoso',                          'Divisi Acara',       null,            'lunas',       null),
  ('Umi Kalsum',                             'Alumni',             null,            'lunas',       null),
  ('Vincentius Adi Nugraha Putra Hadiwijaya','Kating Angkatan 2023', null,          'belum_lunas', 'Susu & Keju (Dairy)'),
  ('Wulan Sari',                             'Divisi Media',       null,            'lunas',       null),
  ('Yohanes Setiawan',                       'Divisi Dokumentasi', null,            'lunas',       null),
  ('Zahra Amelia',                           'Angkatan 2024',      null,            'lunas',       'Seafood (Udang)'),
  ('Ádhitya Gunawan',                        'Divisi Acara',       null,            'lunas',       null),
  ('Ñoel Ramírez',                           'Alumni',             null,            'lunas',       null),
  ('Ratna Juwita',                           'Divisi Konsumsi',    null,            'lunas',       null),
  ('Dimas Aditya',                           'Kating Angkatan 2022', null,          'belum_lunas', 'Daging Kambing'),
  ('Salsabila Nur',                          'Divisi Media',       null,            'lunas',       null)
) as v(full_name, category, contact, payment_status, allergies)
where not exists (select 1 from guests where import_batch = 'seed-dev');
