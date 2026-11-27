# Panduan Integrasi Frontend untuk Arya (Nottura Admin Panel)

Dokumen ini dibuat agar **Arya** bisa langsung mengerjakan slicing UI/UX (tema Dark Mode, Sidebar, Header, Card, Tabel, Modal, Grafik, dan tampilan mobile responsive) di atas fondasi backend & logika yang sudah disiapkan **Raken**, tanpa bentrok kode.

---

## 1. Pembagian Kepemilikan File

### Area Milik Raken (Jangan ubah kontrak/logika tanpa diskusi)
- `supabase/` — Skema 4 tabel (`admin_whitelist`, `family_groups`, `customers`, `transactions`), RLS, dan seed whitelist.
- `src/types/database.ts` — Seluruh tipe data TypeScript.
- `src/lib/supabase/` — Client Supabase browser & server.
- `src/lib/auth/` — Konfigurasi Auth 2 fase (Dummy Lokal vs Google OAuth + Whitelist).
- `src/lib/logic/` — Logika murni (hitung slot, status H-3/Expired, normalisasi WA `628...`, link `wa.me`, cek duplikat Gmail, ringkasan keuangan & grafik, export CSV).
- `src/services/` — Service query & mutasi ke Supabase.
- `src/hooks/` — React hooks siap pakai (`useAuth`, `useDashboard`, `useAccounts`, `useCustomers`, `useFinance`).
- `src/middleware.ts` & `src/app/api/auth/*` & `src/app/auth/callback/route.ts` — Proteksi route otomatis.

### Area Milik Arya (Silakan design, slicing, & styling bebas)
- `src/app/globals.css` — Konfigurasi Tailwind CSS / custom utility styling.
- `src/app/layout.tsx` — Bungkus `{children}` dengan komponen Layout (Sidebar + Header + Mobile Nav). **Pertahankan** konfigurasi `metadata.robots` (`noindex, nofollow`).
- `src/components/` — Silakan buat folder ini untuk menaruh komponen UI (`Sidebar`, `Header`, `KpiCard`, `FinanceChart`, `CustomerModal`, dll).
- `src/app/login/page.tsx`
- `src/app/page.tsx`
- `src/app/accounts/page.tsx`
- `src/app/customers/page.tsx`
- `src/app/finance/page.tsx`

*(Semua halaman saat ini masih berupa skeleton HTML polos yang sudah tersambung ke hooks dan bertanda `// TODO(Arya)`.)*

---

## 2. Panduan Tampilan Sesuai PRD

- **Dark Mode Palette:**
  - Background utama: `#121212`
  - Surface / Sidebar / Header / Card utama: `#090A33` (boleh diberi border `rgba(255, 255, 255, 0.1)`)
  - Teks utama / angka KPI: `#FFFFFF` (teks sekunder putih opacity 60%–70%)
- **Warna Status:**
  - Hijau: Aktif / Slot Tersedia / Pemasukan (`income`)
  - Kuning: H-3 Expired (`expiring_soon`) / Hampir Penuh
  - Merah: Expired (`expired`) / Grup Penuh / Pengeluaran (`expense`)
- **Responsive:** Pastikan minimal halaman Dashboard (`/`) dan Datalist Pelanggan (`/customers`) nyaman dipakai di HP.

---

## 3. Cara Menjalankan Lokal (Fase 1 - Login Dummy)

1. Salin `.env.example` menjadi `.env.local`:
   ```bash
   copy .env.example .env.local
   ```
2. Pastikan `NEXT_PUBLIC_AUTH_MODE=dummy` di `.env.local`.
3. Jalankan dev server:
   ```bash
   npm run dev
   ```
4. Buka `http://localhost:3000` → otomatis diarahkan ke `/login`.
5. Login menggunakan kredensial Fase 1:
   - **Username:** `nottura`
   - **Password:** `123`

> **Catatan:** Saat `NEXT_PUBLIC_SUPABASE_URL` belum diisi, hook tetap aman berjalan tanpa crash (mengembalikan `supabaseConfigured: false` dan pesan `error`). Kamu bisa sementara pakai data dummy lokal di state/komponen saat slicing, lalu sambungkan ke return hook saat Supabase sudah diisi.

