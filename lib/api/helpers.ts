// Public formatting & extraction utilities used across pages.

import type { Me, TabunganSummary } from "./types";

export const SETORAN_MINIMUM = 25_000_000;
export const DEPOSIT_MINIMUM = 100_000;

export function toNumber(val: number | string | null | undefined): number {
  if (val == null) return 0;
  return typeof val === "string" ? parseInt(val, 10) || 0 : val;
}

export function formatRupiah(amount: number | string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(toNumber(amount));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Mask a rekening number, keeping the first and last `visible` digits
 * (default 4) and replacing the middle with `•` characters.
 *
 *   maskNomorRekening("7012345678")           → "7012••5678"
 *   maskNomorRekening("70123456789012", 4)    → "7012••••••9012"
 *
 * Strings short enough that the visible windows overlap are returned as-is.
 */
export function maskNomorRekening(no: string, visible = 4): string {
  if (!no) return "";
  if (no.length <= visible * 2) return no;
  const head = no.slice(0, visible);
  const tail = no.slice(-visible);
  const middle = "•".repeat(no.length - visible * 2);
  return `${head}${middle}${tail}`;
}

/** Extract the first tabungan from a Me object, or null */
export function getTabunganFromMe(me: Me): TabunganSummary | null {
  return me.nasabah?.tabungan?.[0] ?? null;
}
