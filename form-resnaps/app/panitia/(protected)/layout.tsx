// P06.3 / P06.5 / P06.6 / P17: Layout terproteksi panitia yang bersih dan minimalis.
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  QrCode,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  ShieldCheck,
  UserCheck,
  ScanLine,
} from "lucide-react";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "./LogoutButton";

export default async function PanitiaProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getCommitteeAuth();

  if (!auth) {
    redirect("/panitia/login");
  }

  const isAdmin = auth.role === "admin";

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Strip identitas tipis */}
      <div className="h-1 w-full bg-gradient-brand" aria-hidden="true" />

      {/* Header navigasi panitia */}
      <header className="border-b border-line bg-surface/95 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <Link href="/panitia">
            <Logo className="size-8" subtitle="Panel Panitia" />
          </Link>

          <div className="flex items-center gap-2.5">
            <Badge tone={isAdmin ? "brand" : "neutral"} icon={isAdmin ? ShieldCheck : UserCheck}>
              {isAdmin ? "Admin" : "Panitia"}
            </Badge>
            <span className="hidden text-xs font-semibold text-ink-muted sm:inline">
              {auth.email}
            </span>
            <LogoutButton />
          </div>
        </div>

        {/* Tab navigasi utama yang ringkas & bersih */}
        <nav className="mx-auto mt-2.5 flex max-w-6xl gap-1 overflow-x-auto pb-0.5 text-xs font-bold sm:text-sm">
          <Link
            href="/panitia"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-ink transition hover:bg-surface-soft"
          >
            <LayoutDashboard className="size-4 text-brand-blue" />
            Dashboard
          </Link>
          <Link
            href="/panitia/scanner"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-purple/10 px-3 py-1.5 text-brand-purple ring-1 ring-brand-purple/20 transition hover:bg-brand-purple/15"
          >
            <ScanLine className="size-4 text-brand-magenta" />
            Scanner
          </Link>
          <Link
            href="/panitia/qr"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-ink transition hover:bg-surface-soft"
          >
            <QrCode className="size-4 text-brand-purple" />
            Layar QR
          </Link>
          <Link
            href="/panitia/tamu"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-ink transition hover:bg-surface-soft"
          >
            <Users className="size-4 text-brand-coral" />
            Daftar Tamu
          </Link>
          <Link
            href="/panitia/log"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-ink transition hover:bg-surface-soft"
          >
            <FileText className="size-4 text-brand-orange" />
            Log
          </Link>
          {isAdmin ? (
            <Link
              href="/panitia/pengaturan"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-ink transition hover:bg-surface-soft"
            >
              <Settings className="size-4 text-ink-muted" />
              Pengaturan
            </Link>
          ) : null}
        </nav>
      </header>

      {/* Konten halaman */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:py-6">
        {children}
      </main>
    </div>
  );
}
