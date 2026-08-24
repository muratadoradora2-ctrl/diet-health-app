"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { insertExercise } from "@/lib/data/exercises";
import { jstDateTimeToISOString } from "@/lib/date";

const numField = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().finite().optional(),
);

const schema = z.object({
  performedDate: z.string().min(1),
  performedTime: z.string().min(1),
  exerciseType: z.string().min(1),
  durationMinutes: z.coerce.number().int().positive(),
  caloriesKcal: numField,
  memo: z.string().trim().max(500).optional(),
});

export type ExerciseFormState = { error?: string };

export async function createExerciseAction(
  _prevState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const user = await requireAllowedUser();

  const parsed = schema.safeParse({
    performedDate: formData.get("performedDate"),
    performedTime: formData.get("performedTime"),
    exerciseType: formData.get("exerciseType"),
    durationMinutes: formData.get("durationMinutes"),
    caloriesKcal: formData.get("caloriesKcal"),
    memo: formData.get("memo"),
  });

  if (!parsed.success) {
    return { error: "入力内容を確認してください。時間は1分以上で入力してください。" };
  }

  try {
    await insertExercise(user.id, {
      performedAt: jstDateTimeToISOString(parsed.data.performedDate, parsed.data.performedTime),
      exerciseType: parsed.data.exerciseType,
      durationMinutes: parsed.data.durationMinutes,
      estimatedCaloriesKcal: parsed.data.caloriesKcal ?? null,
      memo: parsed.data.memo || null,
    });
  } catch {
    return { error: "登録に失敗しました。もう一度お試しください。" };
  }

  redirect("/exercises");
}
