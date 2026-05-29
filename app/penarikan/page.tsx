"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/component/sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    postPenarikan,
    formatRupiah,
    toNumber,
    getTabunganFromMe,
    SETORAN_MINIMUM,
    type Me,
    type TabunganSummary,
    type HasilTransaksi,
} from "@/lib/api"

const QUICK_AMOUNTS = [500_000, 1_000_000, 2_000_000, 5_000_000]
type PageState = "loading" | "idle" | "submitting" | "success" | "error"

export default function PenarikanPage() {
    const router = useRouter()
    const [me, setMe] = useState<Me | null>(null)
    const [tabungan, setTabungan] = useState<TabunganSummary | null>(null)
    const [pageState, setPageState] = useState<PageState>("loading")
    const [loadError, setLoadError] = useState<string | null>(null)
    const [rawAmount, setRawAmount] = useState("")
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [result, setResult] = useState<HasilTransaksi | null>(null)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        getMe(token)
            .then((profile) => {
                setMe(profile)
                setTabungan(getTabunganFromMe(profile))
                setPageState("idle")
            })
            .catch((err) => {
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else { setLoadError(err.message); setPageState("error") }
            })
    }, [router])

    const saldo = toNumber(tabungan?.saldo)
    const numericAmount = parseInt(rawAmount.replace(/\D/g, "") || "0", 10)
    const estimasiSaldoAkhir = Math.max(0, saldo - numericAmount)
    const isValid = numericAmount > 0 && numericAmount <= saldo && tabungan?.status === "AKTIF"

    function handleQuickSet(amt: number) { setRawAmount(new Intl.NumberFormat("id-ID").format(amt)); setSubmitError(null) }
    function handleAllBalance() { setRawAmount(new Intl.NumberFormat("id-ID").format(saldo)); setSubmitError(null) }

    function formatInput(val: string) {
        const d = val.replace(/\D/g, "")
        return d ? new Intl.NumberFormat("id-ID").format(parseInt(d, 10)) : ""
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!isValid || !tabungan) return
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        setPageState("submitting"); setSubmitError(null)
        try {
            const data = await postPenarikan(token, tabungan.id, numericAmount, "TUNAI")
            setResult(data)
            setTabungan((prev) => prev ? { ...prev, saldo: toNumber(data.saldoSesudah) } : prev)
            setPageState("success")
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : "Terjadi kesalahan")
            setPageState("idle")
        }
    }

    function handleReset() { setResult(null); setRawAmount(""); setSubmitError(null); setPageState("idle") }

    if (pageState === "loading") return <PageSkeleton />
    if (pageState === "error") return <div className="flex items-center justify-center min-h-screen text-error">{loadError}</div>
    if (!me || !tabungan) return null

    const isDormantOrClosed = tabungan.status !== "AKTIF"

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <TopNav userName={me.nasabah?.nama ?? me.email} />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-[1440px] mx-auto">

                    <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="font-outfit text-3xl font-bold text-on-surface">Penarikan Tabungan Haji</h2>
                            <p className="text-base text-on-surface-variant mt-1">Tarik dana dari rekening tabungan haji Anda.</p>
                        </div>
                        <nav className="flex gap-2 text-xs text-on-surface-variant items-center">
                            <span>Transactions</span>
                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            <span className="text-secondary font-bold">Withdraw Funds</span>
                        </nav>
                    </header>

                    {/* Account summary */}
                    <div className="bg-white border border-outline-variant rounded-xl p-8 mb-8 flex items-center justify-between relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-8">
                            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Nomor Rekening</p>
                                <h3 className="font-outfit text-2xl font-semibold text-on-surface">{tabungan.nomorRekening}</h3>
                            </div>
                            <div className="h-12 w-px bg-outline-variant" />
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Saldo Tersedia</p>
                                <h3 className="font-outfit text-2xl font-semibold text-on-surface">{formatRupiah(saldo)}</h3>
                            </div>
                            <div className="h-12 w-px bg-outline-variant" />
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Status</p>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${tabungan.status === "AKTIF" ? "bg-primary/10 text-primary" : tabungan.status === "DORMANT" ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />{tabungan.status}
                                </span>
                            </div>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-secondary/5 to-transparent pointer-events-none flex items-center justify-end px-10">
                            <span className="material-symbols-outlined text-secondary/5 select-none" style={{ fontSize: "120px", fontVariationSettings: "'FILL' 1" }}>savings</span>
                        </div>
                    </div>

                    {isDormantOrClosed && (
                        <div className="bg-error-container border border-error/20 rounded-xl p-6 mb-8 flex items-start gap-4">
                            <span className="material-symbols-outlined text-error text-2xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                            <div>
                                <p className="font-semibold text-on-error-container">Rekening Tidak Aktif</p>
                                <p className="text-sm text-on-error-container/80 mt-1">Penarikan hanya dapat dilakukan pada rekening berstatus <strong>AKTIF</strong>. Status saat ini: <strong>{tabungan.status}</strong>.</p>
                            </div>
                        </div>
                    )}

                    {pageState === "success" && result && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 mb-8 flex items-start gap-6">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary flex-shrink-0">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-outfit text-xl font-semibold text-primary mb-1">Penarikan Berhasil!</h4>
                                <p className="text-sm text-on-surface-variant">Referensi: <span className="font-bold text-on-surface">{result.referensi}</span></p>
                                <p className="text-sm text-on-surface-variant mt-1">Saldo baru: <span className="font-bold text-on-surface">{formatRupiah(toNumber(result.saldoSesudah))}</span></p>
                            </div>
                            <button onClick={handleReset} className="px-4 py-2 text-sm font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-all">Penarikan Baru</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-12 gap-8">
                            {/* Form — 8 cols */}
                            <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-outline-variant bg-surface-container-low">
                                    <h4 className="font-outfit text-xl font-semibold text-on-surface">Detail Penarikan</h4>
                                </div>
                                <div className="p-8 space-y-8">
                                    <div className="space-y-4">
                                        <label className="block text-base font-bold text-on-surface" htmlFor="tarik-amount">Nominal Penarikan</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-on-surface-variant">Rp</span>
                                            <input
                                                id="tarik-amount"
                                                type="text"
                                                inputMode="numeric"
                                                value={formatInput(rawAmount)}
                                                onChange={(e) => { setRawAmount(e.target.value); setSubmitError(null) }}
                                                placeholder="0"
                                                disabled={pageState === "submitting" || isDormantOrClosed}
                                                className="w-full pl-12 pr-4 py-4 bg-surface border border-outline rounded-lg font-outfit text-2xl font-semibold focus:border-secondary focus:ring-2 focus:ring-secondary/10 outline-none transition-all disabled:opacity-60"
                                            />
                                        </div>
                                        {numericAmount > saldo && saldo > 0 && (
                                            <p className="text-sm text-error flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">error</span>
                                                Melebihi saldo tersedia ({formatRupiah(saldo)})
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {QUICK_AMOUNTS.filter((a) => a <= saldo).map((amt) => (
                                                <button key={amt} type="button" onClick={() => handleQuickSet(amt)} disabled={pageState === "submitting" || isDormantOrClosed} className="px-4 py-2 bg-surface-container-high hover:bg-secondary/10 text-on-surface-variant text-xs font-semibold rounded-full transition-colors border border-outline-variant disabled:opacity-50">
                                                    {formatRupiah(amt)}
                                                </button>
                                            ))}
                                            {saldo > 0 && (
                                                <button type="button" onClick={handleAllBalance} disabled={pageState === "submitting" || isDormantOrClosed} className="px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-semibold rounded-full transition-colors border border-secondary/20 disabled:opacity-50">
                                                    Semua Saldo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-error-container/20 border border-error/10 rounded-xl flex gap-4">
                                        <span className="material-symbols-outlined text-error mt-0.5 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                                        <p className="text-sm text-on-surface-variant">Penarikan akan mengurangi saldo tabungan haji Anda. Pertahankan saldo minimal <strong>Rp 25.000.000</strong> agar tetap eligible haji.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary — 4 cols */}
                            <div className="col-span-12 lg:col-span-4 space-y-6">
                                <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-outline-variant">
                                        <h4 className="font-outfit text-xl font-semibold text-on-surface">Ringkasan Penarikan</h4>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-base text-on-surface-variant">Saldo Awal</span>
                                                <span className="text-base font-bold text-on-surface">{formatRupiah(saldo)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-base text-on-surface-variant">Nominal Ditarik</span>
                                                <span className="text-base font-bold text-secondary">− {formatRupiah(numericAmount)}</span>
                                            </div>
                                            <div className="h-px bg-outline-variant" />
                                            <div className="flex justify-between items-center">
                                                <span className="text-base font-bold text-on-surface">Saldo Akhir</span>
                                                <span className={`font-outfit text-2xl font-semibold ${estimasiSaldoAkhir < SETORAN_MINIMUM ? "text-secondary" : "text-on-surface"}`}>{formatRupiah(estimasiSaldoAkhir)}</span>
                                            </div>
                                            {numericAmount > 0 && estimasiSaldoAkhir < SETORAN_MINIMUM && (
                                                <p className="text-xs text-secondary flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">info</span>Saldo akan di bawah batas eligible haji</p>
                                            )}
                                        </div>
                                        {submitError && <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm">{submitError}</div>}
                                        <div className="pt-2 space-y-3">
                                            <button type="submit" disabled={!isValid || pageState === "submitting"} className="w-full py-4 bg-secondary text-on-secondary-fixed rounded-xl font-bold hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                                {pageState === "submitting" ? (
                                                    <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Memproses...</>
                                                ) : "Konfirmasi Penarikan"}
                                            </button>
                                            <button type="button" onClick={() => router.push("/dashboard")} className="w-full py-4 bg-surface-container-high text-on-surface-variant rounded-xl font-bold hover:bg-outline-variant/30 transition-all">Batal</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-secondary/10 to-primary/5 rounded-xl p-6 border border-secondary-container/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                                        <h5 className="text-base font-bold text-secondary">Panduan Penarikan</h5>
                                    </div>
                                    <ul className="space-y-3">
                                        {["Pertahankan saldo minimal Rp 25.000.000 agar tetap eligible haji.", "Penarikan hanya dapat dilakukan pada rekening berstatus AKTIF.", "Dana akan langsung dikurangi dari saldo tabungan Anda."].map((tip, i) => (
                                            <li key={i} className="flex gap-2 text-xs text-on-surface-variant"><span className="text-secondary font-bold">{i + 1}.</span>{tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </form>
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
                <div className="h-28 bg-surface-container rounded-xl" />
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-8 h-96 bg-surface-container rounded-xl" />
                    <div className="col-span-4 h-96 bg-surface-container rounded-xl" />
                </div>
            </div>
        </div>
    )
}
