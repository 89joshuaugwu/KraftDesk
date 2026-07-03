"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUserRole, canReview } from "@/lib/roles";
import { ReviewerQueue } from "@/components/organisms/ReviewerQueue";
import { Spinner } from "@/components/ui/Spinner";

export default function QueuePage() {
  const { role, loading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role && !canReview(role)) {
      toast.error("You don't have access to that page");
      router.replace("/dashboard");
    }
  }, [loading, role, router]);

  if (loading || !role || !canReview(role)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-deep-kraft">Pending review</h1>
      <div className="mt-4">
        <ReviewerQueue />
      </div>
    </div>
  );
}
