"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { updateMenstrualCycle, deleteMenstrualCycle } from "@/lib/data/menstrual-cycles";
import type { CycleFormState } from "../cycle-form";

const updateSchema = z.object({
  id: z.string().uuid(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  memo: z.string().trim().max(500).optional(),
});

export async function updateCycleAction(
  _prevState: CycleFormState,
  formData: FormData,
): Promise<CycleFormState> {
  const user = await requireAllowedUser();

  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
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
    await updateMenstrualCycle(user.id, parsed.data.id, {
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate || null,
      memo: parsed.data.memo || null,
    });
  } catch {
    return { error: "更新に失敗しました。もう一度お試しください。" };
  }

  redirect("/cycles");
}

export type DeleteCycleState = { error?: string };

const deleteSchema = z.object({ id: z.string().uuid() });

export async function deleteCycleAction(
  _prevState: DeleteCycleState,
  formData: FormData,
): Promise<DeleteCycleState> {
  const user = await requireAllowedUser();

  const parsed = deleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: "削除に失敗しました。" };
  }

  try {
    await deleteMenstrualCycle(user.id, parsed.data.id);
  } catch {
    return { error: "削除に失敗しました。もう一度お試しください。" };
  }

  redirect("/cycles");
}
