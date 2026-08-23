import { Suspense } from "react";
import { requireAllowedUser } from "@/lib/auth/require-allowed-user";
import { ReviewCard, ReviewCardSkeleton } from "./review-card";

export default async function ReviewsPage() {
  await requireAllowedUser();

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">週次AIレビュー</h1>
      </header>

      <Suspense fallback={<ReviewCardSkeleton />}>
        <ReviewCard />
      </Suspense>
    </main>
  );
}
