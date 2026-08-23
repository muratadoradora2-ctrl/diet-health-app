"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { insertBodyComposition } from "@/lib/data/body-compositions";
import { jstDateTimeToISOString } from "@/lib/date";

const numField = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().finite().optional(),
);

const schema = z.object({
  measuredDate: z.string().min(1),
  measuredTime: z.string().min(1),
  weightKg: z.preprocess((v) => Number(v), z.number().positive().max(400)),
  bmi: numField,
  bodyFatPercent: numField,
  skeletalMusclePercent: numField,
  muscleMassKg: numField,
  proteinPercent: numField,
  basalMetabolismKcal: numField,
  leanBodyMassKg: numField,
  subcutaneousFatPercent: numField,
  visceralFatLevel: numField,
  bodyWaterPercent: numField,
  boneMassKg: numField,
  bodyTypeLabel: z.string().optional(),
  bodyAge: numField,
});

export type BodyCompositionFormState = { error?: string };

export async function createBodyComposition(
  _prevState: BodyCompositionFormState,
  formData: FormData,
): Promise<BodyCompositionFormState> {
  const user = await requireAllowedUser();

  const parsed = schema.safeParse({
    measuredDate: formData.get("measuredDate"),
    measuredTime: formData.get("measuredTime"),
    weightKg: formData.get("weightKg"),
    bmi: formData.get("bmi"),
    bodyFatPercent: formData.get("bodyFatPercent"),
    skeletalMusclePercent: formData.get("skeletalMusclePercent"),
    muscleMassKg: formData.get("muscleMassKg"),
    proteinPercent: formData.get("proteinPercent"),
    basalMetabolismKcal: formData.get("basalMetabolismKcal"),
    leanBodyMassKg: formData.get("leanBodyMassKg"),
    subcutaneousFatPercent: formData.get("subcutaneousFatPercent"),
    visceralFatLevel: formData.get("visceralFatLevel"),
    bodyWaterPercent: formData.get("bodyWaterPercent"),
    boneMassKg: formData.get("boneMassKg"),
    bodyTypeLabel: formData.get("bodyTypeLabel"),
    bodyAge: formData.get("bodyAge"),
  });

  if (!parsed.success) {
    return { error: "入力内容を確認してください。体重は必須です。" };
  }

  const { measuredDate, measuredTime, bodyTypeLabel, ...rest } = parsed.data;

  try {
    await insertBodyComposition(user.id, {
      measuredAt: jstDateTimeToISOString(measuredDate, measuredTime),
      weightKg: rest.weightKg,
      bmi: rest.bmi ?? null,
      bodyFatPercent: rest.bodyFatPercent ?? null,
      skeletalMusclePercent: rest.skeletalMusclePercent ?? null,
      muscleMassKg: rest.muscleMassKg ?? null,
      proteinPercent: rest.proteinPercent ?? null,
      basalMetabolismKcal: rest.basalMetabolismKcal ?? null,
      leanBodyMassKg: rest.leanBodyMassKg ?? null,
      subcutaneousFatPercent: rest.subcutaneousFatPercent ?? null,
      visceralFatLevel: rest.visceralFatLevel ?? null,
      bodyWaterPercent: rest.bodyWaterPercent ?? null,
      boneMassKg: rest.boneMassKg ?? null,
      bodyTypeLabel: bodyTypeLabel || null,
      bodyAge: rest.bodyAge ?? null,
    });
  } catch {
    return { error: "登録に失敗しました。もう一度お試しください。" };
  }

  redirect("/body-compositions");
}
