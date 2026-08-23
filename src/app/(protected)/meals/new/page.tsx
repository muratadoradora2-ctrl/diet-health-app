import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { jstDateString, jstTimeString } from "@/lib/date";
import { MealForm } from "./form";
import { MEAL_TYPES, type MealTypeKey } from "../meal-fields";

function isMealType(value: string | undefined): value is MealTypeKey {
  return MEAL_TYPES.some((mealType) => mealType.key === value);
}

export default async function NewMealPage({
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
        <h1 className="page-title">食事を記録</h1>
      </header>
      <MealForm
        defaultDate={jstDateString()}
        defaultTime={jstTimeString()}
        defaultType={defaultType}
      />
    </main>
  );
}
