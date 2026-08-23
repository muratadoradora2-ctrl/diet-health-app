import { notFound } from "next/navigation";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { getMealById } from "@/lib/data/meals";
import { EditMealForm } from "./edit-form";

export default async function EditMealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAllowedUser();
  const { id } = await params;
  const meal = await getMealById(user.id, id);

  if (!meal) {
    notFound();
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">食事を修正</h1>
      </header>
      <EditMealForm meal={meal} />
    </main>
  );
}
