// P07.8: Halaman Layar QR Dinamis (Layar Penuh).
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { Logo } from "@/components/brand/Logo";
import { QrDisplay } from "@/components/qr/QrDisplay";

export default async function PanitiaQrPage() {
  const auth = await getCommitteeAuth();
  if (!auth) {
    redirect("/panitia/login?next=/panitia/qr");
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Strip tipis gradien di tepi atas (P07.11 / §7) */}
      <div className="h-2 w-full bg-gradient-brand" aria-hidden="true" />

      {/* Bar navigasi minimal untuk panitia */}
      <header className="flex items-center justify-between border-b border-line bg-surface/80 px-4 py-2.5 backdrop-blur-sm">
        <Link
          href="/panitia"
          className="inline-flex items-center gap-1.5 rounded-control px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-soft"
        >
          <ArrowLeft className="size-3.5" />
          Dashboard
        </Link>

        <div className="flex items-center gap-2">
          <Logo className="h-6 w-auto" />
          <span className="text-xs font-bold uppercase tracking-wider text-ink">Layar QR</span>
        </div>

        <span className="text-xs text-ink-muted">{auth.email}</span>
      </header>

      {/* Area Tengah: Layar QR Responsif */}
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
        <QrDisplay />
      </main>
    </div>
  );
}
