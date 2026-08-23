/**
 * AI処理を疎結合にするための共通インターフェース。
 * 呼び出し側(Server Action等)はこの型だけを参照し、Claude固有の実装
 * (プロンプト・SDK呼び出し)はClaudeProvider(claude-provider.ts)の中に
 * 閉じ込める。将来ベンダーを変える場合は getAIProvider() (index.ts) の
 * 実装差し替えだけで済む設計とする。
 */

export type BodyCompositionDraft = {
  weightKg: number | null;
  bmi: number | null;
  bodyFatPercent: number | null;
  skeletalMusclePercent: number | null;
  muscleMassKg: number | null;
  proteinPercent: number | null;
  basalMetabolismKcal: number | null;
  leanBodyMassKg: number | null;
  subcutaneousFatPercent: number | null;
  visceralFatLevel: number | null;
  bodyWaterPercent: number | null;
  boneMassKg: number | null;
  bodyTypeLabel: string | null;
  bodyAge: number | null;
};

export type ImageInput = {
  data: Buffer;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
};

export type MealNutritionDraft = {
  /** 写真から識別した食事内容の説明。テキストからの推定時はnull */
  description: string | null;
  estimatedCaloriesKcal: number | null;
  estimatedProteinG: number | null;
  estimatedFatG: number | null;
  estimatedCarbsG: number | null;
  estimatedFiberG: number | null;
};

export interface AIProvider {
  analyzeBodyCompositionImage(image: ImageInput): Promise<BodyCompositionDraft>;
  analyzeMealFromText(text: string): Promise<MealNutritionDraft>;
  analyzeMealFromImage(image: ImageInput): Promise<MealNutritionDraft>;
}
