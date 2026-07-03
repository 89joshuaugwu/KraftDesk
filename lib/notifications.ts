"use client";

// Client-side notification helpers: real-time listeners + mark-as-read.
// The actual WRITES for cross-user notifications (new submission, status
// change, new comment) happen in server actions / API routes using
// firebase-admin (see app/api routes and organism components), because a
// designer's client is not allowed to write into a reviewer's notification
// feed directly under a naive rule set. Here we centralize the read side.

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { KraftNotification } from "@/types/notification";

export function useNotifications(uid: string | null) {
  const [items, setItems] = useState<KraftNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    const q = query(
      collection(db, "notifications", uid, "items"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<KraftNotification, "id">),
      }));
      setItems(all);
      setUnreadCount(all.filter((n) => !n.read).length);
    });
    return () => unsub();
  }, [uid]);

  return { items, unreadCount };
}

// Convenience hook when only the badge count is needed (used in AppShell
// before the full dropdown exists — Phase 2).
export function useUnreadCount(uid: string | null): number {
  const { unreadCount } = useNotifications(uid);
  return unreadCount;
}

export async function markAsRead(uid: string, notificationId: string) {
  await updateDoc(doc(db, "notifications", uid, "items", notificationId), {
    read: true,
  });
}
