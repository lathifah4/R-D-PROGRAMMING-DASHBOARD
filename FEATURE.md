FEATURE.md — iNews Performance Dashboard
Dokumen ini merinci fitur yang terlihat pada referensi dashboard Google Looker Studio iNews. Daftar dibuat berdasarkan screenshot yang diberikan; angka, label, dan komponen yang tidak terbaca jelas perlu diverifikasi dengan sumber data asli.
1. Ringkasan Produk
Dashboard analitik untuk memantau performa iNews dan kanal media dalam beberapa dimensi:
- Performa kanal TV dan program.
- Jangkauan ekosistem media digital.
- Performa topik dan konten.
- Lapisan penjualan/iklan serta durasi promo dan komersial.
- Tampilan kustom untuk membandingkan performa kanal, program, topik, dan narasumber.
Navigasi utama
- Channel — performa kanal secara keseluruhan.
- Ecosystem — jangkauan lintas platform digital dan media.
- Program — analitik performa acara/program.
- Big Topics — performa topik besar/isu yang sedang dibahas.
- Sales Layer — durasi promo/komersial dan informasi advertiser.
- Custom — ringkasan performa program, tema, topik, dan narasumber dalam tampilan gabungan.
2. Filter dan Kontrol Global
Filter yang tampak pada halaman berbeda:
- Channel — memilih kanal, misalnya iNews, TVONE, KOMPAS TV, atau METRO.
- Month — memilih bulan analisis.
- Date (Year) — memilih tanggal/tahun atau rentang tanggal sesuai implementasi sumber.
- Week — memilih minggu.
- Program — memilih program tertentu pada halaman Custom.
- Customer Date (Year) — filter periode khusus yang tampak pada halaman Channel.
- Dropdown filter ditampilkan pada bagian atas dashboard dan memengaruhi visualisasi terkait.
Implementasi perlu memastikan filter saling terhubung (cross-filter) sesuai kebutuhan dan menyediakan nilai default, opsi reset, serta indikator periode aktif.

3. Halaman Channel — Channel Performance
3.1 KPI utama
Kartu metrik ringkas yang terlihat:
- TVR — rating/performa pemirsa TV.
- Share — pangsa pemirsa.
- 000s — jumlah audiens dalam satuan ribuan.
- Reach 000s — jangkauan audiens dalam satuan ribuan.
Nilai KPI mengikuti filter kanal dan periode.
3.2 Tren Rating
- Grafik garis Monthly untuk tren bulanan.
- Grafik garis Weekly untuk tren mingguan.
- Membandingkan beberapa kanal (iNews, TVONE, KOMPAS TV, METRO).
- Legenda kanal dan label nilai pada titik data.
- Sumbu waktu untuk melihat perubahan performa.
3.3 Navigasi kategori/shortcut
Tombol kategori yang terlihat:
- Rating Map
- SUSA Prediksi
- Materi FL
- Materi Pak HT
- Agenda Setting
- News & Prod.
Tujuan atau detail halaman masing-masing shortcut perlu dikonfirmasi dari dashboard aktif.
3.4 Composition Program
- Diagram donat komposisi program.
- Legenda kategori program, seperti News, Information, Sport, Religious, Filler, Entertainment, Special, dan Series.
- Menampilkan proporsi tiap kategori dalam keseluruhan komposisi.
3.5 Average Audience
- Grafik tren Average Audience.
- Membandingkan audiens rata-rata lintas kanal menurut waktu.
3.6 Reach Audience
- Grafik tren Reach Audience.
- Membandingkan jangkauan audiens lintas kanal menurut waktu.
3.7 Fresh & Rerun
- Grafik batang bertumpuk 100% untuk membandingkan konten Fresh dan Rerun per kanal.
- Menampilkan persentase fresh versus tayangan ulang.
3.8 Share by Daypart
- Tabel share berdasarkan bagian waktu tayang (daypart).
- Baris rentang waktu, misalnya 02:00–04:59, 05:00–08:59, 09:00–11:59, 12:00–15:59, 16:00–17:59, 18:00–21:59, dan 22:00–23:59.
- Kolom kanal dan ringkasan.
- Memudahkan perbandingan performa kanal berdasarkan jam tayang.
3.9 Top Program
- Tabel peringkat program.
- Kolom yang tampak mencakup peringkat, nama program, channel, 000s, TVR, dan share.
- Dipakai untuk menemukan program dengan performa audiens terbaik.
3.10 Duration Break — Promo vs Commercial
- Tabel perbandingan durasi promo dan komersial.
- Dikelompokkan berdasarkan daypart.
- Memuat persentase Promo dan Commercial per kanal (iNews, KOMPAS TV, METRO, TVONE).
- Menampilkan grand total/ringkasan.
4. Halaman Ecosystem
4.1 Total Reach
- KPI utama Total Reach untuk keseluruhan ekosistem media.
- Kartu jangkauan per platform:
  - Instagram
  - Facebook
  - YouTube
  - Platform video/play (ikon play)
  - Website (ikon WWW)
  - TikTok
