"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Upload } from "lucide-react";
import { db } from "@/lib/firebase";
import { useUserRole } from "@/lib/roles";
import { PosterCard } from "@/components/molecules/PosterCard";
import { SkeletonCard } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Poster } from "@/types/poster";

export default function MyPostersPage() {
  const { user } = useUserRole();
  const [posters, setPosters] = useState<Poster[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "posters"),
      where("uploadedBy", "==", user.uid),
      orderBy("updatedAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosters(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Poster, "id">) })));
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-deep-kraft">My posters</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {posters === null && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        {posters?.map((p) => (
          <PosterCard key={p.id} poster={p} />
        ))}
      </div>
      {posters?.length === 0 && (
        <EmptyState
          icon={<Upload className="h-10 w-10" />}
          title="No posters yet"
          subtitle="Upload your first design to get started."
        />
      )}
    </div>
  );
}
