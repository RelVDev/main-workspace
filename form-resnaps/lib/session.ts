// P05.3: cookie sesi scan `rs_session` = `{sessionId}.{hmac}` ditandatangani SESSION_COOKIE_SECRET.
// Cookie hanya memuat id sesi; semua status (mode, konsumsi, kedaluwarsa) dicek di DB.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "rs_session";
export const DEVICE_LOCK_COOKIE = "rs_device_guest";

function secret(): string {
  const s = process.env.SESSION_COOKIE_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_COOKIE_SECRET tidak valid");
  return s;
}

function sign(sessionId: string): string {
  return createHmac("sha256", secret()).update(sessionId).digest("base64url");
}

export function encodeSessionCookie(sessionId: string): string {
  return `${sessionId}.${sign(sessionId)}`;
}

/** Mengembalikan sessionId bila tanda tangan valid; null bila tidak. Constant-time. */
export function decodeSessionCookie(raw: string | undefined): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const want = Buffer.from(sign(id));
  const got = Buffer.from(sig);
  if (want.length !== got.length) return null;
  return timingSafeEqual(want, got) ? id : null;
}

export async function readSessionId(): Promise<string | null> {
  const jar = await cookies();
  return decodeSessionCookie(jar.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(sessionId: string, maxAgeSeconds: number): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, encodeSessionCookie(sessionId), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Membaca ID tamu yang terkunci pada perangkat/browser ini (anti-titip absen). */
export async function readDeviceGuestId(): Promise<string | null> {
  const jar = await cookies();
  return decodeSessionCookie(jar.get(DEVICE_LOCK_COOKIE)?.value);
}

/** Mengunci perangkat/browser ini ke satu guestId selama 24 jam. */
export async function setDeviceGuestCookie(guestId: string): Promise<void> {
  const jar = await cookies();
  jar.set(DEVICE_LOCK_COOKIE, encodeSessionCookie(guestId), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 jam
  });
}

/** Membuka kunci perangkat bila Admin melakukan recovery / pembatalan absen. */
export async function clearDeviceGuestCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(DEVICE_LOCK_COOKIE);
}
