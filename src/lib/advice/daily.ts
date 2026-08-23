import "server-only";
import { getAIProvider } from "@/lib/ai";
import { getDailyAdvice, saveDailyAdvice } from "@/lib/data/daily-advice";
import { buildDailyAdviceContext } from "./context";
import { jstDateString } from "@/lib/date";

export type DailyAdviceView = {
  points: string[];
  detail: string;
  modelUsed: string;
  adviceDate: string;
};

/**
 * 今日のAIアドバイスを取得する。
 *   - 体組成の記録が1件もない場合は、AI呼び出し自体を行わずnullを返す
 *     (アドバイスできるデータがそもそも無いため、コストをかけない)。
 *   - 入力データのハッシュがキャッシュと一致する場合はAIを呼ばずキャッシュを返す
 *     (体組成登録・食事の追加/編集・強制更新のいずれかがあった場合のみ再生成)。
 *   - forceRegenerate=true の場合は、ハッシュが一致していても再生成する
 *     (「アドバイスを更新」ボタン用)。
 */
export async function getOrGenerateDailyAdvice(
  userId: string,
  displayName: string,
  forceRegenerate = false,
): Promise<DailyAdviceView | null> {
  const todayStr = jstDateString();
  const { context, inputDataHash } = await buildDailyAdviceContext(userId, displayName);

  if (context.today.latestWeightKg === null) {
    return null;
  }

  const cached = await getDailyAdvice(userId, todayStr);
  if (cached && !forceRegenerate && cached.input_data_hash === inputDataHash) {
    return {
      points: cached.content.points,
      detail: cached.content.detail,
      modelUsed: cached.model_used,
      adviceDate: cached.advice_date,
    };
  }

  const provider = getAIProvider();
  const { advice, modelUsed } = await provider.generateDailyAdvice(context);

  await saveDailyAdvice(userId, todayStr, advice, inputDataHash, modelUsed);

  return { points: advice.points, detail: advice.detail, modelUsed, adviceDate: todayStr };
}
