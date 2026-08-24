import { notFound } from "next/navigation";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { getExerciseById } from "@/lib/data/exercises";
import { listBodyCompositions } from "@/lib/data/body-compositions";
import { EditExerciseForm } from "./edit-form";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAllowedUser();
  const { id } = await params;

  const [exercise, entries] = await Promise.all([
    getExerciseById(user.id, id),
    listBodyCompositions(user.id),
  ]);
  if (!exercise) notFound();

  const latestWeightKg = entries.length > 0 ? entries[entries.length - 1].weight_kg : null;

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">記録を編集</h1>
      </header>
      <EditExerciseForm exercise={exercise} latestWeightKg={latestWeightKg} />
    </main>
  );
}
