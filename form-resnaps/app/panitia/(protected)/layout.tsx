// P06.3 / P06.5 / P06.6: Layout terproteksi panitia dengan navigasi role & logout.
import { redirect } from "next/navigation";
import Link from "next/link";
import { QrCode, LayoutDashboard, Users, FileText, Settings, ShieldCheck, UserCheck } from "lucide-react";
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
      <div className="h-1.5 w-full bg-gradient-brand" aria-hidden="true" />

      {/* Header navigasi panitia */}
      <header className="border-b border-line bg-surface px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo className="h-7 w-auto" />
            <div className="hidden h-5 w-px bg-line sm:block" />
            <span className="text-sm font-semibold text-ink">Panel Panitia</span>
          </div>

          <div className="flex items-center gap-3">
            <Badge tone={isAdmin ? "brand" : "neutral"} icon={isAdmin ? ShieldCheck : UserCheck}>
              {isAdmin ? "Admin" : "Panitia"}
            </Badge>
            <span className="hidden text-sm text-ink-muted sm:inline">{auth.email}</span>
            <LogoutButton />
          </div>
        </div>

        {/* Tab navigasi utama */}
        <nav className="mx-auto mt-3 flex max-w-6xl gap-1 overflow-x-auto pb-1 text-sm font-semibold">
          <Link
            href="/panitia"
            className="inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-ink hover:bg-surface-soft"
          >
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
          <Link
            href="/panitia/qr"
            className="inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-ink hover:bg-surface-soft"
          >
            <QrCode className="size-4" />
            Layar QR
          </Link>
          <Link
            href="/panitia/tamu"
            className="inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-ink hover:bg-surface-soft"
          >
            <Users className="size-4" />
            Tamu
          </Link>
          <Link
            href="/panitia/log"
            className="inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-ink hover:bg-surface-soft"
          >
            <FileText className="size-4" />
            Log
          </Link>
          {isAdmin ? (
            <Link
              href="/panitia/pengaturan"
              className="inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-ink hover:bg-surface-soft"
            >
              <Settings className="size-4" />
              Pengaturan
            </Link>
          ) : null}
        </nav>
      </header>

      {/* Konten halaman */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6">
        {children}
      </main>
    </div>
  );
}
