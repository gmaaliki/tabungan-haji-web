"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/component/admin-sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    postRegisterStaff,
    formatDate,
    type StaffUser,
} from "@/lib/api"

type PageState = "loading" | "ready" | "error"
type Role = "USER" | "ADMIN"

export default function AdminStaffPage() {
    const router = useRouter()
    const [adminName, setAdminName] = useState("")
    const [pageState, setPageState] = useState<PageState>("loading")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const [created, setCreated] = useState<StaffUser[]>([])
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [formErr, setFormErr] = useState<string | null>(null)
    const [formMsg, setFormMsg] = useState<string | null>(null)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState<Role>("ADMIN")

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        getMe(token)
            .then((me) => {
                if (me.role !== "ADMIN") { router.replace("/dashboard"); return }
                setAdminName(me.email)
                setPageState("ready")
            })
            .catch((err) => {
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else { setErrorMsg(err.message); setPageState("error") }
            })
    }, [router])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const token = localStorage.getItem("token")
        if (!token) return
        setFormErr(null)
        setFormMsg(null)
        setSubmitting(true)
        try {
            const user = await postRegisterStaff(token, { email, password, role })
            setCreated((prev) => [user, ...prev])
            setFormMsg(`Akun ${role === "ADMIN" ? "admin" : "user"} ${user.email} berhasil dibuat`)
            setEmail("")
            setPassword("")
            setRole("ADMIN")
        } catch (err: unknown) {
            setFormErr(err instanceof Error ? err.message : "Gagal membuat akun")
        } finally {
            setSubmitting(false)
        }
    }

    if (pageState === "loading") return <PageSkeleton />
    if (pageState === "error") return <div className="flex items-center justify-center min-h-screen text-error">{errorMsg}</div>

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />
            <TopNav userName={adminName} userRole="Administrator" />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-[1440px] mx-auto">

                    <header className="mb-8">
                        <h2 className="font-outfit text-3xl font-bold text-on-background">Kelola Akun Staf</h2>
                        <p className="text-base text-on-surface-variant mt-1">Buat akun baru bagi admin atau staf operasional.</p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Create form */}
                        <div className="lg:col-span-5">
                            <div className="glass-card border border-outline-variant rounded-xl p-8">
                                <h4 className="font-outfit text-xl font-semibold mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">person_add</span>
                                    Tambah Akun Baru
                                </h4>
                                <p className="text-sm text-on-surface-variant mb-6">Akun dibuat tanpa profil nasabah. Untuk akun nasabah, gunakan pendaftaran publik.</p>

                                {formMsg && (
                                    <div className="mb-4 p-3 bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        {formMsg}
                                    </div>
                                )}
                                {formErr && (
                                    <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm">{formErr}</div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Field icon="mail" label="Alamat Email">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="staff@bsi.id"
                                            required
                                            maxLength={150}
                                            disabled={submitting}
                                            className={inputCls}
                                        />
                                    </Field>

                                    <Field icon="lock" label="Password">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Minimal 8 karakter"
                                            required
                                            minLength={8}
                                            maxLength={72}
                                            disabled={submitting}
                                            className={`${inputCls} pr-12`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showPassword ? "visibility_off" : "visibility"}
                                            </span>
                                        </button>
                                    </Field>

                                    <Field icon="shield_person" label="Peran (Role)">
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value as Role)}
                                            disabled={submitting}
                                            className={`${inputCls} appearance-none`}
                                        >
                                            <option value="ADMIN">Administrator</option>
                                            <option value="USER">User Biasa</option>
                                        </select>
                                    </Field>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-3 bg-primary text-on-primary font-bold rounded-lg uppercase tracking-wide hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                                Membuat...
                                            </>
                                        ) : (
                                            "Buat Akun"
                                        )}
                                    </button>
                                </form>
                            </div>

                            <div className="mt-4 p-4 bg-tertiary-container/10 border border-tertiary-container/20 rounded-xl flex gap-3">
                                <span className="material-symbols-outlined text-tertiary mt-0.5 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                                <p className="text-xs text-on-surface-variant">
                                    Endpoint backend untuk daftar staf belum tersedia. Akun yang dibuat dalam sesi ini akan ditampilkan sementara di samping, namun tidak dimuat ulang setelah refresh.
                                </p>
                            </div>
                        </div>

                        {/* Recently created */}
                        <div className="lg:col-span-7">
                            <div className="glass-card border border-outline-variant rounded-xl overflow-hidden h-full">
                                <div className="p-6 border-b border-outline-variant flex items-center justify-between">
                                    <h4 className="font-outfit text-xl font-semibold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-secondary">groups_2</span>
                                        Akun Baru (Sesi Ini)
                                    </h4>
                                    <span className="text-sm text-on-surface-variant">{created.length} akun</span>
                                </div>

                                {created.length === 0 ? (
                                    <div className="py-20 text-center text-on-surface-variant">
                                        <span className="material-symbols-outlined text-5xl mb-3 block">person_add</span>
                                        <p className="text-sm">Belum ada akun yang dibuat pada sesi ini.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-surface-container-low border-b border-outline-variant">
                                                <tr>
                                                    {["Email", "Peran", "Dibuat"].map((h) => (
                                                        <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant/30">
                                                {created.map((u) => (
                                                    <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                                                        <td className="px-6 py-4 text-sm font-semibold">{u.email}</td>
                                                        <td className="px-6 py-4"><RolePill role={u.role} /></td>
                                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{u.createdAt ? formatDate(u.createdAt) : "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

const inputCls =
    "w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all bg-surface text-base disabled:opacity-60"

function Field({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-on-surface-variant">{label}</label>
            <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">{icon}</span>
                {children}
            </div>
        </div>
    )
}

function RolePill({ role }: { role: string }) {
    const cfg = role === "ADMIN" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
    return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg}`}><span className="w-1.5 h-1.5 rounded-full bg-current" />{role}</span>
}

function PageSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant" />
            <div className="ml-[280px] pt-16 p-10 space-y-6">
                <div className="h-10 w-72 bg-surface-container rounded-xl" />
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-5 h-96 bg-surface-container rounded-xl" />
                    <div className="col-span-7 h-96 bg-surface-container rounded-xl" />
                </div>
            </div>
        </div>
    )
}
