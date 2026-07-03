import { adminAuth, adminDb } from "@/lib/firebase-admin";

// Server-side gate, not just URL hiding — per CONTEXT.md Section 5.
// A designer viewing someone else's pending poster must never receive the
// clean secureUrl. This route is the single place that decides that.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authHeader = req.headers.get("authorization");
  const idToken = authHeader?.replace("Bearer ", "");
  if (!idToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posterSnap = await adminDb.collection("posters").doc(id).get();
  if (!posterSnap.exists) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const poster = posterSnap.data()!;

  const userSnap = await adminDb.collection("users").doc(uid).get();
  const role = userSnap.exists ? userSnap.data()?.role : null;

  const isOwner = poster.uploadedBy === uid;
  const isReviewerOrAdmin = role === "reviewer" || role === "admin";

  // Per CONTEXT.md Section 3 RBAC table:
  // designers may download only their own posters; reviewer/admin may
  // download any poster, regardless of status.
  if (!isOwner && !isReviewerOrAdmin) {
    return Response.json(
      { error: "You don't have permission to download this poster." },
      { status: 403 }
    );
  }

  return Response.json({ secureUrl: poster.secureUrl as string });
}
