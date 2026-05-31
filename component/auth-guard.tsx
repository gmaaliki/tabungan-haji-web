"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  /** Where to send unauthenticated visitors. Defaults to `/login`. */
  redirectTo?: string;
  /** Custom placeholder while the guard runs the token check (SSR + first paint). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

type Status = "checking" | "authed" | "unauthed";

/**
 * Client-side route guard: checks `localStorage.token` on mount and redirects
 * unauthenticated visitors to `/login`. Children render only once the token
 * is confirmed present.
 *
 * The setState-in-effect pattern below is intentional: we cannot read
 * localStorage during render (SSR has no `window`), so the check must run
 * after mount. The first render unconditionally returns the fallback, so
 * there is never a hydration flash and no redirect fires before the real
 * client-side check completes.
 *
 * Pair with the `api` object in `lib/api/client.ts` — that wrapper does
 * server-side 401 detection and auto-redirects when the token is expired.
 */
export function AuthGuard({
  redirectTo = "/login",
  fallback,
  children,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace(redirectTo);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("unauthed");
      return;
    }
    setStatus("authed");
  }, [router, redirectTo]);

  if (status !== "authed") {
    return (
      fallback ?? (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <span className="material-symbols-outlined animate-spin text-primary text-3xl">
            progress_activity
          </span>
        </div>
      )
    );
  }

  return <>{children}</>;
}
