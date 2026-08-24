import "server-only";
import { getAIProvider } from "@/lib/ai";
import { getDailyAdvice, saveDailyAdvice } from "@/lib/data/daily-advice";
import { buildDailyAdviceContext } from "./context";
import { jstDateString } from "@/lib/date";
import { checkRateLimit } from "@/lib/rate-limit";

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

  if (!forceRegenerate) {
    // 自動生成経路(ホーム画面表示のたびにハッシュ不一致で再生成され得る)にも
    // 上限を設ける。手動更新(forceRegenerate)は呼び出し元(refreshDailyAdvice)
    // が既にレート制限を確認済みのため、ここでは二重にカウントしない。
    const rateLimit = await checkRateLimit(userId, "daily-advice", {
      limit: 20,
      windowSeconds: 60 * 60 * 24,
    });
    if (!rateLimit.success) {
      // 上限到達時は、古くてもキャッシュがあればそれを返し、無ければ
      // 何も表示しない(ページ全体を壊さない)。
      if (cached) {
        return {
          points: cached.content.points,
          detail: cached.content.detail,
          modelUsed: cached.model_used,
          adviceDate: cached.advice_date,
        };
      }
      return null;
    }
  }

  const provider = getAIProvider();
  const { advice, modelUsed } = await provider.generateDailyAdvice(context);

  await saveDailyAdvice(userId, todayStr, advice, inputDataHash, modelUsed);

  return { points: advice.points, detail: advice.detail, modelUsed, adviceDate: todayStr };
}
