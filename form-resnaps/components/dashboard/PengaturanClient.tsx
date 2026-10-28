// P11.7 / P11.8 / P11.9: Halaman Pengaturan Admin (Rotasi QR, Session TTL, Cabut Sesi, Flag Verifikasi).
"use client";

import { useEffect, useState } from "react";
import { Settings, ShieldAlert, Save, X, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";

export function PengaturanClient() {
  const [windowSec, setWindowSec] = useState(30);
  const [graceWindows, setGraceWindows] = useState(1);
  const [ttlSec, setTtlSec] = useState(600);
  const [verificationMode, setVerificationMode] = useState(false);
  const [deviceLockEnabled, setDeviceLockEnabled] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(
    null
  );

  // Modal darurat cabut sesi (P11.8)
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/panitia/dashboard-data");
        if (res.ok) {
          const dash = await res.json();
          if (dash.settings) {
            if (typeof dash.settings.deviceLockEnabled === "boolean") {
              setDeviceLockEnabled(dash.settings.deviceLockEnabled);
            }
            if (typeof dash.settings.verificationMode === "boolean") {
              setVerificationMode(dash.settings.verificationMode);
            }
          }
          // Ambil pengaturan via GET qr-token config
          const qrRes = await fetch("/api/panitia/qr-token?mode=in&ahead=0");
          if (qrRes.ok) {
            const d = await qrRes.json();
            if (d.windowSeconds) setWindowSec(d.windowSeconds);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
    void loadSettings();
  }, []);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/panitia/qr-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_window_seconds: windowSec,
          qr_grace_windows: graceWindows,
          session_ttl_seconds: ttlSec,
          verification_mode: verificationMode,
          device_lock_enabled: deviceLockEnabled,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedback({ kind: "success", text: "Pengaturan rotasi QR berhasil disimpan dan dicatat di log audit." });
      } else {
        setFeedback({ kind: "error", text: data.message || "Gagal menyimpan pengaturan." });
      }
    } catch {
      setFeedback({ kind: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRevokeAllSessions() {
    if (confirmInput.trim().toUpperCase() !== "CABUT") return;

    setIsRevoking(true);
    try {
      const res = await fetch("/api/panitia/revoke-sessions", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedback({
          kind: "success",
          text: `Seluruh sesi dan token QR aktif berhasil dicabut seketika! Versi kunci dinaikkan ke versi ${data.newKeyVersion}.`,
        });
        setShowRevokeModal(false);
        setConfirmInput("");
      } else {
        setFeedback({ kind: "error", text: data.message || "Gagal mencabut sesi." });
      }
    } catch {
      setFeedback({ kind: "error", text: "Terjadi kesalahan jaringan saat mencabut sesi." });
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {feedback ? (
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
      ) : null}

      <div>
        <h1 className="text-2xl font-bold text-ink">Pengaturan Sistem Absensi</h1>
        <p className="text-sm text-ink-muted">
          Pengaturan ini berlaku secara global pada seluruh Layar QR dan perangkat tamu.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Formulir Pengaturan QR (P11.7) */}
        <Card className="flex flex-col gap-5 p-6">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <Settings className="size-5 text-brand-blue" />
            <h2 className="text-base font-bold text-ink">Parameter Token QR Dinamis</h2>
          </div>

          <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="win-sec" className="text-xs font-bold text-ink">
                Interval Rotasi QR (detik)
              </label>
              <Input
                id="win-sec"
                type="number"
                min={15}
                max={60}
                value={windowSec}
                onChange={(e) => setWindowSec(Number(e.target.value))}
                disabled={isLoading || isSaving}
              />
              <span className="text-[11px] text-ink-muted">
                Standar: 30 detik (rentang 15–60 dtk). Waktu QR berganti otomatis.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="grace-win" className="text-xs font-bold text-ink">
                Jumlah Jendela Toleransi (Grace Windows)
              </label>
              <Input
                id="grace-win"
                type="number"
                min={0}
                max={3}
                value={graceWindows}
                onChange={(e) => setGraceWindows(Number(e.target.value))}
                disabled={isLoading || isSaving}
              />
              <span className="text-[11px] text-ink-muted">
                Standar: 1 jendela. Memberi waktu scan jika pergantian terjadi saat kamera fokus.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ttl-sec" className="text-xs font-bold text-ink">
                Masa Berlaku Sesi Tamu (TTL Detik)
              </label>
              <Input
                id="ttl-sec"
                type="number"
                min={300}
                max={1800}
                value={ttlSec}
                onChange={(e) => setTtlSec(Number(e.target.value))}
                disabled={isLoading || isSaving}
              />
              <span className="text-[11px] text-ink-muted">
                Standar: 600 detik (10 menit). Waktu tamu memilih nama setelah scan.
              </span>
            </div>

            {/* Feature Flag: Kunci Keamanan 1 Perangkat = 1 Tamu (Anti-Titip Absen) */}
            <div className="flex flex-col gap-1.5 rounded-2xl border border-brand-purple/25 bg-brand-purple/5 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-ink">
                  Kunci 1 Perangkat = 1 Tamu (Anti-Titip Absen)
                </span>
                <input
                  type="checkbox"
                  checked={deviceLockEnabled}
                  onChange={(e) => setDeviceLockEnabled(e.target.checked)}
                  className="size-4 rounded accent-brand-purple"
                />
              </div>
              <span className="text-[11px] leading-relaxed text-ink-muted">
                Bila aktif (direkomendasikan), tamu yang sudah absen di perangkatnya tidak dapat
                menggunakan HP yang sama untuk mengabsenkan nama tamu lain. Jika tamu salah pilih
                nama, Admin/Panitia dapat melakukan <strong>Recovery / Reset Absen</strong> di Tabel
                Tamu atau Dashboard untuk membuka kunci HP tamu.
              </span>
            </div>

            {/* Feature Flag: Mode Verifikasi Kontak (P11.9 / D14) */}
            <div className="flex flex-col gap-1.5 border-t border-line pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">Mode Verifikasi 4 Digit Kontak</span>
                <input
                  type="checkbox"
                  checked={verificationMode}
                  onChange={(e) => setVerificationMode(e.target.checked)}
                  className="size-4 rounded accent-brand-blue"
                />
              </div>
              <span className="text-[11px] text-ink-muted">
                Bila aktif, tamu diminta memasukkan 4 digit akhir kontak. Nonaktif secara default (D14).
              </span>
            </div>

            <Button type="submit" disabled={isLoading || isSaving} className="mt-2 h-10 text-xs">
              <Save className="size-4" />
              {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </form>
        </Card>

        {/* Zona Bahaya: Cabut Semua Sesi (P11.8 / D12) */}
        <Card className="flex flex-col justify-between gap-5 border-error/30 p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-line pb-3 text-error">
              <ShieldAlert className="size-5" />
              <h2 className="text-base font-bold">Tindakan Tanggap Darurat</h2>
            </div>

            <p className="text-xs leading-relaxed text-ink-muted">
              Gunakan fungsi ini jika kode QR dicurigai bocor ke luar venue atau dibagikan melalui tangkapan
              layar media sosial.
            </p>

            <div className="rounded-control bg-error/10 p-3 text-xs font-semibold text-error">
              Menekan tombol ini akan seketika menaikkan versi kunci (qr_key_version) dan menghanguskan
              seluruh sesi tamu yang sedang berjalan. Layar QR akan otomatis memuat kunci baru.
            </div>
          </div>

          <Button
            variant="danger"
            onClick={() => setShowRevokeModal(true)}
            className="h-10 text-xs font-bold"
          >
            <ShieldAlert className="size-4" />
            Cabut Semua Sesi & QR Sekarang
          </Button>
        </Card>
      </div>

      {/* Modal Konfirmasi Dua Langkah Cabut Sesi (P11.8) */}
      {showRevokeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="flex w-full max-w-md flex-col gap-5 border-error shadow-xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2 text-error font-bold text-sm">
                <AlertTriangle className="size-4" />
                Konfirmasi Pencabutan Sesi
              </div>
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-ink-muted">
              Seluruh QR yang sudah difoto dan sesi tamu yang sedang mencari nama akan{" "}
              <strong className="text-error">seketika tidak berlaku</strong>. Ketik kata{" "}
              <strong className="font-mono text-ink">CABUT</strong> di bawah ini untuk mengonfirmasi:
            </p>

            <Input
              placeholder='Ketik "CABUT"'
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="font-mono text-center font-bold tracking-widest text-error uppercase"
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowRevokeModal(false)}
                className="h-10 text-xs"
              >
                Batal
              </Button>
              <Button
                variant="danger"
                disabled={confirmInput.trim().toUpperCase() !== "CABUT" || isRevoking}
                onClick={handleRevokeAllSessions}
                className="h-10 text-xs font-bold"
              >
                {isRevoking ? "Mencabut..." : "Konfirmasi Cabut Sesi"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
