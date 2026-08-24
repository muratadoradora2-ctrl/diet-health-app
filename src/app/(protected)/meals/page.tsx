import Link from "next/link";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { listMealsBetween } from "@/lib/data/meals";
import { listWaterIntakesBetween } from "@/lib/data/water-intakes";
import { formatJstDateTime, jstDateString, jstDayRangeToISOStrings } from "@/lib/date";
import type { Meal } from "@/lib/types";
import { MEAL_TYPES } from "./meal-fields";
import { WaterQuickAdd } from "./water-quick-add";
import { WaterDeleteButton } from "./water-delete-button";

function formatTime(iso: string) {
  return formatJstDateTime(iso, { hour: "2-digit", minute: "2-digit" });
}

export default async function MealsPage() {
  const user = await requireAllowedUser();
  const today = jstDateString();
  const { startIso, endIso } = jstDayRangeToISOStrings(today);
  const [meals, waterIntakes] = await Promise.all([
    listMealsBetween(user.id, startIso, endIso),
    listWaterIntakesBetween(user.id, startIso, endIso),
  ]);
  const totalWaterMl = waterIntakes.reduce((sum, w) => sum + w.volume_ml, 0);

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

      <div className="card">
        <h2 className="card-title">今日の水分摂取</h2>
        <p className="hero-stat">
          <span className="hero-value">{totalWaterMl}</span>
          <span className="hero-unit">ml</span>
        </p>
        <WaterQuickAdd />
        {waterIntakes.length > 0 && (
          <ul className="water-entry-list">
            {waterIntakes.map((w) => (
              <li key={w.id} className="water-entry-row">
                <span>
                  {formatTime(w.logged_at)}・{w.volume_ml}ml
                </span>
                <WaterDeleteButton id={w.id} />
              </li>
            ))}
          </ul>
        )}
      </div>

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
                  <li key={meal.id}>
                    <Link href={`/meals/${meal.id}`} className="meal-entry">
                      <span className="meal-entry-time">{formatTime(meal.eaten_at)}</span>
                      <span className="meal-entry-text">{meal.input_text}</span>
                    </Link>
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
