// P02.5: notifikasi singkat, live region polite.
"use client";

import type { ReactNode } from "react";

export function Toast({ children, visible }: { children: ReactNode; visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-card bg-ink px-4 py-3 text-base text-white shadow-lg transition-opacity ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