4.2 Trend Ecosystem
- Grafik batang tren bulanan.
- Membandingkan nilai performa/jangkauan ekosistem per bulan.
4.3 TV Reach
- Grafik batang horizontal per kanal TV.
- Kanal yang tampak meliputi INEWS, TVONE, KOMPASTV, METRO, TVRI, CNN INDONESIA, GARUDA TV, BINPO, dan NU BANTARTV (sebagian label mungkin perlu verifikasi karena resolusi screenshot).
4.4 YouTube (VOD + Live)
- Grafik batang horizontal untuk membandingkan reach YouTube antar kanal/brand.
- Memuat beberapa kanal berita dan program digital.
4.5 Social Media Reach
- Grafik batang untuk membandingkan jangkauan media sosial antar kanal.
- Kanal yang tampak: INEWS, KOMPASTV, METRO, dan TVONE.
5. Halaman Program — Program Performance
5.1 Filter
- Channel
- Month
- Date (Year)
- Week
5.2 Grafik performa berdasarkan jenis program
Grafik garis mingguan untuk beberapa program/kategori:
- Buletin Pagi
- Buletin Siang
- Buletin Sore
- Buletin Malam
- Religi
- Buletin Bola
- Rakyat Bersuara
- The Prime Show
- Interupsi (bagian grafik terlihat di bawah screenshot)
Setiap grafik menampilkan beberapa kanal/program pembanding, legenda, sumbu minggu, dan nilai pada titik data.
6. Halaman Big Topics — Content Performance
6.1 Filter
- Channel
- Month
- Week
- Date
6.2 Tabel Big Topics
Tabel ranking topik dengan kolom:
- Agenda Setting / nama topik.
- TVR
- Share
- DUR (durasi).
- Share*Dur (metrik gabungan yang ditampilkan dashboard).
- Kontribusi (persentase kontribusi topik).
Contoh topik yang terlihat pada screenshot:
- Piala Dunia 2026
- Korupsi Batubara
- Konflik Timur Tengah
- Polemik Ijazah Jokowi
- Tiga Tahun, Wanita Disekap Kekasih
- Kegiatan Prabowo
- Dokter Muda Tewas Diduga Ditimb...
- Polisi Gugur Saat Operasi Narkoba
- Kebakaran TPA Jatibarang
- Perang Israel-Palestina
- Korupsi Bupati Kuningan
- Kasus Penganiayaan Oknum Polisi
6.3 Word Cloud
- Area Word Cloud untuk memvisualisasikan kata/topik dominan.
- Pada screenshot area terlihat kosong; perlu dipastikan apakah visualisasi belum dimuat, datanya kosong, atau komponen belum dikonfigurasi.
7. Halaman Sales Layer
7.1 Filter
- Channel
- Month
- Week
- Date
7.2 Duration Break (Promo & Commercial)
- Tabel durasi promo dan komersial.
- Baris berdasarkan daypart.
- Kolom Promo (%) dan Commercial (%) untuk:
  - INEWS
  - KOMPASTV
  - METRO
  - TVONE
