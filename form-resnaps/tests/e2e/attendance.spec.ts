import { test, expect } from "@playwright/test";

test.describe("Alur Tamu Tanpa Sesi (P08 / P09 / P13.3)", () => {
  test("membuka /masuk tanpa token menampilkan layar petunjuk scan QR dan bebas overflow", async ({
    page,
  }) => {
    await page.goto("/masuk", { waitUntil: "domcontentloaded" });
    await expect(page.locator("text=Scan QR Terlebih Dahulu")).toBeVisible({ timeout: 10_000 });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1); // Bebas overflow horizontal
  });

  test("membuka /keluar tanpa token menampilkan layar petunjuk scan QR", async ({ page }) => {
    await page.goto("/keluar", { waitUntil: "domcontentloaded" });
    await expect(page.locator("text=Scan QR Terlebih Dahulu")).toBeVisible({ timeout: 10_000 });
  });

  test("halaman 404 menampilkan identitas brand RE:SNAPS", async ({ page }) => {
    await page.goto("/halaman-ngawur-tidak-ada", { waitUntil: "domcontentloaded" });
    await expect(page.locator("text=404 — Tidak Ditemukan")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Proteksi Autentikasi Panitia (P06 / P13.3)", () => {
  test("akses /panitia tanpa login diarahkan ke /panitia/login", async ({ page }) => {
    await page.goto("/panitia", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/panitia\/login/);
    await expect(page.locator("text=Login Panitia")).toBeVisible();
  });

  test("login dengan password salah menampilkan pesan error generik", async ({ page }) => {
    await page.goto("/panitia/login", { waitUntil: "domcontentloaded" });
    await page.fill('input[type="email"]', "admin@resnaps.local");
    await page.fill('input[type="password"]', "PasswordSalah123!");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=Email atau password salah.")).toBeVisible({ timeout: 10_000 });
  });
});
