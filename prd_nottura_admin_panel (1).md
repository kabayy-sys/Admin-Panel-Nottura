# PRD: Nottura Admin Panel (Subdomain)

**Versi:** 1.1

**Target Subdomain:** `admin.nottura.my.id`

**Tim Pengembang:**

* **Raken:** Frontend (UI/UX) + Full Backend (Supabase, Database, Auth, RLS, API/Query)

* **Arya:** Frontend (UI/UX, slicing komponen, integrasi tampilan)

## 1. Tujuan & Gambaran Umum

Panel admin ini dibuat khusus untuk operasional internal tim Nottura (4 orang). Fokus utamanya cuma tiga hal:

1. **Pantau slot Google AI Pro secara real-time** (tahu persis mana grup yang masih kosong dan mana yang penuh).

2. **Kontrol masa aktif pelanggan** biar tidak ada yang kelewat ditagih atau lupa di-kick saat expired.

3. **Catat arus kas (keuangan)** supaya tim tahu omzet, modal beli akun induk, dan profit bersih tiap bulan tanpa harus buka-tutup spreadsheet terpisah.

Alur order pelanggan tetap dari Landing Page → WhatsApp Business → Admin input data ke panel ini.

## 2. Pembagian Tugas (Raken vs Arya)

Biar tidak bentrok saat ngoding bareng di satu repo:

| Area | PIC | Tanggung Jawab Utama | 
| ----- | ----- | ----- | 
| **Backend & Database** | **Raken** | Setup project Supabase, bikin tabel & relasi, atur Row Level Security (RLS), setup Google OAuth + whitelist email tim, bikin fungsi helper/API buat fetch & mutasi data. | 
| **Frontend: Core & Logic** | **Raken** | Routing & proteksi halaman (middleware auth), integrasi state/data ke komponen, logika hitung slot otomatis, logika hitung keuangan & grafik, integrasi tombol WA. | 
| **Frontend: UI & Layout** | **Arya** | Desain & slicing layout utama (Sidebar, Header, Mobile responsive), komponen tabel, modal/form CRUD, card ringkasan dashboard, styling warna & tipografi biar enak dilihat. | 

*Catatan kerja bareng:* Arya bisa langsung garap tampilan pakai *dummy data* dulu sambil Raken beresin skema Supabase. Begitu backend beres, tinggal sambungkan.

## 3. Prinsip Tampilan & Palet Warna (UI/UX Style)

Panel menggunakan tema **Dark Mode** yang bersih, kontras tinggi, dan nyaman dipakai lama tanpa bikin mata cepat lelah.

* **Palet Warna Utama:**
  * **Background Utama (`#121212`):** Dipakai untuk latar belakang kanvas utama dan area konten.
  * **Surface / Aksen Brand (`#090A33`):** Dipakai untuk Sidebar, Header, Card utama, atau elemen navigasi aktif agar ada pemisah visual yang elegan dari background `#121212` (bisa tambah border tipis putih transparan misal `rgba(255, 255, 255, 0.1)` biar batas antar-card tetap tegas).
  * **Teks & Kontras Utama (`#FFFFFF`):** Dipakai untuk judul, angka KPI, teks utama, dan tombol aksi primer. Untuk teks sekunder/label tabel, gunakan putih redup (misal `#FFFFFF` dengan opacity 60%–70%) supaya hirarki teks tetap jelas.

* **Warna Status (Badge & Indikator):**
  * 🟢 Hijau: Aktif / Slot Tersedia / Pemasukan
  * 🟡 Kuning: H-3 Expired / Hampir Penuh
  * 🔴 Merah: Expired / Grup Penuh / Pengeluaran

* **Mobile-Friendly:** Minimal halaman Dashboard dan Datalist Pelanggan tetap nyaman dibuka dari HP, karena admin sering balas WA dan cek data lewat HP.

## 4. Fitur Utama & Spesifikasi Halaman

### A. Halaman Login (`/login`)

Dibagi menjadi dua fase supaya pengembangan cepat tapi tetap aman saat rilis:

* **Fase 1 (Development / Lokal):** Login sementara pakai username `nottura` dan password `123`.

* **Fase 2 (Production / Sebelum Rilis Publik):**

  * Hapus total login dummy.

  * Ganti ke tombol **"Login with Google"** menggunakan Supabase Auth.

  * **Aturan Whitelist:** Hanya email yang terdaftar di tabel `admin_whitelist` (4 email tim Nottura) yang boleh masuk. Kalau ada email asing yang coba login, sistem otomatis *logout* dan tampilkan pesan *"Akses ditolak"*.

