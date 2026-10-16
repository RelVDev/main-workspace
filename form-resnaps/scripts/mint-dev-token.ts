// P05.11: cetak token QR untuk uji lokal. Tidak aktif di production.
import { mintToken, type Mode } from "../lib/qr-token";

if (process.env.NODE_ENV === "production") {
  console.error("mint-dev-token dilarang di production");
  process.exit(1);
}
const secret = process.env.QR_SIGNING_SECRET;
if (!secret || secret.length < 32) {
  console.error("QR_SIGNING_SECRET belum diset (≥32 karakter)");
  process.exit(1);
}
const mode = (process.argv[2] ?? "in") as Mode;
if (mode !== "in" && mode !== "out") {
  console.error("mode harus in|out");
  process.exit(1);
}
const keyVersion = Number(process.env.QR_KEY_VERSION ?? "1");
process.stdout.write(mintToken(mode, { secret, keyVersion, windowSeconds: 30, graceWindows: 1 }, Date.now()));
