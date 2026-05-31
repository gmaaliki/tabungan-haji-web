"use client"
import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AdminSidebar } from "@/component/admin-sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    getTabungan,
    getEstimasi,
    getMutasi,
    updateStatusRekening,
    setTanggalDaftar,
    deleteRekening,
    downloadLaporanTabungan,
    formatRupiah,
    formatDate,
    toNumber,
    type TabunganDetail,
    type Estimasi,
    type Transaksi,
} from "@/lib/api"

type PageState = "loading" | "ready" | "error"
type Status = "AKTIF" | "DORMANT" | "TUTUP"
const STATUSES: Status[] = ["AKTIF", "DORMANT", "TUTUP"]
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

export default function AdminRekeningDetailPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const tabunganId = params.id

    const [adminName, setAdminName] = useState("")
    const [tabungan, setTabungan] = useState<TabunganDetail | null>(null)
    const [estimasi, setEstimasi] = useState<Estimasi | null>(null)
    const [mutasi, setMutasi] = useState<Transaksi[]>([])
    const [pageState, setPageState] = useState<PageState>("loading")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const [tahun, setTahun] = useState(CURRENT_YEAR)
    const [bulan, setBulan] = useState(0)
    const [fetchingMutasi, setFetchingMutasi] = useState(false)

    const [updatingStatus, setUpdatingStatus] = useState(false)
    const [statusErr, setStatusErr] = useState<string | null>(null)

    const [tglDaftar, setTglDaftar] = useState("")
    const [savingTgl, setSavingTgl] = useState(false)
    const [tglErr, setTglErr] = useState<string | null>(null)
    const [tglMsg, setTglMsg] = useState<string | null>(null)

    const [downloading, setDownloading] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const loadMutasi = useCallback(async (token: string, t: number, b: number) => {
        setFetchingMutasi(true)
        try {
            const params: { tahun?: number; bulan?: number } = { tahun: t }
            if (b > 0) params.bulan = b
            const res = await getMutasi(token, tabunganId, params)
            setMutasi(res.data)
        } catch (err: unknown) {
            console.error(err)
        } finally {
            setFetchingMutasi(false)
        }
    }, [tabunganId])

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        getMe(token)
            .then((me) => {
                if (me.role !== "ADMIN") { router.replace("/dashboard"); return Promise.reject({ handled: true }) }
                setAdminName(me.email)
                return Promise.all([
                    getTabungan(token, tabunganId),
                    getEstimasi(token, tabunganId).catch(() => null),
                    getMutasi(token, tabunganId, { tahun: CURRENT_YEAR }).then((r) => r.data),
                ])
            })
            .then((results) => {
                if (!results) return
                const [tab, est, mut] = results
                setTabungan(tab)
                setEstimasi(est)
                setMutasi(mut)
                setTglDaftar(tab.tanggalDaftarHaji ? tab.tanggalDaftarHaji.slice(0, 10) : "")
                setPageState("ready")
            })
            .catch((err) => {
                if (err?.handled) return
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else { setErrorMsg(err.message); setPageState("error") }
            })
    }, [router, tabunganId])

    useEffect(() => {
        if (pageState !== "ready") return
        const token = localStorage.getItem("token")
        if (!token) return
        loadMutasi(token, tahun, bulan)
    }, [tahun, bulan, pageState, loadMutasi])

    async function handleStatusChange(newStatus: Status) {
        const token = localStorage.getItem("token")
        if (!token || !tabungan || newStatus === tabungan.status) return
        setStatusErr(null)
        setUpdatingStatus(true)
        try {
            await updateStatusRekening(token, tabungan.id, newStatus)
            setTabungan({ ...tabungan, status: newStatus })
        } catch (err: unknown) {
            setStatusErr(err instanceof Error ? err.message : "Gagal mengubah status")
        } finally {
            setUpdatingStatus(false)
        }
    }

    async function handleSaveTanggal(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const token = localStorage.getItem("token")
        if (!token || !tabungan || !tglDaftar) return
        setTglErr(null)
        setTglMsg(null)
        setSavingTgl(true)
        try {
            await setTanggalDaftar(token, tabungan.id, tglDaftar)
            setTabungan({ ...tabungan, tanggalDaftarHaji: new Date(tglDaftar).toISOString() })
            setTglMsg("Tanggal daftar haji berhasil disimpan")
        } catch (err: unknown) {
            setTglErr(err instanceof Error ? err.message : "Gagal menyimpan tanggal")
        } finally {
            setSavingTgl(false)
        }
    }

    async function handleDownloadCsv() {
        const token = localStorage.getItem("token")
        if (!token || !tabungan) return
        setDownloading(true)
        try {
            const params: { tahun?: number; bulan?: number } = { tahun }
            if (bulan > 0) params.bulan = bulan
            const blob = await downloadLaporanTabungan(token, tabungan.id, params)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            const bulanLabel = bulan > 0 ? `-${MONTHS[bulan - 1]}` : ""
            a.download = `laporan-${tabungan.nomorRekening}-${tahun}${bulanLabel}.csv`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Gagal mengunduh laporan")
        } finally {
            setDownloading(false)
        }
    }

    async function handleDelete() {
        const token = localStorage.getItem("token")
        if (!token || !tabungan) return
        setDeleting(true)
        try {
            await deleteRekening(token, tabungan.id)
            router.replace("/admin/rekening")
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Gagal menghapus rekening")
            setDeleting(false)
            setConfirmDelete(false)
        }
    }

    if (pageState === "loading") return <PageSkeleton />
    if (pageState === "error" || !tabungan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl">account_balance</span>
                <p className="text-error">{errorMsg ?? "Rekening tidak ditemukan"}</p>
                <Link href="/admin/rekening" className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold">Kembali</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />
            <TopNav userName={adminName} userRole="Administrator" />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-[1440px] mx-auto">

                    <Link href="/admin/rekening" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mb-4">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Kembali ke Daftar Rekening
                    </Link>

                    <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <p className="text-sm text-on-surface-variant uppercase tracking-wider font-semibold">Nomor Rekening</p>
                            <h2 className="font-outfit text-3xl font-bold text-on-background font-mono mt-1">{tabungan.nomorRekening}</h2>
                            {tabungan.nasabah && (
                                <Link href={`/admin/nasabah/${tabungan.nasabah.id}`} className="text-base text-primary hover:underline mt-2 inline-flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[18px]">person</span>
                                    {tabungan.nasabah.nama} · <span className="font-mono">{tabungan.nasabah.nik}</span>
                                </Link>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {confirmDelete ? (
                                <div className="flex items-center gap-2">
                                    <button onClick={handleDelete} disabled={deleting} className="px-4 py-2.5 bg-error text-on-error rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
                                        {deleting && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                                        Konfirmasi Hapus
                                    </button>
                                    <button onClick={() => setConfirmDelete(false)} className="px-4 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container">Batal</button>
                                </div>
                            ) : (
                                <button onClick={() => setConfirmDelete(true)} className="px-4 py-2.5 border border-error/30 text-error rounded-lg text-sm font-semibold hover:bg-error/5 transition-colors flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    Hapus Rekening
                                </button>
                            )}
                        </div>
                    </header>

                    {/* Summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <SummaryCard icon="savings" label="Saldo" value={formatRupiah(toNumber(tabungan.saldo))} color="text-primary" />
                        <SummaryCard icon="event_available" label="Dibuka" value={formatDate(tabungan.dibukaAt)} color="text-on-surface" />
                        <SummaryCard icon="flag" label="Status" value={tabungan.status} color={tabungan.status === "AKTIF" ? "text-primary" : tabungan.status === "DORMANT" ? "text-secondary" : "text-error"} />
                        <SummaryCard icon="mosque" label="Estimasi Berangkat" value={estimasi?.tahunPerkiraan ? `${estimasi.tahunPerkiraan}` : "—"} color="text-secondary" />
                    </div>

                    {/* Status + tanggal daftar admin controls */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="glass-card border border-outline-variant rounded-xl p-6">
                            <h4 className="font-outfit text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">tune</span>
                                Ubah Status Rekening
                            </h4>
                            <div className="flex items-center gap-2 mb-3">
                                <select
                                    value={tabungan.status}
                                    onChange={(e) => handleStatusChange(e.target.value as Status)}
                                    disabled={updatingStatus || tabungan.status === "TUTUP"}
                                    className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-semibold focus:border-primary outline-none disabled:opacity-50"
                                >
                                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                                {updatingStatus && <span className="material-symbols-outlined animate-spin text-outline text-[20px]">progress_activity</span>}
                            </div>
                            {statusErr && <p className="text-xs text-error mt-1">{statusErr}</p>}
                            <p className="text-xs text-on-surface-variant mt-2 flex items-start gap-1">
                                <span className="material-symbols-outlined text-[14px]">info</span>
                                Status TUTUP bersifat permanen dan tidak dapat diubah kembali.
                            </p>
                        </div>

                        <div className="glass-card border border-outline-variant rounded-xl p-6">
                            <h4 className="font-outfit text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-secondary">event</span>
                                Tanggal Daftar Haji
                            </h4>
                            <form onSubmit={handleSaveTanggal} className="space-y-3">
                                <input type="date" value={tglDaftar} onChange={(e) => setTglDaftar(e.target.value)} required disabled={savingTgl} className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm focus:border-primary outline-none disabled:opacity-50" />
                                <div className="flex items-center gap-2">
                                    <button type="submit" disabled={savingTgl || !tglDaftar} className="px-4 py-2 bg-secondary text-on-secondary-fixed rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
                                        {savingTgl && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                                        Simpan
                                    </button>
                                    {tabungan.tanggalDaftarHaji && (
                                        <span className="text-xs text-on-surface-variant">Saat ini: <strong>{formatDate(tabungan.tanggalDaftarHaji)}</strong></span>
                                    )}
                                </div>
                            </form>
                            {tglMsg && <p className="text-xs text-primary mt-2">{tglMsg}</p>}
                            {tglErr && <p className="text-xs text-error mt-2">{tglErr}</p>}
                            <p className="text-xs text-on-surface-variant mt-3 flex items-start gap-1">
                                <span className="material-symbols-outlined text-[14px]">info</span>
                                Hanya bisa ditetapkan jika saldo telah mencapai setoran awal (Rp 25 juta).
                            </p>
                        </div>
                    </div>

                    {/* Estimasi detail card */}
                    {estimasi && (
                        <div className="glass-card border border-outline-variant rounded-xl p-6 mb-8">
                            <h4 className="font-outfit text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">analytics</span>
                                Estimasi Eligibilitas Haji
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <Info label="Eligible" value={estimasi.eligible ? "Ya" : "Belum"} valueClass={estimasi.eligible ? "text-primary font-bold" : "text-secondary font-bold"} />
                                <Info label="Setoran Awal" value={formatRupiah(toNumber(estimasi.setoranAwal))} />
                                <Info label="Kurang" value={formatRupiah(toNumber(estimasi.kurang))} valueClass={toNumber(estimasi.kurang) > 0 ? "text-error" : "text-primary"} />
                                <Info label="Masa Tunggu" value={`${estimasi.masaTungguTahun} tahun`} />
                            </div>
                            {estimasi.keterangan && (
                                <p className="text-sm text-on-surface-variant mt-4 border-t border-outline-variant pt-4">{estimasi.keterangan}</p>
                            )}
                        </div>
                    )}

                    {/* Mutasi */}
                    <div className="glass-card border border-outline-variant rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-outline-variant flex flex-wrap items-center gap-4 justify-between">
                            <h4 className="font-outfit text-xl font-semibold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">receipt_long</span>
                                Riwayat Mutasi
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap">
                                <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-semibold focus:border-primary outline-none">
                                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className="bg-surface border border-outline-variant rounded-lg px-3 py-2 text-sm font-semibold focus:border-primary outline-none">
                                    <option value={0}>Semua Bulan</option>
                                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                </select>
                                {fetchingMutasi && <span className="material-symbols-outlined animate-spin text-outline text-[20px]">progress_activity</span>}
                                <button onClick={handleDownloadCsv} disabled={downloading || mutasi.length === 0} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50">
                                    {downloading ? (
                                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-[16px]">download</span>
                                    )}
                                    Unduh CSV
                                </button>
                            </div>
                        </div>

                        {mutasi.length === 0 ? (
                            <div className="py-20 text-center text-on-surface-variant">
                                <span className="material-symbols-outlined text-5xl mb-3 block">receipt_long</span>
                                <p>Tidak ada transaksi pada periode ini</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-surface-container-low border-b border-outline-variant">
                                        <tr>
                                            {["Waktu", "Jenis", "Referensi", "Metode", "Nominal", "Saldo Sesudah", ""].map((h) => (
                                                <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/30">
                                        {mutasi.map((trx) => (
                                            <tr key={trx.id} className="hover:bg-surface-container-low transition-colors">
                                                <td className="px-6 py-4 text-sm whitespace-nowrap">
                                                    <p>{formatDate(trx.waktu)}</p>
                                                    <p className="text-xs text-outline">{new Date(trx.waktu).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${trx.jenis === "SETORAN" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                        {trx.jenis === "SETORAN" ? "Setoran" : "Penarikan"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-mono text-outline">{trx.referensi}</td>
                                                <td className="px-6 py-4 text-sm text-on-surface-variant">{trx.metode ?? "—"}</td>
                                                <td className={`px-6 py-4 text-sm font-bold ${trx.jenis === "SETORAN" ? "text-primary" : "text-secondary"}`}>
                                                    {trx.jenis === "SETORAN" ? "+" : "−"}{formatRupiah(toNumber(trx.nominal))}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold">{formatRupiah(toNumber(trx.saldoSesudah))}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href={`/admin/rekening/${tabungan.id}/mutasi/${trx.id}`} className="text-primary text-sm font-semibold hover:underline inline-flex items-center gap-1">
                                                        Detail <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
    return (
        <div className="glass-card border border-outline-variant rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
            </div>
            <p className={`font-outfit text-xl font-bold ${color}`}>{value}</p>
        </div>
    )
}

function Info({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</dt>
            <dd className={`text-base mt-1 ${valueClass ?? ""}`}>{value}</dd>
        </div>
    )
}

function PageSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant" />
            <div className="ml-[280px] pt-16 p-10 space-y-6">
                <div className="h-10 w-96 bg-surface-container rounded-xl" />
                <div className="grid grid-cols-4 gap-6">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 bg-surface-container rounded-xl" />)}</div>
                <div className="grid grid-cols-2 gap-6">{[0, 1].map((i) => <div key={i} className="h-40 bg-surface-container rounded-xl" />)}</div>
                <div className="h-96 bg-surface-container rounded-xl" />
            </div>
        </div>
    )
}
