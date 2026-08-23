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

export interface AIProvider {
  analyzeBodyCompositionImage(image: ImageInput): Promise<BodyCompositionDraft>;
}
