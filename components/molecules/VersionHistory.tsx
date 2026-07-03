"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PosterVersion } from "@/types/poster";

export function VersionHistory({
  posterId,
  currentVersion,
  onPreview,
}: {
  posterId: string;
  currentVersion: number;
  onPreview: (url: string) => void;
}) {
  const [versions, setVersions] = useState<PosterVersion[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "posters", posterId, "versions"),
      orderBy("versionNumber", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setVersions(snap.docs.map((d) => d.data() as PosterVersion));
    });
    return () => unsub();
  }, [posterId]);

  if (versions.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 font-bold text-deep-kraft">Version history</h3>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {versions.map((v) => (
          <button
            key={v.versionNumber}
            onClick={() => onPreview(v.secureUrl)}
            className="relative shrink-0 rounded-lg border border-kraft-tan bg-warm-white p-1"
          >
            <img
              src={v.secureUrl}
              alt={`Version ${v.versionNumber}`}
              className="h-20 w-20 rounded object-cover"
            />
            <span
              className={`absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 text-[10px] font-bold ${
                v.versionNumber === currentVersion
                  ? "bg-kraft-brown text-warm-white"
                  : "bg-kraft-tan text-deep-kraft"
              }`}
            >
              v{v.versionNumber}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
