"use server";

import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAIProvider, type MealNutritionDraft } from "@/lib/ai";
import { sniffImageMimeType } from "@/lib/image-validation";

// Vercelのリクエストサイズ上限(約4.5MB、変更不可)を超えないよう4MBに設定。
// next.config.tsのserverActions.bodySizeLimitも同じ値に揃えている。
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export type MealScanState = {
  status: "idle" | "error" | "success";
  error?: string;
  draft?: MealNutritionDraft;
};

const GENERIC_ERROR: MealScanState = {
  status: "error",
  error: "画像の解析に失敗しました。もう一度お試しいただくか、テキストでの入力をご利用ください。",
};

/**
 * 体組成スクリーンショットの解析(analyzeBodyCompositionImage)と同じ方針。
 * 画像はこの関数のスコープ内(メモリ上)でのみ扱い、ディスク・Supabase
 * Storage・DBのいずれにも書き込まない。抽出した内容は確認画面へ返すだけで
 * ここでは保存しない。
 */
export async function analyzeMealImage(
  _prevState: MealScanState,
  formData: FormData,
): Promise<MealScanState> {
  const user = await requireAllowedUser();

  try {
    const rateLimit = await checkRateLimit(user.id, "meal-scan", {
      limit: 30,
      windowSeconds: 60 * 60 * 24,
    });
    if (!rateLimit.success) {
      return {
        status: "error",
        error: "本日の解析回数の上限に達しました。しばらくしてから再度お試しください。",
      };
    }

    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return { status: "error", error: "写真を選択してください。" };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { status: "error", error: "画像サイズが大きすぎます(4MBまでです)。" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = sniffImageMimeType(buffer);
    if (!mimeType) {
      return {
        status: "error",
        error: "対応していない画像形式です(PNG・JPEGの写真をお使いください)。",
      };
    }

    const provider = getAIProvider();
    const draft = await provider.analyzeMealFromImage({ data: buffer, mimeType });
    return { status: "success", draft };
  } catch (error) {
    console.error("meal image scan failed", error instanceof Error ? error.message : error);
    return GENERIC_ERROR;
  }
}
