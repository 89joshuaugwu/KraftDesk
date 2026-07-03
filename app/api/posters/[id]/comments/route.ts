import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { notifyOnComment } from "@/lib/notifications-server";

// Posts a comment and notifies "the other party" per CONTEXT.md Section 6 /
// PROMPT.md Phase 6. Routed server-side so the cross-user notification write
// can use firebase-admin.
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

  const { text } = (await req.json()) as { text: string };
  if (!text?.trim()) {
    return Response.json({ error: "Comment text is required" }, { status: 400 });
  }

  const userSnap = await adminDb.collection("users").doc(uid).get();
  const userData = userSnap.data();
  const role = userData?.role ?? "designer";

  const posterRef = adminDb.collection("posters").doc(id);
  const posterSnap = await posterRef.get();
  if (!posterSnap.exists) return Response.json({ error: "Not found" }, { status: 404 });
  const poster = posterSnap.data()!;

  await posterRef.collection("comments").add({
    authorId: uid,
    authorRole: role,
    text: text.trim(),
    createdAt: Date.now(),
  });

  await notifyOnComment(id, poster.title, role, poster.uploadedBy, poster.reviewedBy ?? null);

  return Response.json({ ok: true });
}
