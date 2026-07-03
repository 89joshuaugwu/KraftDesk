"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { db, auth } from "@/lib/firebase";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/molecules/RoleBadge";
import type { PosterComment } from "@/types/poster";
import { safeFormatDistanceToNow } from "@/lib/date";

export function CommentThread({ posterId }: { posterId: string }) {
  const [comments, setComments] = useState<PosterComment[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "posters", posterId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PosterComment, "id">) }))
      );
    });
    return () => unsub();
  }, [posterId]);

  async function handlePost() {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/posters/${posterId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("failed");
      setText("");
    } catch {
      toast.error("Couldn't post your comment.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-bold text-deep-kraft">Comments</h3>

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {comments.map((c) => (
            <motion.div
              key={c.id}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-kraft-tan bg-warm-white p-3"
            >
              <div className="flex items-center gap-2">
                <RoleBadge role={c.authorRole} />
                <span className="text-xs text-warm-gray">
                  {safeFormatDistanceToNow(c.createdAt)}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-charcoal">{c.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        {comments.length === 0 && (
          <p className="text-sm text-warm-gray">No comments yet.</p>
        )}
      </div>

      <div className="sticky bottom-16 flex gap-2 bg-cream py-2 md:bottom-0 md:static">
        <Textarea
          placeholder="Add a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[44px]"
        />
        <Button onClick={handlePost} loading={posting} className="self-end">
          Post
        </Button>
      </div>
    </div>
  );
}
