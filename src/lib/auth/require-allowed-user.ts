import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AllowedUser = {
  id: string;
  email: string;
};

/**
 * Server Component / Server Action / Route Handlerから呼ぶ、独立した認可チェック。
 *
 * Middlewareが実行されたことを前提にせず、ここで改めて
 * (a) 有効なSupabaseセッションがあるか
 * (b) allowed_usersにuser_id(uuid)で登録済みか
 * を確認する。allowed_usersへの問い合わせ自体もRLS
 * （auth.uid() = user_idの行のみ見える）の対象になるため、
 * このチェックが「本人の行が存在するか」以外の情報を返すことはない。
 *
 * このチェックを通過した後の実データ取得も、必ずRLSを最終防御層として
 * 経由する（ここでの判定だけに依存しない）。
 */
export async function requireAllowedUser(): Promise<AllowedUser> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: allowedRow, error: allowlistError } = await supabase
    .from("allowed_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (allowlistError || !allowedRow) {
    await supabase.auth.signOut();
    redirect("/login?error=not_allowed");
  }

  return { id: user.id, email: user.email ?? "" };
}
