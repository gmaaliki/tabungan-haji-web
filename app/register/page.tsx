"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { postRegister } from "@/lib/api"

type Status = "idle" | "loading" | "success"

const FEATURES = [
    { icon: "verified_user", color: "bg-primary/10 text-primary", title: "Terdaftar OJK", desc: "Keamanan Dana Terjamin" },
    { icon: "speed", color: "bg-secondary/10 text-secondary", title: "Proses Cepat", desc: "Kurang dari 5 Menit" },
    { icon: "lock", color: "bg-primary/10 text-primary", title: "Prinsip Syariah", desc: "Sesuai Ketentuan MUI" },
    { icon: "mosque", color: "bg-secondary/10 text-secondary", title: "Estimasi Haji", desc: "Pantau Jadwal Keberangkatan" },
]

export default function RegisterPage() {
    const router = useRouter()
    const [status, setStatus] = useState<Status>("idle")
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setStatus("loading")

        const form = new FormData(e.currentTarget)
        try {
            await postRegister({
                nik: form.get("nik") as string,
                nama: form.get("nama") as string,
                email: form.get("email") as string,
                nomorHp: form.get("nomorHp") as string,
                password: form.get("password") as string,
            })
            setStatus("success")
            setTimeout(() => router.push("/login?registered=1"), 1500)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Pendaftaran gagal"
            setError(msg)
            setStatus("idle")
        }
    }

    const isLoading = status === "loading"
    const isSuccess = status === "success"

    return (
        <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden">
            {/* subtle background pattern */}
            <div className="absolute inset-0 islamic-pattern pointer-events-none opacity-50" />

            {/* Top bar */}
            <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-outline-variant bg-surface/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                    <span className="font-outfit text-xl font-bold text-primary">BSI Hajj Online</span>
                </div>
                <Link href="/login" className="text-sm font-semibold text-primary hover:underline">
                    Sudah punya akun? Login
                </Link>
            </header>

            {/* Main content */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-5xl grid md:grid-cols-12 gap-12 items-center">

                    {/* Left branding */}
                    <div className="hidden md:flex md:col-span-6 flex-col gap-6">
                        <div>
                            <span className="inline-flex items-center px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold mb-4">
                                Pendaftaran Online 2026
                            </span>
                            <h1 className="font-outfit text-4xl font-bold text-primary leading-tight">
                                Wujudkan Niat Suci <br />
                                <span className="text-secondary">Ke Tanah Suci</span>
                            </h1>
                            <p className="text-lg text-on-surface-variant mt-4 max-w-md">
                                Buka tabungan Haji mabrur dengan proses digital yang aman, transparan, dan sesuai prinsip syariah.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-2">
                            {FEATURES.map((f) => (
                                <div key={f.title} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${f.color}`}>
                                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                            {f.icon}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{f.title}</p>
                                        <p className="text-xs text-on-surface-variant">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right form card */}
                    <div className="col-span-12 md:col-span-6">
                        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm relative overflow-hidden">
                            {/* gold accent bar */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-secondary" />

                            <div className="p-8">
                                <div className="mb-6">
                                    <h2 className="font-outfit text-2xl font-semibold text-on-surface">Buat Akun Baru</h2>
                                    <p className="text-sm text-on-surface-variant mt-1">Lengkapi data diri untuk pendaftaran haji</p>
                                </div>

                                {isSuccess && (
                                    <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3 text-primary">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                        <p className="text-sm font-semibold">Pendaftaran berhasil! Mengarahkan ke halaman login...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <form className="space-y-4" onSubmit={handleSubmit}>
                                    {/* NIK */}
                                    <Field icon="badge" label="Nomor Induk Kependudukan (NIK)">
                                        <input
                                            name="nik"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={16}
                                            placeholder="16 digit NIK sesuai KTP"
                                            required
                                            pattern="\d{16}"
                                            title="NIK harus 16 digit angka"
                                            onInput={(e) => {
                                                const t = e.currentTarget
                                                t.value = t.value.replace(/\D/g, "")
                                            }}
                                            className={inputCls}
                                            disabled={isLoading || isSuccess}
                                        />
                                    </Field>

                                    {/* Nama */}
                                    <Field icon="person" label="Nama Lengkap">
                                        <input
                                            name="nama"
                                            type="text"
                                            placeholder="Nama lengkap sesuai KTP"
                                            required
                                            className={inputCls}
                                            disabled={isLoading || isSuccess}
                                        />
                                    </Field>

                                    {/* Email */}
                                    <Field icon="mail" label="Alamat Email">
                                        <input
                                            name="email"
                                            type="email"
                                            placeholder="contoh@email.com"
                                            required
                                            className={inputCls}
                                            disabled={isLoading || isSuccess}
                                        />
                                    </Field>

                                    {/* Nomor HP */}
                                    <Field icon="call" label="Nomor Handphone">
                                        <input
                                            name="nomorHp"
                                            type="tel"
                                            placeholder="08xxxxxxxxxx"
                                            required
                                            pattern="08[0-9]{8,11}"
                                            title="Format: 08xxxxxxxxxx (10–13 digit)"
                                            className={inputCls}
                                            disabled={isLoading || isSuccess}
                                        />
                                    </Field>

                                    {/* Password */}
                                    <Field icon="lock" label="Password">
                                        <input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Minimal 8 karakter"
                                            required
                                            minLength={8}
                                            maxLength={72}
                                            className={`${inputCls} pr-12`}
                                            disabled={isLoading || isSuccess}
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

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isLoading || isSuccess}
                                            className="w-full py-4 bg-primary text-on-primary font-bold rounded-lg uppercase tracking-wide hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                                                    Mendaftarkan...
                                                </>
                                            ) : isSuccess ? (
                                                <>
                                                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                    Berhasil!
                                                </>
                                            ) : (
                                                "Daftar Sekarang"
                                            )}
                                        </button>
                                    </div>
                                </form>

                                <div className="mt-6 pt-5 border-t border-outline-variant text-center">
                                    <p className="text-sm text-on-surface-variant">
                                        Sudah memiliki akun?{" "}
                                        <Link href="/login" className="text-primary font-bold hover:underline">
                                            Login di sini
                                        </Link>
                                    </p>
                                </div>
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
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">
                    {icon}
                </span>
                {children}
            </div>
        </div>
    )
}
