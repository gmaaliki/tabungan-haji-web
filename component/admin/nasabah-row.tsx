"use client";
import Link from "next/link";
import { formatDate, type NasabahRow as NasabahRowData } from "@/lib/api";

type Props = {
  nasabah: NasabahRowData;
  /** When set to this row's id, render the "Hapus / Batal" confirm UI. */
  confirmingId: string | null;
  /** When equal to this row's id, the delete request is in-flight. */
  deletingId: string | null;
  onAskDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
};

/**
 * Presentational row for the admin nasabah table. Stateless — confirm/delete
 * state is owned by the parent so the table can coordinate multiple rows.
 */
export function NasabahRow({
  nasabah: n,
  confirmingId,
  deletingId,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: Props) {
  const isConfirming = confirmingId === n.id;
  const isDeleting = deletingId === n.id;

  return (
    <tr className="hover:bg-surface-container-low transition-colors">
      <td className="px-6 py-4 text-sm font-semibold">{n.nama}</td>
      <td className="px-6 py-4 text-sm font-mono text-outline">{n.nik}</td>
      <td className="px-6 py-4 text-sm">{n.email}</td>
      <td className="px-6 py-4 text-sm">{n.nomorHp}</td>
      <td className="px-6 py-4 text-sm text-on-surface-variant">
        {formatDate(n.createdAt)}
      </td>
      <td className="px-6 py-4 text-right">
        {isConfirming ? (
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => onConfirmDelete(n.id)}
              disabled={isDeleting}
              className="px-3 py-1.5 bg-error text-on-error rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
            >
              {isDeleting && (
                <span className="material-symbols-outlined animate-spin text-[14px]">
                  progress_activity
                </span>
              )}
              Hapus
            </button>
            <button
              onClick={onCancelDelete}
              className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold hover:bg-surface-container"
            >
              Batal
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 justify-end">
            <Link
              href={`/admin/nasabah/${n.id}`}
              className="text-primary hover:bg-primary/10 rounded-lg p-2 transition-colors"
              title="Lihat detail"
            >
              <span className="material-symbols-outlined text-[20px]">
                open_in_new
              </span>
            </Link>
            <button
              onClick={() => onAskDelete(n.id)}
              className="text-error hover:bg-error/10 rounded-lg p-2 transition-colors"
              title="Hapus nasabah"
            >
              <span className="material-symbols-outlined text-[20px]">
                delete
              </span>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
