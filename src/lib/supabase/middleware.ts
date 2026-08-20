import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ログイン不要でアクセスできる唯一のページ。
const PUBLIC_PATHS = ["/login"];

/**
 * Middlewareでのセッション確認。
 *
 * 重要: これはUXのための早期リダイレクトに過ぎず、唯一のセキュリティ境界
 * ではない。「ログイン済みかどうか」だけを見ており、allowlist登録の有無は
 * 確認しない。allowlist確認と本人データへのアクセス許可は、
 * - 各Server Component / Server Action / Route Handlerから呼ぶ
 *   requireAllowedUser()（src/lib/auth/require-allowed-user.ts）
 * - Supabase RLS（最終防御層、DB側で独立して再判定）
 * の2箇所で、こことは独立に必ず再確認される。
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
