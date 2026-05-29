const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1"
const HEALTH_URL = API_URL.replace("/api/v1", "/health")

// --- Health ---

export async function checkHealth(): Promise<boolean> {
    try {
        const res = await fetch(HEALTH_URL)
        if (!res.ok) return false
        return (await res.json())?.status === "ok"
    } catch {
        return false
    }
}

// --- Shared ---

function authHeaders(token: string): Record<string, string> {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    }
}

function apiError(json: Record<string, unknown>, fallback: string, status: number) {
    return Object.assign(
        new Error((json.message as string | undefined) ?? fallback),
        { status, code: json.error }
    )
}

// --- Auth ---

/** GET /api/v1/auth/me — returns logged-in user with nasabah + tabungan */
export async function getMe(token: string): Promise<Me> {
    const res = await fetch(`${API_URL}/auth/me`, { headers: authHeaders(token) })
    const json = await res.json()
    if (!res.ok) throw apiError(json, "Gagal memuat profil", res.status)
    return json.data
}

/** POST /api/v1/auth/logout — revokes token server-side */
export async function postLogout(token: string): Promise<void> {
    await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: authHeaders(token),
    })
}

// --- Nasabah ---

/** POST /api/v1/nasabah — PUBLIC, creates user + nasabah in one call */
export async function postRegister(data: {
    nik: string
    nama: string
    email: string
    nomorHp: string
    password: string
}): Promise<void> {
    const res = await fetch(`${API_URL}/nasabah`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw apiError(json, "Pendaftaran gagal", res.status)
}

// --- Tabungan Haji ---

/** GET /api/v1/tabungan-haji/:id — detail rekening */
export async function getTabungan(token: string, tabunganId: string): Promise<Tabungan> {
    const res = await fetch(`${API_URL}/tabungan-haji/${tabunganId}`, {
        headers: authHeaders(token),
    })
    const json = await res.json()
    if (!res.ok) throw apiError(json, "Gagal memuat rekening", res.status)
    return json.data
}

/** GET /api/v1/tabungan-haji/:id/estimasi */
export async function getEstimasi(token: string, tabunganId: string): Promise<Estimasi> {
    const res = await fetch(`${API_URL}/tabungan-haji/${tabunganId}/estimasi`, {
        headers: authHeaders(token),
    })
    const json = await res.json()
    if (!res.ok) throw apiError(json, "Gagal memuat estimasi", res.status)
    return json.data
}

/** GET /api/v1/tabungan-haji/:id/mutasi */
export async function getMutasi(
    token: string,
    tabunganId: string,
    params: { tahun?: number; bulan?: number; limit?: number } = {}
): Promise<{ total: number; data: Transaksi[] }> {
    const q = new URLSearchParams()
    if (params.tahun) q.set("tahun", String(params.tahun))
    if (params.bulan) q.set("bulan", String(params.bulan))
    if (params.limit) q.set("limit", String(params.limit))
    const res = await fetch(`${API_URL}/tabungan-haji/${tabunganId}/mutasi?${q}`, {
        headers: authHeaders(token),
    })
    const json = await res.json()
    if (!res.ok) throw apiError(json, "Gagal memuat mutasi", res.status)
    return { total: json.total ?? json.data?.length ?? 0, data: json.data }
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
    const idempotencyKey = crypto.randomUUID()
    const res = await fetch(`${API_URL}/tabungan-haji/${tabunganId}/setor`, {
        method: "POST",
        headers: { ...authHeaders(token), "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ nominal, metode }),
    })
    const json = await res.json()
    if (!res.ok) throw apiError(json, "Setoran gagal", res.status)
    // API wraps result: { data: { transaksi: {...} } }
    return json.data?.transaksi ?? json.data
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
    })
    const json = await res.json()
    if (!res.ok) throw apiError(json, "Penarikan gagal", res.status)
    return json.data?.transaksi ?? json.data
}

/** GET /api/v1/laporan/transaksi?tahun=&bulan= (Admin only; nasabah will get 403) */
export async function downloadLaporan(
    token: string,
    params: { tahun?: number; bulan?: number } = {}
): Promise<Blob> {
    const q = new URLSearchParams()
    if (params.tahun) q.set("tahun", String(params.tahun))
    if (params.bulan) q.set("bulan", String(params.bulan))
    const res = await fetch(`${API_URL}/laporan/transaksi?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw apiError(json as Record<string, unknown>, "Gagal mengunduh laporan", res.status)
    }
    return res.blob()
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type Me = {
    id: string
    email: string
    role: "USER" | "ADMIN"
    nasabah: {
        id: string
        nik: string
        nama: string
        email: string
        nomorHp: string
        tabungan: TabunganSummary[]
    } | null
}

export type TabunganSummary = {
    id: string
    nomorRekening: string
    saldo: number | string
    status: "AKTIF" | "DORMANT" | "TUTUP"
    dibukaAt: string
    tanggalDaftarHaji: string | null
}

export type Tabungan = TabunganSummary

export type Estimasi = {
    eligible: boolean
    tahunPerkiraan: number | null
    kekurangan?: number | string
    saldo?: number | string
}

export type Transaksi = {
    id: string
    jenis: "SETORAN" | "PENARIKAN"
    nominal: number | string
    saldoSebelum: number | string
    saldoSesudah: number | string
    referensi: string
    metode: string | null
    waktu: string
}

export type HasilTransaksi = {
    id: string
    referensi: string
    nominal: number | string
    saldoSebelum: number | string
    saldoSesudah: number | string
    waktu: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const SETORAN_MINIMUM = 25_000_000
export const DEPOSIT_MINIMUM = 100_000

export function toNumber(val: number | string | null | undefined): number {
    if (val == null) return 0
    return typeof val === "string" ? parseInt(val, 10) || 0 : val
}

export function formatRupiah(amount: number | string): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(toNumber(amount))
}

export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
}

/** Extract the first tabungan from a Me object, or null */
export function getTabunganFromMe(me: Me): TabunganSummary | null {
    return me.nasabah?.tabungan?.[0] ?? null
}
