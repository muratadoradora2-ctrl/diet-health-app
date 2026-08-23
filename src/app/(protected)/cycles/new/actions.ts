"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { insertMenstrualCycle } from "@/lib/data/menstrual-cycles";
import type { CycleFormState } from "../cycle-form";

const schema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  memo: z.string().trim().max(500).optional(),
});

export async function createCycleAction(
  _prevState: CycleFormState,
  formData: FormData,
): Promise<CycleFormState> {
  const user = await requireAllowedUser();

  const parsed = schema.safeParse({
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    memo: formData.get("memo"),
  });

  if (!parsed.success) {
    return { error: "入力内容を確認してください。" };
  }

  if (parsed.data.endDate && parsed.data.endDate < parsed.data.startDate) {
    return { error: "終了日は開始日より後の日付にしてください。" };
  }

  try {
    await insertMenstrualCycle(user.id, {
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate || null,
      memo: parsed.data.memo || null,
    });
  } catch {
    return { error: "記録に失敗しました。もう一度お試しください。" };
  }

  redirect("/cycles");
}
