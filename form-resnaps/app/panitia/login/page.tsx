// P06.2: Halaman login panitia. Pesan error generik ("Email atau password salah").
"use client";

import { Suspense, useState, useTransition, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/panitia";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg("Email dan password wajib diisi.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // P06.2: pesan error generik agar tidak membocorkan keberadaan email
        setErrorMsg("Email atau password salah.");
        return;
      }

      router.push(nextUrl);
      router.refresh();
    });
  }

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-ink">Login Panitia</h2>
        <p className="text-sm text-ink-muted">
          Masukkan email dan password panitia yang telah didaftarkan.
        </p>
      </div>

      {errorMsg ? (
        <StatusBanner kind="error" title="Gagal Masuk">
          {errorMsg}
        </StatusBanner>
      ) : null}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-semibold text-ink">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-semibold text-ink">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
          />
        </div>

        <Button type="submit" disabled={isPending} className="mt-2">
          <LogIn className="size-5" />
          {isPending ? "Memeriksa..." : "Masuk ke Dashboard"}
        </Button>
      </form>
    </Card>
  );
}

export default function PanitiaLoginPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col">
      <BrandHeader title="Masuk Panitia" subtitle="Portal Pengelolaan Absensi RE:SNAPS" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
        <Suspense fallback={<Card className="p-8 text-center text-ink-muted">Memuat formulir...</Card>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
