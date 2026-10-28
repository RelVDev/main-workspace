// Mesin dekoder optik Barcode 1D (Code-128B) berbasis Canvas murni + integrasi BarcodeDetector API.
// Bekerja di seluruh browser: Laptop (Windows/Mac/Linux), iPad, iPhone (iOS Safari), dan Android,
// termasuk kamera depan/webcam yang ter-mirror (terbalik horizontal) maupun posisi miring.

import { normalizeVoucherInput } from "./voucher";

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

/** Mengubah string bit "11010010000" menjadi array panjang run [2, 1, 1, 2, 1, 4] */
function bitsToRuns(bits: string): number[] {
  const runs: number[] = [];
  let i = 0;
  while (i < bits.length) {
    const ch = bits[i];
    let count = 0;
    while (i < bits.length && bits[i] === ch) {
      count++;
      i++;
    }
    runs.push(count);
  }
  return runs;
}

const SYMBOL_RUNS: readonly number[][] = CODE128_PATTERNS.slice(0, 106).map(bitsToRuns);
const START_B_RUNS = SYMBOL_RUNS[START_CODE_B]; // [2, 1, 1, 2, 1, 4]
const STOP_RUNS = bitsToRuns(CODE128_PATTERNS[106]); // [2, 3, 3, 1, 1, 1, 2] (13 modul)

type Run = {
  bit: 0 | 1;
  len: number;
};

/** Menghitung selisih L1 ter-normalisasi antara segmen run piksel dan pola modul target */
function patternDistance(
  runs: readonly Run[],
  offset: number,
  target: readonly number[],
  totalModules: number,
): { dist: number; totalPx: number } {
  let totalPx = 0;
  for (let k = 0; k < target.length; k++) {
    totalPx += runs[offset + k].len;
  }
  if (totalPx < totalModules * 0.75) {
    return { dist: 999, totalPx };
  }
  const scale = totalModules / totalPx;
  let dist = 0;
  for (let k = 0; k < target.length; k++) {
    dist += Math.abs(runs[offset + k].len * scale - target[k]);
  }
  return { dist, totalPx };
}

/** Mencoba mendekode sekuens run-length menjadi string Code-128B terverifikasi Checksum Modulo 103 */
export function decodeRunsCode128B(runs: readonly Run[]): string | null {
  const n = runs.length;
  if (n < 25) return null; // Minimal Start + 2 karakter + Checksum + Stop

  for (let i = 0; i <= n - 25; i++) {
    if (runs[i].bit !== 1) continue;

    const startMatch = patternDistance(runs, i, START_B_RUNS, 11);
    if (startMatch.dist > 2.35) continue;

    // Pastikan ada quiet zone putih sebelum Start bar (bila i > 0)
    if (i > 0 && runs[i - 1].len < startMatch.totalPx * 0.35) continue;

    const codes: number[] = [];
    let pos = i + 6;
    let prevTotalPx = startMatch.totalPx;
    let validSequence = true;

    while (pos + 6 <= n) {
      // Cek apakah posisi saat ini adalah STOP_CODE (7 elemen = 13 modul)
      if (pos + 7 <= n && codes.length >= 2) {
        const stopMatch = patternDistance(runs, pos, STOP_RUNS, 13);
        const expectedStopPx = (prevTotalPx / 11) * 13;
        if (
          stopMatch.dist <= 2.65 &&
          stopMatch.totalPx >= expectedStopPx * 0.65 &&
          stopMatch.totalPx <= expectedStopPx * 1.45
        ) {
          // Verifikasi Checksum Modulo 103
          const checkSymbol = codes[codes.length - 1];
          const dataCodes = codes.slice(0, -1);
          let sum = START_CODE_B;
          for (let idx = 0; idx < dataCodes.length; idx++) {
            sum += dataCodes[idx] * (idx + 1);
          }
          if (sum % 103 === checkSymbol) {
            let decoded = "";
            for (const c of dataCodes) {
              if (c < 0 || c > 94) {
                validSequence = false;
                break;
              }
              decoded += String.fromCharCode(c + 32);
            }
            if (validSequence && decoded.length >= 4) {
              const normalized = normalizeVoucherInput(decoded);
              if (/^RSNP-[0-9A-F]{8}$/i.test(normalized) || decoded.length >= 6) {
                return normalized;
              }
            }
          }
        }
      }

      // Cari simbol 0..102 terbaik untuk 6 run berikutnya
      let bestCode = -1;
      let bestDist = 2.45;
      let bestPx = 0;

      for (let c = 0; c < 103; c++) {
        const m = patternDistance(runs, pos, SYMBOL_RUNS[c], 11);
        if (m.dist < bestDist) {
          bestDist = m.dist;
          bestCode = c;
          bestPx = m.totalPx;
        }
      }

      if (
        bestCode === -1 ||
        bestPx < prevTotalPx * 0.65 ||
        bestPx > prevTotalPx * 1.45
      ) {
        validSequence = false;
        break;
      }

      codes.push(bestCode);
      prevTotalPx = (prevTotalPx + bestPx) * 0.5;
      pos += 6;

      if (codes.length > 24) break;
    }
  }

  return null;
}

