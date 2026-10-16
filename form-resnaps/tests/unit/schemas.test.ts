import { describe, expect, it } from "vitest";
import { searchQuery, guestId, tokenInput, mode } from "@/lib/validation/schemas";

describe("searchQuery", () => {
  it("menerima query minimal 2 karakter dan melakukan auto-trim", () => {
    const res = searchQuery.safeParse({ q: "  an  " });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.q).toBe("an");
    }
  });

  it("menolak query kurang dari 2 karakter", () => {
    expect(searchQuery.safeParse({ q: "a" }).success).toBe(false);
    expect(searchQuery.safeParse({ q: "   " }).success).toBe(false);
  });

  it("menolak query melebihi 60 karakter", () => {
    expect(searchQuery.safeParse({ q: "a".repeat(61) }).success).toBe(false);
  });
});

describe("guestId", () => {
  it("menerima UUID v4 valid", () => {
    expect(guestId.safeParse({ guest_id: "4e77565a-fb15-4f49-b153-cdcbd6fc7348" }).success).toBe(true);
  });

  it("menolak format bukan UUID", () => {
    expect(guestId.safeParse({ guest_id: "bukan-uuid" }).success).toBe(false);
    expect(guestId.safeParse({ guest_id: "" }).success).toBe(false);
  });
});

describe("tokenInput & mode", () => {
  it("memvalidasi token input", () => {
    expect(tokenInput.safeParse({ t: "1.234.sig" }).success).toBe(true);
    expect(tokenInput.safeParse({ t: "" }).success).toBe(false);
  });

  it("hanya menerima mode in atau out", () => {
    expect(mode.safeParse("in").success).toBe(true);
    expect(mode.safeParse("out").success).toBe(true);
    expect(mode.safeParse("admin").success).toBe(false);
  });
});
