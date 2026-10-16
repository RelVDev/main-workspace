// P07.8: Halaman Layar QR Dinamis Gerbang Closing Party CHRYSALIS.
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { Logo } from "@/components/brand/Logo";
import { QrDisplay } from "@/components/qr/QrDisplay";

export default async function PanitiaQrPage() {
  const auth = await getCommitteeAuth();
  if (!auth) {
    redirect("/panitia/login?next=/panitia/qr");
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-canvas">
      {/* Efek Ambient Glow / Festival Bokeh di Latar Belakang */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-brand-blue/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 -right-32 size-96 rounded-full bg-brand-purple/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/3 size-96 rounded-full bg-brand-gold/15 blur-3xl"
      />

      {/* Strip tipis gradien di tepi atas */}
      <div className="relative z-20 h-2 w-full bg-gradient-brand shadow-sm" aria-hidden="true" />

      {/* Bar navigasi perayaan untuk panitia */}
      <header className="relative z-20 flex items-center justify-between border-b border-line/60 bg-surface/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <Link
          href="/panitia"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface/90 px-3 py-1.5 text-xs font-bold text-ink shadow-2xs backdrop-blur-md transition hover:bg-surface-soft"
        >
          <ArrowLeft className="size-3.5" />
          <span className="hidden sm:inline">Kembali ke</span> Dashboard
        </Link>

        <div className="flex items-center gap-2">
          <Logo className="size-8" />
          <div className="hidden h-5 w-px bg-line/80 md:block" />
          <div className="hidden items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-purple md:flex">
            <Sparkles className="size-3.5 text-brand-gold" />
            <span>Gerbang Kehadiran Tamu</span>
          </div>
        </div>

        <span className="rounded-full bg-surface-soft/80 px-3 py-1 text-xs font-bold text-ink-muted backdrop-blur-sm">
          {auth.email}
        </span>
      </header>

      {/* Area Tengah: Layar QR Responsif */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
        <QrDisplay />
      </main>
    </div>
  );
}
