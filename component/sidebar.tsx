"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { postLogout } from "@/lib/api"

const NAV = [
    { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
    { href: "/transaksi", icon: "receipt_long", label: "Riwayat Mutasi" },
    { href: "/setoran", icon: "add_circle", label: "Setoran" },
    { href: "/penarikan", icon: "payments", label: "Penarikan" },
    { href: "/eligibility", icon: "mosque", label: "Hajj Eligibility" },
    { href: "/settings", icon: "settings", label: "Pengaturan" },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()

    async function logout() {
        const token = localStorage.getItem("token")
        if (token) await postLogout(token).catch(() => {})
        localStorage.removeItem("token")
        router.push("/login")
    }

    return (
        <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant flex flex-col py-6 z-50">
            <div className="px-6 mb-10">
                <h1 className="font-outfit text-2xl font-bold text-primary leading-tight">BSI Hajj Online</h1>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">Institutional Portal</p>
            </div>

            <nav className="flex-1 flex flex-col gap-1">
                {NAV.map(({ href, icon, label }) => {
                    const active = pathname === href
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`relative flex items-center gap-3 px-6 py-4 transition-all duration-200 ${
                                active
                                    ? "bg-primary/5 text-primary"
                                    : "text-on-surface-variant hover:bg-surface-container-high"
                            }`}
                        >
                            {active && (
                                <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-sm" />
                            )}
                            <span className="material-symbols-outlined text-[22px]">{icon}</span>
                            <span className={`text-base ${active ? "font-semibold" : ""}`}>{label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="px-6 mt-auto">
                <Link
                    href="/setoran"
                    className="w-full py-3 bg-secondary-container text-on-secondary-container font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        add_circle
                    </span>
                    New Deposit
                </Link>

                <div className="mt-6 pt-6 border-t border-outline-variant">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 text-on-surface-variant hover:text-error transition-colors"
                    >
                        <span className="material-symbols-outlined text-[22px]">logout</span>
                        <span className="text-base">Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    )
}
