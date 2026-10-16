// P05.2: mesin token QR dinamis (spesifikasi PLANNING §5.5).
// Fungsi murni: jam disuntik sebagai `now`, secret dibaca dari argumen (bukan env),
// sehingga bisa diuji tanpa I/O. Tidak ada impor "server-only" di sini agar bisa dites
// langsung; pemanggil (route handler) wajib server-only.
//
// Format token: `{keyVersion}.{idx}.{sig}` (base64url, ≤ ~60 karakter).
// sig = truncate(HMAC-SHA256(secret, "{mode}|{keyVersion}|{idx}"), 16 byte).
// Mode TIDAK ditulis di token; server mencoba `in` lalu `out`. Keputusan ini dicatat di ASSUMPTIONS.md.

import { createHmac, timingSafeEqual } from "node:crypto";

export type Mode = "in" | "out";
export type VerifyReason = "invalid" | "expired" | "revoked";
export type VerifyResult = { ok: true; mode: Mode } | { ok: false; reason: VerifyReason };

export type TokenConfig = {
  secret: string;
  /** qr_key_version aktif saat ini (dari event_settings). */
  keyVersion: number;
  /** W: panjang jendela dalam detik (default 30). */
  windowSeconds?: number;
  /** Jumlah jendela sebelumnya yang masih diterima (default 1). */
  graceWindows?: number;
};

const MODES: readonly Mode[] = ["in", "out"];
const SIG_BYTES = 16;
const DEFAULT_WINDOW = 30;
const DEFAULT_GRACE = 1;

/** Indeks jendela untuk waktu `now` (ms epoch). */
export function windowIndex(nowMs: number, windowSeconds = DEFAULT_WINDOW): number {
  return Math.floor(Math.floor(nowMs / 1000) / windowSeconds);
}

function signature(secret: string, mode: Mode, keyVersion: number, idx: number): Buffer {
  return createHmac("sha256", secret)
    .update(`${mode}|${keyVersion}|${idx}`)
    .digest()
    .subarray(0, SIG_BYTES);
}

/** Buat token untuk `mode` pada jendela `idx`. */
export function mintTokenAt(mode: Mode, cfg: TokenConfig, idx: number): string {
  const sig = signature(cfg.secret, mode, cfg.keyVersion, idx);
  return `${cfg.keyVersion}.${idx}.${sig.toString("base64url")}`;
}

/** Token untuk jendela sekarang. */
export function mintToken(mode: Mode, cfg: TokenConfig, now: number): string {
  return mintTokenAt(mode, cfg, windowIndex(now, cfg.windowSeconds));
}

/** Token untuk jendela sekarang + `n` jendela ke depan (prefetch, P07.2). */
export function mintAhead(
  mode: Mode,
  cfg: TokenConfig,
  now: number,
  n: number,
): { idx: number; token: string; validFromMs: number }[] {
  const w = cfg.windowSeconds ?? DEFAULT_WINDOW;
  const base = windowIndex(now, w);
  const out: { idx: number; token: string; validFromMs: number }[] = [];
  for (let k = 0; k <= n; k++) {
    const idx = base + k;
    out.push({
      idx,
      token: mintTokenAt(mode, cfg, idx),
      validFromMs: idx * w * 1000,
    });
  }
  return out;
}

/**
 * Verifikasi token pada waktu `now`.
 * - Format salah → invalid.
 * - keyVersion ≠ cfg.keyVersion → revoked.
 * - idx di luar [now - grace, now] → expired (idx masa depan juga ditolak sebagai invalid).
 * - Tanda tangan dicek constant-time untuk `in` lalu `out`.
 */
export function verifyToken(token: string, cfg: TokenConfig, now: number): VerifyResult {
  const w = cfg.windowSeconds ?? DEFAULT_WINDOW;
  const grace = cfg.graceWindows ?? DEFAULT_GRACE;

  if (typeof token !== "string" || token.length === 0 || token.length > 120) {
    return { ok: false, reason: "invalid" };
  }
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "invalid" };
  const [kvRaw, idxRaw, sigRaw] = parts;

  if (!/^\d{1,9}$/.test(kvRaw) || !/^\d{1,12}$/.test(idxRaw)) {
    return { ok: false, reason: "invalid" };
  }
  const keyVersion = Number(kvRaw);
  const idx = Number(idxRaw);

  if (keyVersion !== cfg.keyVersion) return { ok: false, reason: "revoked" };

  const current = windowIndex(now, w);
  if (idx > current) return { ok: false, reason: "invalid" };
  if (idx < current - grace) return { ok: false, reason: "expired" };

  let given: Buffer;
  try {
    given = Buffer.from(sigRaw, "base64url");
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (given.length !== SIG_BYTES) return { ok: false, reason: "invalid" };

  for (const mode of MODES) {
    const want = signature(cfg.secret, mode, keyVersion, idx);
    if (timingSafeEqual(want, given)) return { ok: true, mode };
  }
  return { ok: false, reason: "invalid" };
}