### B. Dashboard Utama (`/`)

Halaman pertama setelah login. Isinya ringkasan operasional + keuangan bulan berjalan (ada filter ganti bulan/tahun).

**1. Kartu Ringkasan (KPI Cards):**

* **Total Pelanggan Aktif:** Jumlah pelanggan yang statusnya masih berjalan.

* **Total Slot Ready:** Akumulasi sisa slot kosong dari semua akun Google Pro bertipe *Shared*.

* **Perlu Perhatian (H-3 Expired):** Jumlah pelanggan yang masa aktifnya habis dalam ≤ 3 hari (bisa diklik langsung ke daftar mereka).

* **Ringkasan Keuangan Bulan Ini:**

  * **Omzet (Pemasukan):** Total pembayaran pelanggan (baru + perpanjangan).

  * **Pengeluaran (Modal):** Total biaya langganan akun induk Google Pro + biaya operasional lain.

  * **Profit Bersih:** `Omzet - Pengeluaran`.

**2. Grafik (Charts):**

* **Grafik Kenaikan Pelanggan:** Line/Bar chart pertumbuhan pelanggan baru per bulan.

* **Grafik Keuangan:** Perbandingan Pemasukan vs Pengeluaran per bulan.

**3. Widget Cepat:**

* **Daftar Jatuh Tempo Terdekat:** 5 pelanggan yang paling dekat tanggal habisnya + tombol langsung ingatkan via WA.

### C. Manajemen Akun Google Pro (`/accounts`)

Halaman CRUD untuk mengelola grup Family Sharing (akun induk).

* **Tampilan:** Bisa bentuk Card Grid atau Tabel yang menampilkan:

  * Nama Grup (misal: `Nottura-01`, `Nottura-02`)

  * Email Manager (akun induk)

  * Tipe Grup: `Shared` (eceran) atau `Full Group` (private/patungan 1 grup)

  * **Indikator Slot:** Misal `3 / 5 Terisi` (otomatis terhitung dari jumlah pelanggan aktif di grup tersebut) + badge `2 Slot Ready` atau `FULL`.

  * Tanggal Expired Akun Induk (`master_expired_at`).

  * Status Akun: `Aktif`, `Penuh`, `Bermasalah/Suspended`.

* **Aksi:** Tambah Akun, Edit Akun, Hapus Akun, dan **Lihat Anggota** (klik grup → muncul daftar nama & email 5 orang yang ada di dalamnya).

* **Logika Khusus:** Jika tipe grup diubah ke `Full Group`, slot otomatis dianggap penuh (`0 Slot Ready`) meskipun yang diinput cuma 1 koordinator.

### D. Datalist Pelanggan (`/customers`)

Halaman utama untuk pendataan dan kontrol pelanggan harian.

* **Kolom Tabel:**

  1. Nama Lengkap

  2. Nomor WhatsApp (format `628...`)

  3. Alamat Gmail

  4. Grup Family (dropdown dari tabel akun Google Pro)

  5. Paket (`Solo 35k` / `Full Group 150k` / `Squad 30k`)

  6. Tanggal Mulai (`start_date`)

  7. Tanggal Selesai (`end_date`) — *default otomatis +30 hari dari tanggal mulai saat input baru*

  8. Status (otomatis: `Aktif`, `H-3 Expired`, `Expired`)

  9. Aksi: Edit, Perpanjang (+30 hari), Hapus, dan **Tombol Remind WA**.

* **Fitur Pendukung:**

  * **Search & Filter:** Cari berdasarkan nama/Gmail/WA, dan filter tab cepat (`Semua`, `Aktif`, `H-3 Expired`, `Expired`).

  * **Tombol Remind WA (1-Klik):** Mengarah ke `https://wa.me/{nomor}?text=...` dengan template pesan otomatis berisi nama pelanggan dan tanggal habis langganan.

  * **Peringatan Duplikat Gmail:** Kalau admin menginput Gmail yang pernah terdaftar sebelumnya di grup lain, munculkan peringatan ringan (pengingat aturan *cooldown* 12 bulan Google Family).

  * **Tombol Perpanjang (+1 Bulan):** Sekali klik langsung menambah `end_date` sebanyak 30 hari DAN otomatis memunculkan form konfirmasi pencatatan pemasukan ke halaman Keuangan.

