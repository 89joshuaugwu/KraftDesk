import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { notifyOnStatusChange } from "@/lib/notifications-server";
import type { PosterStatus } from "@/types/poster";

// Reviewer/admin-only status transitions (Approve / Request Changes / Reject
// / Publish), gated server-side per CONTEXT.md Section 3 RBAC table — the
// Firestore rules also allow this write from the client, but routing it
// through here lets us fire the cross-user notification atomically with
// the status change in one trusted place.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = req.headers.get("authorization");
  const idToken = authHeader?.replace("Bearer ", "");
  if (!idToken) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let uid: string;
  try {
    uid = (await adminAuth.verifyIdToken(idToken)).uid;
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status, commentText } = (await req.json()) as {
    status: PosterStatus;
    commentText?: string;
  };

  const userSnap = await adminDb.collection("users").doc(uid).get();
  const role = userSnap.data()?.role;

  const posterRef = adminDb.collection("posters").doc(id);
  const posterSnap = await posterRef.get();
  if (!posterSnap.exists) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const poster = posterSnap.data()!;

  const isReviewerOrAdmin = role === "reviewer" || role === "admin";
  const isAdminOnly = role === "admin";

  if (status === "published") {
    // Publish to gallery is an admin-only manual action, per DESIGN.md
    // Section 7 / PROMPT.md Phase 7.
    if (!isAdminOnly) {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }
  } else if (["approved", "changes_requested", "rejected"].includes(status)) {
    if (!isReviewerOrAdmin) {
      return Response.json({ error: "Reviewer or admin only" }, { status: 403 });
    }
    if ((status === "changes_requested" || status === "rejected") && !commentText?.trim()) {
      return Response.json(
        { error: "A comment is required for this action." },
        { status: 400 }
      );
    }
  } else {
    return Response.json({ error: "Unsupported status transition" }, { status: 400 });
  }

  await posterRef.update({
    status,
    reviewedBy: status === "published" ? poster.reviewedBy ?? null : uid,
    updatedAt: Date.now(),
  });

  if (commentText?.trim()) {
    await posterRef.collection("comments").add({
      authorId: uid,
      authorRole: role,
      text: commentText.trim(),
      createdAt: Date.now(),
    });
  }

  if (status !== "published") {
    await notifyOnStatusChange(id, status, poster.uploadedBy);
  }

  return Response.json({ ok: true });
}
