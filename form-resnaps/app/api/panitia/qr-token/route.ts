// P07.1: Mengambil token QR dinamis (hanya untuk panitia terautentikasi).
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadQrConfig, setting } from "@/lib/settings";
import { mintToken, mintAhead, type Mode } from "@/lib/qr-token";
import { fail, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) {
    return fail("session_invalid");
  }

  const { searchParams } = req.nextUrl;
  const modeParam = searchParams.get("mode");
  const mode: Mode = modeParam === "out" ? "out" : "in";
  const aheadParam = Number(searchParams.get("ahead") ?? "3");
  const aheadCount = Math.min(Math.max(Number.isFinite(aheadParam) ? aheadParam : 3, 0), 5);

  const cfg = await loadQrConfig();
  if (!cfg.ok) return fail("internal");

  const db = createAdminClient();
  const settingKey = mode === "in" ? "checkin_open" : "checkout_open";
  const isOpen = (await setting(db, settingKey)) === true;

  const now = Date.now();

  // Fail-closed: jika absen mode ini ditutup, jangan kirim token sama sekali (P07.1)
  if (!isOpen) {
    return ok({
      open: false,
      mode,
      serverNow: now,
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const basePath = mode === "in" ? "/masuk" : "/keluar";

  const currentToken = mintToken(mode, cfg.value, now);
  const currentUrl = `${siteUrl}${basePath}?t=${currentToken}`;

  const windowSec = cfg.value.windowSeconds ?? 30;
  const currentWindowIdx = Math.floor(Math.floor(now / 1000) / windowSec);
  const expiresAtMs = (currentWindowIdx + 1) * windowSec * 1000;

  const aheadTokens = mintAhead(mode, cfg.value, now, aheadCount).map((item) => ({
    url: `${siteUrl}${basePath}?t=${item.token}`,
    validFrom: new Date(item.validFromMs).toISOString(),
  }));

  return ok({
    open: true,
    mode,
    url: currentUrl,
    windowSeconds: windowSec,
    expiresAt: new Date(expiresAtMs).toISOString(),
    serverNow: now,
    ahead: aheadTokens,
  });
}
