import Link from "next/link";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
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
  const query = isMealType(type) ? `?type=${type}` : "";

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">食事を記録</h1>
      </header>

      <Link href={`/meals/new/photo${query}`} className="button-primary">
        写真で記録
      </Link>
      <p className="lead-note">
        食事の写真をAIが読み取り、食べたものと栄養価を自動入力します。
      </p>

      <Link href={`/meals/new/text${query}`} className="button-secondary">
        テキストで入力
      </Link>
    </main>
  );
}
