"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Download, UploadCloud } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { VersionHistory } from "@/components/molecules/VersionHistory";
import { CommentThread } from "@/components/molecules/CommentThread";
import { ReviewActionBar } from "@/components/molecules/ReviewActionBar";
import { canReview, isAdmin, useUserRole } from "@/lib/roles";
import { validateFileForUpload, uploadToCloudinary } from "@/lib/cloudinary";
import type { Poster } from "@/types/poster";

// IMPORTANT: even though the Firestore /posters/{id} doc technically carries
// a `secureUrl` field readable by any client (Firestore rules gate posters
// at the application layer, not the field layer — see CONTEXT.md Section 5
// and the Firestore rules), this component never renders that raw field.
// The image tag always uses `previewUrl`. The clean, un-watermarked file is
// only ever fetched on demand through the role-gated
// /api/posters/[id]/download route, which re-checks ownership/role
// server-side before returning anything.
export function PosterDetailView({ posterId }: { posterId: string }) {
  const { user, role } = useUserRole();
  const [poster, setPoster] = useState<Poster | null>(null);
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
+  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "posters", posterId), (snap) => {
      if (snap.exists()) {
        setPoster({ id: snap.id, ...(snap.data() as Omit<Poster, "id">) });
      }
    });
    return () => unsub();
  }, [posterId]);

  if (!poster || !user) {
    return <div className="mx-auto max-w-2xl px-4 py-10"><div className="skeleton h-96 w-full" /></div>;
  }

  const isOwner = poster.uploadedBy === user.uid;
  const isReviewer = canReview(role);
  const canDownload = isOwner || isReviewer;

  async function handleDownload() {
    setDownloading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/posters/${posterId}/download`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.open(data.secureUrl, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Couldn't download this poster.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleSubmitFromDraft() {
    if (!poster) return;
    await updateDoc(doc(db, "posters", posterId), { status: "pending", updatedAt: Date.now() });
    const idToken = await auth.currentUser?.getIdToken();
    await fetch("/api/posters/notify-submission", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ posterId, title: poster.title }),
    }).catch(() => {});
    toast.success("Submitted for review!");
  }

  async function handleNewVersionUpload(file: File) {
    const err = validateFileForUpload(file);
    if (err) {
      toast.error(err);
      return;
    }
    setUploadingVersion(true);
    try {
      const result = await uploadToCloudinary(file);
      const nextVersion = poster!.currentVersion + 1;

      await addDoc(collection(db, "posters", posterId, "versions"), {
        versionNumber: nextVersion,
        cloudinaryPublicId: result.public_id,
        secureUrl: result.secure_url,
        uploadedAt: serverTimestamp(),
        changeNote: "",
      });

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
      const { getPreviewUrl } = await import("@/lib/cloudinary");
      await updateDoc(doc(db, "posters", posterId), {
        currentVersion: nextVersion,
        cloudinaryPublicId: result.public_id,
        secureUrl: result.secure_url,
        previewUrl: getPreviewUrl(result.public_id, "pending", cloudName),
        status: "pending",
        updatedAt: Date.now(),
      });

      const idToken = await auth.currentUser?.getIdToken();
      await fetch("/api/posters/notify-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ posterId, title: poster!.title }),
      }).catch(() => {});

      toast.success("New version submitted for review.");
    } catch {
      toast.error("Couldn't upload the new version.");
    } finally {
      setUploadingVersion(false);
    }
  }

  async function handlePublish() {
+    if (!confirm("Publish this poster to the public gallery? This will make it visible to everyone.")) return;
+    setPublishing(true);
     const idToken = await auth.currentUser?.getIdToken();
     const res = await fetch(`/api/posters/${posterId}/status`, {
       method: "POST",
       headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
       body: JSON.stringify({ status: "published" }),
     });
-    if (res.ok) toast.success("Published to gallery!");
-    else toast.error("Couldn't publish.");
+    if (res.ok) toast.success("Published to gallery!");
+    else toast.error("Couldn't publish.");
+    setPublishing(false);
   }

   return (
     <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
       <div className="flex items-start justify-between gap-3">
         <h1 className="text-xl font-bold text-deep-kraft">{poster.title}</h1>
         <StatusBadge status={poster.status} />
       </div>
@@
-        {isAdmin(role) && poster.status === "approved" && (
-          <Button variant="success" onClick={handlePublish}>
-            Publish to gallery
-          </Button>
-        )}
+        {poster.status === "approved" && (isAdmin(role) || isOwner) && (
+          <Button variant="success" onClick={handlePublish} loading={publishing}>
+            Publish to gallery
+          </Button>
+        )}
       </div>
@@
   );
 }
