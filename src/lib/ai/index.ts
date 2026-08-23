import "server-only";
import { ClaudeProvider } from "./claude-provider";
import type { AIProvider } from "./provider";

let cached: AIProvider | null = null;

/**
 * AI実装を差し替える唯一の場所。将来Claude以外のベンダーへ変更する場合は
 * ここで返すインスタンスを差し替えるだけでよい設計にしている。
 */
export function getAIProvider(): AIProvider {
  if (!cached) {
    cached = new ClaudeProvider();
  }
  return cached;
}

export type {
  AIProvider,
  BodyCompositionDraft,
  DailyAdvice,
  DailyAdviceContext,
  DailyAdviceResult,
  ImageInput,
  MealNutritionDraft,
  WeeklyReview,
  WeeklyReviewContext,
  WeeklyReviewResult,
} from "./provider";