---

## 4. Kontrak React Hooks (`src/hooks/`)

### `useAuth()`
- State: `user` (`{ email, name, role, mode } | null`), `authMode` (`"dummy" | "supabase"`), `supabaseConfigured`, `loading`, `submitting`, `error`.
- Aksi: `loginDummy(username, password)`, `loginGoogle()`, `logout()`, `refresh()`.

### `useDashboard(initialYear?, initialMonth?)`
- State: `year`, `setYear`, `month`, `setMonth`, `data` (`DashboardData | null`), `loading`, `error`, `supabaseConfigured`.
- Struktur `data`:
  - `data.kpi`: `{ activeCustomers, totalReadySlots, expiringSoonCount, monthlyIncome, monthlyExpense, monthlyNetProfit }`
  - `data.customerGrowthSeries`: array 12 bulan `{ month, label, newCustomers, cumulativeCustomers }`
  - `data.financeSeries`: array 12 bulan `{ month, label, income, expense, netProfit }`
  - `data.upcomingExpirations`: maksimal 5 pelanggan dengan `remind_wa_url`, `days_remaining`, `end_date`, dll.

### `useAccounts()`
- State: `groups` (`FamilyGroupWithSlots[]`), `selectedGroupMembers` (`EnrichedCustomer[]`), `loadingMembers`, `loading`, `submitting`, `error`.
- Properti slot otomatis pada tiap item `groups`:
  - `active_members_count`, `ready_slots`, `is_full`, `effective_status` (`Full Group` otomatis `ready_slots = 0` & `is_full = true`).
- Aksi: `loadGroupMembers(groupId)`, `createGroup(payload)`, `updateGroup(id, payload)`, `deleteGroup(id)`, `refresh()`.

### `useCustomers(initialStatus?)`
- State: `customers` (sudah terfilter), `allCustomers`, `groups` (untuk dropdown pilihan grup), `search`, `setSearch`, `statusFilter`, `setStatusFilter`, `groupFilter`, `setGroupFilter`, `loading`, `submitting`, `error`.
- Properti otomatis tiap pelanggan: `status` (`"active" | "expiring_soon" | "expired"`), `days_remaining`, `family_group_name`, `remind_wa_url`.
- Aksi:
  - `checkGmailDuplicate(gmail, excludeCustomerId?)` → mengembalikan `{ isDuplicate, matches, warningMessage }` (pengingat cooldown 12 bulan).
  - `createCustomer(payload, { recordIncome?: { record, amount?, payment_method?, description?, transaction_date? } })` → otomatis normalisasi WA `08...` → `628...` dan default `end_date` +30 hari.
  - `updateCustomer(id, payload)`
  - `deleteCustomer(id)`
  - `renewCustomer(id, { days?: 30, recordIncome?: { record, amount?, payment_method? } })` → otomatis +30 hari dan bisa langsung mencatat transaksi `renewal`.

### `useFinance(initialYear?, initialMonth?)`
- State: `transactions`, `summary` (`{ income, expense, netProfit, count }`), `year`, `setYear`, `month`, `setMonth`, `typeFilter`, `setTypeFilter`, `loading`, `submitting`, `error`.
- Aksi: `createTransaction(payload)`, `deleteTransaction(id)`, `downloadCsv()`, `getCsvContent()`, `refresh()`.

---

## 5. Checklist Rilis Produksi (`admin.nottura.my.id`)

Saat siap beralih ke Fase 2 (Production):
1. Jalankan `supabase/migrations/001_initial_schema.sql` dan `supabase/seed.sql` (isi 4 email asli tim Nottura) di Supabase SQL Editor.
2. Aktifkan Google OAuth Provider di Supabase Auth dan daftarkan callback URL `https://admin.nottura.my.id/auth/callback`.
3. Set environment variable produksi dengan `NEXT_PUBLIC_AUTH_MODE=supabase` (login dummy otomatis nonaktif di `NODE_ENV=production`).
