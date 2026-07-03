"use client";

import Link from "next/link";
import { useUserRole, canReview } from "@/lib/roles";
import { DesignerDashboard } from "@/components/organisms/DesignerDashboard";
import { ReviewerQueue } from "@/components/organisms/ReviewerQueue";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardHome() {
  const { user, role, loading } = useUserRole();

  if (loading || !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (canReview(role)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <h1 className="text-xl font-bold text-deep-kraft">Review dashboard</h1>
        <p className="mt-1 text-sm text-warm-gray">
          Posters waiting on your review.
        </p>
        <div className="mt-4">
          <ReviewerQueue preview />
        </div>
        <Link
          href="/dashboard/queue"
          className="mt-3 inline-block text-sm font-medium text-kraft-brown hover:underline"
        >
          View all →
        </Link>
      </div>
    );
  }

  return <DesignerDashboard uid={user.uid} />;
}
