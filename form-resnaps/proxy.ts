// P06.3: Next.js 16 Proxy (pengganti middleware) untuk proteksi rute panitia.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hanya periksa rute /panitia dan API panitia / export
  const isPanitiaPage = pathname.startsWith("/panitia") && pathname !== "/panitia/login";
  const isPanitiaApi = pathname.startsWith("/api/panitia") || pathname.startsWith("/api/export");

  if (!isPanitiaPage && !isPanitiaApi) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Ambil token dari header Authorization bila ada (misal dari API client / tools)
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : undefined;

  // Ambil user dan refresh sesi auth bila mendekati kedaluwarsa (P06.7)
  const {
    data: { user },
  } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser();

  if (!user) {
    if (isPanitiaApi) {
      return NextResponse.json(
        { ok: false, code: "unauthorized", message: "Sesi login panitia diperlukan." },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }
    const loginUrl = new URL("/panitia/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/panitia/:path*", "/api/panitia/:path*", "/api/export"],
};
