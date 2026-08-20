"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export type SignInState = { error?: string };

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "メールアドレスとパスワードを正しく入力してください。" };
  }

  // 2アカウントしかないアプリでも、パスワードの総当たり試行を抑止するため、
  // メールアドレスの試行回数でRate Limitする（識別子はハッシュ化して送信）。
  const rateLimit = await checkRateLimit(
    parsed.data.email.toLowerCase(),
    "login",
    { limit: 5, windowSeconds: 300 },
  );
  if (!rateLimit.success) {
    return {
      error: "試行回数が多すぎます。5分ほど待ってから再度お試しください。",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません。" };
  }

  redirect("/home");
}
