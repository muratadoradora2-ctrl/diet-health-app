"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { updateMeal, deleteMeal } from "@/lib/data/meals";
import { jstDateTimeToISOString } from "@/lib/date";

export type MealFormState = { error?: string };

const numField = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().finite().optional(),
);

const updateSchema = z.object({
  id: z.string().uuid(),
  eatenDate: z.string().min(1),
  eatenTime: z.string().min(1),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  inputText: z.string().trim().min(1, "食事内容を入力してください。").max(1000),
  caloriesKcal: numField,
  proteinG: numField,
  fatG: numField,
  carbsG: numField,
  isAiEstimated: z.enum(["true", "false"]),
});

export async function updateMealAction(
  _prevState: MealFormState,
  formData: FormData,
): Promise<MealFormState> {
  const user = await requireAllowedUser();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    eatenDate: formData.get("eatenDate"),
    eatenTime: formData.get("eatenTime"),
    mealType: formData.get("mealType"),
    inputText: formData.get("inputText"),
    caloriesKcal: formData.get("caloriesKcal"),
    proteinG: formData.get("proteinG"),
    fatG: formData.get("fatG"),
    carbsG: formData.get("carbsG"),
    isAiEstimated: formData.get("isAiEstimated"),
  });

  if (!parsed.success) {
    return { error: "入力内容を確認してください。" };
  }

  try {
    await updateMeal(user.id, parsed.data.id, {
      eatenAt: jstDateTimeToISOString(parsed.data.eatenDate, parsed.data.eatenTime),
      mealType: parsed.data.mealType,
      inputText: parsed.data.inputText,
      estimatedCaloriesKcal: parsed.data.caloriesKcal ?? null,
      estimatedProteinG: parsed.data.proteinG ?? null,
      estimatedFatG: parsed.data.fatG ?? null,
      estimatedCarbsG: parsed.data.carbsG ?? null,
      isAiEstimated: parsed.data.isAiEstimated === "true",
    });
  } catch {
    return { error: "更新に失敗しました。もう一度お試しください。" };
  }

  redirect("/meals");
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function deleteMealAction(
  _prevState: MealFormState,
  formData: FormData,
): Promise<MealFormState> {
  const user = await requireAllowedUser();

  const parsed = deleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: "削除に失敗しました。" };
  }

  try {
    await deleteMeal(user.id, parsed.data.id);
  } catch {
    return { error: "削除に失敗しました。もう一度お試しください。" };
  }

  redirect("/meals");
}
