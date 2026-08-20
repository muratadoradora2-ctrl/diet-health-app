import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Component / Server Action / Route Handler から使うSupabaseクライアント。
 * ログイン中ユーザーのセッション（Cookie）で動作するため、
 * 発行するすべてのクエリはSupabase RLSの対象になる。
 * anon keyのみを使用し、Service Role Keyはここでは扱わない。
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Componentから呼ばれた場合はCookieを書き換えられないが、
            // セッションの更新はmiddlewareが担当するため無視して問題ない。
          }
        },
      },
    },
  );
}
