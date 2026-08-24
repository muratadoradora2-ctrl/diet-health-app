"use server";

import { z } from "zod";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { upsertDailySteps } from "@/lib/data/daily-steps";
import { jstDateString } from "@/lib/date";

export type StepsFormState = { error?: string; success?: boolean };

const schema = z.object({ steps: z.coerce.number().int().min(0).max(200000) });

export async function updateDailyStepsAction(
  _prevState: StepsFormState,
  formData: FormData,
): Promise<StepsFormState> {
  const user = await requireAllowedUser();

  const parsed = schema.safeParse({ steps: formData.get("steps") });
  if (!parsed.success) {
    return { error: "歩数を正しく入力してください。" };
  }

  try {
    await upsertDailySteps(user.id, jstDateString(), parsed.data.steps);
  } catch {
    return { error: "保存に失敗しました。もう一度お試しください。" };
  }

  return { success: true };
}