### E. Keuangan / Cashflow (`/finance`)

Halaman pencatatan uang masuk dan keluar supaya angka di Dashboard akurat.

* **Pemasukan (Otomatis & Manual):**

  * Setiap kali tambah pelanggan baru atau klik "Perpanjang", nominal paket otomatis tercatat sebagai pemasukan (admin tinggal konfirmasi nominal & metode bayar: QRIS / Transfer).

* **Pengeluaran (Input Manual):**

  * Form catat biaya beli/perpanjang akun induk Google Pro, biaya domain, atau operasional lain.

* **Tabel Riwayat Transaksi:**

  * Tanggal, Tipe (`Masuk` / `Keluar`), Kategori (`Order Baru`, `Perpanjangan`, `Modal Akun`, `Lainnya`), Keterangan, Nominal, dan Nama Admin yang input.

  * Bisa difilter per bulan dan ada tombol **Export CSV** (opsional untuk rekap bulanan).

## 5. Rancangan Database (Supabase - Tugas Raken)

Minimal ada 4 tabel utama:

1. **`admin_whitelist`**

   * `id`, `email` (unique), `name`, `role` (`owner` / `admin`)

2. **`family_groups`**

   * `id`, `group_name`, `manager_email`, `group_type` (`shared` / `full`), `max_slots` (default 5), `master_expired_at`, `status` (`active`, `full`, `suspended`), `notes`, `created_at`

3. **`customers`**

   * `id`, `full_name`, `whatsapp`, `gmail`, `family_group_id` (FK → `family_groups.id`), `package_name`, `start_date`, `end_date`, `created_by`, `created_at`

4. **`transactions`**

   * `id`, `type` (`income` / `expense`), `category` (`new_order`, `renewal`, `account_cost`, `operational`), `amount` (integer), `customer_id` (nullable FK → `customers.id`), `description`, `transaction_date`, `recorded_by`, `created_at`

## 6. Aturan Teknis & Keamanan (Wajib Dipatuhi)

1. **Dilarang Deploy Login Dummy ke Produksi:** Login `nottura` / `123` hanya boleh hidup di lokal (`localhost`). Sebelum subdomain dipakai menyimpan data asli pelanggan, wajib sudah pakai Google OAuth + Whitelist.

2. **Wajib Aktifkan RLS (Row Level Security) di Supabase:** Semua tabel di atas harus dikunci dengan policy yang mengecek apakah `auth.jwt() ->> 'email'` ada di `admin_whitelist`. Jangan cuma mengandalkan proteksi halaman di frontend.

3. **Anti-Index Google:** Tambahkan `<meta name="robots" content="noindex, nofollow" />` di `<head>` panel admin agar halaman `admin.nottura.my.id` tidak muncul di pencarian Google.

4. **Format Nomor WA Konsisten:** Di form input, kalau admin ngetik `0812...`, sistem otomatis ubah jadi `62812...` sebelum disimpan ke database supaya tombol Remind WA tidak pernah rusak.

5. **Audit Trail Sederhana:** Setiap tambah/edit data pelanggan atau transaksi, otomatis simpan email admin yang sedang login di kolom `created_by` / `recorded_by`.

## 7. Urutan Eksekusi (Roadmap Singkat)

* **Minggu 1 (Fondasi & UI Dasar):**

  * *Raken:* Setup Supabase, bikin 4 tabel + relasi, setup repo project & login dummy.

  * *Arya:* Slicing layout Sidebar/Navbar, halaman Login, dan tampilan tabel Datalist Pelanggan + Akun Google Pro pakai data dummy dengan palet `#121212`, `#090A33`, `#FFFFFF`.

* **Minggu 2 (Integrasi CRUD & Keuangan):**

  * *Raken:* Sambungkan CRUD Akun Google Pro, CRUD Pelanggan, logika hitung slot otomatis, dan fitur Keuangan + grafik Dashboard.

  * *Arya:* Slicing halaman Dashboard (KPI Cards + tempat grafik), halaman Keuangan, dan rapikan tampilan versi HP (responsive).

* **Minggu 3 (Keamanan & Rilis):**

  * *Raken:* Migrasi ke Google OAuth Supabase, aktifkan `admin_whitelist` + RLS, deploy ke subdomain `admin.nottura.my.id`.

  * *Raken & Arya:* Testing bareng alur input dari awal sampai tombol Remind WA dan hitung profit, lalu serah terima ke 2 teman tim landing page/CS.