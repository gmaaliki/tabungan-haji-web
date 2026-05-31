"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { postLogout } from "@/lib/api"

const NAV = [
    { href: "/admin", icon: "dashboard", label: "Overview" },
    { href: "/admin/nasabah", icon: "groups", label: "Data Nasabah" },
    { href: "/admin/rekening", icon: "account_balance", label: "Rekening Haji" },
    { href: "/admin/laporan", icon: "description", label: "Laporan" },
    { href: "/admin/staff", icon: "shield_person", label: "Akun Staf" },
]

export function AdminSidebar() {
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
                <h1 className="font-outfit text-2xl font-bold text-primary leading-tight">BSI Hajj Admin</h1>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">Management Panel</p>
            </div>

            <nav className="flex-1 flex flex-col gap-1">
                {NAV.map(({ href, icon, label }) => {
                    const active = href === "/admin" ? pathname === href : pathname.startsWith(href)
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`relative flex items-center gap-3 px-6 py-4 transition-all duration-200 ${
                                active ? "bg-primary/5 text-primary" : "text-on-surface-variant hover:bg-surface-container-high"
                            }`}
                        >
                            {active && <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-sm" />}
                            <span className="material-symbols-outlined text-[22px]">{icon}</span>
                            <span className={`text-base ${active ? "font-semibold" : ""}`}>{label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="px-6 mt-auto">
                <div className="pt-6 border-t border-outline-variant">
                    <button onClick={logout} className="flex items-center gap-3 text-on-surface-variant hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[22px]">logout</span>
                        <span className="text-base">Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    )
}
