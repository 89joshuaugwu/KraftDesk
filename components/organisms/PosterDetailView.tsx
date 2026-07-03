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

export function PosterDetailView({ posterId }: { posterId: string }) {
  const { user, role } = useUserRole();
  const [poster, setPoster] = useState<Poster | null>(null);
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "posters", posterId), (snap) => {
      if (snap.exists()) {
        setPoster({ id: snap.id, ...(snap.data() as Omit<Poster, "id">) });
      }
    });
    return () => unsub();
  }, [posterId]);

  if (!poster || !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="skeleton h-96 w-full" />
      </div>
    );
  }

  const isOwner = poster.uploadedBy === user.uid;
  const isReviewer = canReview(role);
  const canDownload = isOwner || isReviewer;

  async function handleDownload() {
    if (!poster) return;
    setDownloading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/posters/${posterId}/download`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // In-page quick download (no new tab). Fetch the file as a blob and
      // trigger a download with the poster's title as the filename, instead
      // of window.open()-ing the raw Cloudinary URL.
      const fileRes = await fetch(data.secureUrl);
      if (!fileRes.ok) throw new Error("Couldn't fetch the file for download.");
      const blob = await fileRes.blob();

      let ext = "";
      const m = (data.secureUrl as string).match(/\.(png|jpg|jpeg|webp|pdf)(\?|$)/i);
      if (m) ext = m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
      else if (blob.type === "image/png") ext = "png";
      else if (blob.type === "image/jpeg") ext = "jpg";
      else if (blob.type === "image/webp") ext = "webp";
      else if (blob.type === "application/pdf") ext = "pdf";
      else ext = "png";

      const safeName = poster.title.replace(/[^a-z0-9_\- ]/gi, "").trim().replace(/\s+/g, "_") || "poster";
      const filename = `${safeName}.${ext}`;

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
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
    } catch (e) {
      toast.error("Couldn't upload the new version.");
    } finally {
      setUploadingVersion(false);
    }
  }

  async function handlePublish() {
    if (!confirm("Publish this poster to the public gallery? This will make it visible to everyone.")) return;
    setPublishing(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/posters/${posterId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ status: "published" }),
      });
      if (res.ok) toast.success("Published to gallery!");
      else toast.error("Couldn't publish.");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't publish.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-deep-kraft">{poster.title}</h1>
        <StatusBadge status={poster.status} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-4 overflow-hidden rounded-lg border border-kraft-tan bg-warm-white"
      >
        <img
          src={previewOverride ?? poster.previewUrl}
          alt={poster.title}
          className="w-full object-contain"
        />
      </motion.div>

      <div className="mt-3 flex flex-wrap gap-2">
        {poster.tags.map((t) => (
          <span key={t} className="rounded-full bg-kraft-tan/50 px-2.5 py-1 text-xs text-deep-kraft">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        {canDownload && (
          <Button variant="secondary" onClick={handleDownload} loading={downloading}>
            <Download className="h-4 w-4" /> Download original
          </Button>
        )}
        {poster.status === "draft" && isOwner && (
          <Button onClick={handleSubmitFromDraft}>Submit for review</Button>
        )}
        {poster.status === "approved" && (isAdmin(role) || isOwner) && (
          <Button variant="success" onClick={handlePublish} loading={publishing}>
            Publish to gallery
          </Button>
        )}
      </div>

      {isOwner && poster.status === "changes_requested" && (
        <label className="mt-4 flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-kraft-tan bg-warm-white text-sm font-medium text-kraft-brown">
          <UploadCloud className="h-4 w-4" />
          {uploadingVersion ? "Uploading..." : "Upload new version"}
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            disabled={uploadingVersion}
            onChange={(e) => e.target.files?.[0] && handleNewVersionUpload(e.target.files[0])}
          />
        </label>
      )}

      <div className="mt-6">
        <VersionHistory
          posterId={posterId}
          currentVersion={poster.currentVersion}
          onPreview={(url) => setPreviewOverride(url)}
        />
      </div>

      <div className="mt-6">
        <CommentThread posterId={posterId} />
      </div>

      {isReviewer && poster.status === "pending" && (
        <div className="mt-6">
          <ReviewActionBar posterId={posterId} onDone={() => {}} />
        </div>
      )}
    </div>
  );
}
