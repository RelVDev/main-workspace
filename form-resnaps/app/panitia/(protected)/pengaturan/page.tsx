// P06.5 / P11.7: Halaman pengaturan khusus Admin. Role committee ditolak.
import { redirect } from "next/navigation";
import { getCommitteeAuth } from "@/lib/supabase/server";

export default async function PanitiaPengaturanPage() {
  const auth = await getCommitteeAuth();

  if (!auth || auth.role !== "admin") {
    redirect("/panitia");
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-ink">Pengaturan Sistem Absensi</h1>
      <p className="text-sm text-ink-muted">
        Halaman ini hanya dapat diakses oleh panitia dengan peran <span className="font-semibold text-brand-blue">Admin</span>.
      </p>
    </div>
  );
}
