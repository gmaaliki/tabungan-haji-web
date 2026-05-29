"use client"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/component/sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    getMutasi,
    downloadLaporanSaya,
    formatRupiah,
    formatDate,
    toNumber,
    getTabunganFromMe,
    type Me,
    type TabunganSummary,
    type Transaksi,
} from "@/lib/api"

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

export default function TransaksiPage() {
    const router = useRouter()
    const [me, setMe] = useState<Me | null>(null)
    const [tabungan, setTabungan] = useState<TabunganSummary | null>(null)
    const [transaksi, setTransaksi] = useState<Transaksi[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [fetching, setFetching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tahun, setTahun] = useState(CURRENT_YEAR)
    const [bulan, setBulan] = useState(0)
    const [downloading, setDownloading] = useState(false)

    async function handleDownload() {
        const token = localStorage.getItem("token")
        if (!token || !tabungan) return
        setDownloading(true)
        try {
            const params: { tahun?: number; bulan?: number } = { tahun }
            if (bulan > 0) params.bulan = bulan
            const blob = await downloadLaporanSaya(token, tabungan.id, params)
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            const bulanLabel = bulan > 0 ? `-${MONTHS[bulan - 1]}` : ""
            a.download = `mutasi-${tabungan.nomorRekening}-${tahun}${bulanLabel}.csv`
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

    const fetchMutasi = useCallback(async (token: string, tabId: string, t: number, b: number) => {
        setFetching(true)
        try {
            const params: { tahun?: number; bulan?: number } = { tahun: t }
            if (b > 0) params.bulan = b
            const res = await getMutasi(token, tabId, params)
            setTransaksi(res.data)
            setTotal(res.total)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Gagal memuat data")
        } finally {
            setFetching(false)
        }
    }, [])

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        getMe(token)
            .then((profile) => {
                setMe(profile)
                const rek = getTabunganFromMe(profile)
                setTabungan(rek)
                if (rek) return fetchMutasi(token, rek.id, CURRENT_YEAR, 0)
            })
            .catch((err) => {
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else setError(err.message)
            })
            .finally(() => setLoading(false))
    }, [router, fetchMutasi])

    useEffect(() => {
        if (loading || !tabungan) return
        const token = localStorage.getItem("token")
        if (!token) return
        fetchMutasi(token, tabungan.id, tahun, bulan)
    }, [tahun, bulan, loading, tabungan, fetchMutasi])

    if (loading) return <TransaksiSkeleton />
    if (error && !me) return <div className="flex items-center justify-center min-h-screen text-error">{error}</div>
    if (!me) return null

    const totalSetoran = transaksi.filter((t) => t.jenis === "SETORAN").reduce((s, t) => s + toNumber(t.nominal), 0)
    const totalPenarikan = transaksi.filter((t) => t.jenis === "PENARIKAN").reduce((s, t) => s + toNumber(t.nominal), 0)

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <TopNav userName={me.nasabah?.nama ?? me.email} />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-[1440px] mx-auto">

                    <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="font-outfit text-3xl font-bold text-on-background">Riwayat Mutasi</h2>
                            {tabungan && (
                                <p className="text-base text-on-surface-variant mt-1">
                                    No. Rekening: <span className="font-mono font-semibold">{tabungan.nomorRekening}</span>
                                </p>
                            )}
                        </div>
                        {tabungan && (
                            <button
                                onClick={handleDownload}
                                disabled={downloading || transaksi.length === 0}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {downloading ? (
                                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                )}
                                Unduh CSV
                            </button>
                        )}
                    </header>

                    {/* Summary cards */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <SummaryCard icon="receipt_long" label="Total Transaksi" value={`${total} transaksi`} color="text-on-surface" />
                        <SummaryCard icon="arrow_downward" label="Total Setoran" value={formatRupiah(totalSetoran)} color="text-primary" />
                        <SummaryCard icon="arrow_upward" label="Total Penarikan" value={formatRupiah(totalPenarikan)} color="text-secondary" />
                    </div>

                    {/* Filter bar */}
                    <div className="glass-card border border-outline-variant rounded-xl p-6 mb-6 flex flex-wrap gap-4 items-center">
                        <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Filter:</span>
                        <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none">
                            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none">
                            <option value={0}>Semua Bulan</option>
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        {fetching && <span className="material-symbols-outlined animate-spin text-outline text-[20px]">progress_activity</span>}
                        <span className="ml-auto text-sm text-on-surface-variant">{transaksi.length} hasil ditemukan</span>
                    </div>

                    {/* Table */}
                    <div className="glass-card border border-outline-variant rounded-xl overflow-hidden">
                        {transaksi.length === 0 ? (
                            <div className="py-20 text-center text-on-surface-variant">
                                <span className="material-symbols-outlined text-5xl mb-3 block">receipt_long</span>
                                <p className="text-base font-semibold">Tidak ada transaksi</p>
                                <p className="text-sm mt-1">Coba ubah filter tahun atau bulan</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-surface-container-low border-b border-outline-variant">
                                        <tr>
                                            {["Waktu", "Jenis", "Referensi", "Metode", "Nominal", "Saldo Sesudah"].map((h) => (
                                                <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/30">
                                        {transaksi.map((trx) => (
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
                                                <td className="px-6 py-4 text-sm font-semibold text-on-surface">{formatRupiah(toNumber(trx.saldoSesudah))}</td>
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
        <div className="glass-card border border-outline-variant rounded-xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center">
                <span className={`material-symbols-outlined ${color}`}>{icon}</span>
            </div>
            <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
                <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
        </div>
    )
}

function TransaksiSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant" />
            <div className="ml-[280px] pt-16 p-10 space-y-6">
                <div className="h-10 w-64 bg-surface-container rounded-xl" />
                <div className="grid grid-cols-3 gap-6">{[0, 1, 2].map((i) => <div key={i} className="h-24 bg-surface-container rounded-xl" />)}</div>
                <div className="h-20 bg-surface-container rounded-xl" />
                <div className="h-96 bg-surface-container rounded-xl" />
            </div>
        </div>
    )
}
