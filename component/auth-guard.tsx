"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

type Props = {
  /** Where to send unauthenticated visitors. Defaults to `/login`. */
  redirectTo?: string;
  /** Custom placeholder while the guard runs the token check (SSR + first paint). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

// External store hooks for `localStorage.token`. Using useSyncExternalStore
// instead of useState + useEffect avoids hydration mismatches (server has no
// localStorage) and reactively picks up cross-tab logout via the storage event.

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readToken(): string | null {
  return localStorage.getItem("token");
}

function readTokenSsr(): string | null {
  return null;
}

/**
 * Client-side route guard: checks `localStorage.token` on mount and redirects
 * unauthenticated visitors to `/login`. Children render only once the token
 * is confirmed present.
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
  const token = useSyncExternalStore(subscribe, readToken, readTokenSsr);
  const ready = token !== null && token !== "";

  useEffect(() => {
    if (!ready) router.replace(redirectTo);
  }, [ready, router, redirectTo]);

  if (!ready) {
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
