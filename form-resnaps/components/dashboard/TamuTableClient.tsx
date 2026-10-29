// P10.5 / P11.1 / P11.2 / P11.5 / P17: Tabel tamu berkecepatan tinggi (0ms pencarian & filter lokal)
// dengan filter HTM, persetujuan Hold, status Voucher, absensi manual, recovery HP, dan Input Tamu OTS.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Wallet,
  AlertTriangle,
  Utensils,
  Camera,
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
  allergies: string | null;
  status: "belum_hadir" | "ditahan" | "di_dalam" | "sudah_pulang";
  paymentStatus: "lunas" | "belum_lunas";
  isOts?: boolean;
  mealEligible?: boolean;
  isTamuRole?: boolean;
  holdAtWib: string;
  voucherCode: string;
  mealRedeemedAt: string | null;
  mealRedeemedAtWib: string;
  photoboothRedeemedAt: string | null;
  photoboothRedeemedAtWib: string;
  checkedInAtWib: string;
  checkedOutAtWib: string;
};

type TamuMealQuota = {
  maxSlots: number;
  usedSlots: number;
  remainingSlots: number;
  totalTamuCount: number;
  canAddOtsMeal: boolean;
};

// Cache memori sisi klien agar perpindahan kembali ke tab Daftar Tamu langsung tampil 0ms
let cachedAllGuests: GuestRow[] | null = null;
let cachedCategories: string[] = [];
let cachedTamuMealQuota: TamuMealQuota = {
  maxSlots: 50,
  usedSlots: 0,
  remainingSlots: 50,
  totalTamuCount: 0,
  canAddOtsMeal: true,
};

const PAGE_SIZE = 50;

