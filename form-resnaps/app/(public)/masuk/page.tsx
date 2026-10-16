// P08: Halaman Absen Masuk (/masuk).
import { Suspense } from "react";
import { AttendanceFlow } from "@/components/attendance/AttendanceFlow";

export default function MasukPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas p-6 text-center text-sm font-semibold text-ink-muted">
          Menyiapkan halaman absen masuk...
        </div>
      }
    >
      <AttendanceFlow expectedMode="in" />
    </Suspense>
  );
}
