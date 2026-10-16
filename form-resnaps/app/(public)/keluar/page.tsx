// P09: Halaman Absen Pulang (/keluar).
import { Suspense } from "react";
import { AttendanceFlow } from "@/components/attendance/AttendanceFlow";

export default function KeluarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas p-6 text-center text-sm font-semibold text-ink-muted">
          Menyiapkan halaman absen pulang...
        </div>
      }
    >
      <AttendanceFlow expectedMode="out" />
    </Suspense>
  );
}
