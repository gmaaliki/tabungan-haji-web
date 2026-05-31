# Tabungan Haji Web

Frontend Next.js (App Router) untuk BSI Hajj Online — portal nasabah dan panel administrasi tabungan haji. Backend: `tabungan-haji-api`.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` di `.env.local` (default `http://localhost:3000/api/v1`).

```bash
npm run build    # production build
npm run lint     # eslint
```

## Tech

- Next.js 15+ App Router, React 19, TypeScript
- Tailwind CSS dengan token Material Design 3
- Material Symbols Outlined untuk ikon
- Auth: JWT disimpan di `localStorage`, role-based redirect (`USER` → `/dashboard`, `ADMIN` → `/admin`)
- API client tunggal di `lib/api.ts` (semua fetch + tipe)

## Struktur direktori

```
app/                 # Next.js App Router pages
component/           # Sidebar, TopNav, LoginForm, HealthStatus
lib/api.ts           # API client + tipe domain
public/              # Aset statis
```

## Daftar Halaman

Total: **19 rute** (5 publik, 6 nasabah, 7 admin, 1 utilitas). Setiap halaman ditandai dengan endpoint backend yang dikonsumsi.

### Halaman publik

| Rute | File | Deskripsi |
|---|---|---|
| `/` | `app/page.tsx` | Root redirect — cek token lalu arahkan ke `/dashboard` (USER) atau `/admin` (ADMIN), kalau tidak ada token ke `/login`. |
| `/login` | `app/login/page.tsx` | Form login email/password. Sukses → simpan token, panggil `getMe`, redirect berdasarkan role. Endpoint: `POST /auth/login`, `GET /auth/me`. |
| `/register` | `app/register/page.tsx` | Pendaftaran publik nasabah baru (NIK 16 digit, nama, email, no HP `08xxxx`, password ≥ 8). Endpoint: `POST /nasabah`. |
| `/health` | `app/health/page.tsx` | Halaman cek konektivitas backend (status `/health` API). |

### Halaman nasabah (role USER)

Layout: `Sidebar` kiri + `TopNav` atas. Semua halaman ini memvalidasi token dan redirect ke `/login` jika 401.

| Rute | File | Deskripsi |
|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard utama: kartu saldo, status eligibilitas (Rp 25 juta), progress bar setoran awal, 5 transaksi terbaru, journey 3-step. Endpoint: `GET /auth/me`, `GET /tabungan-haji/:id`, `GET /tabungan-haji/:id/mutasi`. |
| `/setoran` | `app/setoran/page.tsx` | Form setoran dengan quick-set (500K / 1M / 5M / 10M), pilihan metode `TRANSFER`/`TUNAI`, minimum Rp 100.000, header `Idempotency-Key`. Endpoint: `POST /tabungan-haji/:id/setor`. |
| `/penarikan` | `app/penarikan/page.tsx` | Form penarikan dengan quick-set, validasi saldo, metode `TUNAI`. Endpoint: `POST /tabungan-haji/:id/penarikan`. |
| `/transaksi` | `app/transaksi/page.tsx` | Riwayat mutasi dengan filter tahun (5 tahun terakhir) & bulan, ringkasan total setoran/penarikan, unduh CSV per periode, tiap baris bisa diklik ke detail. Endpoint: `GET /tabungan-haji/:id/mutasi`, `GET /laporan/transaksi/saya/:tabunganId`. |
| `/transaksi/[id]` | `app/transaksi/[id]/page.tsx` | Bukti transaksi tunggal (struk): jumlah, jenis, referensi, metode, pergerakan saldo, tombol cetak. Endpoint: `GET /tabungan-haji/:tabunganId/mutasi/:id`. |
| `/eligibility` | `app/eligibility/page.tsx` | Pemeriksa eligibilitas haji: saldo vs ambang Rp 25 juta, tahun perkiraan keberangkatan (tanggal daftar + masa tunggu), form set tanggal daftar haji. Endpoint: `GET /tabungan-haji/:id/estimasi`, `PATCH /tabungan-haji/:id/tanggal-daftar`. |
| `/settings` | `app/settings/page.tsx` | Pengaturan profil (nama, email, no HP) + tombol buka rekening tabungan haji baru. Endpoint: `PATCH /nasabah/:id`, `POST /tabungan-haji`. |

### Halaman admin (role ADMIN)

Layout: `AdminSidebar` + `TopNav`. Akses ditolak (redirect ke `/dashboard`) jika role bukan `ADMIN`.

