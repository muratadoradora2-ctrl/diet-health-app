import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { jstDateString, jstTimeString } from "@/lib/date";
import { MealForm } from "./form";

const VALID_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = (typeof VALID_TYPES)[number];

function isMealType(value: string | undefined): value is MealType {
  return VALID_TYPES.includes(value as MealType);
}

export default async function NewMealPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAllowedUser();
  const { type } = await searchParams;
  const defaultType: MealType = isMealType(type) ? type : "breakfast";

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
