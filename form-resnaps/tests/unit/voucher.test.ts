import { describe, expect, it } from "vitest";
import { encodeCode128B, generateVoucherCode, normalizeVoucherInput } from "@/lib/voucher";
import { htmActionInput, paymentStatusSchema, voucherScanInput } from "@/lib/validation/schemas";

describe("generateVoucherCode", () => {
  it("menghasilkan format RSNP-XXXXXXXX deterministik sebanyak 13 karakter", () => {
    const id = "4e77565a-fb15-4f49-b153-cdcbd6fc7348";
    const code1 = generateVoucherCode(id);
    const code2 = generateVoucherCode(id.toUpperCase());
    expect(code1).toMatch(/^RSNP-[0-9A-F]{8}$/);
    expect(code1).toBe(code2);
  });

  it("menghasilkan kode berbeda untuk tamu berbeda", () => {
    const c1 = generateVoucherCode("4e77565a-fb15-4f49-b153-cdcbd6fc7348");
    const c2 = generateVoucherCode("5f88676b-fb15-4f49-b153-cdcbd6fc7349");
    expect(c1).not.toBe(c2);
  });
});

describe("normalizeVoucherInput", () => {
  it("menormalkan kode RSNP huruf kecil dan spasi", () => {
    expect(normalizeVoucherInput("  rsnp-8f3a92c1 ")).toBe("RSNP-8F3A92C1");
  });

  it("menambahkan prefiks RSNP- bila hanya 8 digit hex yang dimasukkan", () => {
    expect(normalizeVoucherInput("8f3a92c1")).toBe("RSNP-8F3A92C1");
  });

  it("mengekstrak kode dari payload QR berprefiks RSNP-VOUCHER:", () => {
    expect(normalizeVoucherInput("RSNP-VOUCHER:rsnp-1a2b3c4d")).toBe("RSNP-1A2B3C4D");
  });
});

describe("encodeCode128B", () => {
  it("mengenkode string kode voucher menjadi bit 1 dan 0 yang diawali Start Code B dan diakhiri Stop Code", () => {
    const bits = encodeCode128B("RSNP-8F3A92C1");
    expect(bits).toMatch(/^[01]+$/);
    // Start Code B (104) = 11010010000, Stop Code (106) = 1100011101011
    expect(bits.startsWith("11010010000")).toBe(true);
    expect(bits.endsWith("1100011101011")).toBe(true);
    // Panjang total: (1 start + 13 char + 1 checksum) * 11 + 13 stop = 178 modul
    expect(bits.length).toBe(15 * 11 + 13);
  });

  it("mengembalikan string kosong untuk input kosong", () => {
    expect(encodeCode128B("   ")).toBe("");
  });
});

describe("skema validasi HTM & Voucher", () => {
  it("memvalidasi paymentStatusSchema (lunas | belum_lunas)", () => {
    expect(paymentStatusSchema.safeParse("lunas").success).toBe(true);
    expect(paymentStatusSchema.safeParse("belum_lunas").success).toBe(true);
    expect(paymentStatusSchema.safeParse("pending").success).toBe(false);
  });

  it("memvalidasi voucherScanInput untuk meal dan photobooth", () => {
    expect(voucherScanInput.safeParse({ code: "RSNP-8F3A92C1", kind: "meal" }).success).toBe(true);
    expect(voucherScanInput.safeParse({ code: "RSNP-8F3A92C1", kind: "photobooth" }).success).toBe(
      true,
    );
    expect(voucherScanInput.safeParse({ code: "AB", kind: "meal" }).success).toBe(false);
  });

  it("memvalidasi htmActionInput", () => {
    expect(
      htmActionInput.safeParse({
        guest_id: "4e77565a-fb15-4f49-b153-cdcbd6fc7348",
        action: "approve_checkin",
      }).success,
    ).toBe(true);
    expect(
      htmActionInput.safeParse({
        guest_id: "4e77565a-fb15-4f49-b153-cdcbd6fc7348",
        action: "set_payment",
        payment_status: "belum_lunas",
      }).success,
    ).toBe(true);
  });
});
