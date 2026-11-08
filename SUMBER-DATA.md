# Acuan perhitungan Data TV dan Content

`METODOLOGI.md` adalah acuan rumus, filter, dan agregasi kedua halaman. Angka dibaca dari Google Sheets aktif. Rumus utama Content diselaraskan dengan definisi dashboard referensi sebagaimana dicatat di bawah; data HTML tidak digunakan sebagai pengganti spreadsheet. Customize Data TV mengikuti screenshot yang diberikan pada 4 November 2026. Perhitungan mempertahankan presisi penuh.

## Data TV (`/data-tv`)

ID sumber: `GOOGLE_SHEETS_DATATV_ID`. API: `/api/data-tv`. Parser dan perhitungan: `lib/tv-data.ts`, `lib/tv-customize.ts`.

| Bagian | Sheet | Rumus dan cakupan |
| --- | --- | --- |
| Monthly | PERFORMANCE MONTHLY | Ambil blok Share FTA resmi, bukan Reach/YTD atau Pay TV. Tidak menghitung ulang share bulanan dari harian. |
| Weekly | PERFORMANCE WEEKLY | Share resmi per week. Week 1 = 1–10 Jan; selanjutnya Minggu–Sabtu. Week yang melewati batas bulan tersedia pada kedua bulan. |
| Daily | PERFORMANCE DAILY | Rata-rata share numerik pada tanggal terpilih; tanpa tanggal, semua hari pada bulan terpilih. Kosong tidak dihitung sebagai nol. Ranking menurun. |
| Daypart | SHARE DAYPART MONTHLY / WEEKLY / DAILY | Tanggal memilih DAILY, selain itu Week memilih WEEKLY, selain itu MONTHLY. Beberapa periode memakai rata-rata share numerik setiap channel/daypart. |
| Total Day | PERFORMANCE MONTHLY / WEEKLY / DAILY | Share satu hari penuh pada tingkat periode yang sama. Tidak menjumlahkan delapan share daypart. |
| Kontribusi daypart | Kontribusi By Daypart, Total TV | Σ(000s daypart × menit daypart) / Σ(000s × menit seluruh daypart) × 100, untuk tanggal yang memenuhi irisan Bulan/Week/Tanggal. Durasi delapan daypart: 150, 330, 180, 180, 120, 240, 120, 120 menit. Total 100% sebelum pembulatan. |
| Fresh / Rerun | Program Detail REV2 | ΣDur kategori / ΣDur seluruh kategori channel × 100. Jam per hari = ΣDur kategori / jumlah tanggal channel yang tersedia / 60. Kategori kosong/tidak valid tetap masuk penyebut dan tampil sebagai Belum terklasifikasi. Bila seluruh kategori channel tidak valid, Fresh/Rerun tidak tersedia. Tidak ditebak dari judul. |
| Top 30 | Program Detail REV2 + Program Detail Others | Gabungkan segmen judul sama pada tanggal/channel sama yang hanya dipisahkan filler. Metrik penayangan = Σ(metrik segmen × Dur) / ΣDur segmen yang memiliki nilai metrik. Rata-ratakan penayangan, bukan segmen. Urutkan Average 000s, ambil 30. Angka audience tidak dibulatkan ke integer sebelum ditampilkan. |
| Customize | Kedua sheet Program Detail FTA | Penayangan yang sama dengan Top 30. Include memakai OR; Exclude mengalahkan Include; tidak membedakan kapitalisasi. Kata kunci dan tanggal disimpan lewat OK (Cancel membatalkan), lalu channel/kata kunci/tanggal diterapkan bersama saat Run diklik. Tanggal kosong = semua tanggal yang tersedia. Kalender mendukung tanggal terpisah, weekday, week sumber, bulan, Shift+klik, dan rentang inklusif tanpa membuat tanggal yang tidak ada di sumber. Kelompokkan per tanggal/week/bulan/program. Summary merata-ratakan seluruh penayangan terfilter, bukan rata-rata baris agregasi; kedua summary dapat disembunyikan lewat Opsi Tabel. |
| Metadata Customize | Start time / End time / Level 1 / Level 2 | Jam penayangan pertama per hari, modus jam untuk minggu/bulan/program; modus kategori. Jam Nielsen setelah 24:00 dipertahankan. `(R)` dan judul pertandingan tetap program terpisah. |
| SPR FTA | Program Detail FTA + PERFORMANCE DAILY | Grid 288 slot lima menit, 02:00–25:59. Bulatkan jam mulai ke slot terdekat, termasuk detik bila tersedia. Blok berakhir pada program berikutnya. Durasi nol dilewati. Header share berasal dari harian; kosong = N/A. News channel tampil dahulu. |
| SPR Pay TV, dalam tab Program | Program Detail Paytv + PERFORMANCE DAILY PAYTV + blok Pay TV PERFORMANCE WEEKLY | Program memakai kolom Description. Satu channel, satu week per layar, satu kolom per tanggal. Filter minggu/channel tersedia dari PERFORMANCE DAILY PAYTV walaupun detail program belum ada; saat itu tampil share harian, tanpa blok jadwal buatan. Share harian/mingguan Pay TV tetap terpisah dari FTA. |

