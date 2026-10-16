import { describe, expect, it } from "vitest";
import { mintAhead, mintToken, verifyToken, windowIndex, type TokenConfig } from "@/lib/qr-token";

const cfg: TokenConfig = {
  secret: "test-secret-that-is-at-least-thirty-two-bytes-long",
  keyVersion: 1,
  windowSeconds: 30,
  graceWindows: 1,
};

// 2026-10-16T02:00:00Z, dipilih di tengah jendela agar batas tidak kebetulan.
const T0 = Date.parse("2026-10-16T02:00:00Z") + 7_000;

describe("windowIndex", () => {
  it("memotong ke jendela W detik", () => {
    expect(windowIndex(29_999, 30)).toBe(windowIndex(0, 30));
    expect(windowIndex(30_000, 30)).toBe(windowIndex(0, 30) + 1);
  });
});

describe("verifyToken", () => {
  it("menerima token jendela sekarang dan mengembalikan mode yang ditandatangani", () => {
    const tIn = mintToken("in", cfg, T0);
    const tOut = mintToken("out", cfg, T0);
    expect(verifyToken(tIn, cfg, T0)).toEqual({ ok: true, mode: "in" });
    expect(verifyToken(tOut, cfg, T0)).toEqual({ ok: true, mode: "out" });
  });

  it("menerima token jendela sebelumnya (grace 1) dan menolak yang lebih lama", () => {
    const prev = mintToken("in", cfg, T0 - 30_000);
    const old = mintToken("in", cfg, T0 - 60_000);
    expect(verifyToken(prev, cfg, T0)).toEqual({ ok: true, mode: "in" });
    expect(verifyToken(old, cfg, T0)).toEqual({ ok: false, reason: "expired" });
  });

  it("menolak token dari jendela masa depan", () => {
    const future = mintToken("in", cfg, T0 + 30_000);
    expect(verifyToken(future, cfg, T0)).toEqual({ ok: false, reason: "invalid" });
  });

  it("menolak token yang diubah satu karakter pada tanda tangan", () => {
    const t = mintToken("in", cfg, T0);
    const [kv, idx, sig] = t.split(".");
    const flipped = sig[0] === "A" ? "B" + sig.slice(1) : "A" + sig.slice(1);
    expect(verifyToken(`${kv}.${idx}.${flipped}`, cfg, T0)).toEqual({ ok: false, reason: "invalid" });
  });

  it("menolak token jika indeks jendela diubah (tanda tangan tidak cocok)", () => {
    const t = mintToken("in", cfg, T0);
    const [kv, idx, sig] = t.split(".");
    const bumped = `${kv}.${Number(idx) - 1}.${sig}`;
    expect(verifyToken(bumped, cfg, T0)).toEqual({ ok: false, reason: "invalid" });
  });

  it("menolak token versi kunci lama sebagai revoked", () => {
    const t = mintToken("in", { ...cfg, keyVersion: 1 }, T0);
    expect(verifyToken(t, { ...cfg, keyVersion: 2 }, T0)).toEqual({ ok: false, reason: "revoked" });
  });

  it("menolak secret berbeda", () => {
    const t = mintToken("in", cfg, T0);
    const other = { ...cfg, secret: "another-secret-that-is-also-long-enough-123456" };
    expect(verifyToken(t, other, T0)).toEqual({ ok: false, reason: "invalid" });
  });

  it.each([
    ["kosong", ""],
    ["bagian kurang", "1.2"],
    ["bagian berlebih", "1.2.3.4"],
    ["indeks bukan angka", "1.abc.AAAAAAAAAAAAAAAAAAAAAA"],
    ["tanda tangan terlalu pendek", `1.${windowIndex(T0, 30)}.AAAA`],
    ["terlalu panjang", "1." + "9".repeat(200) + ".AAAA"],
  ])("menolak format salah: %s", (_label, token) => {
    expect(verifyToken(token, cfg, T0)).toEqual({ ok: false, reason: "invalid" });
  });

  it("mengembalikan invalid, bukan melempar, untuk input non-string", () => {
    expect(verifyToken(undefined as unknown as string, cfg, T0)).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("mintAhead", () => {
  it("menghasilkan n+1 token berurutan dan semuanya valid pada waktunya", () => {
    const list = mintAhead("in", cfg, T0, 3);
    expect(list).toHaveLength(4);
    for (const item of list) {
      expect(verifyToken(item.token, cfg, item.validFromMs + 1_000)).toEqual({ ok: true, mode: "in" });
    }
  });
});