| Rute | File | Deskripsi |
|---|---|---|
| `/admin` | `app/admin/page.tsx` | Dashboard admin: 3 stat card (total nasabah, total rekening dengan breakdown aktif/dormant/tutup, total saldo), 3 quick link, 6 rekening terbaru (klik ke detail nasabah / rekening). Endpoint: `GET /nasabah`, `GET /tabungan-haji`. |
| `/admin/nasabah` | `app/admin/nasabah/page.tsx` | Daftar seluruh nasabah dengan pencarian (nama/NIK/email), tombol detail dan hapus (dengan konfirmasi). Endpoint: `GET /nasabah`, `DELETE /nasabah/:id`. |
| `/admin/nasabah/[id]` | `app/admin/nasabah/[id]/page.tsx` | Detail nasabah: ringkasan (jumlah rekening, total saldo, tgl terdaftar), profil dengan edit inline (nama/email/HP), daftar tabungan dengan link ke detail rekening, tombol hapus nasabah. Endpoint: `GET /nasabah/:id`, `PATCH /nasabah/:id`, `DELETE /nasabah/:id`. |
| `/admin/rekening` | `app/admin/rekening/page.tsx` | Daftar seluruh rekening dengan pencarian (no. rekening/nasabah), kolom status bisa diubah inline (`AKTIF`/`DORMANT`/`TUTUP`), tombol detail dan hapus. Endpoint: `GET /tabungan-haji`, `PATCH /tabungan-haji/:id/status`, `DELETE /tabungan-haji/:id`. |
| `/admin/rekening/[id]` | `app/admin/rekening/[id]/page.tsx` | Detail rekening: kartu saldo/dibuka/status/estimasi tahun berangkat, panel ubah status, panel set tanggal daftar haji, detail estimasi eligibilitas, riwayat mutasi dengan filter periode + unduh CSV, tiap baris ke admin tx detail, tombol hapus rekening. Endpoint: `GET /tabungan-haji/:id`, `GET /tabungan-haji/:id/estimasi`, `GET /tabungan-haji/:id/mutasi`, `PATCH /tabungan-haji/:id/status`, `PATCH /tabungan-haji/:id/tanggal-daftar`, `DELETE /tabungan-haji/:id`, `GET /laporan/transaksi/tabungan/:tabunganId`. |
| `/admin/rekening/[id]/mutasi/[txId]` | `app/admin/rekening/[id]/mutasi/[txId]/page.tsx` | Detail transaksi versi admin: kartu utama dengan pergerakan saldo, info rekening dan nasabah (NIK, email), tombol cetak. Endpoint: `GET /tabungan-haji/:id`, `GET /tabungan-haji/:tabunganId/mutasi/:id`. |
| `/admin/laporan` | `app/admin/laporan/page.tsx` | Ekspor CSV berdasarkan periode (tahun + bulan): unduh laporan seluruh transaksi (lintas rekening) atau per rekening tertentu via dropdown. Endpoint: `GET /tabungan-haji`, `GET /laporan/transaksi`, `GET /laporan/transaksi/tabungan/:tabunganId`. |
| `/admin/staff` | `app/admin/staff/page.tsx` | Buat akun staf/admin baru (email + password + role `ADMIN`/`USER`); akun yang dibuat dalam sesi ditampilkan sementara di samping (backend belum punya endpoint list staf). Endpoint: `POST /auth/register`. |

## Komponen kunci

| Komponen | File | Fungsi |
|---|---|---|
| `Sidebar` | `component/sidebar.tsx` | Navigasi nasabah (dashboard, mutasi, setoran, penarikan, eligibility, settings) + tombol logout. |
| `AdminSidebar` | `component/admin-sidebar.tsx` | Navigasi admin (overview, nasabah, rekening, laporan, akun staf) + logout. |
| `TopNav` | `component/topnav.tsx` | Header dengan nama dan role pengguna untuk semua halaman terotentikasi. |
| `LoginForm` | `component/login-form.tsx` | Form login yang dipakai oleh halaman `/login`. |
| `HealthStatus` | `component/health-status.tsx` | Indikator status konektivitas backend. |

## API client (`lib/api.ts`)

Single file yang membungkus semua endpoint backend. Mengembalikan data terpetakan ke tipe TypeScript (`Me`, `Tabungan`, `TabunganDetail`, `TabunganSummary`, `TabunganWithNasabah`, `NasabahRow`, `NasabahDetail`, `Estimasi`, `Transaksi`, `HasilTransaksi`, `StaffUser`). Konstanta domain: `SETORAN_MINIMUM` (Rp 25 juta), `DEPOSIT_MINIMUM` (Rp 100rb). Helper: `formatRupiah`, `formatDate`, `toNumber`, `getTabunganFromMe`.

Seluruh 25 endpoint REST backend (+ `/health`) dipakai oleh frontend.

## Pola autentikasi

- Token JWT disimpan di `localStorage.token` setelah login berhasil.
- Setiap request ke endpoint terproteksi memasang `Authorization: Bearer <token>`.
- Setiap halaman terproteksi memanggil `getMe()` di mount untuk validasi + ambil profil.
- Response `401` mentriger penghapusan token + redirect ke `/login`.
- Halaman admin memeriksa `me.role === "ADMIN"`; selain itu redirect ke `/dashboard`.
- Logout memanggil `POST /auth/logout` (revoke token sisi server) lalu menghapus token lokal.

## Konvensi UI

- Warna mengikuti token Material Design 3 (`primary`, `secondary`, `surface`, `error`, dst.).
- Setiap halaman menyediakan komponen lokal `PageSkeleton` untuk state loading.
- Format mata uang dan tanggal selalu lewat helper di `lib/api.ts` (locale `id-ID`).
- Konfirmasi destruktif (hapus) menggunakan pola in-row dengan tombol "Konfirmasi" + "Batal".
