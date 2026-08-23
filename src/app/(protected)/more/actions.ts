"use server";

import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { updateDisplayName, updateMenstrualTrackingEnabled } from "@/lib/data/profile";

export type ProfileFormState = { error?: string; success?: boolean };

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireAllowedUser();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const menstrualTrackingEnabled = formData.get("menstrualTrackingEnabled") === "on";

  if (!displayName) {
    return { error: "表示名を入力してください。" };
  }

  try {
    await updateDisplayName(user.id, displayName);
    await updateMenstrualTrackingEnabled(user.id, menstrualTrackingEnabled);
  } catch {
    return { error: "更新に失敗しました。" };
  }

  return { success: true };
}