/** Mengubah 1 baris piksel luminance menjadi deretan Run hitam/putih dengan ambang adaptif lokal */
function luminanceLineToRuns(lum: Float32Array, windowRadius: number, bias: number): Run[] {
  const len = lum.length;
  const runs: Run[] = [];
  if (len === 0) return runs;

  // Prefix sum untuk rata-rata lokal cepat O(1)
  const prefix = new Float64Array(len + 1);
  for (let i = 0; i < len; i++) {
    prefix[i + 1] = prefix[i] + lum[i];
  }

  let currentBit: 0 | 1 = 0;
  let currentLen = 0;

  for (let i = 0; i < len; i++) {
    const left = Math.max(0, i - windowRadius);
    const right = Math.min(len - 1, i + windowRadius);
    const localMean = (prefix[right + 1] - prefix[left]) / (right - left + 1);
    const bit: 0 | 1 = lum[i] < localMean - bias ? 1 : 0;

    if (i === 0) {
      currentBit = bit;
      currentLen = 1;
    } else if (bit === currentBit) {
      currentLen++;
    } else {
      runs.push({ bit: currentBit, len: currentLen });
      currentBit = bit;
      currentLen = 1;
    }
  }
  if (currentLen > 0) {
    runs.push({ bit: currentBit, len: currentLen });
  }
  return runs;
}

/**
 * Memindai ImageData dari frame kamera untuk menemukan Barcode 1D Code-128B.
 * Menguji garis horizontal & miring, serta arah normal & terbalik (mirror webcam laptop).
 */
export function scanImageDataForCode128(imageData: ImageData): string | null {
  const { data, width, height } = imageData;
  if (width < 120 || height < 40) return null;

  const yFractions = [
    0.5, 0.48, 0.52, 0.44, 0.56, 0.4, 0.6, 0.35, 0.65, 0.3, 0.7, 0.25, 0.75, 0.2, 0.8,
  ];
  const tilts = [0, -0.04, 0.04, -0.09, 0.09];
  const biases = [2, -2, 6];
  const radii = [
    Math.max(10, Math.round(width / 36)),
    Math.max(16, Math.round(width / 18)),
  ];
  const lumLine = new Float32Array(width);

  for (const yf of yFractions) {
    const baseY = Math.floor(height * yf);
    for (const tilt of tilts) {
      for (let x = 0; x < width; x++) {
        const y = Math.min(
          height - 1,
          Math.max(0, Math.round(baseY + (x - width * 0.5) * tilt)),
        );
        const idx = (y * width + x) * 4;
        // Luminance standar ITU-R BT.601
        lumLine[x] = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      }

      for (const windowRadius of radii) {
        for (const bias of biases) {
          const runs = luminanceLineToRuns(lumLine, windowRadius, bias);
          const forward = decodeRunsCode128B(runs);
          if (forward) return forward;

          // Uji urutan terbalik untuk mengatasi kamera laptop/depan yang mirror atau posisi terbalik
          const reversed = runs.slice().reverse();
          const backward = decodeRunsCode128B(reversed);
          if (backward) return backward;
        }
      }
    }
  }

  return null;
}
