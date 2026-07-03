// Client-safe Cloudinary helpers.
// Signature generation lives server-side in /app/api/cloudinary/sign/route.ts
// per CONTEXT.md Section 4 — the API secret never ships to the browser.

import type { PosterStatus } from "@/types/poster";
import { auth } from "@/lib/firebase";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB cap, protects Cloudinary free tier

export function validateFileForUpload(file: File): string | null {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return "Only JPG, PNG, WebP, or PDF files are accepted.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "File is larger than 10MB. Please compress it and try again.";
  }
  return null;
}

interface SignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
}

export async function requestUploadSignature(): Promise<SignatureResponse> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("You must be signed in to upload.");
  const idToken = await currentUser.getIdToken();

  const res = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error("Could not get an upload signature.");
  return res.json();
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  resource_type: string;
}

export async function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) throw new Error("Cloudinary cloud name is not configured.");

  const { signature, timestamp, apiKey } = await requestUploadSignature();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", "kraftdesk_posters");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // File is uploaded directly to Cloudinary from the browser — it never
    // passes through a Vercel function, avoiding payload size limits.
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error("Upload to Cloudinary failed."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(formData);
  });
}

// Watermark URL-swap logic — never re-upload to change watermark state.
// Implemented exactly per CONTEXT.md Section 5.
export function getPreviewUrl(
  publicId: string,
  status: PosterStatus,
  cloudName: string
): string {
  const base = `https://res.cloudinary.com/${cloudName}/image/upload`;
  const optimize = "q_auto,f_auto,w_1200";

  if (status === "pending") {
    return `${base}/${optimize},l_text:Arial_60_bold:PENDING%20REVIEW,co_white,o_45,g_center,a_-30/${publicId}`;
  }
  if (status === "changes_requested") {
    return `${base}/${optimize},l_text:Arial_60_bold:CHANGES%20REQUESTED,co_white,o_45,g_center,a_-30/${publicId}`;
  }
  // approved, published, or draft (owner viewing own draft) — clean
  return `${base}/${optimize}/${publicId}`;
}

export function getThumbnailUrl(publicId: string, cloudName: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto,w_400/${publicId}`;
}
