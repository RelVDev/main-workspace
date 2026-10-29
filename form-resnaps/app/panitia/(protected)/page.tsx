// P10: Halaman Dashboard Panitia terproteksi (mendukung mode normal dan mode TV ?tv=1).
import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default function PanitiaDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-12 text-center text-sm font-semibold text-ink-muted">
          Memuat dashboard...
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
