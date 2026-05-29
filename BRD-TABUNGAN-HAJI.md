# BUSINESS REQUIREMENTS DOCUMENT (BRD)
## Sistem Tabungan Haji Online

---

| Dokumen       | Keterangan                              |
|---------------|-----------------------------------------|
| Nama Proyek   | Sistem Tabungan Haji Online             |
| Versi         | 1.0                                     |
| Tanggal       | 29 Mei 2026                             |
| Status        | Draft                                   |
| Dibuat Oleh   | Tim Pengembang ODP BSI                  |

---

## DAFTAR ISI

1. [Latar Belakang](#1-latar-belakang)
2. [Tujuan Proyek](#2-tujuan-proyek)
3. [Ruang Lingkup](#3-ruang-lingkup)
4. [Pemangku Kepentingan](#4-pemangku-kepentingan)
5. [Kebutuhan Bisnis](#5-kebutuhan-bisnis)
6. [Kebutuhan Fungsional](#6-kebutuhan-fungsional)
7. [Kebutuhan Non-Fungsional](#7-kebutuhan-non-fungsional)
8. [Alur Proses Bisnis](#8-alur-proses-bisnis)
9. [Model Data](#9-model-data)
10. [Aturan Bisnis](#10-aturan-bisnis)
11. [Penanganan Error](#11-penanganan-error)
12. [Mockup Antarmuka](#12-mockup-antarmuka)
13. [Asumsi dan Batasan](#13-asumsi-dan-batasan)
14. [Glosarium](#14-glosarium)

---

## 1. Latar Belakang

Indonesia merupakan negara dengan populasi muslim terbesar di dunia. Ibadah haji merupakan rukun Islam ke-5 yang wajib dilaksanakan bagi yang mampu. Antrian haji di Indonesia bisa mencapai 10–40 tahun, sehingga persiapan finansial sejak dini sangat penting.

Sistem Tabungan Haji Online hadir sebagai solusi digital bagi nasabah untuk membuka rekening tabungan haji, melakukan setoran, memantau saldo, dan mengecek estimasi keberangkatan haji secara mandiri melalui platform web.

### Arsitektur Sistem

```
┌─────────────────────────────────────┐
│   Next.js Web App (Port 3001)       │
│   Frontend / Antarmuka Pengguna     │
└──────────────┬──────────────────────┘
               │ REST API / HTTP
┌──────────────▼──────────────────────┐
│   Express.js API (Port 3000)        │
│   Backend / Business Logic          │
└──────────────┬──────────────────────┘
               │ Prisma ORM
┌──────────────▼──────────────────────┐
│   PostgreSQL Database               │
│   Penyimpanan Data                  │
└─────────────────────────────────────┘
```

---

## 2. Tujuan Proyek

1. Menyediakan platform digital untuk pendaftaran dan pengelolaan rekening tabungan haji secara mandiri (self-service).
2. Mempermudah nasabah dalam melakukan setoran dan penarikan tabungan haji.
3. Memberikan informasi estimasi keberangkatan haji berdasarkan saldo tabungan.
4. Memberikan kemudahan bagi admin bank dalam mengelola data nasabah dan rekening.
5. Meningkatkan efisiensi operasional melalui otomasi proses administratif.

---

## 3. Ruang Lingkup

### Dalam Lingkup (In Scope)

- Registrasi nasabah secara mandiri
- Login dan autentikasi berbasis JWT
- Pembukaan rekening tabungan haji
- Transaksi setoran dan penarikan
- Pengecekan saldo dan riwayat transaksi
- Estimasi kelayakan dan keberangkatan haji
- Unduh laporan transaksi (format CSV)
- Manajemen nasabah dan rekening oleh admin
- Audit log setiap transaksi penting

### Di Luar Lingkup (Out of Scope)

- Integrasi dengan sistem SISKOHAT (Sistem Informasi dan Komputerisasi Haji Terpadu) Kemenag
- Pembayaran melalui payment gateway eksternal
- Mobile application (Android/iOS)
- Notifikasi email/SMS otomatis
- Integrasi dengan core banking system eksisting

---

## 4. Pemangku Kepentingan

| Pemangku Kepentingan | Peran                                            |
|----------------------|--------------------------------------------------|
| Nasabah              | Pengguna utama sistem; mendaftar, menabung, memantau saldo |
| Admin Bank           | Mengelola data nasabah, rekening, dan laporan    |
| Tim Pengembang       | Membangun dan memelihara sistem                  |
| Tim IT & Keamanan    | Memastikan sistem aman dan tersedia              |

---

## 5. Kebutuhan Bisnis

### 5.1 Masalah yang Diselesaikan

| No | Masalah                                                         | Solusi                                                              |
|----|-----------------------------------------------------------------|---------------------------------------------------------------------|
| 1  | Proses pendaftaran manual membutuhkan kunjungan ke kantor       | Registrasi online mandiri tanpa perlu ke kantor                     |
| 2  | Nasabah tidak tahu kapan berangkat haji                         | Fitur estimasi keberangkatan haji otomatis                          |
| 3  | Pencatatan transaksi manual rentan kesalahan                    | Pencatatan digital otomatis dengan idempotency key                  |
| 4  | Laporan transaksi sulit diakses                                 | Unduh laporan CSV kapan saja                                        |
| 5  | Admin kesulitan memantau seluruh nasabah                        | Dashboard admin dengan akses ke semua data                          |

---

## 6. Kebutuhan Fungsional

### 6.1 Modul Autentikasi

| ID  | Kebutuhan                                                       | Prioritas |
|-----|-----------------------------------------------------------------|-----------|
| F01 | Nasabah dapat mendaftar akun dengan NIK, nama, email, nomor HP, dan password | Tinggi |
| F02 | Pengguna dapat login menggunakan email dan password             | Tinggi    |
| F03 | Sistem menerbitkan JWT token valid selama 24 jam                | Tinggi    |
| F04 | Pengguna dapat logout (token direvoke)                          | Tinggi    |
| F05 | Pengguna dapat melihat profil akun sendiri                      | Sedang    |
| F06 | Admin dapat mendaftarkan pengguna baru dengan role              | Sedang    |

### 6.2 Modul Nasabah

| ID  | Kebutuhan                                                       | Prioritas |
|-----|-----------------------------------------------------------------|-----------|
| F07 | Nasabah dapat mendaftar secara mandiri                          | Tinggi    |
| F08 | Nasabah dapat memperbarui data profil (nama, email, nomor HP)   | Sedang    |
| F09 | Admin dapat melihat daftar seluruh nasabah                      | Tinggi    |
| F10 | Admin dapat menghapus data nasabah (soft delete)                | Sedang    |
| F11 | NIK harus unik dan terdiri dari 16 digit                        | Tinggi    |
| F12 | Satu akun user hanya dapat terdaftar sebagai satu nasabah       | Tinggi    |

### 6.3 Modul Rekening Tabungan Haji

| ID  | Kebutuhan                                                       | Prioritas |
|-----|-----------------------------------------------------------------|-----------|
| F13 | Nasabah dapat membuka rekening tabungan haji                    | Tinggi    |
| F14 | Satu nasabah hanya dapat memiliki satu rekening tabungan haji   | Tinggi    |
| F15 | Nomor rekening digenerate otomatis oleh sistem                  | Tinggi    |
| F16 | Admin dapat mengubah status rekening (AKTIF/DORMANT/TUTUP)      | Tinggi    |
| F17 | Nasabah dapat menetapkan tanggal pendaftaran haji               | Sedang    |
| F18 | Admin dapat menghapus rekening yang saldonya 0 dan tanpa riwayat transaksi | Rendah |

### 6.4 Modul Transaksi

| ID  | Kebutuhan                                                       | Prioritas |
|-----|-----------------------------------------------------------------|-----------|
| F19 | Nasabah dapat melakukan setoran dengan nominal minimal Rp100.000 | Tinggi   |
| F20 | Nasabah dapat melakukan penarikan sesuai saldo yang tersedia    | Tinggi    |
| F21 | Sistem mencatat saldo sebelum dan sesudah setiap transaksi      | Tinggi    |
| F22 | Sistem menghasilkan nomor referensi unik untuk setiap transaksi | Tinggi    |
| F23 | Setoran mendukung idempotency key untuk mencegah duplikasi      | Sedang    |
| F24 | Nasabah dapat melihat riwayat mutasi rekening                   | Tinggi    |
| F25 | Transaksi hanya bisa dilakukan pada rekening berstatus AKTIF    | Tinggi    |

### 6.5 Modul Estimasi Haji

| ID  | Kebutuhan                                                       | Prioritas |
|-----|-----------------------------------------------------------------|-----------|
| F26 | Sistem menghitung kelayakan berdasarkan minimal saldo Rp25.000.000 | Tinggi |
| F27 | Sistem menampilkan perkiraan tahun keberangkatan haji           | Tinggi    |
| F28 | Masa tunggu default adalah 20 tahun dari tanggal daftar         | Tinggi    |
| F29 | Sistem menampilkan kekurangan saldo jika belum eligible         | Sedang    |

### 6.6 Modul Laporan

| ID  | Kebutuhan                                                       | Prioritas |
|-----|-----------------------------------------------------------------|-----------|
| F30 | Nasabah dapat mengunduh laporan transaksi rekening sendiri (CSV) | Sedang   |
| F31 | Admin dapat mengunduh laporan transaksi per rekening (CSV)      | Sedang    |
| F32 | Admin dapat mengunduh laporan seluruh transaksi (CSV)           | Sedang    |
| F33 | Laporan dapat difilter berdasarkan tahun dan bulan              | Sedang    |

---

## 7. Kebutuhan Non-Fungsional

| ID   | Kebutuhan                                                       | Target              |
|------|-----------------------------------------------------------------|---------------------|
| NF01 | Keamanan: Semua password di-hash menggunakan bcrypt             | Wajib               |
| NF02 | Keamanan: JWT token divalidasi di setiap endpoint terproteksi   | Wajib               |
| NF03 | Keamanan: HTTP headers dilindungi menggunakan Helmet.js         | Wajib               |
| NF04 | Validasi: Semua input divalidasi menggunakan Zod schema         | Wajib               |
| NF05 | Audit: Semua aksi kritis dicatat di tabel AuditLog              | Wajib               |
| NF06 | Idempotency: Setoran mendukung idempotency key                  | Wajib               |
| NF07 | Performa: Response API < 2 detik untuk operasi normal           | Tinggi              |
| NF08 | Ketersediaan: Sistem tersedia 99% uptime                        | Tinggi              |

---

## 8. Alur Proses Bisnis

### 8.1 Alur Registrasi Nasabah

```
[Calon Nasabah]
      │
      ▼
┌─────────────────┐
│  Akses Halaman  │
│   Registrasi    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Isi Formulir Registrasi:       │
│  - NIK (16 digit)               │
│  - Nama Lengkap                 │
│  - Email                        │
│  - Nomor HP (08xxxxxxxxxx)      │
│  - Password (min 8 karakter)    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────┐     GAGAL      ┌──────────────────────┐
│  Validasi Data  │───────────────▶│  Tampilkan Pesan Error│
└────────┬────────┘                └──────────────────────┘
         │ BERHASIL
         ▼
┌─────────────────────────────┐
│  Sistem Buat:               │
│  - Akun User (email+pass)   │
│  - Data Nasabah (NIK, dll.) │
│  - Catat AuditLog           │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Registrasi Berhasil     │
│  Nasabah Bisa Login      │
└──────────────────────────┘
```

### 8.2 Alur Login

```
[Pengguna]
      │
      ▼
┌─────────────────────────────┐
│  Masukkan Email + Password  │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────┐    GAGAL    ┌────────────────────────┐
│  Validasi        │────────────▶│  Tampilkan:            │
│  Kredensial      │             │  "Email/password salah" │
└────────┬─────────┘             └────────────────────────┘
         │ BERHASIL
         ▼
┌─────────────────────────────┐
│  Sistem Menerbitkan         │
│  JWT Token (valid 24 jam)   │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Redirect ke Dashboard   │
│  Nasabah                 │
└──────────────────────────┘
```

### 8.3 Alur Pembukaan Rekening Tabungan Haji

```
[Nasabah Terautentikasi]
      │
      ▼
┌─────────────────────────────┐
│  Akses Menu Buka Rekening   │
│  Tabungan Haji              │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────────────────┐    SUDAH ADA   ┌──────────────────────┐
│  Cek: Apakah Nasabah Sudah       │───────────────▶│  Tampilkan Pesan:    │
│  Punya Rekening?                 │                │  "Rekening sudah ada"│
└────────┬─────────────────────────┘                └──────────────────────┘
         │ BELUM ADA
         ▼
┌─────────────────────────────────────┐
│  Sistem Generate:                   │
│  - Nomor Rekening Unik (7 digit)    │
│  - Status: AKTIF                    │
│  - Saldo Awal: Rp0                  │
│  - Tanggal Dibuka: Sekarang         │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Rekening Berhasil Dibuka        │
│  Tampilkan Nomor Rekening        │
└──────────────────────────────────┘
```

### 8.4 Alur Setoran

```
[Nasabah Terautentikasi]
      │
      ▼
┌─────────────────────────────┐
│  Pilih Rekening & Masukkan  │
│  Nominal Setoran            │
└────────┬────────────────────┘
         │
         ▼
┌───────────────────────────┐     GAGAL       ┌──────────────────────────┐
│  Validasi:                │────────────────▶│  Tampilkan Error:        │
│  - Rekening status AKTIF? │                 │  - Rekening tidak aktif  │
│  - Nominal >= Rp100.000?  │                 │  - Nominal terlalu kecil │
└────────┬──────────────────┘                 └──────────────────────────┘
         │ VALID
         ▼
┌─────────────────────────────────────────┐
│  Cek Idempotency Key (jika ada)         │
│  - Sudah diproses? → Return hasil lama  │
│  - Belum? → Proses baru                 │
└────────┬────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Sistem:                             │
│  - Update saldo rekening             │
│  - Buat record Transaksi (SETORAN)   │
│  - Generate nomor referensi (STRxxx) │
│  - Catat saldo sebelum & sesudah     │
└────────┬─────────────────────────────┘
         │
         ▼
┌───────────────────────────────┐
│  Setoran Berhasil             │
│  Tampilkan Konfirmasi & Saldo │
└───────────────────────────────┘
```

### 8.5 Alur Penarikan

```
[Nasabah Terautentikasi]
      │
      ▼
┌─────────────────────────────┐
│  Pilih Rekening & Masukkan  │
│  Nominal Penarikan          │
└────────┬────────────────────┘
         │
         ▼
┌────────────────────────────────┐     GAGAL    ┌──────────────────────────────┐
│  Validasi:                     │─────────────▶│  Tampilkan Error:            │
│  - Rekening status AKTIF?      │              │  - Rekening tidak aktif      │
│  - Saldo >= Nominal Penarikan? │              │  - Saldo tidak mencukupi     │
└────────┬───────────────────────┘              └──────────────────────────────┘
         │ VALID
         ▼
┌──────────────────────────────────────┐
│  Sistem:                             │
│  - Kurangi saldo rekening            │
│  - Buat record Transaksi (PENARIKAN) │
│  - Generate nomor referensi (PTRxxx) │
│  - Catat saldo sebelum & sesudah     │
└────────┬─────────────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│  Penarikan Berhasil            │
│  Tampilkan Konfirmasi & Saldo  │
└────────────────────────────────┘
```

### 8.6 Alur Estimasi Keberangkatan Haji

```
[Nasabah Terautentikasi]
      │
      ▼
┌──────────────────────────────────────┐
│  Akses Halaman Estimasi Haji         │
│  Sistem Baca Saldo & Data Rekening   │
└────────┬─────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│  Cek Kelayakan:                                 │
│  Apakah Saldo >= Rp25.000.000?                  │
└────────┬────────────────────────────────────────┘
         │                         │
    YA (ELIGIBLE)              TIDAK (BELUM ELIGIBLE)
         │                         │
         ▼                         ▼
┌─────────────────────┐   ┌──────────────────────────────┐
│  Tampilkan:         │   │  Tampilkan:                  │
│  - Status: Eligible │   │  - Status: Belum Eligible    │
│  - Saldo saat ini   │   │  - Saldo saat ini            │
│  - Kekurangan: Rp0  │   │  - Kekurangan: Rp(25jt-saldo│
│  - Tanggal daftar   │   │  - Anjuran terus menabung    │
│  - Est. berangkat:  │   └──────────────────────────────┘
│    Tahun Daftar+20  │
└─────────────────────┘
```

### 8.7 Alur Unduh Laporan

```
[Pengguna Terautentikasi]
      │
      ▼
┌──────────────────────────────────────┐
│  Pilih Filter Laporan:               │
│  - Tahun (default: tahun ini)        │
│  - Bulan (default: bulan ini)        │
└────────┬─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Sistem Generate CSV dengan │
│  kolom:                     │
│  waktu, nomor_rekening,     │
│  nama_nasabah, nik, jenis,  │
│  nominal, saldo_sebelum,    │
│  saldo_sesudah, metode,     │
│  referensi                  │
└────────┬────────────────────┘
         │
         ▼
┌──────────────────────────┐
│  File CSV Terunduh       │
│  Otomatis ke Perangkat   │
└──────────────────────────┘
```

### 8.8 Alur Admin: Manajemen Rekening

```
[Admin Terautentikasi]
      │
      ▼
┌────────────────────────────┐
│  Lihat Daftar Semua        │
│  Rekening Tabungan Haji    │
└────────┬───────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│  Pilih Aksi:                                         │
│                                                      │
│  [Ubah Status]   [Lihat Mutasi]   [Hapus Rekening]  │
└────────┬─────────────────────────────────────────────┘
         │
    UBAH STATUS
         │
         ▼
┌─────────────────────────────────────────────┐
│  Pilih Status Baru:                         │
│  - AKTIF (rekening berjalan)                │
│  - DORMANT (tidak aktif sementara)          │
│  - TUTUP (ditutup permanen)                 │
└────────┬────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Cek: Rekening sudah berstatus TUTUP?    │
└──────┬───────────────────────────────────┘
       │                    │
  BELUM TUTUP           SUDAH TUTUP
       │                    │
       ▼                    ▼
┌──────────────┐   ┌──────────────────────┐
│  Update      │   │  Tampilkan Error:    │
│  Status      │   │  "Rekening sudah     │
│  Berhasil    │   │   ditutup"           │
└──────────────┘   └──────────────────────┘
```

---

## 9. Model Data

### 9.1 Diagram Relasi Entitas (ERD)

```
┌─────────────────────┐         ┌───────────────────────────┐
│        USER         │         │          NASABAH           │
├─────────────────────┤  1   1  ├───────────────────────────┤
│ id (UUID, PK)       │◄────────│ id (UUID, PK)             │
│ email (unique)      │         │ userId (FK → User)        │
│ password (hashed)   │         │ nik (16 digit, unique)    │
│ role (USER/ADMIN)   │         │ nama                      │
│ createdAt           │         │ email (unique)            │
│ updatedAt           │         │ nomorHp                   │
└─────────────────────┘         │ deletedAt (soft delete)   │
                                │ createdAt                 │
                                │ updatedAt                 │
                                └──────────────┬────────────┘
                                               │ 1
                                               │
                                               │ *
                               ┌───────────────▼────────────┐
                               │       TABUNGAN_HAJI        │
                               ├────────────────────────────┤
                               │ id (UUID, PK)              │
                               │ nasabahId (FK → Nasabah)  │
                               │ nomorRekening (unique)     │
                               │ saldo (BigInt)             │
                               │ status (AKTIF/DORMANT/TUTUP│
                               │ tanggalDaftarHaji          │
                               │ dibukaAt                   │
                               └──────────────┬─────────────┘
                                              │ 1
                                              │
                                              │ *
                              ┌───────────────▼─────────────┐
                              │          TRANSAKSI           │
                              ├─────────────────────────────┤
                              │ id (UUID, PK)               │
                              │ tabunganId (FK → Tabungan)  │
                              │ jenis (SETORAN/PENARIKAN)   │
                              │ nominal (BigInt)            │
                              │ saldoSebelum (BigInt)       │
                              │ saldoSesudah (BigInt)       │
                              │ referensi (unique)          │
                              │ metode                      │
                              │ idempotencyKey (unique)     │
                              │ waktu                       │
                              └─────────────────────────────┘

┌─────────────────────┐    ┌──────────────────────┐
│    REVOKED_TOKEN    │    │      AUDIT_LOG        │
├─────────────────────┤    ├──────────────────────┤
│ id (UUID, PK)       │    │ id (UUID, PK)         │
│ jti (unique)        │    │ action               │
│ expiresAt           │    │ entity               │
│ createdAt           │    │ entityId             │
└─────────────────────┘    │ actorId              │
                           │ createdAt            │
                           └──────────────────────┘
```

### 9.2 Definisi Status Rekening

| Status  | Deskripsi                                      | Dapat Transaksi |
|---------|------------------------------------------------|-----------------|
| AKTIF   | Rekening berjalan normal                       | Ya              |
| DORMANT | Rekening tidak aktif sementara                 | Tidak           |
| TUTUP   | Rekening ditutup permanen (tidak dapat dibuka kembali) | Tidak   |

---

## 10. Aturan Bisnis

| No  | Aturan                                                                                  |
|-----|-----------------------------------------------------------------------------------------|
| BR1 | Satu akun user hanya dapat terdaftar sebagai satu nasabah                               |
| BR2 | Satu nasabah hanya dapat memiliki satu rekening tabungan haji                           |
| BR3 | NIK harus unik dan terdiri dari tepat 16 digit angka                                    |
| BR4 | Nomor HP harus berformat `08xxxxxxxxxx` (10–13 digit)                                   |
| BR5 | Password minimum 8 karakter, maksimum 72 karakter                                      |
| BR6 | Token JWT berlaku selama 24 jam (86.400 detik)                                          |
| BR7 | Nominal setoran minimal Rp100.000                                                       |
| BR8 | Penarikan tidak boleh melebihi saldo yang tersedia                                      |
| BR9 | Transaksi hanya dapat dilakukan pada rekening berstatus AKTIF                           |
| BR10 | Saldo minimum eligible untuk daftar haji adalah Rp25.000.000                           |
| BR11 | Masa tunggu keberangkatan haji adalah 20 tahun dari tanggal pendaftaran                |
| BR12 | Tanggal pendaftaran haji tidak dapat diubah setelah ditetapkan                         |
| BR13 | Rekening dengan status TUTUP tidak dapat diaktifkan kembali                            |
| BR14 | Rekening hanya dapat dihapus jika saldo = Rp0 DAN tidak ada riwayat transaksi          |
| BR15 | Nasabah yang dihapus menggunakan soft delete (data tetap tersimpan di database)         |
| BR16 | Setoran dengan Idempotency-Key yang sama akan mengembalikan hasil transaksi pertama    |
| BR17 | Nomor referensi setoran: `STRxxxxxxxx`, penarikan: `PTRxxxxxxxx`                       |
| BR18 | Audit log dicatat untuk setiap aksi kritis (registrasi, transaksi, perubahan status)   |

---

## 11. Penanganan Error

| Kode Error              | HTTP Status | Deskripsi                                         |
|-------------------------|-------------|---------------------------------------------------|
| VALIDATION_ERR          | 400         | Input tidak memenuhi validasi                     |
| INVALID_CREDENTIALS     | 401         | Email atau password salah                         |
| UNAUTHORIZED            | 401         | Token tidak ada atau tidak valid                  |
| TOKEN_REVOKED           | 401         | Token sudah digunakan untuk logout                |
| FORBIDDEN               | 403         | Tidak memiliki izin (role tidak sesuai)           |
| NASABAH_NOT_REGISTERED  | 403         | User belum terdaftar sebagai nasabah              |
| NOT_FOUND               | 404         | Data tidak ditemukan                              |
| DUPLICATE_ENTRY         | 409         | Data sudah ada (NIK atau email terduplikasi)      |
| ALREADY_REGISTERED      | 409         | User sudah terdaftar sebagai nasabah              |
| REKENING_EXISTS         | 409         | Nasabah sudah memiliki rekening tabungan haji     |
| HAS_TRANSAKSI           | 409         | Rekening memiliki riwayat transaksi, tidak dapat dihapus |
| ALREADY_SET             | 409         | Data sudah ditetapkan sebelumnya                  |
| TABUNGAN_NOT_ACTIVE     | 422         | Rekening tidak berstatus AKTIF                    |
| INSUFFICIENT_BALANCE    | 422         | Saldo tidak mencukupi untuk penarikan             |
| SETORAN_AWAL_NOT_REACHED| 422         | Saldo belum mencapai minimum Rp25.000.000         |
| HAS_SALDO               | 422         | Rekening masih memiliki saldo, tidak dapat dihapus|
| ALREADY_CLOSED          | 422         | Rekening sudah berstatus TUTUP                    |

---

## 12. Mockup Antarmuka

### 12.1 Halaman Registrasi Nasabah

```
╔══════════════════════════════════════════════════════════════╗
║                    BANK SYARIAH INDONESIA                    ║
║                   Tabungan Haji Online                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║                  DAFTAR AKUN BARU                            ║
║                                                              ║
║  NIK (16 digit)                                              ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │ 1234567890123456                                     │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║  Nama Lengkap                                                ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │ Ahmad Fauzi                                          │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║  Email                                                       ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │ ahmad.fauzi@email.com                                │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║  Nomor HP                                                    ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │ 081234567890                                         │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║  Password (min. 8 karakter)                                  ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │ ••••••••••••                                         │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║         ┌──────────────────────────────────────┐            ║
║         │           DAFTAR SEKARANG            │            ║
║         └──────────────────────────────────────┘            ║
║                                                              ║
║              Sudah punya akun? Masuk di sini                ║
╚══════════════════════════════════════════════════════════════╝
```

### 12.2 Halaman Login

```
╔══════════════════════════════════════════════════════════════╗
║                    BANK SYARIAH INDONESIA                    ║
║                   Tabungan Haji Online                       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║                      MASUK AKUN                              ║
║                                                              ║
║  Email                                                       ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │ ahmad.fauzi@email.com                                │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║  Password                                                    ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │ ••••••••••••                                         │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║         ┌──────────────────────────────────────┐            ║
║         │               MASUK                  │            ║
║         └──────────────────────────────────────┘            ║
║                                                              ║
║              Belum punya akun? Daftar di sini               ║
╚══════════════════════════════════════════════════════════════╝
```

### 12.3 Dashboard Nasabah

```
╔══════════════════════════════════════════════════════════════╗
║  BSI Tabungan Haji            Ahmad Fauzi  [Keluar]          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Selamat Datang, Ahmad Fauzi                                 ║
║  NIK: 1234567890123456  |  No. HP: 081234567890             ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │  REKENING TABUNGAN HAJI                              │   ║
║  │  No. Rekening: 7012345                               │   ║
║  │  Status: ● AKTIF                                     │   ║
║  │                                                      │   ║
║  │  SALDO                                               │   ║
║  │  Rp 15.500.000                                       │   ║
║  │                                                      │   ║
║  │  Dibuka: 01 Januari 2025                             │   ║
║  │                                                      │   ║
║  │   [Setor Dana]  [Tarik Dana]  [Lihat Mutasi]        │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │  ESTIMASI KEBERANGKATAN HAJI                         │   ║
║  │                                                      │   ║
║  │  Status: Belum Eligible                              │   ║
║  │  Saldo Saat Ini:    Rp 15.500.000                    │   ║
║  │  Minimal Setoran:   Rp 25.000.000                    │   ║
║  │  Kekurangan:        Rp  9.500.000                    │   ║
║  │                                                      │   ║
║  │  Terus menabung untuk memenuhi syarat daftar haji!   │   ║
║  └──────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════╝
```

### 12.4 Dashboard Nasabah (Eligible)

```
╔══════════════════════════════════════════════════════════════╗
║  BSI Tabungan Haji            Ahmad Fauzi  [Keluar]          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │  ESTIMASI KEBERANGKATAN HAJI                         │   ║
║  │                                                      │   ║
║  │  ✓ Status: ELIGIBLE                                  │   ║
║  │  Saldo Saat Ini:    Rp 30.000.000                    │   ║
║  │  Kekurangan:        Rp          0                    │   ║
║  │                                                      │   ║
║  │  Tanggal Daftar Haji: 15 Maret 2025                  │   ║
║  │  Perkiraan Berangkat: Tahun 2045                     │   ║
║  │  Masa Tunggu:         20 Tahun                       │   ║
║  │                                                      │   ║
║  │  Alhamdulillah! Anda sudah eligible untuk haji.      │   ║
║  └──────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════╝
```

### 12.5 Halaman Setoran Dana

```
╔══════════════════════════════════════════════════════════════╗
║  BSI Tabungan Haji            Ahmad Fauzi  [Keluar]          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║               SETORAN TABUNGAN HAJI                          ║
║                                                              ║
║  No. Rekening: 7012345                                       ║
║  Saldo Saat Ini: Rp 15.500.000                               ║
║                                                              ║
║  Nominal Setoran (min. Rp 100.000)                           ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │ Rp 1.000.000                                         │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║  Metode Pembayaran (opsional)                                ║
║  ┌──────────────────────────────────────────────────────┐   ║
║  │ Transfer Bank                                        │   ║
║  └──────────────────────────────────────────────────────┘   ║
║                                                              ║
║  ┌────────────────────────────────────────────────────┐     ║
║  │  Ringkasan:                                        │     ║
║  │  Saldo Sebelum:  Rp 15.500.000                     │     ║
║  │  Setoran:      + Rp  1.000.000                     │     ║
║  │  Saldo Sesudah:  Rp 16.500.000                     │     ║
║  └────────────────────────────────────────────────────┘     ║
║                                                              ║
║    ┌─────────────────────┐  ┌─────────────────────────┐     ║
║    │       BATAL         │  │    KONFIRMASI SETORAN   │     ║
║    └─────────────────────┘  └─────────────────────────┘     ║
╚══════════════════════════════════════════════════════════════╝
```

### 12.6 Halaman Riwayat Mutasi

```
╔══════════════════════════════════════════════════════════════╗
║  BSI Tabungan Haji            Ahmad Fauzi  [Keluar]          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  MUTASI REKENING — No. Rek: 7012345                          ║
║                                                              ║
║  Filter: [Tahun: 2026 ▼]  [Bulan: Mei ▼]  [Unduh CSV]      ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ Waktu          │ Jenis    │ Nominal      │ Saldo       │  ║
║  ├────────────────────────────────────────────────────────┤  ║
║  │ 29 Mei 2026    │ SETORAN  │ +Rp1.000.000 │ Rp16.500.000│  ║
║  │ 15:30          │          │              │             │  ║
║  │ Ref: STR123456 │          │              │             │  ║
║  ├────────────────────────────────────────────────────────┤  ║
║  │ 20 Mei 2026    │ SETORAN  │ +Rp2.000.000 │ Rp15.500.000│  ║
║  │ 10:15          │          │              │             │  ║
║  │ Ref: STR123455 │          │              │             │  ║
║  ├────────────────────────────────────────────────────────┤  ║
║  │ 01 Mei 2026    │ PENARIKAN│ -Rp500.000   │ Rp13.500.000│  ║
║  │ 09:00          │          │              │             │  ║
║  │ Ref: PTR123454 │          │              │             │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  Total: 3 transaksi                                          ║
╚══════════════════════════════════════════════════════════════╝
```

### 12.7 Dashboard Admin

```
╔══════════════════════════════════════════════════════════════╗
║  BSI Admin Panel                    Admin  [Keluar]          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐  ║
║  │  NASABAH     │ │  REKENING    │ │  TOTAL SALDO         │  ║
║  │  1.250 orang │ │  1.180 akun  │ │  Rp 15.6 Miliar      │  ║
║  └──────────────┘ └──────────────┘ └──────────────────────┘  ║
║                                                              ║
╠═══════════════ DAFTAR NASABAH ═══════════════════════════════╣
║                                                              ║
║  Cari: [___________________]  [Unduh Laporan CSV]           ║
║                                                              ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │ Nama           │ NIK              │ Email    │ Rekening  │ ║
║  ├──────────────────────────────────────────────────────────┤ ║
║  │ Ahmad Fauzi    │ 1234567890123456 │ a@b.com  │ 7012345  │ ║
║  │                │                  │          │ [AKTIF]  │ ║
║  │                │           [Detail] [Ubah Status] [Hapus]│ ║
║  ├──────────────────────────────────────────────────────────┤ ║
║  │ Siti Aminah    │ 9876543210987654 │ s@b.com  │ 7012346  │ ║
║  │                │                  │          │ [DORMANT]│ ║
║  │                │           [Detail] [Ubah Status] [Hapus]│ ║
║  └──────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════╝
```

### 12.8 Modal Ubah Status Rekening (Admin)

```
╔══════════════════════════════════════════════════════╗
║               UBAH STATUS REKENING                  ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  Nasabah:       Ahmad Fauzi                          ║
║  No. Rekening:  7012345                              ║
║  Status Saat Ini: AKTIF                              ║
║                                                      ║
║  Status Baru:                                        ║
║  ○ AKTIF    (rekening berjalan normal)               ║
║  ● DORMANT  (nonaktifkan sementara)                  ║
║  ○ TUTUP    (tutup permanen — tidak dapat dibuka lagi)║
║                                                      ║
║  ┌──────────────────┐  ┌──────────────────────────┐  ║
║  │      BATAL       │  │    SIMPAN PERUBAHAN      │  ║
║  └──────────────────┘  └──────────────────────────┘  ║
╚══════════════════════════════════════════════════════╝
```

---

## 13. Asumsi dan Batasan

### Asumsi

1. Setoran awal minimum untuk memenuhi syarat haji adalah **Rp25.000.000** (dapat dikonfigurasi melalui environment variable `SETORAN_AWAL`).
2. Masa tunggu keberangkatan haji adalah **20 tahun** (dapat dikonfigurasi melalui `MASA_TUNGGU_TAHUN`).
3. Setiap nasabah memiliki satu nomor rekening tabungan haji.
4. Validasi NIK dilakukan hanya secara format (16 digit), belum terintegrasi dengan data Dukcapil.
5. Sistem tidak terintegrasi dengan SISKOHAT Kemenag secara langsung.
6. Metode pembayaran setoran bersifat opsional dan hanya dicatat sebagai teks.

### Batasan Teknis

1. Frontend (`tabungan-haji-web`) saat ini masih dalam tahap awal pengembangan — hanya memiliki komponen pengecekan status API.
2. Laporan tersedia dalam format CSV saja, belum mendukung format PDF atau Excel.
3. Sistem belum memiliki fitur notifikasi (email/SMS) untuk konfirmasi transaksi.
4. Tidak ada mekanisme reset password secara mandiri oleh pengguna.

---

## 14. Glosarium

| Istilah             | Definisi                                                                      |
|---------------------|-------------------------------------------------------------------------------|
| NIK                 | Nomor Induk Kependudukan — identitas nasabah 16 digit                         |
| JWT                 | JSON Web Token — token autentikasi digital                                    |
| Setoran             | Transaksi masuk (deposit) ke rekening tabungan haji                           |
| Penarikan           | Transaksi keluar (withdrawal) dari rekening tabungan haji                     |
| Eligible            | Status nasabah yang saldonya telah memenuhi syarat minimum untuk daftar haji  |
| SISKOHAT            | Sistem Informasi dan Komputerisasi Haji Terpadu (Kemenag RI)                  |
| Idempotency Key     | Kunci unik pada header request untuk mencegah duplikasi transaksi             |
| Soft Delete         | Penghapusan data secara logis tanpa menghapus fisik dari database             |
| DORMANT             | Status rekening yang dinonaktifkan sementara                                  |
| Masa Tunggu         | Waktu antara tanggal pendaftaran haji hingga perkiraan keberangkatan          |
| Mutasi              | Riwayat transaksi pada rekening                                               |
| AuditLog            | Catatan digital setiap aksi kritis yang dilakukan pengguna dalam sistem       |
| Nomor Referensi     | Kode unik transaksi; format STRxxxxxxxx (setoran) atau PTRxxxxxxxx (penarikan)|
| Role                | Peran pengguna dalam sistem: USER (nasabah) atau ADMIN                        |
| CSV                 | Comma-Separated Values — format file laporan yang dapat dibuka di Excel        |

---

*Dokumen ini dibuat berdasarkan analisis kode sumber project `tabungan-haji-api` dan `tabungan-haji-web` pada ODP BSI.*
*Catatan: Project `tabungan-haji-online` dan `fe-odp` tidak ditemukan dalam direktori yang tersedia.*
