"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AdminSidebar } from "@/component/admin-sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    getTabungan,
    getTransaksiDetail,
    formatRupiah,
    toNumber,
    type TabunganDetail,
    type Transaksi,
} from "@/lib/api"

type PageState = "loading" | "ready" | "error"

export default function AdminTransaksiDetailPage() {
    const router = useRouter()
    const params = useParams<{ id: string; txId: string }>()
    const tabunganId = params.id
    const transaksiId = params.txId

    const [adminName, setAdminName] = useState("")
    const [tabungan, setTabungan] = useState<TabunganDetail | null>(null)
    const [trx, setTrx] = useState<Transaksi | null>(null)
    const [pageState, setPageState] = useState<PageState>("loading")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        getMe(token)
            .then((me) => {
                if (me.role !== "ADMIN") { router.replace("/dashboard"); return Promise.reject({ handled: true }) }
                setAdminName(me.email)
                return Promise.all([
                    getTabungan(token, tabunganId),
                    getTransaksiDetail(token, tabunganId, transaksiId),
                ])
            })
            .then((results) => {
                if (!results) return
                const [tab, t] = results
                setTabungan(tab)
                setTrx(t)
                setPageState("ready")
            })
            .catch((err) => {
                if (err?.handled) return
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else { setErrorMsg(err.message); setPageState("error") }
            })
    }, [router, tabunganId, transaksiId])

    if (pageState === "loading") return <PageSkeleton />
    if (pageState === "error" || !trx || !tabungan) {
        return (
            <div className="min-h-screen bg-background">
                <AdminSidebar />
                <TopNav userName={adminName} userRole="Administrator" />
                <main className="ml-[280px] pt-16 min-h-screen flex flex-col items-center justify-center gap-4 text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl">receipt_long</span>
                    <p className="text-error">{errorMsg ?? "Transaksi tidak ditemukan"}</p>
                    <Link href={`/admin/rekening/${tabunganId}`} className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold">Kembali</Link>
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
            <AdminSidebar />
            <TopNav userName={adminName} userRole="Administrator" />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-4xl mx-auto">

                    <Link href={`/admin/rekening/${tabunganId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mb-4">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Kembali ke Rekening {tabungan.nomorRekening}
                    </Link>

                    <header className="mb-8">
                        <h2 className="font-outfit text-3xl font-bold text-on-background">Detail Transaksi</h2>
                        <p className="text-base text-on-surface-variant mt-1 flex items-center gap-2 flex-wrap">
                            <span>No. Rekening: <span className="font-mono font-semibold">{tabungan.nomorRekening}</span></span>
                            {tabungan.nasabah && (
                                <>
                                    <span className="text-outline">·</span>
                                    <Link href={`/admin/nasabah/${tabungan.nasabah.id}`} className="text-primary hover:underline">
                                        {tabungan.nasabah.nama}
                                    </Link>
                                </>
                            )}
                        </p>
                    </header>

                    {/* Main detail card */}
                    <div className="glass-card border border-outline-variant rounded-xl overflow-hidden">

                        <div className="p-8 border-b border-outline-variant grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3 ${bgAccent}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {isSetoran ? "Setoran" : "Penarikan"}
                                </span>
                                <p className={`font-outfit text-4xl font-bold ${accent}`}>
                                    {sign}{formatRupiah(toNumber(trx.nominal))}
                                </p>
                                <p className="text-sm text-on-surface-variant mt-2">
                                    {waktuDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                    {" · "}
                                    {waktuDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                                </p>
                            </div>
                            <div className="bg-surface-container-low rounded-xl p-5">
                                <p className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant mb-3">Pergerakan Saldo</p>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs text-on-surface-variant">Sebelum</p>
                                        <p className="text-base font-semibold">{formatRupiah(toNumber(trx.saldoSebelum))}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-outline">arrow_forward</span>
                                    <div className="text-right">
                                        <p className="text-xs text-on-surface-variant">Sesudah</p>
                                        <p className={`text-base font-bold ${accent}`}>{formatRupiah(toNumber(trx.saldoSesudah))}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <dl className="divide-y divide-outline-variant/30">
                            <Row label="Nomor Referensi" value={trx.referensi} mono />
                            <Row label="Metode" value={trx.metode ?? "—"} />
                            <Row label="ID Transaksi" value={trx.id} mono small />
                            <Row label="ID Rekening" value={tabungan.id} mono small />
                            {tabungan.nasabah && <Row label="NIK Nasabah" value={tabungan.nasabah.nik} mono />}
                            {tabungan.nasabah && <Row label="Email Nasabah" value={tabungan.nasabah.email} />}
                        </dl>

                        <div className="p-6 border-t border-outline-variant bg-surface-container-lowest flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-on-surface-variant flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                                Tampilan administrator
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

function Row({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
    return (
        <div className="px-8 py-4 flex items-center justify-between gap-4">
            <dt className="text-sm text-on-surface-variant">{label}</dt>
            <dd className={`text-on-surface text-right ${mono ? "font-mono" : ""} ${small ? "text-xs text-outline" : "text-sm"}`}>{value}</dd>
        </div>
    )
}

function PageSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant" />
            <div className="ml-[280px] pt-16 p-10 max-w-4xl mx-auto space-y-6">
                <div className="h-10 w-72 bg-surface-container rounded-xl" />
                <div className="h-96 bg-surface-container rounded-xl" />
            </div>
        </div>
    )
}
