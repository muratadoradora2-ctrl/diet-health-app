import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { listBodyCompositions } from "@/lib/data/body-compositions";
import { GraphExplorer } from "./graph-explorer";

export default async function GraphsPage() {
  const user = await requireAllowedUser();
  const entries = await listBodyCompositions(user.id);

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">グラフ</h1>
      </header>
      <GraphExplorer entries={entries} />
    </main>
  );
}