Tren daypart satu week atau satu bulan memakai harian. Tanggal tren tetap beririsan dengan Bulan/Week yang dipilih. Beberapa week memakai mingguan; beberapa bulan memakai bulanan; tanpa pilihan periode memakai semua bulan. Grafik satu sampai tiga periode memakai batang, empat atau lebih memakai garis.

Rank iNews memakai seluruh channel FTA yang tersedia pada sumber daypart, termasuk channel tambahan yang belum ada di katalog bulanan. Share daypart mengikuti basis 14-channel/total-TV pada sheet dan tidak dinormalisasi agar semua channel berjumlah 100%. Perbandingan dengan periode sebelumnya hanya berlaku bila satu periode dipilih. Kekosongan data kompetitor tidak dihitung sebagai kemenangan iNews.

## Content (`/content`)

ID sumber: `GOOGLE_SHEETS_CONTENT_ID`. API: `/api/content`. Parser dan perhitungan: `lib/content-data.ts`.

| Sumber | Topik | Metrik |
| --- | --- | --- |
| INEWS / TVONE / KOMPAS / SINDONEWS | AGENDA SETTING, melalui tabel pemetaan TV yang sudah ada | DUR dan Share; eksposur = Durasi × Share. |
| YOUTUBE | Isu Final (coding) | Views. |
| SOCIAL MEDIA | Isu Final (coding) | Instagram/TikTok: Views. Facebook/X: Tayangan/Impressions. |

Baris TV dengan Share kosong atau tidak numerik tidak masuk agregat performa. Share numerik nol tetap valid. Internal = TV iNews/Sindonews dan digital iNews/Sindonews/Okezone/IDX Channel. Kompetitor tidak masuk penyebut skor internal.

### Kontribusi, skor, dan ranking

1. Penyebut kontribusi adalah eksposur internal yang memiliki topik pada platform dan rentang aktif, mengikuti `buildMatrixRows` dan `buildClusterData` di dashboard referensi. Other dan airtime struktural tidak masuk penyebut kontribusi; keduanya tetap dipertahankan untuk KPI total cluster dan status kelengkapan coding.
2. Kontribusi = eksposur topik / total platform × 100.
3. Normalisasi = kontribusi topik / kontribusi topik tertinggi pada platform yang sama.
4. Skor Gabungan = Σ(normalisasi × bobot) × 100. Bobot: TV 25%, YouTube 25%, Instagram 15%, TikTok 15%, Facebook 10%, X 10%.
5. Topik dengan konten pada seluruh enam platform didahulukan; di dalam kedua kelompok gunakan Skor Gabungan. Views nol yang tercatat tetap menandakan ada konten.
6. Perhitungan, pembandingan, dan pengurutan menggunakan presisi penuh. Pembulatan hanya untuk format tampilan.

Referensi HTML membulatkan kontribusi ke dua desimal sebelum normalisasi skor, dan membulatkan Share channel sebelum menghitung gap. Aplikasi mempertahankan presisi penuh agar kontribusi sangat kecil dan keputusan di batas ambang tidak hilang. Karena itu, meski input identik, pembulatan bertingkat pada referensi masih dapat menghasilkan selisih 0,1 pada tampilan satu desimal atau perubahan urutan topik dengan skor berdekatan. Penyelarasan rumus utama tidak berarti hasil identik dengan seluruh perilaku pembulatan referensi.

Mode Semua Platform pada cluster mengikuti `buildClusterAllTopics` pada referensi: jumlah platform yang memuat topik didahulukan. Untuk iNews/Sindonews, urutan berikutnya memakai durasi TV lalu rata-rata Share; untuk Okezone/IDX Channel memakai total Views digital. Durasi tetap memakai presisi sumber, tanpa membulatkan sebelum pengurutan. Mode satu platform memakai eksposur platform tersebut, sehingga informasi rata-rata per post tidak mengubah ranking.

