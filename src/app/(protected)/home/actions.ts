"use server";

import { redirect } from "next/navigation";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { getOrCreateProfile } from "@/lib/data/profile";
import { checkRateLimit } from "@/lib/rate-limit";
import { getOrGenerateDailyAdvice } from "@/lib/advice/daily";

export type AdviceRefreshState = { error?: string };

export async function refreshDailyAdvice(
  _prevState: AdviceRefreshState,
  formData: FormData,
): Promise<AdviceRefreshState> {
  void formData;
  const user = await requireAllowedUser();

  const rateLimit = await checkRateLimit(user.id, "daily-advice", {
    limit: 20,
    windowSeconds: 60 * 60 * 24,
  });
  if (!rateLimit.success) {
    return { error: "本日のアドバイス更新回数の上限に達しました。しばらくしてから再度お試しください。" };
  }

  try {
    const profile = await getOrCreateProfile(user.id, user.email);
    await getOrGenerateDailyAdvice(user.id, profile.display_name, true);
  } catch (error) {
    console.error("daily advice refresh failed", error instanceof Error ? error.message : error);
    return { error: "アドバイスの更新に失敗しました。もう一度お試しください。" };
  }

  redirect("/home");
}
