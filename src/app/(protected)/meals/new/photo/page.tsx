import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { MEAL_TYPES, type MealTypeKey } from "../../meal-fields";
import { PhotoFlow } from "./photo-flow";

// Buffer操作・Anthropic SDKを使うため、Node.jsランタイムを明示する。
export const runtime = "nodejs";

function isMealType(value: string | undefined): value is MealTypeKey {
  return MEAL_TYPES.some((mealType) => mealType.key === value);
}

export default async function NewMealPhotoPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAllowedUser();
  const { type } = await searchParams;
  const defaultType: MealTypeKey = isMealType(type) ? type : "breakfast";

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">写真で食事を記録</h1>
      </header>
      <PhotoFlow defaultType={defaultType} />
    </main>
  );
}
