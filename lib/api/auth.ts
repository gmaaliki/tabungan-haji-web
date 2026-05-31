import { API_URL, apiError, authHeaders, readJson } from "./client";
import type { Me, StaffUser } from "./types";

/** GET /api/v1/auth/me — returns logged-in user with nasabah + tabungan */
export async function getMe(token: string): Promise<Me> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(token),
  });
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Gagal memuat profil", res.status);
  return json.data;
}

/** POST /api/v1/auth/logout — revokes token server-side */
export async function postLogout(token: string): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

/** POST /api/v1/auth/register — admin-only: create staff/admin user account */
export async function postRegisterStaff(
  token: string,
  data: { email: string; password: string; role: "USER" | "ADMIN" }
): Promise<StaffUser> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await readJson(res);
  if (!res.ok) throw apiError(json, "Pendaftaran akun gagal", res.status);
  return json.data;
}
