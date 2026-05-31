"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/component/sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    getTransaksiDetail,
    getTabunganFromMe,
    formatRupiah,
    toNumber,
    type Me,
    type Transaksi,
} from "@/lib/api"

type PageState = "loading" | "ready" | "error"

export default function TransaksiDetailPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const transaksiId = params.id

    const [me, setMe] = useState<Me | null>(null)
    const [nomorRekening, setNomorRekening] = useState<string>("")
    const [trx, setTrx] = useState<Transaksi | null>(null)
    const [pageState, setPageState] = useState<PageState>("loading")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        getMe(token)
            .then((profile) => {
                setMe(profile)
                const rek = getTabunganFromMe(profile)
                if (!rek) {
                    setErrorMsg("Anda belum memiliki rekening tabungan haji")
                    setPageState("error")
                    return Promise.reject({ handled: true })
                }
                setNomorRekening(rek.nomorRekening)
                return getTransaksiDetail(token, rek.id, transaksiId)
            })
            .then((data) => {
                if (!data) return
                setTrx(data)
                setPageState("ready")
            })
            .catch((err) => {
                if (err?.handled) return
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else { setErrorMsg(err.message); setPageState("error") }
            })
    }, [router, transaksiId])

    if (pageState === "loading") return <PageSkeleton />
    if (pageState === "error" || !trx) {
        return (
            <div className="min-h-screen bg-background">
                <Sidebar />
                <TopNav userName={me?.nasabah?.nama ?? me?.email ?? ""} />
                <main className="ml-[280px] pt-16 min-h-screen flex flex-col items-center justify-center gap-4 text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl">receipt_long</span>
                    <p className="text-error">{errorMsg ?? "Transaksi tidak ditemukan"}</p>
                    <Link href="/transaksi" className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold">Kembali ke Riwayat</Link>
                </main>
            </div>
        )
    }

    const isSetoran = trx.jenis === "SETORAN"
    const sign = isSetoran ? "+" : "−"
    const accent = isSetoran ? "text-primary" : "text-secondary"
    const bgAccent = isSetoran ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
    const waktuDate = new Date(trx.waktu)

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <TopNav userName={me?.nasabah?.nama ?? me?.email ?? ""} />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-3xl mx-auto">

                    <Link href="/transaksi" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mb-4">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Kembali ke Riwayat Mutasi
                    </Link>

                    <header className="mb-8">
                        <h2 className="font-outfit text-3xl font-bold text-on-background">Bukti Transaksi</h2>
                        <p className="text-base text-on-surface-variant mt-1">Detail lengkap transaksi tabungan haji Anda.</p>
                    </header>

                    {/* Receipt */}
                    <div className="glass-card border border-outline-variant rounded-xl overflow-hidden">

                        {/* Receipt header */}
                        <div className="p-8 border-b border-outline-variant text-center">
                            <span className={`material-symbols-outlined text-5xl ${accent}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                {isSetoran ? "check_circle" : "task_alt"}
                            </span>
                            <p className="mt-3 text-sm uppercase tracking-wider font-semibold text-on-surface-variant">
                                {isSetoran ? "Setoran Berhasil" : "Penarikan Berhasil"}
                            </p>
                            <p className={`font-outfit text-4xl font-bold ${accent} mt-2`}>
                                {sign}{formatRupiah(toNumber(trx.nominal))}
                            </p>
                            <p className="text-sm text-on-surface-variant mt-2">
                                {waktuDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                {" · "}
                                {waktuDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                            </p>
                        </div>

                        {/* Receipt body */}
                        <dl className="divide-y divide-outline-variant/30">
                            <Row label="Jenis Transaksi">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${bgAccent}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {isSetoran ? "Setoran" : "Penarikan"}
                                </span>
                            </Row>
                            <Row label="Nomor Referensi">
                                <span className="font-mono text-sm">{trx.referensi}</span>
                            </Row>
                            <Row label="Metode">
                                <span>{trx.metode ?? "—"}</span>
                            </Row>
                            <Row label="No. Rekening">
                                <span className="font-mono">{nomorRekening}</span>
                            </Row>
                            <Row label="Saldo Sebelum">
                                <span>{formatRupiah(toNumber(trx.saldoSebelum))}</span>
                            </Row>
                            <Row label="Saldo Sesudah">
                                <span className="font-bold">{formatRupiah(toNumber(trx.saldoSesudah))}</span>
                            </Row>
                            <Row label="ID Transaksi">
                                <span className="font-mono text-xs text-outline">{trx.id}</span>
                            </Row>
                        </dl>

                        {/* Footer actions */}
                        <div className="p-6 border-t border-outline-variant bg-surface-container-lowest flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-on-surface-variant flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">verified</span>
                                Bukti transaksi sah dari sistem BSI Hajj Online
                            </p>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">print</span>
                                Cetak
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="px-8 py-4 flex items-center justify-between gap-4">
            <dt className="text-sm text-on-surface-variant">{label}</dt>
            <dd className="text-sm text-on-surface text-right">{children}</dd>
        </div>
    )
}

function PageSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant" />
            <div className="ml-[280px] pt-16 p-10 max-w-3xl mx-auto space-y-6">
                <div className="h-10 w-64 bg-surface-container rounded-xl" />
                <div className="h-96 bg-surface-container rounded-xl" />
            </div>
        </div>
    )
}
