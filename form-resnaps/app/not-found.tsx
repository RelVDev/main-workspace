// P12.10: Halaman 404 ramah pengguna dengan gaya brand RE:SNAPS.
import Link from "next/link";
import { SearchX, Home } from "lucide-react";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-1 flex-col bg-canvas">
      <BrandHeader title="Halaman Tidak Ditemukan" subtitle="RE:SNAPS · Closing Party CHRYSALIS" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <Card className="flex flex-col items-center gap-4 p-8 shadow-sm">
          <div className="flex size-16 items-center justify-center rounded-full bg-surface-soft text-brand-blue">
            <SearchX className="size-8" />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-ink">404 — Tidak Ditemukan</h2>
            <p className="text-sm text-ink-muted">
              Tautan yang kamu tuju salah atau halaman tersebut sudah dipindahkan.
            </p>
          </div>

          <Link
            href="/"
            className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95"
          >
            <Home className="size-4" />
            Kembali ke Beranda
          </Link>
        </Card>
      </div>
    </main>
  );
}
