"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "success";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  // Visiting /login always means "start fresh": clear any stale token left over
  // from a previous session (e.g. after a DB reset that invalidated the JWT's
  // sub), so AuthGuard can't bounce us back into a broken dashboard.
  useEffect(() => {
    try {
      localStorage.removeItem("token");
    } catch {}
  }, []);

  useEffect(() => {
    const createOrb = () => {
      const orb = document.createElement("div");
      const size = Math.random() * 100 + 50;
      Object.assign(orb.style, {
        position: "fixed",
        borderRadius: "9999px",
        background: "rgba(0, 163, 157, 0.1)",
        filter: "blur(40px)",
        pointerEvents: "none",
        width: `${size}px`,
        height: `${size}px`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        zIndex: "0",
        animation: "floatOrb 6s ease-in-out forwards",
      });
      document.body.appendChild(orb);
      setTimeout(() => orb.remove(), 7000);
    };

    const interval = setInterval(createOrb, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    const form = new FormData(e.currentTarget);
    const email = form.get("identifier") as string;
    const password = form.get("password") as string;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Login gagal. Periksa email dan password Anda.");
        setStatus("idle");
        return;
      }

      const token = data.data?.token;
      if (token) {
        localStorage.setItem("token", token);
      }

      // Determine destination by role
      let destination = "/dashboard";
      try {
        const meRes = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const me = await meRes.json();
        if (me.data?.role === "ADMIN") destination = "/admin";
      } catch {
        // fall back to dashboard
      }

      setStatus("success");
      setTimeout(() => {
        window.location.href = destination;
      }, 1000);
    } catch {
      setError("Koneksi gagal. Pastikan server API berjalan.");
      setStatus("idle");
    }
  };

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <div className="font-inter bg-background min-h-screen flex items-center justify-center relative overflow-hidden text-on-surface">
      {/* Background layers */}
      <div className="absolute inset-0 islamic-pattern pointer-events-none" />
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary-container/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-secondary-container/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="relative z-10 w-full max-w-[480px] px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 animate-logo">
          <div className="mb-4">
            <img
              alt="BSI Logo"
              className="h-12 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCWKrc6VabEMu71Zg7aR0kRrMxxX5ehHzPIA7B8B-lgNpwg9rM8qoOafInWyQXZfYc2JZqI09gd7LfaRDioCIo1OqnSD8NYgm_vnF9pqcUm0ZUDjNTlpOCbMdQXEDWbB_3LuN3ocj0TVwebFfBfeOfsHmPwS6VNWGEE7EQhJBRT2KMoX8dkQ9aUDoEKp0Snk09kCvawVZunWmmROs-qu429-8ycJTaq703FyS11vBR4rOjVl0pR70U9bdNgRLWoA5UZ5HvMNSnRhck"
            />
          </div>
          <h1 className="font-outfit text-2xl font-semibold text-primary text-center">
            BSI Hajj Online
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 text-center">
            Institutional Portal for Digital Pilgrimage Management
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-10 rounded-xl border border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.05)] animate-card">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Error banner */}
            {error && (
              <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email / Phone */}
            <div className="space-y-2">
              <label
                className="block text-xs font-semibold tracking-wider uppercase text-on-surface-variant"
                htmlFor="identifier"
              >
                Email or Phone Number
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  person
                </span>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-lg text-base focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-outline-variant"
                  id="identifier"
                  name="identifier"
                  placeholder="example@domain.com"
                  required
                  type="text"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  className="block text-xs font-semibold tracking-wider uppercase text-on-surface-variant"
                  htmlFor="password"
                >
                  Password
                </label>
                <Link
                  className="text-xs font-semibold text-primary hover:underline transition-all"
                  href="#"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  className="w-full pl-10 pr-12 py-3 bg-white border border-outline-variant rounded-lg text-base focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-outline-variant"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors p-1"
                  onClick={() => setShowPassword((v) => !v)}
                  type="button"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-3 py-2">
              <input
                className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary/20 transition-all cursor-pointer"
                id="remember"
                name="remember"
                type="checkbox"
              />
              <label
                className="text-sm text-on-surface-variant cursor-pointer select-none"
                htmlFor="remember"
              >
                Keep me logged in on this device
              </label>
            </div>

            {/* Submit */}
            <button
              className={`w-full py-4 text-white text-lg font-semibold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 ${
                isSuccess ? "bg-green-600" : "bg-primary-container"
              }`}
              disabled={isLoading || isSuccess}
              type="submit"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">
                    progress_activity
                  </span>
                  Authenticating...
                </>
              ) : isSuccess ? (
                <>
                  <span className="material-symbols-outlined">check_circle</span>
                  Welcome
                </>
              ) : (
                <>
                  <span>Login to Portal</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>

            {/* Register */}
            <div className="pt-4 text-center">
              <p className="text-sm text-on-surface-variant">
                Don&apos;t have an account yet?{" "}
                <Link
                  className="text-primary font-semibold hover:underline decoration-2 underline-offset-4 ml-1 transition-all"
                  href="/register"
                >
                  Register Here
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="mt-6 flex flex-col items-center gap-4 animate-footer">
          <div className="flex items-center gap-6">
            <Link
              className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Privacy Policy
            </Link>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <Link
              className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Terms of Service
            </Link>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <Link
              className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
              href="#"
            >
              Help Center
            </Link>
          </div>
          <p className="text-xs text-outline">
            © 2024 Bank Syariah Indonesia. All Rights Reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
