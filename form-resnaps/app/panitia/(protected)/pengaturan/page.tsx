// P06.5 / P11.7: Halaman pengaturan khusus Admin. Role committee ditolak.
import { redirect } from "next/navigation";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { PengaturanClient } from "@/components/dashboard/PengaturanClient";

export default async function PanitiaPengaturanPage() {
  const auth = await getCommitteeAuth();

  if (!auth || auth.role !== "admin") {
    redirect("/panitia");
  }

  return <PengaturanClient />;
}
