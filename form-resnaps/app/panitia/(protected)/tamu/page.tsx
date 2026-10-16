// P10.5 / P11.1: Halaman Daftar Tamu & Aksi Operasional Panitia.
import { getCommitteeAuth } from "@/lib/supabase/server";
import { TamuTableClient } from "@/components/dashboard/TamuTableClient";

export default async function PanitiaTamuPage() {
  const auth = await getCommitteeAuth();
  const isAdmin = auth?.role === "admin";

  return <TamuTableClient isAdmin={isAdmin} />;
}
