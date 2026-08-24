"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { updateExercise, deleteExercise } from "@/lib/data/exercises";
import { jstDateTimeToISOString } from "@/lib/date";

const numField = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().finite().optional(),
);

const updateSchema = z.object({
  id: z.string().uuid(),
  performedDate: z.string().min(1),
  performedTime: z.string().min(1),
  exerciseType: z.string().min(1),
  durationMinutes: z.coerce.number().int().positive(),
  caloriesKcal: numField,
  memo: z.string().trim().max(500).optional(),
});

export type ExerciseFormState = { error?: string };

export async function updateExerciseAction(
  _prevState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const user = await requireAllowedUser();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    performedDate: formData.get("performedDate"),
    performedTime: formData.get("performedTime"),
    exerciseType: formData.get("exerciseType"),
    durationMinutes: formData.get("durationMinutes"),
    caloriesKcal: formData.get("caloriesKcal"),
    memo: formData.get("memo"),
  });

  if (!parsed.success) {
    return { error: "入力内容を確認してください。" };
  }

  try {
    await updateExercise(user.id, parsed.data.id, {
      performedAt: jstDateTimeToISOString(parsed.data.performedDate, parsed.data.performedTime),
      exerciseType: parsed.data.exerciseType,
      durationMinutes: parsed.data.durationMinutes,
      estimatedCaloriesKcal: parsed.data.caloriesKcal ?? null,
      memo: parsed.data.memo || null,
    });
  } catch {
    return { error: "更新に失敗しました。もう一度お試しください。" };
  }

  redirect("/exercises");
}

export type DeleteExerciseState = { error?: string };

const deleteSchema = z.object({ id: z.string().uuid() });

export async function deleteExerciseAction(
  _prevState: DeleteExerciseState,
  formData: FormData,
): Promise<DeleteExerciseState> {
  const user = await requireAllowedUser();

  const parsed = deleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: "削除に失敗しました。" };
  }

  try {
    await deleteExercise(user.id, parsed.data.id);
  } catch {
    return { error: "削除に失敗しました。もう一度お試しください。" };
  }

  redirect("/exercises");
}