- Ringkasan Grand Total di bagian bawah.
- Digunakan untuk melihat alokasi waktu promo versus komersial menurut kanal dan waktu tayang.
7.3 Advertiser
- Area visualisasi/tabel Advertiser.
- Pada screenshot, area ini tampak sebagai blok kosong dengan ikon/placeholder, sehingga isi, metrik, dan interaksinya belum dapat dipastikan.
8. Halaman Custom — Program Performance
8.1 Filter
- Channel
- Month
- Week
- Date
- Dropdown tambahan yang tampak berlabel Customer Date (Year) atau label serupa.
- Filter Program.
8.2 KPI
- TVR
- Share
- 000s
- Reach 000s
8.3 Program Performance
- Grafik garis mingguan yang membandingkan performa beberapa kanal (iNews, TVONE, KOMPAS TV, METRO).
- Memuat legenda, label nilai, dan sumbu minggu.
8.4 Tema
- Tabel tema dengan kolom Week, Channel, Date, TVR, SHR, dan Items.
- Digunakan untuk menelusuri tema yang muncul per minggu dan kanal.
8.5 Bagian INEWS
Topik
- Tabel ringkasan topik iNews.
- Kolom yang tampak: topik, TVR, SHR, dan Count.
- Contoh kategori: Big Topics, Konflik Timur Tengah, Polemik Ijazah Jokowi, Pemerintahan Prabowo, Akidah/Keyakinan, Lebaran, Cuaca Ekstrem, Akhlak, Pertumbuhan Ekonomi Indonesia, Korupsi Batu Bara, Korupsi Muba, dan topik lainnya.
Nara Sumber
- Tabel narasumber.
- Kolom yang tampak: nama narasumber, jabatan, TVR, SHR, dan DUR.
- Digunakan untuk menganalisis performa topik atau kemunculan narasumber.
8.6 Bagian Kompetitor
- Area perbandingan untuk kanal kompetitor.
- Panel yang terlihat: TVONE dan KOMPAS TV.
- Menampilkan tabel topik/performa per kanal; detail kolom dan isi lanjutan perlu diverifikasi dari dashboard penuh.
9. Pola Visual dan Interaksi yang Terlihat
- Header dengan logo iNews dan judul halaman.
- Navigasi tab di bagian atas.
- Filter dropdown.
- Kartu KPI berwarna cyan muda.
- Grafik garis, batang, batang horizontal, batang bertumpuk, dan diagram donat.
- Tabel dengan header berwarna, baris bergantian, dan total.
- Legenda untuk membedakan kanal/kategori.
- Label nilai pada grafik dan sumbu waktu.
- Beberapa visual tampak memiliki toolbar eksplorasi/ekspor dari Looker Studio; fungsi yang tepat bergantung pada konfigurasi report.
- Sebagian konten pada screenshot terlihat terpotong atau kosong; jangan menganggapnya sebagai data nol sebelum memeriksa sumber.
10. Kebutuhan Implementasi yang Disarankan
Bagian ini merupakan rekomendasi implementasi, bukan fitur yang dapat dipastikan hanya dari screenshot.
10.1 Struktur aplikasi
- Sediakan satu layout dashboard dengan navigasi tab.
- Pisahkan halaman/route untuk Channel, Ecosystem, Program, Big Topics, Sales Layer, dan Custom.
- Buat komponen filter yang dapat dipakai ulang.
- Buat komponen kartu KPI, grafik, dan tabel yang konsisten.
10.2 Data dan filter
- Definisikan skema data untuk channel, program, periode, daypart, topik, reach, TVR, share, durasi, dan advertiser.
- Pastikan seluruh angka memiliki definisi, satuan, dan format yang jelas.
- Terapkan filter periode dan kanal pada semua visual yang relevan.
- Tampilkan loading, empty state, dan error state.
- Bedakan data kosong, nilai nol, dan data gagal dimuat.
10.3 Visualisasi
- Gunakan line chart untuk tren waktu.
- Gunakan bar chart untuk perbandingan kategori.
- Gunakan 100% stacked bar untuk Fresh vs Rerun.
- Gunakan donut chart untuk komposisi program.
- Gunakan tabel sortable/paginated untuk Top Program, Big Topics, Tema, Topik, dan Narasumber.
- Sediakan tooltip, legenda, format angka, dan label sumbu yang terbaca.
10.4 Aksesibilitas dan responsivitas
- Sediakan label yang jelas untuk setiap filter.
- Pastikan kontras teks dan warna memadai.
- Buat layout responsif untuk desktop, tablet, dan mobile.
- Jangan mengandalkan warna saja untuk membedakan kanal.
- Pertahankan keterbacaan tabel dengan scroll horizontal atau tampilan alternatif pada layar kecil.
10.5 Validasi
- Cocokkan angka KPI dan hasil agregasi dengan sumber data resmi.
- Verifikasi definisi TVR, Share, 000s, Reach, DUR, Share*Dur, dan Kontribusi.
- Konfirmasi semua nama kanal, program, kategori, serta rentang waktu dari report asli.
- Uji bahwa perubahan filter memperbarui visualisasi yang benar.
- Periksa area Word Cloud dan Advertiser yang terlihat kosong pada screenshot.
11. Hal yang Belum Dapat Dipastikan dari Screenshot
- Definisi bisnis dan rumus tiap metrik.
- Sumber data, skema tabel, dan frekuensi pembaruan.
- Apakah filter diterapkan global atau hanya pada visual tertentu.
- Perilaku klik pada grafik/tabel (cross-filter, drill-down, detail).
- Isi penuh tabel yang terpotong.
- Fungsi tombol Rating Map, SUSA Prediksi, Materi FL, Materi Pak HT, Agenda Setting, dan News & Prod.
- Isi aktual Word Cloud dan Advertiser.
- Mekanisme autentikasi, hak akses, serta ekspor data.