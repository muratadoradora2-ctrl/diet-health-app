"use server";

import { redirect } from "next/navigation";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { getOrCreateProfile } from "@/lib/data/profile";
import { checkRateLimit } from "@/lib/rate-limit";
import { getOrGenerateWeeklyReview } from "@/lib/advice/weekly";

export type ReviewRefreshState = { error?: string };

export async function refreshWeeklyReview(
  _prevState: ReviewRefreshState,
  formData: FormData,
): Promise<ReviewRefreshState> {
  void formData;
  const user = await requireAllowedUser();

  const rateLimit = await checkRateLimit(user.id, "weekly-review", {
    limit: 10,
    windowSeconds: 60 * 60 * 24,
  });
  if (!rateLimit.success) {
    return { error: "本日のレビュー更新回数の上限に達しました。しばらくしてから再度お試しください。" };
  }

  try {
    const profile = await getOrCreateProfile(user.id, user.email);
    await getOrGenerateWeeklyReview(user.id, profile.display_name, true);
  } catch (error) {
    console.error("weekly review refresh failed", error instanceof Error ? error.message : error);
    return { error: "レビューの更新に失敗しました。もう一度お試しください。" };
  }

  redirect("/reviews");
}
