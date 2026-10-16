// P12.10: Error boundary ramah pengguna dengan gaya brand RE:SNAPS.
"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Tidak log PII, hanya pesan error
    console.error("Terjadi error aplikasi:", error.message);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-1 flex-col bg-canvas">
      <BrandHeader title="Kendala Sistem" subtitle="RE:SNAPS · Closing Party CHRYSALIS" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <Card className="flex flex-col items-center gap-4 p-8 shadow-sm">
          <div className="flex size-16 items-center justify-center rounded-full bg-error/10 text-error">
            <AlertCircle className="size-8" />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-ink">Terjadi Kendala Teknis</h2>
            <p className="text-sm text-ink-muted">
              Sistem mengalami masalah sementara saat memproses permintaanmu. Silakan muat ulang halaman.
            </p>
          </div>

          <Button onClick={() => reset()} className="mt-2 text-sm">
            <RotateCcw className="size-4" />
            Coba Lagi
          </Button>
        </Card>
      </div>
    </main>
  );
}
