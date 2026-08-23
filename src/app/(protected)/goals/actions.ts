"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { saveGoal } from "@/lib/data/goals";

const schema = z.object({
  startDate: z.string().min(1),
  startWeightKg: z.preprocess((v) => Number(v), z.number().positive().max(400)),
  targetWeightKg: z.preprocess((v) => Number(v), z.number().positive().max(400)),
  targetBodyFatPercent: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().min(0).max(100).optional(),
  ),
  targetDate: z.string().optional(),
});

export type GoalFormState = { error?: string };

export async function upsertGoalAction(
  _prevState: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const user = await requireAllowedUser();

  const parsed = schema.safeParse({
    startDate: formData.get("startDate"),
    startWeightKg: formData.get("startWeightKg"),
    targetWeightKg: formData.get("targetWeightKg"),
    targetBodyFatPercent: formData.get("targetBodyFatPercent"),
    targetDate: formData.get("targetDate"),
  });

  if (!parsed.success) {
    return { error: "入力内容を確認してください。" };
  }

  try {
    await saveGoal(user.id, {
      startDate: parsed.data.startDate,
      startWeightKg: parsed.data.startWeightKg,
      targetWeightKg: parsed.data.targetWeightKg,
      targetBodyFatPercent: parsed.data.targetBodyFatPercent ?? null,
      targetDate: parsed.data.targetDate || null,
    });
  } catch {
    return { error: "保存に失敗しました。もう一度お試しください。" };
  }

  redirect("/home");
}
