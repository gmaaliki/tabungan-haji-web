"use client"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/component/sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    postSetor,
    formatRupiah,
    toNumber,
    getTabunganFromMe,
    DEPOSIT_MINIMUM,
    type Me,
    type TabunganSummary,
    type HasilTransaksi,
} from "@/lib/api"

const QUICK_AMOUNTS = [500_000, 1_000_000, 5_000_000, 10_000_000]
const PAYMENT_METHODS = [
    { value: "TRANSFER", icon: "account_balance", label: "Saldo Tabungan BSI", desc: "Transfer langsung antar rekening" },
    { value: "TUNAI", icon: "payments", label: "Tunai", desc: "Setor tunai di kantor BSI" },
]

type PageState = "loading" | "idle" | "submitting" | "success" | "error"

export default function SetoranPage() {
    const router = useRouter()
    const [me, setMe] = useState<Me | null>(null)
    const [tabungan, setTabungan] = useState<TabunganSummary | null>(null)
    const [pageState, setPageState] = useState<PageState>("loading")
    const [loadError, setLoadError] = useState<string | null>(null)
    const [rawAmount, setRawAmount] = useState("")
    const [method, setMethod] = useState("TRANSFER")
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [result, setResult] = useState<HasilTransaksi | null>(null)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        getMe(token)
            .then((profile) => {
                setMe(profile)
                const rek = getTabunganFromMe(profile)
                setTabungan(rek)
                setPageState("idle")
            })
            .catch((err) => {
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else { setLoadError(err.message); setPageState("error") }
            })
    }, [router])

    const saldo = toNumber(tabungan?.saldo)
    const numericAmount = parseInt(rawAmount.replace(/\D/g, "") || "0", 10)
    const estimasiSaldoAkhir = saldo + numericAmount
    const isValid = numericAmount >= DEPOSIT_MINIMUM && tabungan?.status === "AKTIF"

    const formatInput = useCallback((val: string) => {
        const d = val.replace(/\D/g, "")
        return d ? new Intl.NumberFormat("id-ID").format(parseInt(d, 10)) : ""
    }, [])

    function handleQuickSet(amt: number) { setRawAmount(new Intl.NumberFormat("id-ID").format(amt)); setSubmitError(null) }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!isValid || !tabungan) return
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        setPageState("submitting"); setSubmitError(null)
        try {
            const data = await postSetor(token, tabungan.id, numericAmount, method)
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

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <TopNav userName={me.nasabah?.nama ?? me.email} />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-[1440px] mx-auto">

                    <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="font-outfit text-3xl font-bold text-on-surface">Setoran Tabungan Haji</h2>
                            <p className="text-base text-on-surface-variant mt-1">Complete your sacred journey with regular and secure deposits.</p>
                        </div>
                        <nav className="flex gap-2 text-xs text-on-surface-variant items-center">
                            <span>Transactions</span>
                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            <span className="text-primary font-bold">Deposit Funds</span>
                        </nav>
                    </header>

                    {/* Account Summary */}
                    <div className="bg-white border border-outline-variant rounded-xl p-8 mb-8 flex items-center justify-between relative overflow-hidden group">
                        <div className="relative z-10 flex items-center gap-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Nomor Rekening Aktif</p>
                                <h3 className="font-outfit text-2xl font-semibold text-on-surface">{tabungan.nomorRekening}</h3>
                            </div>
                            <div className="h-12 w-px bg-outline-variant" />
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Saldo Saat Ini</p>
                                <h3 className="font-outfit text-2xl font-semibold text-primary">{formatRupiah(saldo)}</h3>
                            </div>
                        </div>
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none flex items-center justify-end px-10">
                            <span className="material-symbols-outlined text-primary/5 select-none" style={{ fontSize: "120px", fontVariationSettings: "'FILL' 1" }}>mosque</span>
                        </div>
                    </div>

                    {/* Success banner */}
                    {pageState === "success" && result && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 mb-8 flex items-start gap-6">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary flex-shrink-0">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-outfit text-xl font-semibold text-primary mb-1">Setoran Berhasil!</h4>
                                <p className="text-sm text-on-surface-variant">Referensi: <span className="font-bold text-on-surface">{result.referensi}</span></p>
                                <p className="text-sm text-on-surface-variant mt-1">Saldo baru: <span className="font-bold text-on-surface">{formatRupiah(toNumber(result.saldoSesudah))}</span></p>
                            </div>
                            <button onClick={handleReset} className="px-4 py-2 text-sm font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-all">Setoran Baru</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-12 gap-8">

                            {/* Form — 8 cols */}
                            <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-outline-variant bg-surface-container-low">
                                    <h4 className="font-outfit text-xl font-semibold text-on-surface">Detail Setoran</h4>
                                </div>
                                <div className="p-8 space-y-8">
                                    <div className="space-y-4">
                                        <label className="block text-base font-bold text-on-surface" htmlFor="deposit-amount">Nominal Setoran</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-on-surface-variant">Rp</span>
                                            <input
                                                id="deposit-amount"
                                                type="text"
                                                inputMode="numeric"
                                                value={formatInput(rawAmount)}
                                                onChange={(e) => { setRawAmount(e.target.value); setSubmitError(null) }}
                                                placeholder="0"
                                                disabled={pageState === "submitting"}
                                                className="w-full pl-12 pr-4 py-4 bg-surface border border-outline rounded-lg font-outfit text-2xl font-semibold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all disabled:opacity-60"
                                            />
                                        </div>
                                        {numericAmount > 0 && numericAmount < DEPOSIT_MINIMUM && (
                                            <p className="text-sm text-error flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">error</span>
                                                Minimal setoran {formatRupiah(DEPOSIT_MINIMUM)}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {QUICK_AMOUNTS.map((amt) => (
                                                <button key={amt} type="button" onClick={() => handleQuickSet(amt)} disabled={pageState === "submitting"} className="px-4 py-2 bg-surface-container-high hover:bg-primary/10 text-on-surface-variant text-xs font-semibold rounded-full transition-colors border border-outline-variant disabled:opacity-50">
                                                    {formatRupiah(amt)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-base font-bold text-on-surface">Metode Pembayaran</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {PAYMENT_METHODS.map((pm) => (
                                                <label key={pm.value} className={`relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${method === pm.value ? "border-primary bg-primary/5" : "border-outline-variant hover:border-primary/50"}`}>
                                                    <input type="radio" name="payment" value={pm.value} checked={method === pm.value} onChange={() => setMethod(pm.value)} className="text-primary focus:ring-primary h-5 w-5" />
                                                    <div className="flex items-center gap-3">
                                                        <span className={`material-symbols-outlined ${method === pm.value ? "text-primary" : "text-on-surface-variant"}`}>{pm.icon}</span>
                                                        <div>
                                                            <p className="text-base font-bold text-on-surface">{pm.label}</p>
                                                            <p className="text-xs text-on-surface-variant">{pm.desc}</p>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-tertiary-container/10 border border-tertiary-container/20 rounded-xl flex gap-4">
                                        <span className="material-symbols-outlined text-tertiary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                                        <p className="text-sm text-on-surface-variant">Setoran dana untuk pendaftaran porsi Haji minimal Rp 25.000.000 sesuai ketentuan Kementerian Agama Republik Indonesia.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary — 4 cols */}
                            <div className="col-span-12 lg:col-span-4 space-y-6">
                                <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-outline-variant">
                                        <h4 className="font-outfit text-xl font-semibold text-on-surface">Transaction Summary</h4>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-base text-on-surface-variant">Saldo Awal</span>
                                                <span className="text-base font-bold text-on-surface">{formatRupiah(saldo)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-base text-on-surface-variant">Nominal Setoran</span>
                                                <span className="text-base font-bold text-primary">+ {formatRupiah(numericAmount)}</span>
                                            </div>
                                            <div className="h-px bg-outline-variant" />
                                            <div className="flex justify-between items-center">
                                                <span className="text-base font-bold text-on-surface">Saldo Akhir</span>
                                                <span className="font-outfit text-2xl font-semibold text-on-surface">{formatRupiah(estimasiSaldoAkhir)}</span>
                                            </div>
                                        </div>
                                        {submitError && <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm">{submitError}</div>}
                                        <div className="pt-2 space-y-3">
                                            <button type="submit" disabled={!isValid || pageState === "submitting"} className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold hover:bg-surface-tint transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                                {pageState === "submitting" ? (
                                                    <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Memproses...</>
                                                ) : "Konfirmasi Setoran"}
                                            </button>
                                            <button type="button" onClick={() => router.push("/dashboard")} className="w-full py-4 bg-surface-container-high text-on-surface-variant rounded-xl font-bold hover:bg-outline-variant/30 transition-all">Batal</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-secondary/10 to-primary/5 rounded-xl p-6 border border-secondary-container/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                        <h5 className="text-base font-bold text-secondary">Panduan Setoran</h5>
                                    </div>
                                    <ul className="space-y-3">
                                        {["Input nominal sesuai kemampuan finansial Anda.", "Pastikan saldo rekening asal mencukupi nominal setoran.", "Simpan bukti transaksi digital setelah konfirmasi berhasil."].map((tip, i) => (
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
