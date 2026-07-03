"use client";

import { useUserRole } from "@/lib/roles";
import { PosterUploadForm } from "@/components/molecules/PosterUploadForm";
import { Spinner } from "@/components/ui/Spinner";

export default function UploadPage() {
  const { user, loading } = useUserRole();

  if (loading || !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-deep-kraft">Upload a new poster</h1>
      <div className="mt-5">
        <PosterUploadForm uid={user.uid} />
      </div>
    </div>
  );
}
