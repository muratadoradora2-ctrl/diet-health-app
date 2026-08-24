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

/** 日次AIアドバイス生成に渡す、本人の直近データのまとめ */
export type DailyAdviceContext = {
  displayName: string;
  today: {
    latestWeightKg: number | null;
    latestMeasuredAt: string | null;
    bodyFatPercent: number | null;
  };
  change7dKg: number | null;
  change30dKg: number | null;
  goal: {
    startWeightKg: number;
    targetWeightKg: number;
    targetDate: string | null;
  } | null;
  /** 直近7日分、日付昇順 */
  recentWeights: { date: string; weightKg: number }[];
  /** 本日記録済みの食事(種類・内容・推定カロリー) */
  todaysMeals: {
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    text: string | null;
    caloriesKcal: number | null;
  }[];
  /** 本日の運動時間合計(分) */
  todaysExerciseMinutes: number;
  /** 本日の運動による推定消費カロリー合計(kcal)。記録が無い場合はnull */
  todaysExerciseCaloriesKcal: number | null;
};

export type DailyAdvice = {
  /** 箇条書きの要点(2〜4件程度) */
  points: string[];
  /** 詳しい解説文 */
  detail: string;
};

export type DailyAdviceResult = {
  advice: DailyAdvice;
  modelUsed: string;
};

/** 週次AIレビュー生成に渡す、直近の「完了した週」(月〜日)のまとめ */
export type WeeklyReviewContext = {
  displayName: string;
  weekStartDate: string;
  weekEndDate: string;
  weightStartKg: number | null;
  weightEndKg: number | null;
  weightChangeKg: number | null;
  avgWeightKg: number | null;
  /** その週のうち、体組成を記録した日数(0〜7) */
  daysWithBodyCompLog: number;
  goal: {
    startWeightKg: number;
    targetWeightKg: number;
    targetDate: string | null;
  } | null;
  avgCaloriesKcal: number | null;
  /** その週のうち、食事を1件以上記録した日数(0〜7) */
  daysWithMealLog: number;
  totalMealsLogged: number;
  /** その週のうち、運動を1件以上記録した日数(0〜7) */
  daysWithExerciseLog: number;
  totalExerciseMinutes: number;
  /** 週末時点の体重と目標体重との差(kg)。正の値は目標より重い。goal未設定または体重未記録ならnull */
  remainingWeightKg: number | null;
  /** 週の最終日から目標日までの残り日数。目標日未設定ならnull(負の値は目標日超過) */
  daysUntilTargetDate: number | null;
};

export type WeeklyReview = {
  /** その週の総括(3〜5文程度) */
  summary: string;
  /** 良かった点(1〜3件) */
  goodPoints: string[];
  /** 来週に向けて(1〜3件) */
  focusNextWeek: string[];
  /** 目標日までを見据えた、運動の種類・頻度・時間の目安の提案 */
  exerciseSuggestion: string;
  /** 目標に向けて食生活で気をつけるとよいこと */
  dietTip: string;
};

export type WeeklyReviewResult = {
  review: WeeklyReview;
  modelUsed: string;
};

export interface AIProvider {
  analyzeBodyCompositionImage(image: ImageInput): Promise<BodyCompositionDraft>;
  analyzeMealFromText(text: string): Promise<MealNutritionDraft>;
  analyzeMealFromImage(image: ImageInput): Promise<MealNutritionDraft>;
  generateDailyAdvice(context: DailyAdviceContext): Promise<DailyAdviceResult>;
  generateWeeklyReview(context: WeeklyReviewContext): Promise<WeeklyReviewResult>;
}
