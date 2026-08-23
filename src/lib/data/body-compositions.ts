import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BodyComposition } from "@/lib/types";

export async function listBodyCompositions(
  userId: string,
  sinceIso?: string,
): Promise<BodyComposition[]> {
  const supabase = await createClient();
  let query = supabase
    .from("body_compositions")
    .select("*")
    .eq("user_id", userId)
    .order("measured_at", { ascending: true });

  if (sinceIso) {
    query = query.gte("measured_at", sinceIso);
  }

  const { data, error } = await query;
  if (error) throw new Error("体組成データの取得に失敗しました");
  return data ?? [];
}

export async function listBodyCompositionsBetween(
  userId: string,
  startIso: string,
  endIso: string,
): Promise<BodyComposition[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("body_compositions")
    .select("*")
    .eq("user_id", userId)
    .gte("measured_at", startIso)
    .lt("measured_at", endIso)
    .order("measured_at", { ascending: true });

  if (error) throw new Error("体組成データの取得に失敗しました");
  return data ?? [];
}

export type BodyCompositionInput = {
  measuredAt: string;
  weightKg: number;
  source: "manual" | "ai_scan";
  bmi?: number | null;
  bodyFatPercent?: number | null;
  skeletalMusclePercent?: number | null;
  muscleMassKg?: number | null;
  proteinPercent?: number | null;
  basalMetabolismKcal?: number | null;
  leanBodyMassKg?: number | null;
  subcutaneousFatPercent?: number | null;
  visceralFatLevel?: number | null;
  bodyWaterPercent?: number | null;
  boneMassKg?: number | null;
  bodyTypeLabel?: string | null;
  bodyAge?: number | null;
};

export async function insertBodyComposition(
  userId: string,
  input: BodyCompositionInput,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("body_compositions").insert({
    user_id: userId,
    measured_at: input.measuredAt,
    weight_kg: input.weightKg,
    bmi: input.bmi ?? null,
    body_fat_percent: input.bodyFatPercent ?? null,
    skeletal_muscle_percent: input.skeletalMusclePercent ?? null,
    muscle_mass_kg: input.muscleMassKg ?? null,
    protein_percent: input.proteinPercent ?? null,
    basal_metabolism_kcal: input.basalMetabolismKcal ?? null,
    lean_body_mass_kg: input.leanBodyMassKg ?? null,
    subcutaneous_fat_percent: input.subcutaneousFatPercent ?? null,
    visceral_fat_level: input.visceralFatLevel ?? null,
    body_water_percent: input.bodyWaterPercent ?? null,
    bone_mass_kg: input.boneMassKg ?? null,
    body_type_label: input.bodyTypeLabel ?? null,
    body_age: input.bodyAge ?? null,
    source: input.source,
  });

  if (error) throw new Error("体組成の登録に失敗しました");
}
