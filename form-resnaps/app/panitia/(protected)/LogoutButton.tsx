// P06.6: Tombol keluar panitia dengan pembersihan sesi client dan redirect ke login.
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/panitia/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-error hover:bg-surface-soft disabled:opacity-50"
      title="Keluar dari akun panitia"
    >
      <LogOut className="size-3.5" />
      {isPending ? "Keluar..." : "Keluar"}
    </button>
  );
}