Kapitalisasi berbeda untuk label isu yang sama disatukan. Ejaan mengikuti Isu Final sumber, kemudian tabel pemetaan TV; tidak memakai katalog ejaan Builder. Label yang belum memiliki padanan semantik tetap mengikuti sumber.

### Kompetitor

- TV per channel: share = Σ(Durasi × Share) / ΣDurasi. Share iNews, TVOne, dan KompasTV tetap kolom terpisah sesuai Builder. Status terhadap tiap kompetitor dihitung masing-masing, ambang ±0,5 poin, dan tersedia pada rincian tooltip Status.
- TV gabungan: mengikuti `buildTvCompare` pada referensi, gap = (Share TVOne + Share KompasTV) / 2 − Share iNews. Masing-masing Share sudah tertimbang durasi di dalam channel tersebut; kedua channel kompetitor diberi bobot sama, bukan dibobot lagi berdasarkan perbedaan total durasi antar-channel. Status gabungan hanya tersedia bila ketiga channel mempunyai data.
- Struktur tabel tetap mengikuti Builder, dengan satu kolom Status. Perhitungan masing-masing dan gabungan tetap terpisah; tidak menambah kolom visual untuk mengubah gaya referensi.
- YouTube: pilih kompetitor terkuat per topik dalam pasangan cluster. iNews vs TVOne/KompasTV; Sindonews vs MetroTV; Okezone vs Kompas.com; IDX Channel vs CNBC Indonesia.
- Margin YouTube = (Views kompetitor terkuat − Views cluster) / max(kedua Views) × 100. Lebih dari +20 = Kompetitor Unggul, kurang dari −20 = Cluster Unggul; termasuk kedua batas = Seimbang.
- Nol yang benar-benar tercatat dapat dibandingkan. Bila keduanya nol, margin = 0. Bila salah satu sisi tidak memiliki data, angka dan status tetap tidak tersedia, bukan nol buatan.
- Ambang TV/YouTube diterapkan sebelum pembulatan; hanya toleransi presisi floating point pada batas tepat yang digunakan.

Seluruh ringkasan, matrix, cluster, dan pembanding menghitung ulang rentang aktif. Status kelengkapan coding memakai seluruh dataset dan tetap saat rentang diubah. Ringkasan eksekutif mengikuti empat insight Builder: topik terbaik menurut ranking lintas platform; topik spesifik dengan selisih kontribusi terbesar antara platform pertama dan kedua (minimal hadir di tiga platform, selain topik terbaik); contoh topik digital tanpa data TV dengan Views tertinggi beserta contoh TV tanpa konten digital berdurasi terbesar; dan jumlah status kompetitif TV. Label kategori umum dikecualikan dari contoh karakter platform dan peluang sesuai pola Builder. Kehadiran konten dibedakan dari nilai nol yang benar-benar tercatat. Semua angka berasal dari spreadsheet, tanpa menyalin angka statis referensi.

### Definisi atau sumber yang belum lengkap

- Metodologi meminta tabel pemetaan TV yang direview Dewi. `lib/content-topic-aliases.ts` adalah tabel yang sudah ada; repo belum memuat bukti review tersebut. Tidak ada penambahan mapping berdasarkan pencocokan angka Builder dalam audit ini.
- Metodologi menyebut Tier mengikuti ranking, tetapi belum menentukan batas ranking Panas/Tinggi/Pantau. Batas implementasi lama 1–10 / 11–30 / sisanya masih dipertahankan; angka batas ini belum dapat diklaim berasal dari metodologi.
- Pada workbook gabungan, metrik native Facebook/X sebelumnya disimpan di kolom bernama Views. Parser mendahulukan kolom Impressions/Tayangan jika ada. Bila masih memakai kolom Views gabungan, isi kolom harus merupakan metrik impressions sebagaimana kontrak sumber; native video views tidak boleh dianggap otomatis sebagai impressions.
- Cakupan periode mengikuti sheet yang benar-benar tersedia, bukan tanggal akhir yang tertulis dalam dokumentasi. Program Detail Others, Program Detail Paytv, dan file Content periode terbaru dibaca bila tersedia, tanpa data pengganti buatan.
- Pada audit 4 November 2026, sumber Google Sheets Content memuat INEWS/TVONE/KOMPAS sampai 15 Oktober, SINDONEWS sampai 8 Oktober, SOCIAL MEDIA sampai 15 Oktober, dan YOUTUBE sampai 16 Oktober. Rentang 9–16 Oktober belum terisi penuh di semua sumber. Screenshot terbitan menampilkan Ijazah Gibran iNews 532 menit/4,86%, sementara sumber aktif memuat 491 menit/4,87%; perbedaan input ini tidak dapat diselesaikan dengan mengubah rumus. File periode 16–22 Oktober belum tersedia lokal. Cakupan yang tidak memenuhi rentang aktif ditandai di atas hasil Content.
- Pada pemeriksaan sumber 2 November 2026, 38.094 dari 38.296 baris Program Detail REV2 memiliki Category `#ERROR! (FORMULA PARSE ERROR.)`. Karena itu komposisi Fresh/Rerun masih terbatas oleh kualitas klasifikasi sumber, meskipun rumusnya sudah diperiksa. Dashboard menyebutkan jumlah baris yang belum terklasifikasi pada periode terpilih.

