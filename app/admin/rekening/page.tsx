"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AdminSidebar } from "@/component/admin-sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    getAllTabungan,
    updateStatusRekening,
    deleteRekening,
    formatRupiah,
    formatDate,
    toNumber,
    type TabunganWithNasabah,
} from "@/lib/api"

type PageState = "loading" | "ready" | "error"
type Status = "AKTIF" | "DORMANT" | "TUTUP"
const STATUSES: Status[] = ["AKTIF", "DORMANT", "TUTUP"]

export default function AdminRekeningPage() {
    const router = useRouter()
    const [adminName, setAdminName] = useState("")
    const [rekening, setRekening] = useState<TabunganWithNasabah[]>([])
    const [pageState, setPageState] = useState<PageState>("loading")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [busyId, setBusyId] = useState<string | null>(null)
    const [editId, setEditId] = useState<string | null>(null)
    const [confirmDelId, setConfirmDelId] = useState<string | null>(null)

    function load() {
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
    }

    useEffect(load, [router])

    async function handleStatusChange(id: string, status: Status) {
        const token = localStorage.getItem("token")
        if (!token) return
        setBusyId(id)
        try {
            await updateStatusRekening(token, id, status)
            setRekening((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
            setEditId(null)
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Gagal mengubah status")
        } finally {
            setBusyId(null)
        }
    }

    async function handleDelete(id: string) {
        const token = localStorage.getItem("token")
        if (!token) return
        setBusyId(id)
        try {
            await deleteRekening(token, id)
            setRekening((prev) => prev.filter((r) => r.id !== id))
            setConfirmDelId(null)
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Gagal menghapus rekening")
        } finally {
            setBusyId(null)
        }
    }

    if (pageState === "loading") return <PageSkeleton />
    if (pageState === "error") return <div className="flex items-center justify-center min-h-screen text-error">{errorMsg}</div>

    const filtered = rekening.filter((r) =>
        [r.nomorRekening, r.nasabah.nama, r.nasabah.nik].some((f) => f.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />
            <TopNav userName={adminName} userRole="Administrator" />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-[1440px] mx-auto">

                    <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="font-outfit text-3xl font-bold text-on-background">Rekening Tabungan Haji</h2>
                            <p className="text-base text-on-surface-variant mt-1">{rekening.length} rekening terkelola</p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari no. rekening atau nasabah..."
                                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                            />
                        </div>
                    </header>

                    <div className="glass-card border border-outline-variant rounded-xl overflow-hidden">
                        {filtered.length === 0 ? (
                            <div className="py-20 text-center text-on-surface-variant">
                                <span className="material-symbols-outlined text-5xl mb-3 block">account_balance</span>
                                <p>{search ? "Tidak ada hasil pencarian" : "Belum ada rekening"}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-surface-container-low border-b border-outline-variant">
                                        <tr>
                                            {["No. Rekening", "Nasabah", "Saldo", "Dibuka", "Status", "Aksi"].map((h) => (
                                                <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/30">
                                        {filtered.map((r) => (
                                            <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                                                <td className="px-6 py-4 text-sm font-mono font-semibold">{r.nomorRekening}</td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold">{r.nasabah.nama}</p>
                                                    <p className="text-xs text-outline font-mono">{r.nasabah.nik}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-primary">{formatRupiah(toNumber(r.saldo))}</td>
                                                <td className="px-6 py-4 text-sm text-on-surface-variant">{formatDate(r.dibukaAt)}</td>
                                                <td className="px-6 py-4">
                                                    {editId === r.id ? (
                                                        <select
                                                            autoFocus
                                                            defaultValue={r.status}
                                                            disabled={busyId === r.id}
                                                            onChange={(e) => handleStatusChange(r.id, e.target.value as Status)}
                                                            onBlur={() => setEditId(null)}
                                                            className="bg-surface border border-outline-variant rounded-lg px-2 py-1 text-xs font-semibold focus:border-primary outline-none"
                                                        >
                                                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    ) : (
                                                        <StatusPill status={r.status} />
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {confirmDelId === r.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => handleDelete(r.id)} disabled={busyId === r.id} className="px-3 py-1.5 bg-error text-on-error rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
                                                                {busyId === r.id && <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>}
                                                                Hapus
                                                            </button>
                                                            <button onClick={() => setConfirmDelId(null)} className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold hover:bg-surface-container">Batal</button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <Link href={`/admin/rekening/${r.id}`} className="text-primary hover:bg-primary/10 rounded-lg p-2 transition-colors" title="Lihat detail">
                                                                <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                                                            </Link>
                                                            <button onClick={() => setEditId(r.id)} disabled={r.status === "TUTUP"} className="text-primary hover:bg-primary/10 rounded-lg p-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Ubah status">
                                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                                            </button>
                                                            <button onClick={() => setConfirmDelId(r.id)} className="text-error hover:bg-error/10 rounded-lg p-2 transition-colors" title="Hapus rekening">
                                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <p className="text-xs text-on-surface-variant mt-4 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        Rekening berstatus TUTUP tidak dapat diubah lagi. Rekening hanya dapat dihapus jika saldo Rp 0 dan tanpa riwayat transaksi.
                    </p>
                </div>
            </main>
        </div>
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
            <div className="ml-[280px] pt-16 p-10 space-y-6">
                <div className="h-10 w-72 bg-surface-container rounded-xl" />
                <div className="h-96 bg-surface-container rounded-xl" />
            </div>
        </div>
    )
}
