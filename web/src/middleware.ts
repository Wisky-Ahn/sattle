import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 세션 갱신
  const { data: { user } } = await supabase.auth.getUser();

  // 보호된 경로: 로그인 필요
  const protectedPaths = ["/instructor", "/student"];
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  // TODO: OAuth 프로바이더 설정 완료 후 아래 주석 해제
  // if (isProtected && !user) {
  //   const loginUrl = new URL("/login", request.url);
  //   loginUrl.searchParams.set("next", request.nextUrl.pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  return supabaseResponse;
}

export const config = {
  matcher: ["/instructor/:path*", "/student/:path*"],
};
