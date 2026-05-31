"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/component/admin-sidebar"
import { TopNav } from "@/component/topnav"
import { NasabahRow } from "@/component/admin/nasabah-row"
import {
    ApiError,
    getMe,
    getAllNasabah,
    deleteNasabah,
    postRegister,
    type NasabahRow as NasabahRowData,
} from "@/lib/api"

type PageState = "loading" | "ready" | "error"

const EMPTY_FORM = { nik: "", nama: "", email: "", nomorHp: "", password: "" }
type FormState = typeof EMPTY_FORM

export default function AdminNasabahPage() {
    const router = useRouter()
    const [adminName, setAdminName] = useState("")
    const [nasabah, setNasabah] = useState<NasabahRowData[]>([])
    const [pageState, setPageState] = useState<PageState>("loading")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [confirmId, setConfirmId] = useState<string | null>(null)

    // Create form
    const [showCreate, setShowCreate] = useState(false)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [creating, setCreating] = useState(false)
    const [createBanner, setCreateBanner] = useState<string | null>(null)
    const [createError, setCreateError] = useState<string | null>(null)
    const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string[]>>({})

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

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setCreateBanner(null)
        setCreateError(null)
        setCreateFieldErrors({})
        setCreating(true)
        try {
            await postRegister(form)
            setCreateBanner(`Nasabah ${form.nama} berhasil didaftarkan`)
            setForm(EMPTY_FORM)
            // Reload list to surface the new row + correct ordering.
            const token = localStorage.getItem("token")
            if (token) {
                const res = await getAllNasabah(token)
                setNasabah(res.data)
            }
        } catch (err: unknown) {
            if (err instanceof ApiError && err.hasFieldErrors()) {
                setCreateFieldErrors(err.details!.fieldErrors!)
                setCreateError(err.details?.formErrors?.[0] ?? null)
            } else {
                setCreateError(err instanceof Error ? err.message : "Gagal mendaftarkan nasabah")
            }
        } finally {
            setCreating(false)
        }
    }

    function toggleCreate() {
        setShowCreate((v) => !v)
        setCreateBanner(null)
        setCreateError(null)
        setCreateFieldErrors({})
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
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-80">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama, NIK, atau email..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                                />
                            </div>
                            <button
                                onClick={toggleCreate}
                                className="px-4 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                            >
                                <span className="material-symbols-outlined text-[18px]">{showCreate ? "close" : "person_add"}</span>
                                {showCreate ? "Tutup" : "Tambah Nasabah"}
                            </button>
                        </div>
                    </header>

                    {showCreate && (
                        <div className="glass-card border border-outline-variant rounded-xl p-6 mb-6">
                            <h3 className="font-outfit text-xl font-semibold mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person_add</span>
                                Tambah Nasabah Baru
                            </h3>
                            <p className="text-sm text-on-surface-variant mb-4">
                                Membuat akun nasabah baru sekaligus akun login (password diset di sini).
                            </p>

                            {createBanner && (
                                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    {createBanner}
                                </div>
                            )}
                            {createError && (
                                <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm">{createError}</div>
                            )}

                            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CreateField label="NIK" name="nik" value={form.nik} onChange={(v) => setForm((f) => ({ ...f, nik: v.replace(/\D/g, "").slice(0, 16) }))} placeholder="16 digit" pattern="\\d{16}" inputMode="numeric" maxLength={16} errors={createFieldErrors.nik} disabled={creating} />
                                <CreateField label="Nama Lengkap" name="nama" value={form.nama} onChange={(v) => setForm((f) => ({ ...f, nama: v }))} placeholder="Nama sesuai KTP" errors={createFieldErrors.nama} disabled={creating} />
                                <CreateField label="Email" name="email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="contoh@email.com" errors={createFieldErrors.email} disabled={creating} />
                                <CreateField label="Nomor HP" name="nomorHp" type="tel" value={form.nomorHp} onChange={(v) => setForm((f) => ({ ...f, nomorHp: v }))} placeholder="08xxxxxxxxxx" pattern="08[0-9]{8,11}" errors={createFieldErrors.nomorHp} disabled={creating} />
                                <CreateField label="Password" name="password" type="password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="Minimal 8 karakter" minLength={8} maxLength={72} errors={createFieldErrors.password} disabled={creating} />
                                <div className="md:col-span-2 flex items-center gap-3 pt-2">
                                    <button type="submit" disabled={creating} className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                                        {creating && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
                                        Simpan
                                    </button>
                                    <button type="button" onClick={() => { setForm(EMPTY_FORM); setCreateError(null); setCreateFieldErrors({}) }} disabled={creating} className="px-5 py-2.5 border border-outline-variant rounded-lg font-semibold text-sm hover:bg-surface-container disabled:opacity-50">
                                        Reset
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

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
                                            <NasabahRow
                                                key={n.id}
                                                nasabah={n}
                                                confirmingId={confirmId}
                                                deletingId={deletingId}
                                                onAskDelete={setConfirmId}
                                                onCancelDelete={() => setConfirmId(null)}
                                                onConfirmDelete={handleDelete}
                                            />
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

function CreateField({
    label, name, value, onChange, placeholder, type = "text", pattern, inputMode, maxLength, minLength, errors, disabled,
}: {
    label: string
    name: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    type?: string
    pattern?: string
    inputMode?: "text" | "numeric" | "tel" | "email"
    maxLength?: number
    minLength?: number
    errors?: string[]
    disabled?: boolean
}) {
    const hasError = !!errors && errors.length > 0
    return (
        <div className="space-y-1">
            <label htmlFor={`create-${name}`} className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</label>
            <input
                id={`create-${name}`}
                name={name}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                pattern={pattern}
                inputMode={inputMode}
                maxLength={maxLength}
                minLength={minLength}
                required
                disabled={disabled}
                className={`w-full px-3 py-2.5 rounded-lg border bg-surface text-sm outline-none transition-all disabled:opacity-60 ${hasError ? "border-error focus:ring-2 focus:ring-error/20" : "border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10"}`}
            />
            {hasError && (
                <ul className="text-xs text-error space-y-0.5 pl-1">
                    {errors!.map((msg, i) => (
                        <li key={i} className="flex items-start gap-1">
                            <span className="material-symbols-outlined text-[14px] mt-0.5">error</span>
                            <span>{msg}</span>
                        </li>
                    ))}
                </ul>
            )}
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
