"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/component/sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    getEstimasi,
    setTanggalDaftar,
    formatRupiah,
    formatDate,
    toNumber,
    getTabunganFromMe,
    SETORAN_MINIMUM,
    type Me,
    type TabunganSummary,
    type Estimasi,
} from "@/lib/api"

type PageState = "loading" | "ready" | "error" | "no-rekening"

export default function EligibilityPage() {
    const router = useRouter()
    const [me, setMe] = useState<Me | null>(null)
    const [tabungan, setTabungan] = useState<TabunganSummary | null>(null)
    const [estimasi, setEstimasi] = useState<Estimasi | null>(null)
    const [pageState, setPageState] = useState<PageState>("loading")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const [tanggal, setTanggal] = useState("")
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    function load() {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        getMe(token)
            .then((profile) => {
                setMe(profile)
                const rek = getTabunganFromMe(profile)
                if (!rek) { setPageState("no-rekening"); return }
                setTabungan(rek)
                return getEstimasi(token, rek.id).then((est) => {
                    setEstimasi(est)
                    setPageState("ready")
                })
            })
            .catch((err) => {
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else { setErrorMsg(err.message); setPageState("error") }
            })
    }

    useEffect(load, [router])

    async function handleSetTanggal(e: React.FormEvent) {
        e.preventDefault()
        if (!tabungan || !tanggal) return
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        setSaving(true); setSaveError(null)
        try {
            await setTanggalDaftar(token, tabungan.id, new Date(tanggal).toISOString())
            load()
            setTanggal("")
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : "Gagal menyimpan")
        } finally {
            setSaving(false)
        }
    }

    if (pageState === "loading") return <PageSkeleton />
    if (pageState === "error") return <div className="flex items-center justify-center min-h-screen text-error">{errorMsg}</div>

    if (pageState === "no-rekening") {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <TopNav userName={me?.nasabah?.nama ?? me?.email ?? ""} />
                <main className="ml-[280px] pt-16 min-h-screen">
                    <div className="p-10 max-w-[1440px] mx-auto">
                        <div className="glass-card border border-outline-variant rounded-xl p-12 text-center">
                            <span className="material-symbols-outlined text-5xl text-primary mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>mosque</span>
                            <h3 className="font-outfit text-2xl font-semibold text-on-surface mb-2">Belum ada rekening</h3>
                            <p className="text-on-surface-variant mb-6">Buka rekening tabungan haji terlebih dahulu untuk melihat estimasi keberangkatan.</p>
                            <Link href="/dashboard" className="px-8 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-all inline-block">Ke Dashboard</Link>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (!me || !tabungan || !estimasi) return null

    const saldo = toNumber(estimasi.saldo)
    const kurang = toNumber(estimasi.kurang)
    const progress = Math.min(100, Math.round((saldo / toNumber(estimasi.setoranAwal)) * 100))

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <TopNav userName={me.nasabah?.nama ?? me.email} />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-[1440px] mx-auto">

                    <header className="mb-10">
                        <h2 className="font-outfit text-3xl font-bold text-on-background">Estimasi Keberangkatan Haji</h2>
                        <p className="text-base text-on-surface-variant mt-1">{estimasi.keterangan}</p>
                    </header>

                    {/* Hero status card */}
                    <div className={`rounded-xl p-8 mb-8 border ${estimasi.eligible ? "bg-primary/5 border-primary/20" : "bg-secondary/5 border-secondary/20"}`}>
                        <div className="flex items-center gap-6">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 ${estimasi.eligible ? "bg-primary text-on-primary" : "bg-secondary text-on-secondary-fixed"}`}>
                                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    {estimasi.eligible ? "verified" : "hourglass_top"}
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Status Kelayakan</p>
                                <h3 className={`font-outfit text-3xl font-bold ${estimasi.eligible ? "text-primary" : "text-secondary"}`}>
                                    {estimasi.eligible ? "Eligible" : "Belum Eligible"}
                                </h3>
                                <p className="text-base text-on-surface-variant mt-1">
                                    {estimasi.eligible
                                        ? "Alhamdulillah, saldo Anda memenuhi syarat porsi haji."
                                        : `Butuh tambahan ${formatRupiah(kurang)} lagi untuk eligible.`}
                                </p>
                            </div>
                            {estimasi.eligible && estimasi.tahunPerkiraan && (
                                <div className="text-right">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Perkiraan Berangkat</p>
                                    <p className="font-outfit text-4xl font-bold text-primary">{estimasi.tahunPerkiraan}</p>
                                    <p className="text-sm text-on-surface-variant">Masa tunggu {estimasi.masaTungguTahun} tahun</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Detail card */}
                        <div className="lg:col-span-7 glass-card border border-outline-variant rounded-xl p-8">
                            <h4 className="font-outfit text-xl font-semibold mb-6">Rincian Tabungan</h4>
                            <div className="space-y-5">
                                <Row label="Nomor Rekening" value={estimasi.nomorRekening} mono />
                                <Row label="Status Rekening" value={estimasi.status} />
                                <Row label="Saldo Saat Ini" value={formatRupiah(saldo)} bold />
                                <Row label="Setoran Minimum" value={formatRupiah(estimasi.setoranAwal)} />
                                <Row label="Kekurangan" value={kurang > 0 ? formatRupiah(kurang) : "Terpenuhi ✓"} valueClass={kurang > 0 ? "text-secondary" : "text-primary"} />
                                <Row label="Tanggal Daftar Haji" value={estimasi.tanggalDaftarHaji ? formatDate(estimasi.tanggalDaftarHaji) : "Belum ditetapkan"} />
                                <Row label="Masa Tunggu" value={`${estimasi.masaTungguTahun} tahun`} />
                            </div>

                            <div className="mt-8">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-semibold">Progress menuju {formatRupiah(SETORAN_MINIMUM)}</span>
                                    <span className="font-outfit text-xl font-semibold text-secondary">{progress}%</span>
                                </div>
                                <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                                    <div className="h-full bg-secondary-container rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Action card */}
                        <div className="lg:col-span-5 space-y-6">
                            {estimasi.eligible && !estimasi.tanggalDaftarHaji ? (
                                <div className="glass-card border border-outline-variant rounded-xl p-8">
                                    <h4 className="font-outfit text-xl font-semibold mb-2">Tetapkan Tanggal Daftar Haji</h4>
                                    <p className="text-sm text-on-surface-variant mb-6">
                                        Anda sudah eligible! Tetapkan tanggal pendaftaran untuk menghitung perkiraan keberangkatan.
                                        Tanggal tidak dapat diubah setelah ditetapkan.
                                    </p>
                                    <form onSubmit={handleSetTanggal} className="space-y-4">
                                        <input
                                            type="date"
                                            value={tanggal}
                                            onChange={(e) => setTanggal(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-base focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                                        />
                                        {saveError && <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm">{saveError}</div>}
                                        <button type="submit" disabled={saving || !tanggal} className="w-full py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                            {saving && <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>}
                                            Tetapkan Tanggal
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="glass-card border border-outline-variant rounded-xl p-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                                        <h4 className="font-outfit text-xl font-semibold">Informasi</h4>
                                    </div>
                                    {!estimasi.eligible ? (
                                        <>
                                            <p className="text-sm text-on-surface-variant mb-4">Terus tingkatkan saldo tabungan untuk mencapai syarat minimum porsi haji.</p>
                                            <Link href="/setoran" className="w-full py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-[20px]">add</span> Setor Dana
                                            </Link>
                                        </>
                                    ) : (
                                        <p className="text-sm text-on-surface-variant">
                                            Tanggal daftar haji telah ditetapkan pada <strong>{formatDate(estimasi.tanggalDaftarHaji!)}</strong>.
                                            Perkiraan keberangkatan tahun <strong>{estimasi.tahunPerkiraan}</strong>.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="bg-gradient-to-br from-secondary/10 to-primary/5 rounded-xl p-6 border border-secondary-container/20">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                                    <h5 className="text-base font-bold text-secondary">Tahukah Anda?</h5>
                                </div>
                                <p className="text-xs text-on-surface-variant">
                                    Masa tunggu haji di Indonesia bisa mencapai 10–40 tahun. Semakin cepat Anda mencapai
                                    setoran awal dan menetapkan tanggal daftar, semakin cepat pula nomor porsi haji diperoleh.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function Row({ label, value, bold, mono, valueClass }: { label: string; value: string; bold?: boolean; mono?: boolean; valueClass?: string }) {
    return (
        <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30 last:border-0">
            <span className="text-sm text-on-surface-variant">{label}</span>
            <span className={`text-base ${bold ? "font-bold" : "font-semibold"} ${mono ? "font-mono" : ""} ${valueClass ?? "text-on-surface"}`}>{value}</span>
        </div>
    )
}

function PageSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant" />
            <div className="ml-[280px] pt-16 p-10 space-y-8">
                <div className="h-10 w-80 bg-surface-container rounded-xl" />
                <div className="h-32 bg-surface-container rounded-xl" />
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-7 h-80 bg-surface-container rounded-xl" />
                    <div className="col-span-5 h-80 bg-surface-container rounded-xl" />
                </div>
            </div>
        </div>
    )
}
