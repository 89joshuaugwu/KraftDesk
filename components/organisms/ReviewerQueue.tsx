"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, limit as fbLimit } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { ClipboardList } from "lucide-react";
import { db } from "@/lib/firebase";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Spinner";
import type { Poster } from "@/types/poster";

interface QueueRow extends Poster {
  designerName?: string;
}

// preview=true renders the top-3 Home widget (Phase 2); preview=false is the
// full /dashboard/queue list (Phase 5).
export function ReviewerQueue({ preview = false }: { preview?: boolean }) {
  const [rows, setRows] = useState<QueueRow[] | null>(null);

  useEffect(() => {
    const constraints = [
      where("status", "==", "pending"),
      orderBy("createdAt", "asc"),
    ] as const;

    const q = preview
      ? query(collection(db, "posters"), ...constraints, fbLimit(3))
      : query(collection(db, "posters"), ...constraints);

    const unsub = onSnapshot(q, async (snap) => {
      const base = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Poster, "id">) }));
      const withNames = await Promise.all(
        base.map(async (p) => {
          const userSnap = await getDoc(doc(db, "users", p.uploadedBy));
          return { ...p, designerName: userSnap.exists() ? userSnap.data().displayName : "Unknown" };
        })
      );
      setRows(withNames);
    });
    return () => unsub();
  }, [preview]);

  if (rows === null) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: preview ? 3 : 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-10 w-10" />}
        title="All caught up!"
        subtitle="No posters waiting for review."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((p) => (
        <Link
          key={p.id}
          href={`/dashboard/posters/${p.id}`}
          className="flex items-center gap-3 rounded-lg border border-kraft-tan bg-warm-white p-3 hover:shadow-sm"
        >
          <img
            src={p.previewUrl}
            alt={p.title}
            className="h-14 w-14 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-charcoal">{p.title}</p>
            <p className="text-xs text-warm-gray">
              {p.designerName} · submitted{" "}
              {p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : ""}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
