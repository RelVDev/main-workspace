// P12.10: Halaman 404 bergaya identitas RE:SNAPS.
import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-1 flex-col bg-canvas">
      <BrandHeader title="Halaman Tidak Ditemukan" subtitle="RE:SNAPS · Closing Party CHRYSALIS" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <Card className="flex flex-col items-center gap-4 p-8">
          <div className="flex size-16 items-center justify-center rounded-full bg-surface-soft text-brand-blue">
            <FileQuestion className="size-8" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-ink">404 — Tidak Ditemukan</h2>
            <p className="text-xs text-ink-muted">
              Halaman yang Anda tuju tidak tersedia atau tautan sudah kedaluwarsa.
            </p>
          </div>
          <Link href="/" className="w-full">
            <Button className="h-10 text-xs">
              <ArrowLeft className="size-4" />
              Kembali ke Halaman Utama
            </Button>
          </Link>
        </Card>
      </div>
    </main>
  );
}