export function TamuTableClient({ isAdmin: _isAdmin }: { isAdmin?: boolean }) {
  const [allGuests, setAllGuests] = useState<GuestRow[]>(() => cachedAllGuests ?? []);
  const [categories, setCategories] = useState<string[]>(() => cachedCategories);
  const [tamuMealQuota, setTamuMealQuota] = useState<TamuMealQuota>(() => cachedTamuMealQuota);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(() => cachedAllGuests === null);

  // Filter instan (0ms di memori klien)
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Modal Undo
  const [undoModal, setUndoModal] = useState<{
    guest: GuestRow;
    type: "in" | "out";
  } | null>(null);
  const [undoReason, setUndoReason] = useState("");
  const [isUndoing, setIsUndoing] = useState(false);

  // Modal Input Tamu OTS
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newAllergies, setNewAllergies] = useState("");
  const [newPaymentStatus, setNewPaymentStatus] = useState<"lunas" | "belum_lunas">("lunas");
  const [includeMealOts, setIncludeMealOts] = useState(false);
  const [autoCheckinOts, setAutoCheckinOts] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Pesan feedback
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(
    null,
  );

  // Baca query parameter awal (mis. ?payment=belum_lunas dari Dashboard)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const p = sp.get("payment");
    if (p === "belum_lunas" || p === "lunas") {
      setPaymentFilter(p);
    }
  }, []);

  const fetchGuests = useCallback(async (showSpinner = false) => {
    if (showSpinner && !cachedAllGuests) {
      setIsLoading(true);
    }
    try {
      const res = await fetch("/api/panitia/tamu-list?limit=500");
      if (res.ok) {
        const d = await res.json();
        if (d.ok) {
          const rows: GuestRow[] = d.guests || [];
          const cats: string[] = d.categories || [];
          cachedAllGuests = rows;
          cachedCategories = cats;
          if (d.tamuMealQuota) {
            cachedTamuMealQuota = d.tamuMealQuota;
            setTamuMealQuota(d.tamuMealQuota);
          }
          setAllGuests(rows);
          setCategories(cats);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchGuests(true);
  }, [fetchGuests]);

  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if (
        (e.key === "/" || (e.ctrlKey && e.key === "k")) &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        e.preventDefault();
        document.getElementById("tamu-search-input")?.focus();
      }
    }
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Filter & Pencarian Instan 0ms di Memori Klien
  const filteredGuests = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allGuests.filter((g) => {
      if (statusFilter && g.status !== statusFilter) return false;
      if (paymentFilter && g.paymentStatus !== paymentFilter) return false;
      if (categoryFilter && (g.category || "") !== categoryFilter) return false;
      if (q) {
        const hay = `${g.name} ${g.voucherCode} ${g.category || ""} ${g.allergies || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allGuests, query, statusFilter, paymentFilter, categoryFilter]);

  const totalCount = filteredGuests.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pagedGuests = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredGuests.slice(start, start + PAGE_SIZE);
  }, [filteredGuests, safePage]);

  async function handleHtmAction(
    guest: GuestRow,
    action: "approve_checkin" | "set_payment" | "reset_attendance" | "set_meal_eligible",
    nextStatus?: "lunas" | "belum_lunas",
    nextMealEligible?: boolean,
  ) {
    if (
      action === "reset_attendance" &&
      !window.confirm(
        `Recovery Salah Absen untuk "${guest.name}"?\n\nStatus dikembalikan ke Belum Hadir dan kunci HP dibuka.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/panitia/htm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: guest.id,
          action,
          payment_status: nextStatus,
          meal_eligible: nextMealEligible,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.tamuMealQuota) {
          cachedTamuMealQuota = data.tamuMealQuota;
          setTamuMealQuota(data.tamuMealQuota);
        }
        setFeedback({
          kind: "success",
          text:
            action === "approve_checkin"
              ? `${guest.name} dilunasi & diizinkan masuk.`
              : action === "reset_attendance"
                ? `Recovery berhasil! Kunci HP ${guest.name} telah dibuka.`
                : action === "set_meal_eligible"
                  ? nextMealEligible
                    ? `Tiket Makan ditambahkan untuk ${guest.name} (Sisa slot Tamu Angkatan: ${
                        data.tamuMealQuota?.remainingSlots ?? "-"
                      }/50).`
                    : `Tiket Makan untuk ${guest.name} dicabut (Hanya Tiket Photobooth).`
                  : `Status HTM ${guest.name} diubah ke ${
                      data.guest?.paymentStatus === "lunas" ? "LUNAS" : "BELUM LUNAS"
                    }.`,
        });
        void fetchGuests(false);
      } else {
        setFeedback({ kind: "error", text: data.message || "Gagal memperbarui status." });
      }
    } catch {
      setFeedback({ kind: "error", text: "Terjadi kesalahan jaringan." });
    }
  }

  async function handleManualAttendance(guest: GuestRow, type: "in" | "out") {
    const actionLabel = type === "in" ? "MASUK" : "PULANG";
    if (!window.confirm(`Catat absen ${actionLabel} manual untuk ${guest.name}?`)) {
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
        setFeedback({
          kind: "success",
          text: `Absen ${actionLabel} untuk ${guest.name} tercatat.`,
        });
        void fetchGuests(false);
      } else {
        setFeedback({ kind: "error", text: data.message || "Gagal mencatat absensi." });
      }
    } catch {
      setFeedback({ kind: "error", text: "Terjadi kesalahan jaringan." });
    }
  }

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
          text: `Absen ${
            undoModal.type === "in" ? "masuk" : "pulang"
          } ${undoModal.guest.name} dibatalkan & kunci HP dibuka.`,
        });
        setUndoModal(null);
        setUndoReason("");
        void fetchGuests(false);
      } else {
        setFeedback({ kind: "error", text: data.message || "Gagal membatalkan absensi." });
      }
    } finally {
      setIsUndoing(false);
    }
  }

  // Input Tamu On-The-Spot (OTS)
  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch("/api/panitia/tambah-tamu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newName.trim(),
          category: newCategory.trim() || "OTS · Tamu",
          contact: newContact.trim() || null,
          allergies: newAllergies.trim() || null,
          payment_status: newPaymentStatus,
          include_meal: includeMealOts && tamuMealQuota.canAddOtsMeal,
          auto_checkin: newPaymentStatus === "lunas" && autoCheckinOts,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.tamuMealQuota) {
          cachedTamuMealQuota = data.tamuMealQuota;
          setTamuMealQuota(data.tamuMealQuota);
        }
        const vCode = data.guest?.voucher_code ? ` · Kode: ${data.guest.voucher_code}` : "";
        const mealNote = data.guest?.meal_eligible
          ? " · Dapat Tiket Makan + Photobooth"
          : " · Hanya Tiket Photobooth (Tanpa Makan)";
        const checkinNote = data.guest?.checked_in_at
          ? " & langsung Check-In"
          : " (siap scan QR di gerbang)";
        setFeedback({
          kind: "success",
          text: `Tamu OTS "${newName.trim()}" ditambahkan${checkinNote}${mealNote}${vCode}.`,
        });
        setShowAddModal(false);
        setNewName("");
        setNewCategory("");
        setNewContact("");
        setNewAllergies("");
        setNewPaymentStatus("lunas");
        setIncludeMealOts(false);
        setAutoCheckinOts(true);
        void fetchGuests(false);
      } else {
        setFeedback({ kind: "error", text: data.message || "Gagal menambahkan tamu OTS." });
      }
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Banner Feedback */}
      {feedback ? (
        <StatusBanner kind={feedback.kind}>
          <div className="flex items-center justify-between gap-3">
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="shrink-0 text-xs font-bold underline"
            >
              Tutup
            </button>
          </div>
        </StatusBanner>
      ) : null}

      {/* Header Ringkas, Kuota 50 Slot Makan Tamu Angkatan & Aksi OTS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black text-ink sm:text-2xl">Daftar Tamu & Panitia</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
                tamuMealQuota.canAddOtsMeal
                  ? "bg-brand-orange/15 text-brand-orange ring-1 ring-brand-orange/30"
                  : "bg-error/15 text-error ring-1 ring-error/30"
              }`}
            >
              <Utensils className="size-3.5" />
              Slot Makan Tamu Angkatan: {tamuMealQuota.usedSlots} / {tamuMealQuota.maxSlots} (Sisa{" "}
              {tamuMealQuota.remainingSlots})
            </span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-ink-muted">
            {totalCount} ditampilkan dari {allGuests.length} terdaftar · OTS default hanya Photobooth (bisa ditambah Makan jika slot Tamu &lt; 50)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAddModal(true)}
            className="h-10 rounded-xl px-3.5 text-xs font-black"
          >
            <UserPlus className="size-4" />
            + Input Tamu OTS
          </Button>

          <a
            href="/api/export"
            download
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-bold text-brand-blue hover:bg-surface-soft"
          >
            <FileDown className="size-4" />
            CSV
          </a>
        </div>
      </div>

      {/* Baris Filter & Pencarian Instan (0ms) */}
      <Card className="flex flex-wrap items-center gap-2.5 rounded-2xl p-3.5">
        <div className="relative min-w-52 flex-1">
          <Input
            id="tamu-search-input"
            placeholder="Ketik nama, divisi, atau kode RSNP-XXXX (instan)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl pr-9 text-sm"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
              className="absolute inset-y-0 right-2.5 my-auto flex size-6 items-center justify-center rounded-full text-ink-muted hover:bg-surface-soft hover:text-ink"
              title="Hapus pencarian"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <Search className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-ink-muted" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-line bg-surface px-3 text-xs font-bold text-ink focus:outline-none"
          >
            <option value="">Semua HTM</option>
            <option value="belum_lunas">Belum Lunas</option>
            <option value="lunas">Lunas</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="ditahan">Ditahan (Hold)</option>
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
            className="h-10 max-w-48 truncate rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink focus:outline-none"
          >
            <option value="">Semua Divisi</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {query || statusFilter || paymentFilter || categoryFilter ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("");
                setPaymentFilter("");
                setCategoryFilter("");
                setPage(1);
              }}
              className="px-1.5 text-xs font-bold text-brand-blue hover:underline"
            >
              Reset
            </button>
          ) : null}
        </div>
      </Card>

      {/* Tabel Tamu Bersih (5 Kolom Fokus) */}
      <Card className="overflow-x-auto rounded-2xl p-0 shadow-sm">
        <table className="w-full min-w-[740px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
              <th className="px-4 py-3">Nama & Kode</th>
              <th className="px-4 py-3">Divisi / Kategori</th>
              <th className="px-4 py-3">HTM & Kehadiran</th>
              <th className="px-4 py-3">Voucher</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-ink-muted">
                  <Loader2 className="mx-auto size-6 animate-spin text-brand-blue" />
                </td>
              </tr>
            ) : pagedGuests.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center">
                  <EmptyState icon={Users} title="Data tidak ditemukan">
                    Tidak ada tamu yang cocok dengan filter saat ini.
                  </EmptyState>
                </td>
              </tr>
            ) : (
              pagedGuests.map((g) => {
                const isHeld = g.status === "ditahan";
                const isUnpaid = g.paymentStatus === "belum_lunas";
                return (
                  <tr
                    key={g.id}
                    className={`transition ${
                      isHeld ? "bg-warning/10 hover:bg-warning/15" : "hover:bg-surface-soft/50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-ink">{g.name}</span>
                        <span className="font-mono text-[11px] font-semibold text-brand-purple">
                          {g.voucherCode}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-ink-muted">{g.category || "-"}</span>
                        {g.allergies ? (
                          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-extrabold text-warning">
                            <AlertTriangle className="size-3" />
                            {g.allergies}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            void handleHtmAction(
                              g,
                              "set_payment",
                              isUnpaid ? "lunas" : "belum_lunas",
                            )
                          }
                          title="Klik untuk ubah Lunas / Belum Lunas"
                        >
                          {isUnpaid ? (
                            <Badge tone="warning" icon={Wallet}>
                              Belum Lunas
                            </Badge>
                          ) : (
                            <Badge tone="success" icon={CheckCircle2}>
                              Lunas
                            </Badge>
                          )}
                        </button>

                        {isHeld ? (
                          <Badge tone="warning" icon={AlertTriangle}>
                            Hold ({g.holdAtWib})
                          </Badge>
                        ) : g.status === "belum_hadir" ? (
                          <Badge tone="neutral" icon={Clock}>
                            Belum Hadir
                          </Badge>
                        ) : g.status === "di_dalam" ? (
                          <Badge tone="success" icon={Radio}>
                            Hadir ({g.checkedInAtWib})
                          </Badge>
                        ) : (
                          <Badge tone="info" icon={CheckCircle2}>
                            Pulang ({g.checkedOutAtWib})
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                        {g.mealEligible === false ? (
                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-surface-soft px-2 py-0.5 text-ink-muted line-through">
                              <Utensils className="size-3" />
                              Tanpa Makan
                            </span>
                            <button
                              type="button"
                              disabled={!tamuMealQuota.canAddOtsMeal}
                              onClick={() =>
                                void handleHtmAction(g, "set_meal_eligible", undefined, true)
                              }
                              title={
                                tamuMealQuota.canAddOtsMeal
                                  ? `Beri Tiket Makan (Sisa ${tamuMealQuota.remainingSlots}/50 slot Tamu Angkatan)`
                                  : "Kuota 50 slot Tiket Makan Tamu Angkatan sudah penuh"
                              }
                              className="inline-flex items-center gap-0.5 rounded-lg bg-brand-orange px-2 py-0.5 text-[10px] font-black text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              + Makan
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={Boolean(g.mealRedeemedAt)}
                            onClick={() => {
                              if (
                                !g.mealRedeemedAt &&
                                (g.isOts || g.isTamuRole) &&
                                window.confirm(
                                  `Cabut hak Tiket Makan untuk "${g.name}" (ubah menjadi hanya Tiket Photobooth)?`,
                                )
                              ) {
                                void handleHtmAction(g, "set_meal_eligible", undefined, false);
                              }
                            }}
                            title={
                              !g.mealRedeemedAt && (g.isOts || g.isTamuRole)
                                ? "Klik untuk mencabut Tiket Makan (kembalikan 1 slot Tamu Angkatan)"
                                : undefined
                            }
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 ${
                              g.mealRedeemedAt
                                ? "bg-success/15 text-success"
                                : "bg-brand-orange/15 text-brand-orange"
                            }`}
                          >
                            <Utensils className="size-3" />
                            {g.mealRedeemedAt ? g.mealRedeemedAtWib : "Makan Aktif"}
                          </button>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 ${
                            g.photoboothRedeemedAt
                              ? "bg-brand-purple/15 text-brand-purple"
                              : "bg-surface-soft text-ink-muted"
                          }`}
                        >
                          <Camera className="size-3" />
                          {g.photoboothRedeemedAt ? g.photoboothRedeemedAtWib : "Foto Aktif"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {isHeld || (isUnpaid && g.status === "belum_hadir") ? (
                          <button
                            type="button"
                            onClick={() => void handleHtmAction(g, "approve_checkin")}
                            className="inline-flex items-center gap-1 rounded-xl bg-success px-2.5 py-1 text-xs font-black text-white hover:brightness-95"
                          >
                            <CheckCircle2 className="size-3" />
                            {isHeld ? "Izinkan Masuk" : "Lunasi & Masuk"}
                          </button>
                        ) : null}

                        {isHeld ? (
                          <button
                            type="button"
                            onClick={() => void handleHtmAction(g, "reset_attendance")}
                            className="inline-flex items-center gap-1 rounded-xl border border-error/40 px-2 py-1 text-xs font-bold text-error hover:bg-error/10"
                          >
                            <RotateCcw className="size-3" />
                            Recovery HP
                          </button>
                        ) : null}

                        {g.status === "belum_hadir" && !isUnpaid ? (
                          <button
                            type="button"
                            onClick={() => void handleManualAttendance(g, "in")}
                            className="inline-flex items-center gap-1 rounded-xl bg-brand-blue px-2.5 py-1 text-xs font-bold text-white hover:brightness-95"
                          >
                            <LogIn className="size-3" />
                            Masuk
                          </button>
                        ) : null}

                        {g.status === "di_dalam" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleManualAttendance(g, "out")}
                              className="inline-flex items-center gap-1 rounded-xl bg-brand-purple px-2.5 py-1 text-xs font-bold text-white hover:brightness-95"
                            >
                              <LogOut className="size-3" />
                              Pulang
                            </button>
                            <button
                              type="button"
                              onClick={() => setUndoModal({ guest: g, type: "in" })}
                              className="inline-flex items-center gap-1 rounded-xl border border-error/40 px-2 py-1 text-xs font-bold text-error hover:bg-error/10"
                              title="Batalkan absen & buka kunci HP"
                            >
                              <RotateCcw className="size-3" />
                              Recovery
                            </button>
                          </>
                        ) : null}

                        {g.status === "sudah_pulang" ? (
                          <button
                            type="button"
                            onClick={() => setUndoModal({ guest: g, type: "out" })}
                            className="inline-flex items-center gap-1 rounded-xl border border-error/40 px-2 py-1 text-xs font-bold text-error hover:bg-error/10"
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
            Halaman {safePage} / {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-line bg-surface px-3 py-1 font-semibold text-ink disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl border border-line bg-surface px-3 py-1 font-semibold text-ink disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      ) : null}

      {/* Modal Batalkan Absen / Recovery HP */}
      {undoModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <Card className="flex w-full max-w-md flex-col gap-4 rounded-3xl p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-sm font-black text-ink">Recovery / Batalkan Absen</span>
              <button
                type="button"
                onClick={() => setUndoModal(null)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-ink-muted">
              Batalkan absen {undoModal.type === "in" ? "MASUK" : "PULANG"} untuk{" "}
              <strong className="text-ink">{undoModal.guest.name}</strong>? Kunci perangkat (HP)
              tamu akan otomatis dibuka kembali.
            </p>

            <Input
              id="undo-reason"
              placeholder="Catatan singkat (mis. Salah klik nama)"
              value={undoReason}
              onChange={(e) => setUndoReason(e.target.value)}
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setUndoModal(null)}
                className="h-10 text-xs"
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmUndo}
                disabled={!undoReason.trim() || isUndoing}
                className="h-10 text-xs font-bold"
              >
                {isUndoing ? "Memproses..." : "Reset & Buka Kunci HP"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Modal Input Tamu On-The-Spot (OTS) */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
          <Card className="flex w-full max-w-md flex-col gap-4 rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="size-4 text-brand-blue" />
                <span className="text-sm font-black text-ink">Input Tamu On-The-Spot (OTS)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddGuest} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label htmlFor="guest-name" className="text-xs font-bold text-ink">
                  Nama Lengkap *
                </label>
                <Input
                  id="guest-name"
                  placeholder="Ketik nama lengkap tamu OTS..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="guest-cat" className="text-xs font-bold text-ink">
                    Kategori / Divisi
                  </label>
                  <Input
                    id="guest-cat"
                    placeholder="OTS · Tamu / Kating"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="guest-htm" className="text-xs font-bold text-ink">
                    Status HTM
                  </label>
                  <select
                    id="guest-htm"
                    value={newPaymentStatus}
                    onChange={(e) =>
                      setNewPaymentStatus(e.target.value as "lunas" | "belum_lunas")
                    }
                    className="h-11 rounded-control border border-line bg-surface px-3 text-xs font-bold text-ink focus:outline-none"
                  >
                    <option value="lunas">Sudah Lunas</option>
                    <option value="belum_lunas">Belum Lunas (Hold)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="guest-allergies" className="text-xs font-bold text-ink">
                    Alergi Makanan (Opsional)
                  </label>
                  <Input
                    id="guest-allergies"
                    placeholder="Mis. Seafood / Kacang"
                    value={newAllergies}
                    onChange={(e) => setNewAllergies(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="guest-contact" className="text-xs font-bold text-ink">
                    No. WhatsApp (Opsional)
                  </label>
                  <Input
                    id="guest-contact"
                    placeholder="08xxxxxxxxxx"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                  />
                </div>
              </div>

              {/* Pengaturan Tiket Makan OTS (Berdasarkan Sisa Kuota 50 Slot Tamu Angkatan) */}
              <label
                className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${
                  tamuMealQuota.canAddOtsMeal
                    ? "cursor-pointer border-brand-orange/35 bg-brand-orange/5"
                    : "cursor-not-allowed border-error/30 bg-error/5 opacity-75"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Utensils className="size-3.5 text-brand-orange" />
                    <span className="text-xs font-extrabold text-ink">
                      Tambahkan Tiket Makan (Slot Tamu Angkatan: {tamuMealQuota.usedSlots}/
                      {tamuMealQuota.maxSlots})
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-muted">
                    {tamuMealQuota.canAddOtsMeal
                      ? `Default OTS hanya dapat Tiket Photobooth. Centang untuk memberi Tiket Makan (Sisa ${tamuMealQuota.remainingSlots} slot).`
                      : "Slot 50 Tamu Angkatan sudah penuh! Tamu OTS hanya mendapatkan Tiket Photobooth."}
                  </span>
                </div>
                <input
                  type="checkbox"
                  disabled={!tamuMealQuota.canAddOtsMeal}
                  checked={includeMealOts && tamuMealQuota.canAddOtsMeal}
                  onChange={(e) => setIncludeMealOts(e.target.checked)}
                  className="size-4 rounded accent-brand-orange"
                />
              </label>

              {newPaymentStatus === "lunas" ? (
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-brand-blue/25 bg-brand-blue/5 p-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-ink">
                      Langsung Check-In (Hadir) Sekarang
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      Matikan centang bila tamu ingin scan QR gerbang dari HP sendiri
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoCheckinOts}
                    onChange={(e) => setAutoCheckinOts(e.target.checked)}
                    className="size-4 rounded accent-brand-blue"
                  />
                </label>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                  className="h-10 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={!newName.trim() || isAdding}
                  className="h-10 px-4 text-xs font-black"
                >
                  {isAdding ? "Menyimpan..." : "Simpan Tamu OTS"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
