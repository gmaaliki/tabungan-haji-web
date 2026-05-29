"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/component/admin-sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    getAllTabungan,
    downloadLaporanSemua,
    downloadLaporanTabungan,
    formatRupiah,
    toNumber,
    type TabunganWithNasabah,
} from "@/lib/api"

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

type PageState = "loading" | "ready" | "error"

export default function AdminLaporanPage() {
    const router = useRouter()
    const [adminName, setAdminName] = useState("")
    const [rekening, setRekening] = useState<TabunganWithNasabah[]>([])
    const [pageState, setPageState] = useState<PageState>("loading")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const [tahun, setTahun] = useState(CURRENT_YEAR)
    const [bulan, setBulan] = useState(CURRENT_MONTH)
    const [selectedRek, setSelectedRek] = useState("")
    const [downloadingAll, setDownloadingAll] = useState(false)
    const [downloadingRek, setDownloadingRek] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        getMe(token)
            .then((me) => {
                if (me.role !== "ADMIN") { router.replace("/dashboard"); return Promise.reject({ handled: true }) }
                setAdminName(me.email)
                return getAllTabungan(token)
            })
            .then((res) => {
                if (!res) return
                setRekening(res.data)
                setPageState("ready")
            })
            .catch((err) => {
                if (err?.handled) return
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else { setErrorMsg(err.message); setPageState("error") }
            })
    }, [router])

    function triggerDownload(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    async function handleDownloadAll() {
        const token = localStorage.getItem("token")
        if (!token) return
        setDownloadingAll(true)
        try {
            const blob = await downloadLaporanSemua(token, { tahun, bulan })
            triggerDownload(blob, `laporan-semua-${tahun}-${MONTHS[bulan - 1]}.csv`)
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Gagal mengunduh laporan")
        } finally {
            setDownloadingAll(false)
        }
    }

    async function handleDownloadRek() {
        const token = localStorage.getItem("token")
        if (!token || !selectedRek) return
        setDownloadingRek(true)
        try {
            const blob = await downloadLaporanTabungan(token, selectedRek, { tahun, bulan })
            const rek = rekening.find((r) => r.id === selectedRek)
            triggerDownload(blob, `laporan-${rek?.nomorRekening ?? selectedRek}-${tahun}-${MONTHS[bulan - 1]}.csv`)
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Gagal mengunduh laporan")
        } finally {
            setDownloadingRek(false)
        }
    }

    if (pageState === "loading") return <PageSkeleton />
    if (pageState === "error") return <div className="flex items-center justify-center min-h-screen text-error">{errorMsg}</div>

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />
            <TopNav userName={adminName} userRole="Administrator" />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-[1440px] mx-auto">

                    <header className="mb-10">
                        <h2 className="font-outfit text-3xl font-bold text-on-background">Laporan Transaksi</h2>
                        <p className="text-base text-on-surface-variant mt-1">Ekspor data transaksi ke format CSV berdasarkan periode.</p>
                    </header>

                    {/* Period filter */}
                    <div className="glass-card border border-outline-variant rounded-xl p-6 mb-8 flex flex-wrap gap-4 items-center">
                        <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Periode:</span>
                        <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none">
                            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none">
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* All transactions */}
                        <div className="glass-card border border-outline-variant rounded-xl p-8 flex flex-col">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>summarize</span>
                            </div>
                            <h4 className="font-outfit text-xl font-semibold mb-2">Laporan Seluruh Transaksi</h4>
                            <p className="text-sm text-on-surface-variant mb-6 flex-1">
                                Unduh seluruh transaksi dari semua rekening pada periode {MONTHS[bulan - 1]} {tahun}.
                            </p>
                            <button onClick={handleDownloadAll} disabled={downloadingAll} className="w-full py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {downloadingAll ? (
                                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                )}
                                Unduh CSV Semua
                            </button>
                        </div>

                        {/* Per rekening */}
                        <div className="glass-card border border-outline-variant rounded-xl p-8 flex flex-col">
                            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary mb-4">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                            </div>
                            <h4 className="font-outfit text-xl font-semibold mb-2">Laporan Per Rekening</h4>
                            <p className="text-sm text-on-surface-variant mb-4">Pilih rekening untuk mengunduh transaksinya pada periode terpilih.</p>
                            <select
                                value={selectedRek}
                                onChange={(e) => setSelectedRek(e.target.value)}
                                className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none mb-4 flex-1"
                            >
                                <option value="">— Pilih rekening —</option>
                                {rekening.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.nomorRekening} · {r.nasabah.nama} ({formatRupiah(toNumber(r.saldo))})
                                    </option>
                                ))}
                            </select>
                            <button onClick={handleDownloadRek} disabled={downloadingRek || !selectedRek} className="w-full py-3 bg-secondary text-on-secondary-fixed rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {downloadingRek ? (
                                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                )}
                                Unduh CSV Rekening
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-tertiary-container/10 border border-tertiary-container/20 rounded-xl flex gap-4">
                        <span className="material-symbols-outlined text-tertiary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                        <p className="text-sm text-on-surface-variant">
                            File CSV berisi kolom: waktu, nomor rekening, nama nasabah, NIK, jenis, nominal, saldo sebelum,
                            saldo sesudah, metode, dan nomor referensi. Dapat dibuka langsung di Microsoft Excel.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}

function PageSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant" />
            <div className="ml-[280px] pt-16 p-10 space-y-8">
                <div className="h-10 w-72 bg-surface-container rounded-xl" />
                <div className="h-16 bg-surface-container rounded-xl" />
                <div className="grid grid-cols-2 gap-8">
                    <div className="h-64 bg-surface-container rounded-xl" />
                    <div className="h-64 bg-surface-container rounded-xl" />
                </div>
            </div>
        </div>
    )
}
