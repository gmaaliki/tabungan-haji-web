"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AdminSidebar } from "@/component/admin-sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    getAllNasabah,
    getAllTabungan,
    formatRupiah,
    toNumber,
    type TabunganWithNasabah,
} from "@/lib/api"

type PageState = "loading" | "ready" | "error"

export default function AdminOverviewPage() {
    const router = useRouter()
    const [adminName, setAdminName] = useState("")
    const [totalNasabah, setTotalNasabah] = useState(0)
    const [rekening, setRekening] = useState<TabunganWithNasabah[]>([])
    const [pageState, setPageState] = useState<PageState>("loading")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        getMe(token)
            .then((me) => {
                if (me.role !== "ADMIN") { router.replace("/dashboard"); return Promise.reject({ handled: true }) }
                setAdminName(me.email)
                return Promise.all([getAllNasabah(token), getAllTabungan(token)])
            })
            .then((results) => {
                if (!results) return
                const [nasabah, tabungan] = results
                setTotalNasabah(nasabah.total)
                setRekening(tabungan.data)
                setPageState("ready")
            })
            .catch((err) => {
                if (err?.handled) return
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else { setErrorMsg(err.message); setPageState("error") }
            })
    }, [router])

    if (pageState === "loading") return <PageSkeleton />
    if (pageState === "error") return <div className="flex items-center justify-center min-h-screen text-error">{errorMsg}</div>

    const totalSaldo = rekening.reduce((s, r) => s + toNumber(r.saldo), 0)
    const aktif = rekening.filter((r) => r.status === "AKTIF").length
    const dormant = rekening.filter((r) => r.status === "DORMANT").length
    const tutup = rekening.filter((r) => r.status === "TUTUP").length
    const recent = [...rekening].slice(0, 6)

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />
            <TopNav userName={adminName} userRole="Administrator" />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-[1440px] mx-auto">

                    <header className="mb-10">
                        <h2 className="font-outfit text-3xl font-bold text-on-background">Dashboard Admin</h2>
                        <p className="text-base text-on-surface-variant mt-1">Ringkasan nasabah, rekening, dan total dana terkelola.</p>
                    </header>

                    {/* Stat cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard icon="groups" label="Total Nasabah" value={`${totalNasabah}`} sub="nasabah terdaftar" color="text-primary" />
                        <StatCard icon="account_balance" label="Total Rekening" value={`${rekening.length}`} sub={`${aktif} aktif · ${dormant} dormant · ${tutup} tutup`} color="text-secondary" />
                        <StatCard icon="savings" label="Total Saldo Terkelola" value={formatRupiah(totalSaldo)} sub="seluruh rekening" color="text-primary" />
                    </div>

                    {/* Quick links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <QuickLink href="/admin/nasabah" icon="groups" title="Kelola Nasabah" desc="Lihat & hapus data nasabah" />
                        <QuickLink href="/admin/rekening" icon="account_balance" title="Kelola Rekening" desc="Ubah status & hapus rekening" />
                        <QuickLink href="/admin/laporan" icon="description" title="Unduh Laporan" desc="Ekspor transaksi ke CSV" />
                    </div>

                    {/* Recent rekening */}
                    <div className="glass-card border border-outline-variant rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                            <h4 className="font-outfit text-xl font-semibold">Rekening Terbaru</h4>
                            <Link href="/admin/rekening" className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                                Lihat Semua <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </Link>
                        </div>
                        {recent.length === 0 ? (
                            <div className="py-16 text-center text-on-surface-variant">Belum ada rekening</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-surface-container-low border-b border-outline-variant">
                                        <tr>
                                            {["Nasabah", "No. Rekening", "Saldo", "Status"].map((h) => (
                                                <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/30">
                                        {recent.map((r) => (
                                            <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                                                <td className="px-6 py-4">
                                                    <Link href={`/admin/nasabah/${r.nasabah.id}`} className="text-sm font-semibold hover:text-primary hover:underline">{r.nasabah.nama}</Link>
                                                    <p className="text-xs text-outline font-mono">{r.nasabah.nik}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link href={`/admin/rekening/${r.id}`} className="text-sm font-mono hover:text-primary hover:underline">{r.nomorRekening}</Link>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-primary">{formatRupiah(toNumber(r.saldo))}</td>
                                                <td className="px-6 py-4"><StatusPill status={r.status} /></td>
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

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
    return (
        <div className="glass-card border border-outline-variant rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-surface-container rounded-full flex items-center justify-center">
                    <span className={`material-symbols-outlined ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</p>
            </div>
            <p className={`font-outfit text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{sub}</p>
        </div>
    )
}

function QuickLink({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
    return (
        <Link href={href} className="glass-card border border-outline-variant rounded-xl p-6 hover:border-primary/40 hover:shadow-sm transition-all group">
            <span className="material-symbols-outlined text-primary text-3xl mb-3 block group-hover:scale-110 transition-transform">{icon}</span>
            <p className="font-semibold text-on-surface">{title}</p>
            <p className="text-sm text-on-surface-variant mt-0.5">{desc}</p>
        </Link>
    )
}

function StatusPill({ status }: { status: string }) {
    const cfg = { AKTIF: "bg-primary/10 text-primary", DORMANT: "bg-secondary/10 text-secondary", TUTUP: "bg-error/10 text-error" }[status] ?? "bg-outline/10 text-outline"
    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{status}</span>
}

function PageSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant" />
            <div className="ml-[280px] pt-16 p-10 space-y-8">
                <div className="h-10 w-72 bg-surface-container rounded-xl" />
                <div className="grid grid-cols-3 gap-6">{[0, 1, 2].map((i) => <div key={i} className="h-28 bg-surface-container rounded-xl" />)}</div>
                <div className="h-96 bg-surface-container rounded-xl" />
            </div>
        </div>
    )
}
