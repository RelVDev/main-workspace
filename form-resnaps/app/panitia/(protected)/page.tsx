// P06.3 / P10: Dashboard Panitia.
import { getCommitteeAuth } from "@/lib/supabase/server";

export default async function PanitiaDashboardPage() {
  const auth = await getCommitteeAuth();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-ink">Dashboard Panitia</h1>
      <p className="text-sm text-ink-muted">
        Selamat datang, <span className="font-semibold text-ink">{auth?.email}</span>. Pantau kehadiran tamu secara real-time.
      </p>
    </div>
  );
}
