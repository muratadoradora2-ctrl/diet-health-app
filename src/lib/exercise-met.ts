/**
 * 運動種目ごとの METs(運動強度の指標)。国立健康・栄養研究所の
 * 身体活動のメッツ表に基づく一般的な目安値。
 * 消費カロリーの推定にはAIを使わず、この静的な値で計算する
 * (無料・即時・十分な精度のため)。
 */
export const EXERCISE_TYPES = [
  { key: "walking", label: "ウォーキング", met: 3.5 },
  { key: "jogging", label: "ジョギング", met: 7.0 },
  { key: "running", label: "ランニング", met: 9.8 },
  { key: "cycling", label: "サイクリング", met: 6.0 },
  { key: "swimming", label: "水泳", met: 6.0 },
  { key: "strength", label: "筋力トレーニング", met: 5.0 },
  { key: "squat", label: "スクワット", met: 5.0 },
  { key: "situp", label: "腹筋", met: 3.8 },
  { key: "plank", label: "プランク", met: 3.0 },
  { key: "radiotaiso", label: "ラジオ体操", met: 4.0 },
  { key: "yoga", label: "ヨガ・ストレッチ", met: 2.5 },
  { key: "other", label: "その他", met: 4.0 },
] as const;

export type ExerciseTypeKey = (typeof EXERCISE_TYPES)[number]["key"];

export function getExerciseMet(exerciseType: string): number {
  return EXERCISE_TYPES.find((t) => t.key === exerciseType)?.met ?? 4.0;
}

export function getExerciseLabel(exerciseType: string): string {
  return EXERCISE_TYPES.find((t) => t.key === exerciseType)?.label ?? exerciseType;
}

/** 消費カロリー(kcal) = MET × 体重(kg) × 時間(h) × 1.05 */
export function estimateCaloriesBurned(
  exerciseType: string,
  weightKg: number,
  durationMinutes: number,
): number {
  const met = getExerciseMet(exerciseType);
  return Math.round(met * weightKg * (durationMinutes / 60) * 1.05);
}
