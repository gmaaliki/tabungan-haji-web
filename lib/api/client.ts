// Internal HTTP layer used by the rest of lib/api/.
// Exposes:
//   - API_URL, HEALTH_URL — base URLs
//   - ApiError              — typed error with status/code/details/message
//   - api.{get,post,put,patch,del} — central fetch wrapper that auto-attaches
//     the bearer token from localStorage, parses JSON safely (handles 204),
//     extracts ValidationDetails, and redirects to /login on 401.
//   - readJson(res)         — 204-safe JSON parse helper
//   - authHeaders, apiError, fetchCsv, periodeQuery — retained for the
//     existing per-domain modules (auth/nasabah/tabungan/transaksi/laporan).
//     New code should prefer `api.*` instead.

import type { ValidationDetails } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export const HEALTH_URL = API_URL.replace("/api/v1", "/health");

// ─── ApiError ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: ValidationDetails;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: ValidationDetails
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** True when the backend returned a per-field validation error (zod flatten). */
  hasFieldErrors(): boolean {
    return !!this.details?.fieldErrors &&
      Object.keys(this.details.fieldErrors).length > 0;
  }

  /** Get all messages for a specific field, or empty array. */
  fieldError(name: string): string[] {
    return this.details?.fieldErrors?.[name] ?? [];
  }
}

// ─── 401 handling ────────────────────────────────────────────────────────────

/** When unauthorized, clear token and bounce to /login — unless we're already there. */
function handleUnauthorized() {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return;
  try {
    localStorage.removeItem("token");
  } catch {}
  window.location.replace("/login");
}

// ─── Body parsing ────────────────────────────────────────────────────────────

/**
 * Read a response body that may be JSON, empty, or non-JSON. Returns `null` on
 * 204 / Content-Length: 0 / empty / unparseable. Typed as `any` because the
 * shape varies per endpoint; callers do their own narrowing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readJson(res: Response): Promise<any> {
  if (res.status === 204) return null;
  if (res.headers.get("content-length") === "0") return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ─── Headers / errors (legacy helpers, still used by per-domain modules) ─────

export function authHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Build an ApiError from a parsed error body. Also triggers 401 redirect.
 * Recognised body shape: `{ error, message, details }` where `details` is the
 * zod `.flatten()` output.
 */
export function apiError(
  json: Record<string, unknown> | null | undefined,
  fallback: string,
  status: number
): ApiError {
  if (status === 401) handleUnauthorized();
  const message =
    (json?.message as string | undefined) ??
    (json?.error as string | undefined) ??
    fallback;
  const code = json?.error as string | undefined;
  const details = json?.details as ValidationDetails | undefined;
  return new ApiError(message, status, code, details);
}

// ─── CSV helper (binary, no JSON parsing) ────────────────────────────────────

export async function fetchCsv(url: string, token: string): Promise<Blob> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const json = (await readJson(res)) as Record<string, unknown> | null;
    throw apiError(json, "Gagal mengunduh laporan", res.status);
  }
  return res.blob();
}

export function periodeQuery(params: { tahun?: number; bulan?: number }) {
  const q = new URLSearchParams();
  if (params.tahun) q.set("tahun", String(params.tahun));
  if (params.bulan) q.set("bulan", String(params.bulan));
  return q.toString();
}

// ─── Central api object (new code should prefer this) ────────────────────────

type RequestOptions = {
  /** Extra headers; merged after the auth header so callers can override. */
  headers?: Record<string, string>;
  /** Fallback error message when the backend omits one. */
  fallback?: string;
  /** If true, do not attach the bearer token. Use for public endpoints. */
  skipAuth?: boolean;
};

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {}
): Promise<T> {
  const url = path.startsWith("http")
    ? path
    : `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (!opts.skipAuth) {
    const token = readToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  Object.assign(headers, opts.headers ?? {});

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await readJson(res);
  if (!res.ok) {
    throw apiError(
      json as Record<string, unknown> | null,
      opts.fallback ?? "Permintaan gagal",
      res.status
    );
  }
  // 204 / empty body → `null`. Caller's `T` must allow it (or be `void`).
  return json as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", path, body, opts),
  del: <T = void>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, undefined, opts),
};
