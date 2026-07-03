"use client";

import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { UploadCloud, X } from "lucide-react";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  validateFileForUpload,
  uploadToCloudinary,
  getPreviewUrl,
} from "@/lib/cloudinary";
import type { Category } from "@/types/poster";

export function PosterUploadForm({ uid }: { uid: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [createdPosterId, setCreatedPosterId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getDocs(collection(db, "categories")).then((snap) => {
      setCategories(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, "id">) }))
      );
    });
  }, []);

  function handleFile(f: File | null) {
    if (!f) return;
    const error = validateFileForUpload(f);
    if (error) {
      toast.error(error);
      return;
    }
    setFile(f);
    setPreviewSrc(f.type === "application/pdf" ? null : URL.createObjectURL(f));
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }
    if (!title || !category) {
      toast.error("Title and category are required.");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, setProgress);
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
      const preview = getPreviewUrl(result.public_id, "draft", cloudName);

      const docRef = await addDoc(collection(db, "posters"), {
        title,
        category,
        tags,
        status: "draft",
        currentVersion: 1,
        cloudinaryPublicId: result.public_id,
        secureUrl: result.secure_url,
        previewUrl: preview,
        uploadedBy: uid,
        reviewedBy: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCreatedPosterId(docRef.id);
      toast.success("Poster saved as draft.");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmitForReview() {
    if (!createdPosterId) return;
    setUploading(true);
    try {
      const { doc, updateDoc, serverTimestamp: ts } = await import("firebase/firestore");
      await updateDoc(doc(db, "posters", createdPosterId), {
        status: "pending",
        updatedAt: ts(),
      });

      // Fire the notify-reviewers write via a server route so it can use
      // firebase-admin without exposing service credentials client-side.
      const { auth } = await import("@/lib/firebase");
      const idToken = await auth.currentUser?.getIdToken();
      await fetch("/api/posters/notify-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ posterId: createdPosterId, title }),
      }).catch(() => {
        // Non-fatal: the poster is still submitted even if the notify call fails.
      });

      toast.success("Submitted for review!");
      window.location.href = `/dashboard/posters/${createdPosterId}`;
    } catch (err) {
      toast.error("Couldn't submit for review.");
    } finally {
      setUploading(false);
    }
  }

  if (createdPosterId) {
    return (
      <div className="rounded-lg border border-kraft-tan bg-warm-white p-6 text-center">
        <p className="font-semibold text-deep-kraft">Poster saved as a draft.</p>
        <p className="mt-1 text-sm text-warm-gray">
          It&apos;s only visible to you until you submit it for review.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="secondary" onClick={() => (window.location.href = `/dashboard/posters/${createdPosterId}`)}>
            View draft
          </Button>
          <Button onClick={handleSubmitForReview} loading={uploading}>
            Submit for review
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleCreate} className="flex flex-col gap-5">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-kraft-tan bg-warm-white p-6 text-center hover:border-terracotta"
      >
        {previewSrc ? (
          <img src={previewSrc} alt="Preview" className="max-h-48 rounded-md object-contain" />
        ) : file ? (
          <p className="font-medium text-charcoal">{file.name}</p>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-kraft-brown" />
            <p className="font-medium text-charcoal">Tap to choose a file</p>
            <p className="text-xs text-warm-gray">JPG, PNG, WebP, or PDF — up to 10MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {uploading && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-kraft-tan">
          <div
            className="h-full bg-kraft-brown transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />

      <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} required>
        <option value="">Select a category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-charcoal">Tags</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded-full bg-kraft-tan/50 px-2.5 py-1 text-xs font-medium text-deep-kraft"
            >
              {t}
              <button
                type="button"
                onClick={() => setTags(tags.filter((x) => x !== t))}
                aria-label={`Remove ${t}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <Input
          placeholder="Type a tag and press Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
        />
      </div>

      <Button type="submit" fullWidth loading={uploading}>
        Save as draft
      </Button>
    </form>
  );
}
