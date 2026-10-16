// P12.10: Halaman Error boundary global bergaya identitas RE:SNAPS.
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error secara internal (tanpa membocorkan PII ke log publik)
    console.error("Application error boundary caught:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-canvas">
      <BrandHeader title="Terjadi Kendala" subtitle="RE:SNAPS · Closing Party CHRYSALIS" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <Card className="flex flex-col items-center gap-4 border-error/30 p-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-error/10 text-error">
            <AlertCircle className="size-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-ink">Terjadi Kendala Sistem</h2>
            <p className="text-xs text-ink-muted">
              Sistem gagal memproses permintaan Anda. Silakan coba kembali atau hubungi panitia teknis.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 pt-2">
            <Button onClick={() => reset()} className="h-10 text-xs">
              <RotateCcw className="size-4" />
              Coba Muat Ulang
            </Button>
            <Link href="/" className="w-full">
              <Button variant="secondary" className="h-10 text-xs">
                <Home className="size-4" />
                Halaman Utama
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
