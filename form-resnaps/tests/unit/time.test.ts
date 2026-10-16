import { describe, expect, it } from "vitest";
import { formatWib } from "@/lib/time";

describe("formatWib", () => {
  it("memformat waktu UTC ke zona waktu WIB (Asia/Jakarta, UTC+7)", () => {
    // 2026-10-16T10:00:00Z di UTC adalah pukul 17.00 WIB
    const utcIso = "2026-10-16T10:00:00.000Z";
    expect(formatWib(utcIso)).toBe("17.00 WIB");
  });

  it("menerima format custom", () => {
    const utcIso = "2026-10-16T10:30:00.000Z";
    expect(formatWib(utcIso, "HH:mm:ss")).toBe("17:30:00");
  });

  it("mengembalikan tanda hubung '-' untuk nilai tanggal yang tidak valid tanpa melempar error", () => {
    expect(formatWib("tanggal-ngawur")).toBe("-");
    expect(formatWib(NaN)).toBe("-");
  });
});
