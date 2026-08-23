"use server";

import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAIProvider, type BodyCompositionDraft } from "@/lib/ai";
import { sniffImageMimeType } from "@/lib/image-validation";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type ScanState = {
  status: "idle" | "error" | "success";
  error?: string;
  draft?: BodyCompositionDraft;
};

export const initialScanState: ScanState = { status: "idle" };

/**
 * アップロードされた画像はこの関数のスコープ内(メモリ上)でのみ扱い、
 * ディスク・Supabase Storage・DBのいずれにも書き込まない。
 * 関数を抜けるとBufferは参照を失い、ガベージコレクションの対象になる。
 * 抽出した数値はここでは保存せず、確認画面へ返すだけ。
 */
export async function analyzeBodyCompositionImage(
  _prevState: ScanState,
  formData: FormData,
): Promise<ScanState> {
  const user = await requireAllowedUser();

  const rateLimit = await checkRateLimit(user.id, "body-scan", {
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
    return { status: "error", error: "画像を選択してください。" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { status: "error", error: "画像サイズが大きすぎます(10MBまでです)。" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = sniffImageMimeType(buffer);
  if (!mimeType) {
    return {
      status: "error",
      error: "対応していない画像形式です(PNG・JPEGのスクリーンショットをお使いください)。",
    };
  }

  try {
    const provider = getAIProvider();
    const draft = await provider.analyzeBodyCompositionImage({ data: buffer, mimeType });
    return { status: "success", draft };
  } catch {
    return {
      status: "error",
      error: "画像の解析に失敗しました。もう一度お試しいただくか、手入力をご利用ください。",
    };
  }
}
