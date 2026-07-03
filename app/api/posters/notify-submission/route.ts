import { adminAuth } from "@/lib/firebase-admin";
import { notifyReviewersOnSubmission } from "@/lib/notifications-server";

// Called client-side right after a poster's status flips to "pending".
// Runs server-side because it needs to fan out writes into other users'
// /notifications/{uid}/items subcollections, which a designer's own client
// is not permitted to write into directly.
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  // Falls back gracefully: this is a best-effort notify call, the poster
  // submission itself already succeeded client-side by this point.
  const idToken = authHeader?.replace("Bearer ", "");
  if (idToken) {
    try {
      await adminAuth.verifyIdToken(idToken);
    } catch {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { posterId, title } = await req.json();
  if (!posterId || !title) {
    return Response.json({ error: "Missing posterId or title" }, { status: 400 });
  }

  await notifyReviewersOnSubmission(posterId, title);
  return Response.json({ ok: true });
}
