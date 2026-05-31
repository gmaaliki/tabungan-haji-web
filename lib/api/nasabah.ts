import { API_URL, apiError, authHeaders, readJson } from "./client";
import type {
  ListResponse,
  NasabahDetail,
  NasabahRow,
  TabunganSummary,
} from "./types";

/** POST /api/v1/nasabah — PUBLIC, creates user + nasabah in one call */
export async function postRegister(data: {
  nik: string;
  nama: string;
  email: string;
  nomorHp: string;
  password: string;
}): Promise<void> {
  const res = await fetch(`${API_URL}/nasabah`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Pendaftaran gagal", res.status);
}

/** GET /api/v1/nasabah/:id — single nasabah with tabungan list */
export async function getNasabahDetail(
  token: string,
  nasabahId: string
): Promise<NasabahDetail> {
  const res = await fetch(`${API_URL}/nasabah/${nasabahId}`, {
    headers: authHeaders(token),
  });
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Gagal memuat data nasabah", res.status);
  return json.data;
}

/** GET /api/v1/nasabah/:nasabahId/tabungan — list of nasabah's tabungan accounts */
export async function getNasabahTabungan(
  token: string,
  nasabahId: string
): Promise<ListResponse<TabunganSummary>> {
  const res = await fetch(`${API_URL}/nasabah/${nasabahId}/tabungan`, {
    headers: authHeaders(token),
  });
  const json = await readJson(res);
  if (!res.ok)
    throw apiError(json, "Gagal memuat tabungan nasabah", res.status);
  return { total: json.total ?? json.data?.length ?? 0, data: json.data };
}

/** PATCH /api/v1/nasabah/:id — update nasabah profile (nama, email, nomorHp) */
export async function updateNasabah(
  token: string,
  nasabahId: string,
  data: { nama?: string; email?: string; nomorHp?: string }
): Promise<void> {
  const res = await fetch(`${API_URL}/nasabah/${nasabahId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Gagal memperbarui profil", res.status);
}

/** GET /api/v1/nasabah — admin: all nasabah */
export async function getAllNasabah(
  token: string
): Promise<ListResponse<NasabahRow>> {
  const res = await fetch(`${API_URL}/nasabah`, {
    headers: authHeaders(token),
  });
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Gagal memuat nasabah", res.status);
  return { total: json.total ?? json.data?.length ?? 0, data: json.data };
}

/** DELETE /api/v1/nasabah/:id — admin: soft-delete nasabah */
export async function deleteNasabah(
  token: string,
  nasabahId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/nasabah/${nasabahId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const json = await readJson(res);
    throw apiError(json, "Gagal menghapus nasabah", res.status);
  }
}
