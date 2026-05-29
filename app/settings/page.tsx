"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/component/sidebar"
import { TopNav } from "@/component/topnav"
import {
    getMe,
    updateNasabah,
    bukaRekening,
    formatRupiah,
    formatDate,
    toNumber,
    getTabunganFromMe,
    type Me,
    type TabunganSummary,
} from "@/lib/api"

type PageState = "loading" | "ready" | "error"

export default function SettingsPage() {
    const router = useRouter()
    const [me, setMe] = useState<Me | null>(null)
    const [tabungan, setTabungan] = useState<TabunganSummary | null>(null)
    const [pageState, setPageState] = useState<PageState>("loading")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)

    const [nama, setNama] = useState("")
    const [email, setEmail] = useState("")
    const [nomorHp, setNomorHp] = useState("")
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [saveOk, setSaveOk] = useState(false)
    const [opening, setOpening] = useState(false)

    function load() {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        getMe(token)
            .then((profile) => {
                setMe(profile)
                setTabungan(getTabunganFromMe(profile))
                if (profile.nasabah) {
                    setNama(profile.nasabah.nama)
                    setEmail(profile.nasabah.email)
                    setNomorHp(profile.nasabah.nomorHp)
                }
                setPageState("ready")
            })
            .catch((err) => {
                if (err.status === 401) { localStorage.removeItem("token"); router.replace("/login") }
                else { setErrorMsg(err.message); setPageState("error") }
            })
    }

    useEffect(load, [router])

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        if (!me?.nasabah) return
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        setSaving(true); setSaveError(null); setSaveOk(false)
        try {
            await updateNasabah(token, me.nasabah.id, { nama, email, nomorHp })
            setSaveOk(true)
            setTimeout(() => setSaveOk(false), 3000)
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : "Gagal menyimpan")
        } finally {
            setSaving(false)
        }
    }

    async function handleBukaRekening() {
        const token = localStorage.getItem("token")
        if (!token) { router.replace("/login"); return }
        setOpening(true)
        try {
            await bukaRekening(token)
            load()
        } catch (err: unknown) {
            setSaveError(err instanceof Error ? err.message : "Gagal membuka rekening")
        } finally {
            setOpening(false)
        }
    }

    if (pageState === "loading") return <PageSkeleton />
    if (pageState === "error") return <div className="flex items-center justify-center min-h-screen text-error">{errorMsg}</div>
    if (!me) return null

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <TopNav userName={me.nasabah?.nama ?? me.email} />
            <main className="ml-[280px] pt-16 min-h-screen">
                <div className="p-10 max-w-[1440px] mx-auto">

                    <header className="mb-10">
                        <h2 className="font-outfit text-3xl font-bold text-on-background">Pengaturan Akun</h2>
                        <p className="text-base text-on-surface-variant mt-1">Kelola data profil dan rekening tabungan haji Anda.</p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Profile form */}
                        <div className="lg:col-span-7 glass-card border border-outline-variant rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-outline-variant bg-surface-container-low">
                                <h4 className="font-outfit text-xl font-semibold">Data Profil</h4>
                            </div>
                            {me.nasabah ? (
                                <form onSubmit={handleSave} className="p-8 space-y-5">
                                    <Field label="NIK">
                                        <input value={me.nasabah.nik} readOnly className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-lg text-base font-mono text-on-surface-variant cursor-not-allowed" />
                                    </Field>
                                    <Field label="Nama Lengkap">
                                        <input value={nama} onChange={(e) => setNama(e.target.value)} required className={inputCls} />
                                    </Field>
                                    <Field label="Email">
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
                                    </Field>
                                    <Field label="Nomor Handphone">
                                        <input type="tel" value={nomorHp} onChange={(e) => setNomorHp(e.target.value)} required pattern="08[0-9]{8,11}" title="Format: 08xxxxxxxxxx" className={inputCls} />
                                    </Field>

                                    {saveError && <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm">{saveError}</div>}
                                    {saveOk && (
                                        <div className="p-3 bg-primary/10 text-primary rounded-lg text-sm flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                            Profil berhasil diperbarui
                                        </div>
                                    )}

                                    <button type="submit" disabled={saving} className="px-6 py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2">
                                        {saving && <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>}
                                        Simpan Perubahan
                                    </button>
                                </form>
                            ) : (
                                <div className="p-8 text-center text-on-surface-variant">
                                    <p>Akun ini tidak memiliki profil nasabah.</p>
                                </div>
                            )}
                        </div>

                        {/* Account card */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="glass-card border border-outline-variant rounded-xl p-8">
                                <h4 className="font-outfit text-xl font-semibold mb-6">Rekening Tabungan Haji</h4>
                                {tabungan ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30">
                                            <span className="text-sm text-on-surface-variant">Nomor Rekening</span>
                                            <span className="text-base font-mono font-semibold">{tabungan.nomorRekening}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30">
                                            <span className="text-sm text-on-surface-variant">Saldo</span>
                                            <span className="text-base font-bold text-primary">{formatRupiah(toNumber(tabungan.saldo))}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30">
                                            <span className="text-sm text-on-surface-variant">Status</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tabungan.status === "AKTIF" ? "bg-primary/10 text-primary" : tabungan.status === "DORMANT" ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"}`}>{tabungan.status}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-on-surface-variant">Dibuka</span>
                                            <span className="text-base font-semibold">{formatDate(tabungan.dibukaAt)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <span className="material-symbols-outlined text-4xl text-primary mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                                        <p className="text-sm text-on-surface-variant mb-5">Anda belum memiliki rekening tabungan haji.</p>
                                        <button onClick={handleBukaRekening} disabled={opening} className="w-full py-3 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                            {opening && <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>}
                                            Buka Rekening Sekarang
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="glass-card border border-outline-variant rounded-xl p-8">
                                <h4 className="font-outfit text-base font-semibold mb-4 text-on-surface-variant uppercase tracking-wider">Info Akun</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-on-surface-variant">Email Login</span>
                                        <span className="text-sm font-semibold">{me.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-on-surface-variant">Role</span>
                                        <span className="text-sm font-semibold">{me.role}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

const inputCls = "w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-base focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-on-surface-variant">{label}</label>
            {children}
        </div>
    )
}

function PageSkeleton() {
    return (
        <div className="min-h-screen bg-background animate-pulse">
            <div className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant" />
            <div className="ml-[280px] pt-16 p-10 space-y-8">
                <div className="h-10 w-72 bg-surface-container rounded-xl" />
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-7 h-96 bg-surface-container rounded-xl" />
                    <div className="col-span-5 h-96 bg-surface-container rounded-xl" />
                </div>
            </div>
        </div>
    )
}
