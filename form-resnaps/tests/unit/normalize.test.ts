import { describe, expect, it } from "vitest";
import { normalizeNameJs } from "@/lib/normalize";

describe("normalizeNameJs", () => {
  it("mengubah huruf besar menjadi huruf kecil dan memotong spasi liar", () => {
    expect(normalizeNameJs("  ANINDYA PUTRI   MAHARANI  ")).toBe("anindya putri maharani");
  });

  it("menghapus tanda aksen (unaccent) agar cocok dengan PostgreSQL", () => {
    expect(normalizeNameJs("Ádhitya Gunawan")).toBe("adhitya gunawan");
    expect(normalizeNameJs("Ñoel Ramírez")).toBe("noel ramirez");
    expect(normalizeNameJs("Renée François")).toBe("renee francois");
  });

  it("menghapus karakter kontrol tersembunyi", () => {
    expect(normalizeNameJs("Budi\x00\x1F\x7FSantoso")).toBe("budisantoso");
  });

  it("mengembalikan string kosong untuk input kosong", () => {
    expect(normalizeNameJs("")).toBe("");
    expect(normalizeNameJs("    ")).toBe("");
  });
});
