import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service Role Key(RLSを迂回する)を使う唯一の許可されたクライアント。
 * docs/phase2-security-notes.md に記載の例外にのみ使用する:
 *   daily_ai_advice / weekly_ai_reviews への INSERT/UPDATE(AI生成物の保存)。
 *
 * 安全に使うための前提:
 *   1. このファイルはサーバー専用コードからのみimportされる("server-only")。
 *   2. 呼び出し元は必ず事前に requireAllowedUser() 相当の認可チェックを
 *      独自に行い、その結果得た user.id だけを user_id 列に書き込む
 *      (このクライアント自身はリクエストのユーザーを一切知らない)。
 *   3. SELECT(読み取り)にはこの例外を適用せず、通常のRLS対応クライアント
 *      (src/lib/supabase/server.ts)を使う。
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
