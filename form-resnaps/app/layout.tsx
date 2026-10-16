import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// P02.3: font default sementara (§7). Ganti bila panduan merek resmi menentukan lain.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RE:SNAPS — Sistem Absensi",
  description: "Sistem absensi RE:SNAPS",
  robots: { index: false, follow: false },
};

// P11.x/P12: theme-color dan viewport mobile (P08.11 ikut dipenuhi di sini).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Nilai sama dengan --brand-blue di styles/tokens.css (meta tag tidak bisa membaca CSS var).
  themeColor: "#1677B8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
