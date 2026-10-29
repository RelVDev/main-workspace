// P06.3 / P06.5 / P06.6 / P17: Layout terproteksi panitia yang bersih, minimalis, dan instan.
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, UserCheck } from "lucide-react";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { Logo } from "@/components/brand/Logo";
import { PanitiaNav } from "@/components/dashboard/PanitiaNav";
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

        {/* Tab navigasi utama dengan prefetch & highlight instan */}
        <PanitiaNav isAdmin={isAdmin} />
      </header>

      {/* Konten halaman */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:py-6">
        {children}
      </main>
    </div>
  );
}
