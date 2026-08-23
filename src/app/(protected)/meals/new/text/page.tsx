import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { jstDateString, jstTimeString } from "@/lib/date";
import { MealEntryForm } from "../../meal-entry-form";
import { MEAL_TYPES, type MealTypeKey } from "../../meal-fields";
import { createMeal } from "../actions";

function isMealType(value: string | undefined): value is MealTypeKey {
  return MEAL_TYPES.some((mealType) => mealType.key === value);
}

export default async function NewMealTextPage({
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
        <h1 className="page-title">食事をテキストで記録</h1>
      </header>
      <MealEntryForm
        action={createMeal}
        initialValues={{
          mealType: defaultType,
          date: jstDateString(),
          time: jstTimeString(),
          text: "",
          caloriesKcal: null,
          proteinG: null,
          fatG: null,
          carbsG: null,
          isAiEstimated: false,
        }}
      />
    </main>
  );
}
