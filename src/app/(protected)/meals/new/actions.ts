"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { insertMeal } from "@/lib/data/meals";
import { jstDateTimeToISOString } from "@/lib/date";

const schema = z.object({
  eatenDate: z.string().min(1),
  eatenTime: z.string().min(1),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  inputText: z.string().trim().min(1, "食事内容を入力してください。").max(1000),
});

export type MealFormState = { error?: string };

export async function createMeal(
  _prevState: MealFormState,
  formData: FormData,
): Promise<MealFormState> {
  const user = await requireAllowedUser();

  const parsed = schema.safeParse({
    eatenDate: formData.get("eatenDate"),
    eatenTime: formData.get("eatenTime"),
    mealType: formData.get("mealType"),
    inputText: formData.get("inputText"),
  });

  if (!parsed.success) {
    return { error: "入力内容を確認してください。食事内容は必須です。" };
  }

  try {
    await insertMeal(user.id, {
      eatenAt: jstDateTimeToISOString(parsed.data.eatenDate, parsed.data.eatenTime),
      mealType: parsed.data.mealType,
      inputText: parsed.data.inputText,
    });
  } catch {
    return { error: "登録に失敗しました。もう一度お試しください。" };
  }

  redirect("/meals");
}
