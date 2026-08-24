"use server";

import { z } from "zod";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { insertWaterIntake, deleteWaterIntake } from "@/lib/data/water-intakes";

export type WaterFormState = { error?: string };

const addSchema = z.object({ volumeMl: z.coerce.number().int().positive().max(5000) });

export async function addWaterIntakeAction(
  _prevState: WaterFormState,
  formData: FormData,
): Promise<WaterFormState> {
  const user = await requireAllowedUser();

  const parsed = addSchema.safeParse({ volumeMl: formData.get("volumeMl") });
  if (!parsed.success) {
    return { error: "水分量を正しく入力してください。" };
  }

  try {
    await insertWaterIntake(user.id, new Date().toISOString(), parsed.data.volumeMl);
  } catch {
    return { error: "記録に失敗しました。もう一度お試しください。" };
  }

  return {};
}

const deleteSchema = z.object({ id: z.string().uuid() });

export async function deleteWaterIntakeAction(
  _prevState: WaterFormState,
  formData: FormData,
): Promise<WaterFormState> {
  const user = await requireAllowedUser();

  const parsed = deleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: "削除に失敗しました。" };
  }

  try {
    await deleteWaterIntake(user.id, parsed.data.id);
  } catch {
    return { error: "削除に失敗しました。" };
  }

  return {};
}
