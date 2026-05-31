import { API_URL, apiError, authHeaders, readJson } from "./client";
import type { HasilTransaksi, ListResponse, Transaksi } from "./types";

/** GET /api/v1/tabungan-haji/:id/mutasi */
export async function getMutasi(
  token: string,
  tabunganId: string,
  params: { tahun?: number; bulan?: number; limit?: number } = {}
): Promise<ListResponse<Transaksi>> {
  const q = new URLSearchParams();
  if (params.tahun) q.set("tahun", String(params.tahun));
  if (params.bulan) q.set("bulan", String(params.bulan));
  if (params.limit) q.set("limit", String(params.limit));
  const res = await fetch(
    `${API_URL}/tabungan-haji/${tabunganId}/mutasi?${q}`,
    {
      headers: authHeaders(token),
    }
  );
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Gagal memuat mutasi", res.status);
  return { total: json.total ?? json.data?.length ?? 0, data: json.data };
}

/** GET /api/v1/tabungan-haji/:tabunganId/mutasi/:id — single transaction detail */
export async function getTransaksiDetail(
  token: string,
  tabunganId: string,
  transaksiId: string
): Promise<Transaksi> {
  const res = await fetch(
    `${API_URL}/tabungan-haji/${tabunganId}/mutasi/${transaksiId}`,
    {
      headers: authHeaders(token),
    }
  );
  const json = await readJson(res);
  if (!res.ok)
    throw apiError(json, "Gagal memuat detail transaksi", res.status);
  return json.data;
}

/** POST /api/v1/tabungan-haji/:id/setor
 *  Returns the created transaksi (nested under data.transaksi in API response)
 */
export async function postSetor(
  token: string,
  tabunganId: string,
  nominal: number,
  metode: string
): Promise<HasilTransaksi> {
  const idempotencyKey = crypto.randomUUID();
  const res = await fetch(`${API_URL}/tabungan-haji/${tabunganId}/setor`, {
    method: "POST",
    headers: { ...authHeaders(token), "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ nominal, metode }),
  });
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Setoran gagal", res.status);
  // API wraps result: { data: { transaksi: {...} } }
  return json.data?.transaksi ?? json.data;
}

/** POST /api/v1/tabungan-haji/:id/penarikan */
export async function postPenarikan(
  token: string,
  tabunganId: string,
  nominal: number,
  metode: string
): Promise<HasilTransaksi> {
  const res = await fetch(`${API_URL}/tabungan-haji/${tabunganId}/penarikan`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ nominal, metode }),
  });
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Penarikan gagal", res.status);
  return json.data?.transaksi ?? json.data;
}
