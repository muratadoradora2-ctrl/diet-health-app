import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * 初回ログイン時、profilesとuser_settingsの行がまだ存在しない場合に作成する。
 * RLSにより、この処理は常にログイン中本人の行のみを対象にする。
 */
export async function getOrCreateProfile(
  userId: string,
  email: string,
): Promise<Profile> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("user_id, display_name, menstrual_tracking_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing;

  const defaultName = email.split("@")[0] || "ユーザー";

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({ user_id: userId, display_name: defaultName })
    .select("user_id, display_name, menstrual_tracking_enabled")
    .single();

  if (error || !created) {
    throw new Error("プロフィールの作成に失敗しました");
  }

  await supabase
    .from("user_settings")
    .upsert({ user_id: userId }, { onConflict: "user_id" });

  return created;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("user_id, display_name, menstrual_tracking_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function updateDisplayName(userId: string, displayName: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("user_id", userId);

  if (error) throw new Error("プロフィールの更新に失敗しました");
}

/**
 * 生理周期記録機能の表示有無を切り替える。本人の行のみRLSで更新可能なため、
 * 配偶者が相手のこの設定を読む・変更することはできない。
 */
export async function updateMenstrualTrackingEnabled(userId: string, enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ menstrual_tracking_enabled: enabled })
    .eq("user_id", userId);

  if (error) throw new Error("設定の更新に失敗しました");
}
