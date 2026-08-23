import { notFound } from "next/navigation";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { getMenstrualCycleById } from "@/lib/data/menstrual-cycles";
import { EditCycleForm } from "./edit-form";

export default async function EditCyclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAllowedUser();
  const { id } = await params;
  const cycle = await getMenstrualCycleById(user.id, id);
  if (!cycle) notFound();

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">記録を編集</h1>
      </header>
      <EditCycleForm cycle={cycle} />
    </main>
  );
}
