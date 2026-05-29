"use client"

type TopNavProps = {
    userName: string
    userRole?: string
}

export function TopNav({ userName, userRole = "Nasabah" }: TopNavProps) {
    const initials = userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()

    return (
        <header className="fixed top-0 right-0 z-40 flex justify-between items-center h-16 px-6 ml-[280px] w-[calc(100%-280px)] bg-surface/80 backdrop-blur-md border-b border-outline-variant">
            <div className="flex items-center flex-1 max-w-md">
                <div className="relative w-full">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                        search
                    </span>
                    <input
                        className="w-full bg-surface-container-low border border-outline-variant rounded-full py-1.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-outline"
                        placeholder="Search transactions or info..."
                        type="text"
                        readOnly
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button className="relative text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-surface" />
                </button>
                <button className="text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">help</span>
                </button>

                <div className="h-8 w-px bg-outline-variant" />

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-semibold leading-tight text-on-surface">{userName}</p>
                        <p className="text-xs text-on-surface-variant">{userRole}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center text-primary font-bold text-sm select-none">
                        {initials}
                    </div>
                </div>
            </div>
        </header>
    )
}
