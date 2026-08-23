"use server";

import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAIProvider, type MealNutritionDraft } from "@/lib/ai";

export type EstimateResult =
  | { success: true; draft: MealNutritionDraft }
  | { success: false; error: string };

/**
 * フォームのボタンから直接呼び出すServer Action(useActionStateは使わない)。
 * 呼び出し側でReactのstateに結果を反映し、その場でフィールドを更新する。
 */
export async function estimateMealFromText(text: string): Promise<EstimateResult> {
  const user = await requireAllowedUser();

  const trimmed = text.trim();
  if (!trimmed) {
    return { success: false, error: "食べたものを入力してください。" };
  }
  if (trimmed.length > 1000) {
    return { success: false, error: "入力が長すぎます。" };
  }

  try {
    const rateLimit = await checkRateLimit(user.id, "meal-estimate", {
      limit: 60,
      windowSeconds: 60 * 60 * 24,
    });
    if (!rateLimit.success) {
      return {
        success: false,
        error: "本日の推定回数の上限に達しました。しばらくしてから再度お試しください。",
      };
    }

    const provider = getAIProvider();
    const draft = await provider.analyzeMealFromText(trimmed);
    return { success: true, draft };
  } catch (error) {
    console.error("meal text estimate failed", error instanceof Error ? error.message : error);
    return { success: false, error: "推定に失敗しました。もう一度お試しください。" };
  }
}