## Pembuktian

`tests/methodology-calculations.test.ts` memakai contoh hitung terkontrol dengan hasil pecahan yang ditetapkan dari rumus, bukan angka snapshot Builder. Mencakup penyebut kontribusi bertopik, skor kecil yang tidak boleh hilang oleh pembulatan, Share tertimbang per channel dengan bobot sama antar-kompetitor, batas ±0,5/±20, nol vs kosong, irisan tren, kontribusi delapan daypart, rank FTA, audience desimal, SPR, dan kolom Pay TV.

Tes Content/TV/Customize yang lain memeriksa parsing sumber, rata-rata penayangan, Fresh/Rerun, filter, metadata, dan perhitungan ulang tanggal. `scripts/merge_content.py` mengganti overflow file lama dengan periode baru saat file tersebut tersedia; pengujian Python memakai workbook kecil terkontrol.

### Audit selisih Content terhadap Builder, 3 November 2026

Perbandingan memakai rentang yang sama, 1 September–16 Oktober 2026. Temuan berikut dipisahkan agar perubahan rumus tidak disalahartikan sebagai kehilangan baris saat penggabungan.

| Penyebab | Bukti | Dampak |
| --- | --- | --- |
| Snapshot YouTube 1 Oktober terhitung ganda pada referensi | Sepuluh video internal di file September mempunyai Content ID, cluster, tanggal, dan judul yang sama dengan file 1–8 Oktober. Total Views snapshot lama adalah 279.018. Selisih total YouTube referensi (314.287.570) dan sheet aktif (314.008.552) persis 279.018. | Pemotongan overflow September pada penggabungan aktif mencegah hitungan ganda. Jangan menambahkan snapshot lama untuk mengejar total Builder. |
| Sumber TV Sindonews belum lengkap | File 9–15 Oktober yang tersedia tidak mempunyai sheet SINDONEWS; sumber September dan 1–8 Oktober tidak mencakup tanggal tersebut. Referensi memuat 3.088 menit Sindonews pada 9–15 Oktober. | Kontribusi dan durasi TV gabungan berbeda. Melengkapi tanggal perlu sumber TV yang asli, bukan menyalin angka HTML. |
| Penyebut kontribusi berbeda pada implementasi sebelum 4 November | Builder mengecualikan Other/airtime struktural dari total; implementasi sebelumnya memasukkannya. Pada data mentah Builder yang sama, kontribusi YouTube Ijazah Gibran berubah dari 23,88% menjadi 21,50% hanya karena penyebut. | Diperbaiki pada 4 November: penyebut hanya eksposur bertopik, sesuai referensi. KPI total cluster tetap memuat seluruh konten. |
| Rumus gabungan kompetitor berbeda pada implementasi sebelum 4 November | Dengan data TV yang sama, rata-rata sederhana dua share kompetitor pada Builder menghasilkan 188 unggul, 3 kalah, 10 seimbang; gabungan tertimbang durasi menghasilkan 190 unggul, 3 kalah, 8 seimbang. | Diperbaiki pada 4 November: Share tertimbang di masing-masing channel, lalu rata-rata dengan bobot sama antar-channel. Kebijakan presisi penuh tetap berlaku. |

Audit juga menemukan deduplikasi lintas tanggal pada script gabung: ID yang sama pada 2 dan 9 Oktober menghapus satu baris YouTube IDX Channel tanggal 2 Oktober dengan Views nol. Identitas kini menyertakan tanggal, sehingga penambahan file periode berikutnya tidak menghapus catatan tanggal sebelumnya. Perbaikan ini menambah satu konten dan tidak menambah Views pada sumber yang diperiksa. Pengujian Python memeriksa ID/link berulang pada tanggal berbeda serta penggantian snapshot pada batas periode. Perbaikan workbook lokal tidak otomatis mengubah Google Sheets yang dibaca halaman Content.
