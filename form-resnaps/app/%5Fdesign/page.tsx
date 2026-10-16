// P02.6: katalog komponen. Hanya tersedia di non-production (notFound di production).
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowRight, Info, LogIn, LogOut, Search, Users } from "lucide-react";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { DesignSegment } from "./DesignSegment";

export default function DesignCatalog() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex flex-1 flex-col">
      <BrandHeader title="Katalog Komponen" subtitle="RE:SNAPS · Closing Party CHRYSALIS" />
      <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-6">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Tombol</h2>
          <Button>Ya, absen masuk</Button>
          <Button variant="secondary">Bukan saya</Button>
          <Button variant="danger">Cabut semua sesi</Button>
          <Button disabled>Tombol nonaktif</Button>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Input</h2>
          <Input placeholder="Cari namamu" aria-label="Cari nama" type="search" />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Status (selalu ikon + label)</h2>
          <StatusBanner kind="success" title="Absen masuk tercatat">Pukul 18.04 WIB</StatusBanner>
          <StatusBanner kind="warning" title="Sesi berakhir dalam 1:42" />
          <StatusBanner kind="error" title="Absen masuk sedang ditutup" />
          <StatusBanner kind="info" title="Untuk absen orang lain, scan ulang QR di layar." />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Badge</h2>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral" icon={Users}>Belum hadir</Badge>
            <Badge tone="success" icon={LogIn}>Di dalam</Badge>
            <Badge tone="info" icon={LogOut}>Sudah pulang</Badge>
            <Badge tone="brand" icon={Info}>Divisi Acara</Badge>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Mode (Masuk / Pulang)</h2>
          <DesignSegment />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Kartu, skeleton, kosong</h2>
          <Card>
            <p className="font-semibold">Anindya Putri Maharani</p>
            <p className="text-sm text-ink-muted">Divisi Dokumentasi</p>
          </Card>
          <Skeleton className="h-12 w-full" />
          <EmptyState icon={Search} title="Nama tidak ditemukan">
            Mungkin kamu sudah absen, atau namamu belum terdaftar. Hubungi panitia di meja registrasi.
          </EmptyState>
          <EmptyState icon={AlertTriangle} title="Tidak ada data" />
          <Card className="flex items-center gap-2 text-sm text-ink-muted">
            <ArrowRight aria-hidden={true} className="size-4" /> Kartu memakai surface putih, bukan gradien.
          </Card>
        </section>
      </div>
    </main>
  );
}
