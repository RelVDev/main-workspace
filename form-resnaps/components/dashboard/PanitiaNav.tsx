// Navigasi tab panitia berkecepatan tinggi dengan prefetch otomatis & feedback visual instan (0ms).
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  QrCode,
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  ScanLine,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/panitia",
    label: "Dashboard",
    icon: LayoutDashboard,
    iconColor: "text-brand-blue",
    adminOnly: false,
  },
  {
    href: "/panitia/scanner",
    label: "Scanner",
    icon: ScanLine,
    iconColor: "text-brand-magenta",
    adminOnly: false,
  },
  {
    href: "/panitia/tamu",
    label: "Daftar Tamu",
    icon: Users,
    iconColor: "text-brand-coral",
    adminOnly: false,
  },
  {
    href: "/panitia/qr",
    label: "Layar QR",
    icon: QrCode,
    iconColor: "text-brand-purple",
    adminOnly: false,
  },
  {
    href: "/panitia/log",
    label: "Log",
    icon: FileText,
    iconColor: "text-brand-orange",
    adminOnly: false,
  },
  {
    href: "/panitia/pengaturan",
    label: "Pengaturan",
    icon: Settings,
    iconColor: "text-ink-muted",
    adminOnly: true,
  },
] as const;

export function PanitiaNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);

  // Reset optimistic highlight saat pathname asli berubah
  useEffect(() => {
    setOptimisticPath(null);
  }, [pathname]);

  // Prefetch seluruh rute panitia saat komponen terpasang agar klik berpindah instan
  useEffect(() => {
    for (const item of NAV_ITEMS) {
      if (item.adminOnly && !isAdmin) continue;
      router.prefetch(item.href);
    }
  }, [router, isAdmin]);

  const currentActive = optimisticPath ?? pathname;

  return (
    <nav className="mx-auto mt-2.5 flex max-w-6xl gap-1 overflow-x-auto pb-0.5 text-xs font-bold sm:text-sm">
      {NAV_ITEMS.map((item) => {
        if (item.adminOnly && !isAdmin) return null;
        const Icon = item.icon;
        const isActive =
          item.href === "/panitia"
            ? currentActive === "/panitia"
            : currentActive?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onClick={() => setOptimisticPath(item.href)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 transition ${
              isActive
                ? "bg-brand-blue/10 font-black text-brand-blue ring-1 ring-brand-blue/25"
                : "text-ink hover:bg-surface-soft"
            }`}
          >
            <Icon className={`size-4 ${isActive ? "text-brand-blue" : item.iconColor}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
