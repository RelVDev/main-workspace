// Mesin kode voucher terpadu (Makan & Photobooth 2-in-1) serta encoder Barcode 1D Code-128B murni.
import { createHash } from "node:crypto";

export type VoucherKind = "meal" | "photobooth";
export type PaymentStatus = "lunas" | "belum_lunas";

/**
 * Menghasilkan kode voucher deterministik `RSNP-XXXXXXXX` yang identik dengan trigger PostgreSQL
 * `guests_set_voucher_code()` di migrasi 0008.
 */
export function generateVoucherCode(guestId: string): string {
  const cleanId = guestId.trim().toLowerCase();
  const hex = createHash("md5")
    .update(`${cleanId}resnaps-voucher`)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return `RSNP-${hex}`;
}

/**
 * Menormalkan input dari hasil scan QR, scan Barcode 1D, atau ketikan manual panitia.
 * Mendukung:
 * - "RSNP-8F3A92C1" atau "rsnp-8f3a92c1"
 * - "8F3A92C1" (8 karakter hex langsung)
 * - Payload berprefiks "RSNP-VOUCHER:RSNP-8F3A92C1"
 * - UUID tamu
 */
export function normalizeVoucherInput(raw: string): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";

  // Jika berformat payload QR khusus "RSNP-VOUCHER:RSNP-XXXXXXXX"
  if (trimmed.toUpperCase().startsWith("RSNP-VOUCHER:")) {
    return normalizeVoucherInput(trimmed.slice("RSNP-VOUCHER:".length));
  }

  // Jika cocok pola RSNP-XXXXXXXX
  const rsnpMatch = trimmed.match(/RSNP-([0-9A-F]{8})/i);
  if (rsnpMatch) {
    return `RSNP-${rsnpMatch[1].toUpperCase()}`;
  }

  // Jika panitia hanya mengetik 8 karakter hex tanpa RSNP-
  if (/^[0-9A-F]{8}$/i.test(trimmed)) {
    return `RSNP-${trimmed.toUpperCase()}`;
  }

  return trimmed;
}

/** Tabel pola modul standar ISO/IEC 15417 (Code-128) untuk nilai 0..106 */
const CODE128_PATTERNS: readonly string[] = [
  "11011001100", "11001101100", "11001100110", "10010011000", "10010001100",
  "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
  "11001000100", "11000100100", "10110011100", "10011011100", "10011001110",
  "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
  "11001001110", "11011100100", "11001110100", "11101101110", "11101001100",
  "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
  "11011011000", "11011000110", "11000110110", "10100011000", "10001011000",
  "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
  "11000101000", "11000100010", "10110111000", "10110001110", "10001101110",
  "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
  "11000101110", "11011101000", "11011100010", "11011101110", "11101011000",
  "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
  "11101111010", "11001000010", "11110001010", "10100110000", "10100001100",
  "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
  "10110000100", "10011010000", "10011000010", "10000110100", "10000110010",
  "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
  "10100111100", "10010111100", "10010011110", "10111100100", "10011110100",
  "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
  "11011110110", "11110110110", "10101111000", "10100011110", "10001011110",
  "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
  "10111101110", "11101011110", "11110101110", "11010000100", "11010010000",
  "11010011100", "1100011101011",
];

const START_CODE_B = 104;
const STOP_CODE = 106;

/**
 * Mengenkode teks ASCII (32..126) menjadi deretan bit modul '1' (bar hitam) dan '0' (spasi putih)
 * sesuai standar Code-128 Subset B (termasuk checksum Modulo 103 & Stop pattern).
 */
export function encodeCode128B(text: string): string {
  const clean = text.trim();
  if (!clean) return "";

  let checksum = START_CODE_B;
  const parts: string[] = [CODE128_PATTERNS[START_CODE_B]];

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    if (code < 0 || code > 94) {
      throw new Error(`Karakter tidak didukung di Code-128B: ${clean[i]}`);
    }
    checksum += code * (i + 1);
    parts.push(CODE128_PATTERNS[code]);
  }

  const checkIndex = checksum % 103;
  parts.push(CODE128_PATTERNS[checkIndex]);
  parts.push(CODE128_PATTERNS[STOP_CODE]);

  return parts.join("");
}
