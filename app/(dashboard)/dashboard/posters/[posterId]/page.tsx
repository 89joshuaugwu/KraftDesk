"use client";

import { use } from "react";
import { PosterDetailView } from "@/components/organisms/PosterDetailView";

export default function PosterDetailPage({
  params,
}: {
  params: Promise<{ posterId: string }>;
}) {
  const { posterId } = use(params);
  return <PosterDetailView posterId={posterId} />;
}
