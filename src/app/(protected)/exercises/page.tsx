import Link from "next/link";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { listExercisesBetween } from "@/lib/data/exercises";
import { formatJstDateTime, jstDateString, jstDayRangeToISOStrings } from "@/lib/date";
import { getExerciseLabel } from "@/lib/exercise-met";

function formatTime(iso: string) {
  return formatJstDateTime(iso, { hour: "2-digit", minute: "2-digit" });
}

export default async function ExercisesPage() {
  const user = await requireAllowedUser();
  const today = jstDateString();
  const { startIso, endIso } = jstDayRangeToISOStrings(today);
  const exercises = await listExercisesBetween(user.id, startIso, endIso);

  const totalMinutes = exercises.reduce((sum, ex) => sum + ex.duration_minutes, 0);
  const totalCalories = exercises.reduce(
    (sum, ex) => sum + (ex.estimated_calories_kcal ?? 0),
    0,
  );

  return (
    <main className="page">
      <header className="page-header">
        <p className="page-eyebrow">今日の運動</p>
        <h1 className="page-title">運動</h1>
      </header>

      <div className="card">
        <div className="meal-section-header">
          <h2 className="card-title">今日の記録</h2>
          <Link href="/exercises/new" className="meal-add-link">
            ＋ 追加
          </Link>
        </div>

        {exercises.length === 0 ? (
          <p className="lead-note">まだ記録がありません</p>
        ) : (
          <>
            <ul className="meal-entry-list">
              {exercises.map((exercise) => (
                <li key={exercise.id}>
                  <Link href={`/exercises/${exercise.id}`} className="meal-entry">
                    <span className="meal-entry-time">{formatTime(exercise.performed_at)}</span>
                    <span className="meal-entry-text">
                      {getExerciseLabel(exercise.exercise_type)}({exercise.duration_minutes}分)
                      {exercise.estimated_calories_kcal !== null &&
                        ` ・約${exercise.estimated_calories_kcal}kcal`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="lead-note" style={{ marginTop: 12 }}>
              合計: {totalMinutes}分
              {totalCalories > 0 && ` ・約${totalCalories}kcal`}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
