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
      {/* Strip tipis gradien di tepi atas */}
      <div className="h-2 w-full bg-gradient-brand" aria-hidden="true" />

      {/* Bar navigasi minimal untuk panitia */}
      <header className="flex items-center justify-between border-b border-line bg-surface/90 px-4 py-2.5 backdrop-blur-md">
        <Link
          href="/panitia"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink shadow-2xs hover:bg-surface-soft"
        >
          <ArrowLeft className="size-3.5" />
          Dashboard
        </Link>

        <Logo className="size-7" />

        <span className="hidden text-xs font-semibold text-ink-muted sm:inline">{auth.email}</span>
      </header>

      {/* Area Tengah: Layar QR Responsif */}
      <main className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
        <QrDisplay />
      </main>
    </div>
  );
}
