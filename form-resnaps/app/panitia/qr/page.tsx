// P06.3 / P07: Layar QR Dinamis (Layar Penuh).
import { redirect } from "next/navigation";
import { getCommitteeAuth } from "@/lib/supabase/server";

export default async function PanitiaQrPage() {
  const auth = await getCommitteeAuth();
  if (!auth) {
    redirect("/panitia/login?next=/panitia/qr");
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="h-2 w-full bg-gradient-brand" aria-hidden="true" />
      <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-ink">Layar QR Dinamis</h1>
        <p className="text-sm text-ink-muted">Komponen Layar QR akan dimuat di Phase 07.</p>
      </main>
    </div>
  );
}
