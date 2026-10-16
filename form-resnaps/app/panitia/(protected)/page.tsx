// P10: Halaman Dashboard Panitia terproteksi (mendukung mode normal dan mode TV ?tv=1).
import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function PanitiaDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tv?: string }>;
}) {
  const params = await searchParams;
  const isTv = params.tv === "1";

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-12 text-center text-sm font-semibold text-ink-muted">
          Memuat data dashboard...
        </div>
      }
    >
      <DashboardClient isTvMode={isTv} />
    </Suspense>
  );
}
