# iNews Performance Dashboard

Dashboard Next.js 16 / React 19 dengan isi dan desain Data TV serta Content mengikuti referensi pada `public/_dashboard_builder/dashboard/inews-group-dashboard.html`. Tampilan memakai Barlow, Barlow Condensed, dan JetBrains Mono, tab folder, header yang mengecil saat digulir, filter biru, serta tabel navy dengan garis kuning. Panel Data TV tersusun vertikal; filter periode dan channel tetap terhubung antar panel. Kontrol zoom tersedia di header.

## Menjalankan

```sh
bun install
bun run dev
```

Halaman utama membuka `/data-tv`. Navigasi utama terdiri dari Data TV dan Content. Tautan lama `/channel` dan `/program` menuju Data TV; `/big-topics` menuju Content.

## Spreadsheet

Konfigurasi `.env`:

```dotenv
GOOGLE_SHEETS_DATATV_ID=id-spreadsheet-data-tv
GOOGLE_SHEETS_CONTENT_ID=id-spreadsheet-content
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Kedua sumber harus berupa Google Sheets native dan dapat dibaca service account. Jika masih berupa Excel di Drive, gunakan **File → Save as Google Sheets** dan gunakan ID hasil konversinya. `GOOGLE_SHEETS_ID` masih diterima sebagai nama konfigurasi lama untuk sumber Data TV.

Kredensial hanya digunakan di server. `/api/data-tv` dan `/api/content` membaca Google Sheets melalui `services/google-sheets.ts`. Frontend memakai TanStack Query dengan cache lima menit; Refresh mengambil data lagi. Kegagalan awal menyediakan Coba lagi, sedangkan kegagalan pembaruan mempertahankan data terakhir. Tidak ada fallback aplikasi ke Excel atau HTML referensi.

## Data TV

- Channel: Monthly Performance, Weekly Performance, Daily Performance, Performance by Daypart, dan Composition Fresh Program.
- Tab Data TV: Channel, Program, dan Customize. Customize memiliki panel sendiri; Program memuat Top 30 serta Rating Map FTA dan Pay TV.
- Pay TV memakai `PERFORMANCE DAILY PAYTV` untuk share harian dan blok Pay TV pada `PERFORMANCE WEEKLY` untuk share mingguan. Setelah Enter, hasil selalu memakai grid SPR seperti referensi builder: share harian di atas tanggal, nama hari, dan penggaris waktu di kedua sisi. Jika `Program Detail Paytv` belum tersedia, grid tetap tampil dengan pemberitahuan dan tanpa blok program. Nama sheet yang berbeda kapitalisasi, spasi, atau pemisah tetap dikenali tanpa mengganti sumber dengan data FTA.
- Kontribusi daypart memakai baris Total TV pada `Kontribusi By Daypart`, dibobot durasi delapan daypart dan dinormalisasi menjadi 100% untuk irisan Bulan/Week/Tanggal.
- Customize mengikuti referensi screenshot: bar filter biru, popup enam baris Include/Exclude dengan OK/Cancel, kalender multi-tanggal (hari, week, bulan, Shift+klik, dan tambah rentang), serta panel Opsi Tabel hijau di kanan. Hasil memakai filter yang disimpan saat Run diklik; perubahan filter menunggu Run berikutnya. Baris dapat dikelompokkan per tanggal/week/bulan/program, dan metrik tetap rata-rata per penayangan. Urutan/visibilitas 13 kolom, pengelompokan, serta pilihan Summary per channel/Summary Columns tersimpan di browser. Kolom dapat dipindahkan dengan drag atau tombol naik/turun.
- Segmen program yang sama, pada channel dan hari siaran yang sama, digabung bila hanya diselingi filler. Metrik penayangan dibobot durasi sebelum dirata-ratakan pada Top 30 dan Customize. SPR dan Fresh tetap memakai segmen sumber.
- Filter bulan, minggu, dan beberapa tanggal terpisah. Channel FTA dapat dipilih semua; Program membatasi sepuluh channel. SPR FTA mendukung maksimal tujuh tanggal; Pay TV memakai satu channel dan kolom tanggal dalam satu minggu.
- Ekspor Channel berisi Share harian terfilter; ekspor Program berisi hasil Top 30.

`lib/tv-data.ts` memisahkan blok Share dari Reach/YTD dan blok FTA dari Pay TV. Data program yang tersedia saat refactor hanya mencakup iNews, TVOne, KompasTV, dan Metro. `Program Detail Others` dan `Program Detail Paytv` belum tersedia; halaman menjelaskan keterbatasan tersebut.

## Content

- Satu rentang tanggal untuk Ringkasan Eksekutif, Matrix Topik × Platform, ringkasan/Top Topik per Cluster, serta perbandingan TV dan YouTube dengan kompetitor.
- Enam platform: TV, YouTube, Instagram, TikTok, Facebook, X. Cluster internal: iNews, Sindonews, Okezone, IDX Channel.
- Kontribusi TV berdasarkan Durasi × Share; digital berdasarkan Views. Skor gabungan menggunakan bobot 25/25/15/15/10/10 dan memprioritaskan topik yang tersedia pada seluruh platform.
- Chip Platform/Tier, pencarian, Top 20/semua dan warna Matrix mengikuti Dashboard Builder. Detail topik, ekspor CSV, serta preset seluruh data/7 hari/30 hari berlaku untuk rentang aktif.
- Data mentah diagregasi per hari di server agar rentang apa pun tetap dapat dihitung ulang tanpa mengirim seluruh teks posting dan rincian TV ke browser.
- Status kelengkapan coding memakai seluruh dataset dan tetap saat filter tanggal berubah. Cakupan yang tampil mengikuti spreadsheet, sehingga tanggal di dokumen metodologi tidak dianggap otomatis tersedia.

`METODOLOGI.md` menjadi sumber teks metodologi dan footer sumber di kedua halaman. Arahan penulisan pada heading Markdown tidak ditampilkan di dashboard; blok sumber ditampilkan terpisah di bawah metodologi dengan gaya Builder.

`METODOLOGI.md` menjadi acuan perhitungan. Mengikuti dashboard referensi, penyebut kontribusi hanya mencakup eksposur internal yang memiliki topik; Other dan segmen struktural tetap masuk KPI total cluster. Share TV dihitung tertimbang durasi per channel, lalu status gabungan membandingkan rata-rata Share TVOne dan KompasTV dengan iNews. Mode Semua Platform per cluster diurutkan berdasarkan cakupan platform, lalu durasi/Share TV atau total Views digital. Skor, ranking, dan status kompetitor memakai presisi penuh; pembulatan hanya pada tampilan. Label isu mengikuti sumber dan tabel pemetaan TV yang sudah ada pada `lib/content-topic-aliases.ts`; katalog ejaan topik dari Builder sudah dihapus. Bukti review tabel pemetaan oleh Dewi belum tersedia di repo. Dashboard menandai sumber yang belum mencakup penuh rentang terpilih. Rincian rumus dan batas definisi tercatat di `SUMBER-DATA.md`.

## Menggabungkan Excel Content

```sh
python -m pip install openpyxl
python scripts/merge_content.py
```

Menggabungkan file Database All Platform September, 1–8 Oktober, dan 9–15 Oktober menjadi `public/Database All Platform Combined.xlsx`, enam tab. File `Database All Platform 16 - 22 Oct 2026.xlsx` ikut digabung bila tersedia; snapshot 16 Oktober dari file sebelumnya diganti seluruhnya, sementara overflow digital 23 Oktober dari file terbaru dipertahankan. Bila file terbaru belum ada, script memberi catatan dan memakai cakupan sumber yang tersedia. Header diselaraskan, nama file sumber disimpan, dan salinan digital antarfile memperhatikan tanggal, akun/cluster, serta teks. ID/link yang sama pada tanggal berbeda tidak menghapus baris periode sebelumnya. Baris berulang di dalam satu file tetap dipertahankan. Workbook RAW INEWS tidak diproses oleh script ini.

Lihat [SUMBER-DATA.md](SUMBER-DATA.md) untuk pemetaan visual ke sheet dan rumus.

## Pemeriksaan

```sh
bun run test:data
bunx tsc --noEmit
bun run lint
bun run build
python -B -m unittest discover -s tests -p test_merge_content.py
```

Tes mencakup skema spreadsheet lama, agregasi Content, pembanding kosong, prioritas enam platform, blok Share/Reach/YTD, Pay TV, minggu sumber, rata-rata Top 30, dan tabrakan slot SPR. Folder referensi `public/_dashboard_builder` dikecualikan dari ESLint dan pemindaian kelas Tailwind karena berisi script/data pendukung, bukan source aplikasi.
