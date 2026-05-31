"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AdminSidebar } from "@/component/admin-sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    getNasabahDetail,
    updateNasabah,
    deleteNasabah,
    formatRupiah,
    formatDate,
    toNumber,
    type NasabahDetail,
} from "@/lib/api"

type PageState = "loading" | "ready" | "error"

export default function AdminNasabahDetailPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const nasabahId = params.id

    const [adminName, setAdminName] = useState("")
    const [nasabah, setNasabah] = useState<NasabahDetail | null>(null)
    const [pageState, setPageState] = useState<PageState>("loading")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const [editing, setEditing] = useState(false)
    const [savingProfile, setSavingProfile] = useState(false)
    const [profileMsg, setProfileMsg] = useState<string | null>(null)
    const [profileErr, setProfileErr] = useState<string | null>(null)
    const [formNama, setFormNama] = useState("")
    const [formEmail, setFormEmail] = useState("")
    const [formHp, setFormHp] = useState("")

    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        getMe(token)
            .then((me) => {
                if (me.role !== "ADMIN") { router.replace("/dashboard"); return Promise.reject({ handled: true }) }
                setAdminName(me.email)
                return getNasabahDetail(token, nasabahId)
            })
            .then((data) => {
                if (!data) return
                setNasabah(data)
                setFormNama(data.nama)
                setFormEmail(data.email)
                setFormHp(data.nomorHp)
                setPageState("ready")
            })
            .catch((err) => {
                if (err?.handled) return
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else { setErrorMsg(err.message); setPageState("error") }
            })
    }, [router, nasabahId])

    async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const token = localStorage.getItem("token")
        if (!token || !nasabah) return
        setProfileErr(null)
        setProfileMsg(null)
        setSavingProfile(true)
        try {
            const payload: { nama?: string; email?: string; nomorHp?: string } = {}
            if (formNama !== nasabah.nama) payload.nama = formNama
            if (formEmail !== nasabah.email) payload.email = formEmail
            if (formHp !== nasabah.nomorHp) payload.nomorHp = formHp
            if (Object.keys(payload).length === 0) {
                setProfileMsg("Tidak ada perubahan")
                setEditing(false)
                return
            }
            await updateNasabah(token, nasabah.id, payload)
            setNasabah({ ...nasabah, ...payload })
            setProfileMsg("Profil berhasil diperbarui")
            setEditing(false)
        } catch (err: unknown) {
            setProfileErr(err instanceof Error ? err.message : "Gagal memperbarui profil")
        } finally {
            setSavingProfile(false)
        }
    }

    async function handleDelete() {
        const token = localStorage.getItem("token")
        if (!token || !nasabah) return
        setDeleting(true)
        try {
            await deleteNasabah(token, nasabah.id)
            router.replace("/admin/nasabah")
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Gagal menghapus nasabah")
            setDeleting(false)
            setConfirmDelete(false)
        }
    }

    if (pageState === "loading") return <PageSkeleton />
    if (pageState === "error" || !nasabah) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl">person_off</span>
                <p className="text-error">{errorMsg ?? "Nasabah tidak ditemukan"}</p>
                <Link href="/admin/nasabah" className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold">Kembali</Link>
            </div>
        )
    }

    const totalSaldo = nasabah.tabungan.reduce((s, t) => s + toNumber(t.saldo), 0)

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />
            <TopNav userName={adminName} userRole="Administrator" />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-[1440px] mx-auto">

                    <Link href="/admin/nasabah" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mb-4">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        Kembali ke Daftar Nasabah
                    </Link>

                    <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="font-outfit text-3xl font-bold text-on-background">{nasabah.nama}</h2>
                            <p className="text-base text-on-surface-variant mt-1 font-mono">{nasabah.nik}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {!editing && (
                                <button onClick={() => { setEditing(true); setProfileMsg(null); setProfileErr(null) }} className="px-4 py-2.5 border border-primary text-primary rounded-lg text-sm font-semibold hover:bg-primary/5 transition-colors flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                    Ubah Profil
                                </button>
                            )}
                            {confirmDelete ? (
                                <div className="flex items-center gap-2">
                                    <button onClick={handleDelete} disabled={deleting} className="px-4 py-2.5 bg-error text-on-error rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
                                        {deleting && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                                        Konfirmasi Hapus
                                    </button>
                                    <button onClick={() => setConfirmDelete(false)} className="px-4 py-2.5 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container">Batal</button>
                                </div>
                            ) : (
                                <button onClick={() => setConfirmDelete(true)} className="px-4 py-2.5 border border-error/30 text-error rounded-lg text-sm font-semibold hover:bg-error/5 transition-colors flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    Hapus
                                </button>
                            )}
                        </div>
                    </header>

                    {/* Summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <SummaryCard icon="account_balance" label="Rekening" value={`${nasabah.tabungan.length}`} sub="tabungan haji" color="text-primary" />
                        <SummaryCard icon="savings" label="Total Saldo" value={formatRupiah(totalSaldo)} sub="seluruh rekening" color="text-secondary" />
                        <SummaryCard icon="calendar_today" label="Terdaftar Sejak" value={formatDate(nasabah.createdAt)} sub="tanggal daftar nasabah" color="text-on-surface" />
                    </div>

                    {/* Profile card */}
                    <div className="glass-card border border-outline-variant rounded-xl p-8 mb-8">
                        <h4 className="font-outfit text-xl font-semibold mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">badge</span>
                            Profil Nasabah
                        </h4>

                        {profileMsg && (
                            <div className="mb-4 p-3 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm">{profileMsg}</div>
                        )}
                        {profileErr && (
                            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm">{profileErr}</div>
                        )}

                        {editing ? (
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <Field label="Nama Lengkap">
                                    <input value={formNama} onChange={(e) => setFormNama(e.target.value)} required className={inputCls} disabled={savingProfile} />
                                </Field>
                                <Field label="Email">
                                    <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required className={inputCls} disabled={savingProfile} />
                                </Field>
                                <Field label="Nomor Handphone">
                                    <input type="tel" value={formHp} onChange={(e) => setFormHp(e.target.value)} required pattern="08[0-9]{8,11}" title="Format: 08xxxxxxxxxx" className={inputCls} disabled={savingProfile} />
                                </Field>
                                <div className="flex items-center gap-3 pt-2">
                                    <button type="submit" disabled={savingProfile} className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                                        {savingProfile && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                                        Simpan Perubahan
                                    </button>
                                    <button type="button" onClick={() => {
                                        setEditing(false)
                                        setFormNama(nasabah.nama); setFormEmail(nasabah.email); setFormHp(nasabah.nomorHp)
                                        setProfileErr(null)
                                    }} className="px-5 py-2.5 border border-outline-variant rounded-lg font-semibold text-sm hover:bg-surface-container" disabled={savingProfile}>
                                        Batal
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Info label="Nama Lengkap" value={nasabah.nama} />
                                <Info label="NIK" value={nasabah.nik} mono />
                                <Info label="Email" value={nasabah.email} />
                                <Info label="Nomor Handphone" value={nasabah.nomorHp} />
                            </dl>
                        )}
                    </div>

                    {/* Tabungan list */}
                    <div className="glass-card border border-outline-variant rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
                            <h4 className="font-outfit text-xl font-semibold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">account_balance</span>
                                Rekening Tabungan Haji
                            </h4>
                            <span className="text-sm text-on-surface-variant">{nasabah.tabungan.length} rekening</span>
                        </div>

                        {nasabah.tabungan.length === 0 ? (
                            <div className="py-16 text-center text-on-surface-variant">
                                <span className="material-symbols-outlined text-5xl mb-3 block">account_balance_wallet</span>
                                <p>Belum ada rekening tabungan haji</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-surface-container-low border-b border-outline-variant">
                                        <tr>
                                            {["No. Rekening", "Saldo", "Status", "Dibuka", "Tanggal Daftar Haji", ""].map((h) => (
                                                <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant/30">
                                        {nasabah.tabungan.map((t) => (
                                            <tr key={t.id} className="hover:bg-surface-container-low transition-colors">
                                                <td className="px-6 py-4 text-sm font-mono font-semibold">{t.nomorRekening}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-primary">{formatRupiah(toNumber(t.saldo))}</td>
                                                <td className="px-6 py-4"><StatusPill status={t.status} /></td>
                                                <td className="px-6 py-4 text-sm text-on-surface-variant">{formatDate(t.dibukaAt)}</td>
                                                <td className="px-6 py-4 text-sm text-on-surface-variant">{t.tanggalDaftarHaji ? formatDate(t.tanggalDaftarHaji) : "—"}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href={`/admin/rekening/${t.id}`} className="text-primary text-sm font-semibold hover:underline inline-flex items-center gap-1">
                                                        Detail <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                                    </Link>
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

const inputCls =
    "w-full px-4 py-2.5 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none bg-surface text-sm disabled:opacity-60"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-on-surface-variant">{label}</label>
            {children}
        </div>
    )
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</dt>
            <dd className={`text-base mt-1 ${mono ? "font-mono" : ""}`}>{value}</dd>
        </div>
    )
}

function SummaryCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color: string }) {
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
                <div className="grid grid-cols-3 gap-6">{[0, 1, 2].map((i) => <div key={i} className="h-28 bg-surface-container rounded-xl" />)}</div>
                <div className="h-48 bg-surface-container rounded-xl" />
                <div className="h-64 bg-surface-container rounded-xl" />
            </div>
        </div>
    )
}
