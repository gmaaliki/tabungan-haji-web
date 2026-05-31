import { API_URL, apiError, authHeaders, readJson } from "./client";
import type {
  Estimasi,
  ListResponse,
  TabunganDetail,
  TabunganSummary,
  TabunganWithNasabah,
} from "./types";

/** POST /api/v1/tabungan-haji — open a new hajj savings account */
export async function bukaRekening(token: string): Promise<TabunganSummary> {
  const res = await fetch(`${API_URL}/tabungan-haji`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Gagal membuka rekening", res.status);
  return json.data;
}

/** GET /api/v1/tabungan-haji/:id — detail rekening (admin view includes nasabah) */
export async function getTabungan(
  token: string,
  tabunganId: string
): Promise<TabunganDetail> {
  const res = await fetch(`${API_URL}/tabungan-haji/${tabunganId}`, {
    headers: authHeaders(token),
  });
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Gagal memuat rekening", res.status);
  return json.data;
}

/** GET /api/v1/tabungan-haji/:id/estimasi */
export async function getEstimasi(
  token: string,
  tabunganId: string
): Promise<Estimasi> {
  const res = await fetch(`${API_URL}/tabungan-haji/${tabunganId}/estimasi`, {
    headers: authHeaders(token),
  });
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Gagal memuat estimasi", res.status);
  return json.data;
}

/** PATCH /api/v1/tabungan-haji/:id/tanggal-daftar — set hajj registration date (requires eligible) */
export async function setTanggalDaftar(
  token: string,
  tabunganId: string,
  tanggalDaftarHaji: string
): Promise<void> {
  const res = await fetch(
    `${API_URL}/tabungan-haji/${tabunganId}/tanggal-daftar`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ tanggalDaftarHaji }),
    }
  );
  const json = await readJson(res);
  if (!res.ok)
    throw apiError(json, "Gagal menetapkan tanggal daftar haji", res.status);
}

/** GET /api/v1/tabungan-haji — admin: all rekening with nasabah */
export async function getAllTabungan(
  token: string
): Promise<ListResponse<TabunganWithNasabah>> {
  const res = await fetch(`${API_URL}/tabungan-haji`, {
    headers: authHeaders(token),
  });
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Gagal memuat rekening", res.status);
  return { total: json.total ?? json.data?.length ?? 0, data: json.data };
}

/** PATCH /api/v1/tabungan-haji/:id/status — admin: change rekening status */
export async function updateStatusRekening(
  token: string,
  tabunganId: string,
  status: "AKTIF" | "DORMANT" | "TUTUP"
): Promise<void> {
  const res = await fetch(`${API_URL}/tabungan-haji/${tabunganId}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Gagal mengubah status", res.status);
}

/** DELETE /api/v1/tabungan-haji/:id — admin: delete empty rekening */
export async function deleteRekening(
  token: string,
  tabunganId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/tabungan-haji/${tabunganId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const json = await readJson(res);
    throw apiError(json, "Gagal menghapus rekening", res.status);
  }
}
