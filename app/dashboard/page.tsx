"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/component/sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    getEstimasi,
    getMutasi,
    formatRupiah,
    formatDate,
    toNumber,
    getTabunganFromMe,
    SETORAN_MINIMUM,
    type Me,
    type TabunganSummary,
    type Estimasi,
    type Transaksi,
} from "@/lib/api"

export default function DashboardPage() {
    const router = useRouter()
    const [me, setMe] = useState<Me | null>(null)
    const [tabungan, setTabungan] = useState<TabunganSummary | null>(null)
    const [estimasi, setEstimasi] = useState<Estimasi | null>(null)
    const [transaksi, setTransaksi] = useState<Transaksi[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }

        getMe(token)
            .then((profile) => {
                setMe(profile)
                const rek = getTabunganFromMe(profile)
                if (!rek) { setLoading(false); return }
                setTabungan(rek)
                return Promise.all([
                    getEstimasi(token, rek.id),
                    getMutasi(token, rek.id, { limit: 5 }),
                ])
            })
            .then((results) => {
                if (!results) return
                const [est, mutasi] = results
                setEstimasi(est)
                setTransaksi(mutasi.data)
            })
            .catch((err) => {
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else setError(err.message)
            })
            .finally(() => setLoading(false))
    }, [router])

    if (loading) return <DashboardSkeleton />
    if (error) return <div className="flex items-center justify-center min-h-screen text-error">{error}</div>
    if (!me) return null

    const nasabah = me.nasabah
    const saldo = toNumber(tabungan?.saldo)
    const progress = Math.min(100, Math.round((saldo / SETORAN_MINIMUM) * 100))
    const kekurangan = estimasi ? toNumber(estimasi.kekurangan) : Math.max(0, SETORAN_MINIMUM - saldo)
    const eligible = estimasi?.eligible ?? saldo >= SETORAN_MINIMUM
    const firstName = nasabah?.nama.split(" ")[0] ?? "Nasabah"

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <TopNav userName={nasabah?.nama ?? me.email} />

            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-[1440px] mx-auto">

                    {/* Header */}
                    <header className="mb-10">
                        <h2 className="font-outfit text-4xl font-bold text-on-background">
                            Assalamu&apos;alaikum, {firstName}
                        </h2>
                        <p className="text-lg text-on-surface-variant mt-1">
                            Manage your Hajj savings and track your eligibility for the sacred pilgrimage.
                        </p>
                    </header>

                    {/* No rekening state */}
                    {!tabungan ? (
                        <div className="glass-card border border-outline-variant rounded-xl p-12 text-center">
                            <span className="material-symbols-outlined text-5xl text-primary mb-4 block" style={{ fontVariationSettings: "'FILL' 1" }}>
                                account_balance_wallet
                            </span>
                            <h3 className="font-outfit text-2xl font-semibold text-on-surface mb-2">
                                Belum ada rekening tabungan haji
                            </h3>
                            <p className="text-on-surface-variant mb-6">
                                Buka rekening tabungan haji untuk mulai menabung menuju tanah suci.
                            </p>
                            <button className="px-8 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-all">
                                Buka Rekening Sekarang
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Top Cards */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">

                                {/* Account Card — 7 cols */}
                                <div className="lg:col-span-7 glass-card rounded-xl p-8 relative overflow-hidden group border border-outline-variant/50">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-110 pointer-events-none" />
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">Account Type</p>
                                                <h3 className="font-outfit text-2xl font-semibold text-primary">BSI Tabungan Haji</h3>
                                                <p className="text-sm font-mono text-outline mt-1">Acc. No. {tabungan.nomorRekening}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-primary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                account_balance_wallet
                                            </span>
                                        </div>
                                        <div className="mt-auto">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Available Balance</p>
                                            <div className="flex items-baseline gap-3 mt-1">
                                                <span className="font-outfit text-3xl font-semibold text-on-surface">{formatRupiah(saldo)}</span>
                                                <StatusBadge status={tabungan.status} />
                                            </div>
                                        </div>
                                        <div className="flex gap-4 mt-8">
                                            <Link href="/setoran" className="flex-1 py-3 bg-primary text-on-primary rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98]">
                                                <span className="material-symbols-outlined text-[20px]">add</span>
                                                Deposit
                                            </Link>
                                            <Link href="/penarikan" className="flex-1 py-3 border border-outline-variant text-on-surface rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-low transition-all">
                                                <span className="material-symbols-outlined text-[20px]">account_balance</span>
                                                Withdraw
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Eligibility Card — 5 cols */}
                                <div className="lg:col-span-5 glass-card rounded-xl p-8 flex flex-col border border-outline-variant/50">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-semibold">Hajj Eligibility</h3>
                                        {eligible ? (
                                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">Eligible ✓</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded-full border border-secondary/20">Belum Eligible</span>
                                        )}
                                    </div>
                                    <div className="mb-8">
                                        <div className="flex justify-between items-end mb-3">
                                            <span className="text-sm font-semibold text-on-surface">Progress to Goal ({formatRupiah(SETORAN_MINIMUM)})</span>
                                            <span className="font-outfit text-2xl font-semibold text-secondary">{progress}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                                            <div className="h-full bg-secondary-container rounded-full transition-all duration-700" style={{ width: `${progress}%`, boxShadow: "0 0 12px rgba(0,163,157,0.3)" }} />
                                        </div>
                                    </div>
                                    <div className="mt-auto bg-surface-container-low p-4 rounded-lg flex items-start gap-4">
                                        <span className="material-symbols-outlined text-secondary text-2xl mt-0.5">info</span>
                                        {eligible ? (
                                            <div>
                                                <p className="text-sm text-on-surface">Alhamdulillah! Anda sudah eligible untuk daftar haji.</p>
                                                {estimasi?.tahunPerkiraan && (
                                                    <p className="text-sm font-bold text-primary mt-1">Perkiraan berangkat: {estimasi.tahunPerkiraan}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm text-on-surface">
                                                    Butuh tambahan <span className="font-bold">{formatRupiah(kekurangan)}</span> lagi untuk eligible daftar haji.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                                {/* Transactions Table — 8 cols */}
                                <div className="lg:col-span-8 glass-card rounded-xl p-8 border border-outline-variant/50">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-semibold">Recent Transactions</h3>
                                        <Link href="/transaksi" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
                                            See All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                        </Link>
                                    </div>
                                    {transaksi.length === 0 ? (
                                        <div className="text-center py-12 text-on-surface-variant">
                                            <span className="material-symbols-outlined text-4xl mb-2 block">receipt_long</span>
                                            <p>Belum ada transaksi</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-outline-variant">
                                                        {["Date", "Type", "Reference", "Amount"].map((h) => (
                                                            <th key={h} className={`pb-4 text-xs font-semibold uppercase tracking-widest text-on-surface-variant ${h === "Amount" ? "text-right" : ""}`}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-outline-variant/30">
                                                    {transaksi.map((trx) => (
                                                        <tr key={trx.id} className="hover:bg-surface-container-low transition-colors">
                                                            <td className="py-4 text-sm">{formatDate(trx.waktu)}</td>
                                                            <td className="py-4">
                                                                <span className="flex items-center gap-2 text-sm font-semibold">
                                                                    <span className={`w-2 h-2 rounded-full ${trx.jenis === "SETORAN" ? "bg-primary" : "bg-secondary"}`} />
                                                                    {trx.jenis === "SETORAN" ? "Deposit" : "Withdrawal"}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 text-sm text-outline">{trx.referensi}</td>
                                                            <td className={`py-4 text-sm font-bold text-right ${trx.jenis === "SETORAN" ? "text-primary" : "text-secondary"}`}>
                                                                {trx.jenis === "SETORAN" ? "+" : "−"}{formatRupiah(toNumber(trx.nominal))}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Registration Journey — 4 cols */}
                                <div className="lg:col-span-4 glass-card rounded-xl p-8 flex flex-col border border-outline-variant/50">
                                    <h3 className="text-xl font-semibold mb-6">Registration Journey</h3>
                                    <div className="space-y-6 flex-1">
                                        <JourneyStep num={1} done title="Open Hajj Account" subtitle={`Dibuka ${formatDate(tabungan.dibukaAt)}`} hasLine />
                                        <JourneyStep num={2} done={eligible} inProgress={!eligible} title="Reach Initial Deposit" subtitle={`Min. ${formatRupiah(SETORAN_MINIMUM)} required`} hasLine />
                                        <JourneyStep num={3} done={false} title="Validation & SPPH" subtitle="Register to Ministry of Religion" hasLine={false} />
                                    </div>
                                    <div className="mt-8 rounded-lg overflow-hidden">
                                        <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center rounded-lg">
                                            <span className="material-symbols-outlined text-primary/30 select-none" style={{ fontSize: "80px", fontVariationSettings: "'FILL' 1" }}>mosque</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* FAB */}
            <button className="fixed bottom-10 right-10 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                <span className="absolute right-full mr-4 px-3 py-1.5 bg-inverse-surface text-inverse-on-surface rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Chat with Hajj Specialist</span>
            </button>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const cfg = { AKTIF: "bg-primary/10 text-primary", DORMANT: "bg-secondary/10 text-secondary", TUTUP: "bg-error/10 text-error" }[status] ?? "bg-outline/10 text-outline"
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg}`}>{status}</span>
}

function JourneyStep({ num, done, inProgress, title, subtitle, hasLine }: { num: number; done: boolean; inProgress?: boolean; title: string; subtitle: string; hasLine: boolean }) {
    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                {done ? (
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                ) : (
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm ${inProgress ? "border-secondary-container text-secondary-container" : "border-outline-variant text-outline"}`}>{num}</div>
                )}
                {hasLine && <div className={`w-0.5 flex-1 mt-1 ${done ? "bg-primary" : "bg-outline-variant"}`} />}
            </div>
            <div className="pb-6">
                <p className={`text-base font-bold ${done || inProgress ? "text-on-surface" : "text-outline"}`}>{title}</p>
                <p className="text-sm text-on-surface-variant">{subtitle}</p>
                {inProgress && <span className="mt-2 inline-flex items-center gap-2 px-2 py-0.5 bg-secondary/10 text-secondary text-xs font-bold rounded">In Progress</span>}
            </div>
        </div>
    )
}

function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant" />
            <div className="ml-[280px] pt-16 p-10 space-y-8">
                <div className="h-12 w-80 bg-surface-container rounded-xl" />
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-7 h-64 bg-surface-container rounded-xl" />
                    <div className="col-span-5 h-64 bg-surface-container rounded-xl" />
                </div>
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-8 h-80 bg-surface-container rounded-xl" />
                    <div className="col-span-4 h-80 bg-surface-container rounded-xl" />
                </div>
            </div>
        </div>
    )
}
