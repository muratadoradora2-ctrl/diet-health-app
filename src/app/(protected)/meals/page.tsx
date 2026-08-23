import Link from "next/link";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { listMealsBetween } from "@/lib/data/meals";
import { jstDateString, jstDayRangeToISOStrings } from "@/lib/date";
import type { Meal } from "@/lib/types";

const MEAL_TYPES = [
  { key: "breakfast", label: "朝食" },
  { key: "lunch", label: "昼食" },
  { key: "dinner", label: "夕食" },
  { key: "snack", label: "間食" },
] as const;

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export default async function MealsPage() {
  const user = await requireAllowedUser();
  const today = jstDateString();
  const { startIso, endIso } = jstDayRangeToISOStrings(today);
  const meals = await listMealsBetween(user.id, startIso, endIso);

  const byType = new Map<string, Meal[]>();
  for (const meal of meals) {
    const list = byType.get(meal.meal_type) ?? [];
    list.push(meal);
    byType.set(meal.meal_type, list);
  }

  return (
    <main className="page">
      <header className="page-header">
        <p className="page-eyebrow">今日の食事</p>
        <h1 className="page-title">食事</h1>
      </header>

      {MEAL_TYPES.map((mealType) => {
        const entries = byType.get(mealType.key) ?? [];
        return (
          <div key={mealType.key} className="card">
            <div className="meal-section-header">
              <h2 className="card-title">{mealType.label}</h2>
              <Link href={`/meals/new?type=${mealType.key}`} className="meal-add-link">
                ＋ 追加
              </Link>
            </div>

            {entries.length === 0 ? (
              <p className="lead-note">まだ記録がありません</p>
            ) : (
              <ul className="meal-entry-list">
                {entries.map((meal) => (
                  <li key={meal.id} className="meal-entry">
                    <span className="meal-entry-time">{formatTime(meal.eaten_at)}</span>
                    <span className="meal-entry-text">{meal.input_text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </main>
  );
}
