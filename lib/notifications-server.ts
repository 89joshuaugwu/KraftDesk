// Server-only notification writers — call these from API routes / server
// actions that mutate poster status, exactly per CONTEXT.md Section 6.
// Never import this file from a "use client" component.

import { adminDb } from "@/lib/firebase-admin";
import type { NotificationType } from "@/types/notification";
import type { PosterStatus } from "@/types/poster";

const STATUS_MESSAGES: Partial<Record<PosterStatus, string>> = {
  approved: "Your poster was approved ✅",
  changes_requested: "Changes were requested on your poster",
  rejected: "Your poster was rejected",
};

async function prefsAllow(
  uid: string,
  key: "newSubmission" | "statusChange" | "newComment"
): Promise<boolean> {
  const snap = await adminDb.collection("users").doc(uid).get();
  if (!snap.exists) return true; // fail open rather than silently drop notifications
  const prefs = snap.data()?.notificationPrefs;
  if (!prefs || typeof prefs[key] !== "boolean") return true;
  return prefs[key];
}

export async function notifyOnStatusChange(
  posterId: string,
  newStatus: PosterStatus,
  designerId: string
) {
  const message = STATUS_MESSAGES[newStatus];
  if (!message) return;
  if (!(await prefsAllow(designerId, "statusChange"))) return;

  const type: NotificationType = newStatus as NotificationType;
  await adminDb
    .collection("notifications")
    .doc(designerId)
    .collection("items")
    .add({
      type,
      posterId,
      message,
      read: false,
      createdAt: Date.now(),
    });
}

export async function notifyReviewersOnSubmission(
  posterId: string,
  title: string
) {
  const reviewers = await adminDb
    .collection("users")
    .where("role", "in", ["reviewer", "admin"])
    .get();

  const batch = adminDb.batch();
  for (const docSnap of reviewers.docs) {
    if (!(await prefsAllow(docSnap.id, "newSubmission"))) continue;
    const ref = adminDb
      .collection("notifications")
      .doc(docSnap.id)
      .collection("items")
      .doc();
    batch.set(ref, {
      type: "new_submission",
      posterId,
      message: `New poster submitted: "${title}"`,
      read: false,
      createdAt: Date.now(),
    });
  }
  await batch.commit();
}

// Notify "the other party" when a comment is posted: if a designer comments,
// notify the reviewer who last actioned the poster (reviewedBy) or, absent
// that, all reviewers/admins; if a reviewer/admin comments, notify the
// poster's uploadedBy.
export async function notifyOnComment(
  posterId: string,
  posterTitle: string,
  commenterRole: "designer" | "reviewer" | "admin",
  uploadedBy: string,
  reviewedBy: string | null
) {
  const recipients = new Set<string>();

  if (commenterRole === "designer") {
    if (reviewedBy) {
      recipients.add(reviewedBy);
    } else {
      const reviewers = await adminDb
        .collection("users")
        .where("role", "in", ["reviewer", "admin"])
        .get();
      reviewers.forEach((d) => recipients.add(d.id));
    }
  } else {
    recipients.add(uploadedBy);
  }

  const batch = adminDb.batch();
  for (const uid of recipients) {
    if (!(await prefsAllow(uid, "newComment"))) continue;
    const ref = adminDb
      .collection("notifications")
      .doc(uid)
      .collection("items")
      .doc();
    batch.set(ref, {
      type: "new_comment",
      posterId,
      message: `New comment on "${posterTitle}"`,
      read: false,
      createdAt: Date.now(),
    });
  }
  await batch.commit();
}
