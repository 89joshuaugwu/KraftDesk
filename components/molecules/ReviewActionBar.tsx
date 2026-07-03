"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, AlertTriangle, X } from "lucide-react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import type { PosterStatus } from "@/types/poster";

// Only rendered by the parent when viewer's role is reviewer or admin.
// Request Changes / Reject require a comment before submitting.
export function ReviewActionBar({
  posterId,
  onDone,
}: {
  posterId: string;
  onDone: () => void;
}) {
  const [pendingAction, setPendingAction] = useState<PosterStatus | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(status: PosterStatus, commentText?: string) {
    setSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/posters/${posterId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ status, commentText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      toast.success(
        status === "approved"
          ? "Poster approved ✅"
          : status === "rejected"
          ? "Poster rejected"
          : "Changes requested"
      );
      setPendingAction(null);
      setComment("");
      onDone();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="sticky bottom-16 z-10 flex gap-2 border-t border-kraft-tan bg-warm-white p-3 md:bottom-0 md:rounded-lg md:border">
        <Button variant="success" fullWidth onClick={() => submit("approved")} loading={submitting}>
          <Check className="h-4 w-4" /> Approve
        </Button>
        <Button variant="secondary" fullWidth onClick={() => setPendingAction("changes_requested")}>
          <AlertTriangle className="h-4 w-4" /> Request Changes
        </Button>
        <Button variant="danger" fullWidth onClick={() => setPendingAction("rejected")}>
          <X className="h-4 w-4" /> Reject
        </Button>
      </div>

      <Modal
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        title={pendingAction === "rejected" ? "Reject poster" : "Request changes"}
      >
        <p className="mb-3 text-sm text-warm-gray">
          A comment is required so the designer knows what to fix.
        </p>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Explain what needs to change…"
          autoFocus
        />
        <Button
          fullWidth
          className="mt-4"
          variant={pendingAction === "rejected" ? "danger" : "primary"}
          disabled={!comment.trim()}
          loading={submitting}
          onClick={() => pendingAction && submit(pendingAction, comment)}
        >
          {pendingAction === "rejected" ? "Confirm reject" : "Confirm request changes"}
        </Button>
      </Modal>
    </>
  );
}
