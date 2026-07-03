"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { Upload } from "lucide-react";
import { db } from "@/lib/firebase";
import { PosterCard } from "@/components/molecules/PosterCard";
import { SkeletonCard } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Poster } from "@/types/poster";

export function DesignerDashboard({ uid }: { uid: string }) {
  const [posters, setPosters] = useState<Poster[] | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "posters"),
      where("uploadedBy", "==", uid),
      orderBy("updatedAt", "desc"),
      limit(12)
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosters(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Poster, "id">) })));
    });
    return () => unsub();
  }, [uid]);

  const counts = {
    draft: posters?.filter((p) => p.status === "draft").length ?? 0,
    pending: posters?.filter((p) => p.status === "pending").length ?? 0,
    approved: posters?.filter((p) => ["approved", "published"].includes(p.status)).length ?? 0,
    changes: posters?.filter((p) => p.status === "changes_requested").length ?? 0,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Drafts", value: counts.draft },
          { label: "Pending", value: counts.pending },
          { label: "Approved", value: counts.approved },
          { label: "Changes Needed", value: counts.changes },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-kraft-tan bg-warm-white p-4">
            <p className="text-2xl font-bold text-deep-kraft">{s.value}</p>
            <p className="text-xs text-warm-gray">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-deep-kraft">Your posters</h2>
        <Link
          href="/dashboard/upload"
          className="flex items-center gap-1.5 rounded-lg bg-kraft-brown px-3.5 py-2 text-sm font-medium text-warm-white hover:bg-deep-kraft"
        >
          <Upload className="h-4 w-4" /> Upload
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {posters === null &&
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        {posters?.map((p) => (
          <PosterCard key={p.id} poster={p} />
        ))}
      </div>

      {posters?.length === 0 && (
        <EmptyState
          icon={<Upload className="h-10 w-10" />}
          title="No posters yet"
          subtitle="Upload your first design to get started."
          action={
            <Link
              href="/dashboard/upload"
              className="mt-2 rounded-lg bg-kraft-brown px-4 py-2 text-sm font-medium text-warm-white"
            >
              Upload a poster
            </Link>
          }
        />
      )}
    </div>
  );
}
