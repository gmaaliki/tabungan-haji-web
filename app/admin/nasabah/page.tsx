"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/component/admin-sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    getAllNasabah,
    deleteNasabah,
    formatDate,
    type NasabahRow,
} from "@/lib/api"

type PageState = "loading" | "ready" | "error"

export default function AdminNasabahPage() {
    const router = useRouter()
    const [adminName, setAdminName] = useState("")
    const [nasabah, setNasabah] = useState<NasabahRow[]>([])
    const [pageState, setPageState] = useState<PageState>("loading")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [confirmId, setConfirmId] = useState<string | null>(null)

    function load() {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        getMe(token)
            .then((me) => {
                if (me.role !== "ADMIN") { router.replace("/dashboard"); return Promise.reject({ handled: true }) }
                setAdminName(me.email)
                return getAllNasabah(token)
            })
            .then((res) => {
                if (!res) return
                setNasabah(res.data)
                setPageState("ready")
            })
            .catch((err) => {
                if (err?.handled) return
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else { setErrorMsg(err.message); setPageState("error") }
            })
    }

    useEffect(load, [router])

    async function handleDelete(id: string) {
        const token = localStorage.getItem("token")
        if (!token) return
        setDeletingId(id)
        try {
            await deleteNasabah(token, id)
            setNasabah((prev) => prev.filter((n) => n.id !== id))
            setConfirmId(null)
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Gagal menghapus")
        } finally {
            setDeletingId(null)
        }
    }

    if (pageState === "loading") return <PageSkeleton />
    if (pageState === "error") return <div className="flex items-center justify-center min-h-screen text-error">{errorMsg}</div>

    const filtered = nasabah.filter((n) =>
        [n.nama, n.nik, n.email].some((f) => f.toLowerCase().includes(search.toLowerCase()))
    )

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />
            <TopNav userName={adminName} userRole="Administrator" />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-[1440px] mx-auto">

                    <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="font-outfit text-3xl font-bold text-on-background">Data Nasabah</h2>
                            <p className="text-base text-on-surface-variant mt-1">{nasabah.length} nasabah terdaftar</p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, NIK, atau email..."
                                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                            />
                        </div>
                    </header>

                    <div className="glass-card border border-outline-variant rounded-xl overflow-hidden">
                        {filtered.length === 0 ? (
                            <div className="py-20 text-center text-on-surface-variant">
                                <span className="material-symbols-outlined text-5xl mb-3 block">person_off</span>
                                <p>{search ? "Tidak ada hasil pencarian" : "Belum ada nasabah"}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-surface-container-low border-b border-outline-variant">
                                        <tr>
                                            {["Nama", "NIK", "Email", "No. HP", "Terdaftar", ""].map((h) => (
                                                <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/30">
                                        {filtered.map((n) => (
                                            <tr key={n.id} className="hover:bg-surface-container-low transition-colors">
                                                <td className="px-6 py-4 text-sm font-semibold">{n.nama}</td>
                                                <td className="px-6 py-4 text-sm font-mono text-outline">{n.nik}</td>
                                                <td className="px-6 py-4 text-sm">{n.email}</td>
                                                <td className="px-6 py-4 text-sm">{n.nomorHp}</td>
                                                <td className="px-6 py-4 text-sm text-on-surface-variant">{formatDate(n.createdAt)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    {confirmId === n.id ? (
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <button onClick={() => handleDelete(n.id)} disabled={deletingId === n.id} className="px-3 py-1.5 bg-error text-on-error rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
                                                                {deletingId === n.id && <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>}
                                                                Hapus
                                                            </button>
                                                            <button onClick={() => setConfirmId(null)} className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold hover:bg-surface-container">Batal</button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setConfirmId(n.id)} className="text-error hover:bg-error/10 rounded-lg p-2 transition-colors" title="Hapus nasabah">
                                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                                        </button>
                                                    )}
                                                </td>
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

function PageSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant" />
            <div className="ml-[280px] pt-16 p-10 space-y-6">
                <div className="h-10 w-64 bg-surface-container rounded-xl" />
                <div className="h-96 bg-surface-container rounded-xl" />
            </div>
        </div>
    )
}
