// P10.5 / P11.1 / P11.2 / P11.5: Tabel tamu interaktif dengan pencarian, filter, absensi manual, undo, dan tambah tamu.
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  LogIn,
  LogOut,
  RotateCcw,
  UserPlus,
  FileDown,
  CheckCircle2,
  Users,
  Clock,
  Radio,
  X,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { EmptyState } from "@/components/ui/EmptyState";

type GuestRow = {
  id: string;
  name: string;
  category: string | null;
  status: "belum_hadir" | "di_dalam" | "sudah_pulang";
  checkedInAtWib: string;
  checkedOutAtWib: string;
};

export function TamuTableClient({ isAdmin }: { isAdmin: boolean }) {
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filter
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modal Undo
  const [undoModal, setUndoModal] = useState<{
    guest: GuestRow;
    type: "in" | "out";
  } | null>(null);
  const [undoReason, setUndoReason] = useState("");
  const [isUndoing, setIsUndoing] = useState(false);

  // Modal Tambah Tamu
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newContact, setNewContact] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Pesan feedback
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(
    null
  );

  const fetchGuests = useCallback(async () => {
    setIsLoading(true);
    try {
      const sp = new URLSearchParams();
      if (query.trim()) sp.set("q", query.trim());
      if (statusFilter) sp.set("status", statusFilter);
      if (categoryFilter) sp.set("category", categoryFilter);
      sp.set("page", String(page));
      sp.set("limit", "50");

      const res = await fetch(`/api/panitia/tamu-list?${sp.toString()}`);
      if (res.ok) {
        const d = await res.json();
        if (d.ok) {
          setGuests(d.guests || []);
          setTotalCount(d.total || 0);
          setTotalPages(d.totalPages || 1);
          setCategories(d.categories || []);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [query, statusFilter, categoryFilter, page]);

  // Shortcut keyboard: tombol '/' atau 'Ctrl+K' langsung memfokuskan pencarian
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.key === "/" || (e.ctrlKey && e.key === "k")) && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        document.getElementById("tamu-search-input")?.focus();
      }
    }
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchGuests();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchGuests]);

  // Absensi manual (P11.1)
  async function handleManualAttendance(guest: GuestRow, type: "in" | "out") {
    const actionLabel = type === "in" ? "MASUK" : "PULANG";
    if (!window.confirm(`Catat absensi ${actionLabel} secara manual untuk ${guest.name}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/panitia/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_id: guest.id, type }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedback({ kind: "success", text: `Absensi ${actionLabel} untuk ${guest.name} berhasil dicatat.` });
        void fetchGuests();
      } else {
        setFeedback({ kind: "error", text: data.message || "Gagal mencatat absensi manual." });
      }
    } catch {
      setFeedback({ kind: "error", text: "Terjadi kesalahan jaringan." });
    }
  }

  // Batalkan absensi (P11.2)
  async function handleConfirmUndo() {
    if (!undoModal || !undoReason.trim()) return;

    setIsUndoing(true);
    try {
      const res = await fetch("/api/panitia/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: undoModal.guest.id,
          type: undoModal.type,
          reason: undoReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedback({
          kind: "success",
          text: `Absensi ${undoModal.type === "in" ? "masuk" : "pulang"} untuk ${undoModal.guest.name} telah dibatalkan.`,
        });
        setUndoModal(null);
        setUndoReason("");
        void fetchGuests();
      } else {
        setFeedback({ kind: "error", text: data.message || "Gagal membatalkan absensi." });
      }
    } finally {
      setIsUndoing(false);
    }
  }

  // Tambah tamu on-the-spot (P11.5)
  async function handleAddGuest() {
    if (!newName.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch("/api/panitia/tambah-tamu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newName.trim(),
          category: newCategory.trim() || null,
          contact: newContact.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedback({ kind: "success", text: `Tamu "${newName}" berhasil ditambahkan.` });
        setShowAddModal(false);
        setNewName("");
        setNewCategory("");
        setNewContact("");
        void fetchGuests();
      } else {
        setFeedback({ kind: "error", text: data.message || "Gagal menambahkan tamu." });
      }
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner Feedback */}
      {feedback ? (
        <div className="relative">
          <StatusBanner kind={feedback.kind}>
            <div className="flex items-center justify-between pr-4">
              <span>{feedback.text}</span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-xs font-bold underline"
              >
                Tutup
              </button>
            </div>
          </StatusBanner>
        </div>
      ) : null}

      {/* Header & Aksi Atas */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Daftar Tamu & Kehadiran</h1>
          <p className="text-sm text-ink-muted">
            Total {totalCount} tamu terdaftar dalam sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Button onClick={() => setShowAddModal(true)} className="h-10 text-xs font-semibold">
              <UserPlus className="size-4" />
              Tambah Tamu
            </Button>
          ) : null}

          <a
            href="/api/export"
            download
            className="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-2 text-xs font-semibold text-brand-blue hover:bg-surface-soft"
          >
            <FileDown className="size-4" />
            Ekspor CSV
          </a>
        </div>
      </div>

      {/* Baris Filter & Pencarian */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-56 flex-1">
          <Input
            id="tamu-search-input"
            placeholder="Cari nama tamu... (Tekan / untuk fokus)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="h-10 pr-9 text-sm"
          />
          <Search className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-ink-muted" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="min-h-10 rounded-control border border-line bg-surface px-3 text-xs font-semibold text-ink focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="belum_hadir">Belum Hadir</option>
            <option value="di_dalam">Di Dalam</option>
            <option value="sudah_pulang">Sudah Pulang</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="min-h-10 rounded-control border border-line bg-surface px-3 text-xs font-semibold text-ink focus:outline-none"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {(query || statusFilter || categoryFilter) ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("");
                setCategoryFilter("");
                setPage(1);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
            >
              Reset Filter
            </button>
          ) : null}
        </div>
      </Card>

      {/* Tabel Tamu Responsif (P10.5) */}
      <Card className="overflow-x-auto p-0 shadow-sm">
        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-xs font-bold uppercase tracking-wider text-ink-muted">
              <th className="px-4 py-3">Nama Tamu</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Jam Masuk</th>
              <th className="px-4 py-3">Jam Pulang</th>
              <th className="px-4 py-3 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-ink-muted">
                  <Loader2 className="mx-auto size-6 animate-spin text-brand-blue" />
                  <p className="mt-2 text-xs font-semibold">Memuat data tamu...</p>
                </td>
              </tr>
            ) : guests.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <EmptyState icon={Users} title="Tamu tidak ditemukan">
                    Tidak ada data tamu yang cocok dengan filter pencarian saat ini.
                  </EmptyState>
                </td>
              </tr>
            ) : (
              guests.map((g) => {
                return (
                  <tr key={g.id} className="hover:bg-surface-soft/60">
                    <td className="px-4 py-3 font-semibold text-ink">{g.name}</td>
                    <td className="px-4 py-3 text-xs text-ink-muted">{g.category || "-"}</td>
                    <td className="px-4 py-3">
                      {g.status === "belum_hadir" ? (
                        <Badge tone="neutral" icon={Clock}>
                          Belum Hadir
                        </Badge>
                      ) : g.status === "di_dalam" ? (
                        <Badge tone="success" icon={Radio}>
                          Di Dalam
                        </Badge>
                      ) : (
                        <Badge tone="info" icon={CheckCircle2}>
                          Sudah Pulang
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink">{g.checkedInAtWib}</td>
                    <td className="px-4 py-3 tabular-nums text-ink">{g.checkedOutAtWib}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {g.status === "belum_hadir" ? (
                          <button
                            type="button"
                            onClick={() => handleManualAttendance(g, "in")}
                            className="inline-flex items-center gap-1 rounded-control bg-brand-blue px-2.5 py-1 text-xs font-bold text-white hover:brightness-95"
                            title="Absen masuk manual"
                          >
                            <LogIn className="size-3" />
                            Masuk
                          </button>
                        ) : null}

                        {g.status === "di_dalam" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleManualAttendance(g, "out")}
                              className="inline-flex items-center gap-1 rounded-control bg-brand-purple px-2.5 py-1 text-xs font-bold text-white hover:brightness-95"
                              title="Absen pulang manual"
                            >
                              <LogOut className="size-3" />
                              Pulang
                            </button>
                            <button
                              type="button"
                              onClick={() => setUndoModal({ guest: g, type: "in" })}
                              className="inline-flex items-center gap-1 rounded-control border border-error px-2 py-1 text-xs font-semibold text-error hover:bg-error/10"
                              title="Batalkan absen masuk"
                            >
                              <RotateCcw className="size-3" />
                              Batal
                            </button>
                          </>
                        ) : null}

                        {g.status === "sudah_pulang" ? (
                          <button
                            type="button"
                            onClick={() => setUndoModal({ guest: g, type: "out" })}
                            className="inline-flex items-center gap-1 rounded-control border border-error px-2 py-1 text-xs font-semibold text-error hover:bg-error/10"
                            title="Batalkan absen pulang"
                          >
                            <RotateCcw className="size-3" />
                            Batal Pulang
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-control border border-line bg-surface px-2.5 py-1 font-semibold text-ink disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-control border border-line bg-surface px-2.5 py-1 font-semibold text-ink disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      ) : null}

      {/* Modal Batalkan Absen (P11.2) */}
      {undoModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <Card className="flex w-full max-w-md flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-sm font-bold text-ink">Batalkan Absensi</span>
              <button
                type="button"
                onClick={() => setUndoModal(null)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-sm text-ink-muted">
              Batalkan catatan absen {undoModal.type === "in" ? "MASUK" : "PULANG"} untuk{" "}
              <strong className="text-ink">{undoModal.guest.name}</strong>? Tindakan ini akan dicatat
              di log audit panitia.
            </p>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="undo-reason" className="text-xs font-bold text-ink">
                Alasan Pembatalan (Wajib)
              </label>
              <Input
                id="undo-reason"
                placeholder="Contoh: Salah klik oleh panitia / tamu salah nama"
                value={undoReason}
                onChange={(e) => setUndoReason(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setUndoModal(null)} className="h-10 text-xs">
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmUndo}
                disabled={!undoReason.trim() || isUndoing}
                className="h-10 text-xs"
              >
                {isUndoing ? "Memproses..." : "Ya, Batalkan Absen"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Modal Tambah Tamu On-The-Spot (P11.5) */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <Card className="flex w-full max-w-md flex-col gap-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-sm font-bold text-ink">Tambah Tamu On-the-Spot</span>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="guest-name" className="text-xs font-bold text-ink">
                  Nama Lengkap (Wajib)
                </label>
                <Input
                  id="guest-name"
                  placeholder="Nama tamu..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="guest-cat" className="text-xs font-bold text-ink">
                  Kategori / Divisi
                </label>
                <Input
                  id="guest-cat"
                  placeholder="Contoh: Tamu Undangan / VIP"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="guest-contact" className="text-xs font-bold text-ink">
                  Kontak (Opsional)
                </label>
                <Input
                  id="guest-contact"
                  placeholder="0812xxxxxxxx"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                className="h-10 text-xs"
              >
                Batal
              </Button>
              <Button
                onClick={handleAddGuest}
                disabled={!newName.trim() || isAdding}
                className="h-10 text-xs"
              >
                {isAdding ? "Menyimpan..." : "Simpan Tamu"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
