import { API_URL, fetchCsv, periodeQuery } from "./client";

/** GET /api/v1/laporan/transaksi/saya/:tabunganId — nasabah's own CSV */
export function downloadLaporanSaya(
  token: string,
  tabunganId: string,
  params: { tahun?: number; bulan?: number } = {}
): Promise<Blob> {
  return fetchCsv(
    `${API_URL}/laporan/transaksi/saya/${tabunganId}?${periodeQuery(params)}`,
    token
  );
}

/** GET /api/v1/laporan/transaksi/tabungan/:tabunganId — admin per-rekening CSV */
export function downloadLaporanTabungan(
  token: string,
  tabunganId: string,
  params: { tahun?: number; bulan?: number } = {}
): Promise<Blob> {
  return fetchCsv(
    `${API_URL}/laporan/transaksi/tabungan/${tabunganId}?${periodeQuery(
      params
    )}`,
    token
  );
}

/** GET /api/v1/laporan/transaksi — admin all-transactions CSV */
export function downloadLaporanSemua(
  token: string,
  params: { tahun?: number; bulan?: number } = {}
): Promise<Blob> {
  return fetchCsv(
    `${API_URL}/laporan/transaksi?${periodeQuery(params)}`,
    token
  );
}
