export type PosterStatus =
  | "draft"
  | "pending"
  | "approved"
  | "changes_requested"
  | "rejected"
  | "published";

export interface Poster {
  id: string;
  title: string;
  category: string; // categoryId reference
  tags: string[];
  status: PosterStatus;
  currentVersion: number;
  cloudinaryPublicId: string;
  secureUrl: string; // clean, un-watermarked — NEVER pass to an unauthorized client
  previewUrl: string; // watermarked if pending/changes_requested, else same as secureUrl
  uploadedBy: string;
  reviewedBy: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface PosterVersion {
  versionNumber: number;
  cloudinaryPublicId: string;
  secureUrl: string;
  uploadedAt: number;
  changeNote: string;
}

export interface PosterComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: "designer" | "reviewer" | "admin";
  text: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  posterCount: number;
  createdBy: string;
  createdAt: number;
}

// Client-safe projection of a Poster — used whenever a poster is passed to
// a viewer who may not be authorized to see the clean secureUrl.
// See CONTEXT.md Section 5: "the real protection is the server-side gate."
export type ClientSafePoster = Omit<Poster, "secureUrl"> & {
  secureUrl: string | null; // null unless the viewer is authorized
};
