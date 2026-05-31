// Shared API response types — re-exported from the lib/api barrel.

/** Generic envelope for list endpoints: `{ data: [...], total: N }`. */
export type ListResponse<T> = {
  total: number;
  data: T[];
};

/** Zod `flatten()` shape returned by the backend under `details` on 400 validation errors. */
export type ValidationDetails = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[]>;
};

export type Me = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  nasabah: {
    id: string;
    nik: string;
    nama: string;
    email: string;
    nomorHp: string;
    tabungan: TabunganSummary[];
  } | null;
};

export type TabunganSummary = {
  id: string;
  nomorRekening: string;
  saldo: number | string;
  status: "AKTIF" | "DORMANT" | "TUTUP";
  dibukaAt: string;
  tanggalDaftarHaji: string | null;
};

export type Tabungan = TabunganSummary;

export type TabunganDetail = TabunganSummary & {
  nasabah?: {
    id: string;
    nik: string;
    nama: string;
    email: string;
    nomorHp: string;
  };
};

export type TabunganWithNasabah = TabunganSummary & {
  nasabah: {
    id: string;
    nik: string;
    nama: string;
    email: string;
    nomorHp: string;
  };
};

export type NasabahRow = {
  id: string;
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
  createdAt: string;
};

export type NasabahDetail = {
  id: string;
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
  createdAt: string;
  tabungan: TabunganSummary[];
};

export type StaffUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
};

export type Estimasi = {
  nomorRekening: string;
  status: "AKTIF" | "DORMANT" | "TUTUP";
  tanggalDaftarHaji: string | null;
  eligible: boolean;
  saldo: number | string;
  setoranAwal: number | string;
  kurang: number | string;
  masaTungguTahun: number;
  tahunPerkiraan: number | null;
  keterangan: string;
};

export type Transaksi = {
  id: string;
  jenis: "SETORAN" | "PENARIKAN";
  nominal: number | string;
  saldoSebelum: number | string;
  saldoSesudah: number | string;
  referensi: string;
  metode: string | null;
  waktu: string;
};

export type HasilTransaksi = {
  id: string;
  referensi: string;
  nominal: number | string;
  saldoSebelum: number | string;
  saldoSesudah: number | string;
  waktu: string;
};
