# KraftDesk — CONTEXT.md

Technical architecture reference. Pair with `DESIGN.md` when prompting Antigravity.

---

## 1. Tech Stack (locked — $0 cost)

| Layer | Choice | Free tier notes |
|---|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) | Vercel free tier — 100GB bandwidth/mo |
| Language | TypeScript (strict mode) | |
| Styling | Tailwind CSS v4 | Light mode only, Kraft palette per DESIGN.md |
| Motion | Framer Motion 11.x | |
| Auth | Firebase Auth (email/password + Google) | Spark plan — unlimited auth, free |
| Database | Firestore | Spark plan — 1GB storage, 50K reads/20K writes per day free |
| File storage | Cloudinary | Free tier — 25 credits/mo (~25GB storage+bandwidth combined). **Flag: monitor usage, this is the tightest constraint in the whole stack** |
| Notifications | Firestore-based in-app only | No Gmail SMTP — removed per scope decision, zero email infra needed |
| Hosting | Vercel | Free tier, auto-deploy from GitHub |

⚠️ **Cloudinary free tier is the real constraint here, not Firebase.** 25 credits/mo covers storage + bandwidth + transformations combined. Mitigate with:
- Always serve `q_auto,f_auto` (never raw uploads) — cuts bandwidth significantly
- Don't regenerate transformations unnecessarily — cache the transformation URL strings in Firestore, don't re-request new params on every render
- Consider a soft poster-count cap or image size limit on upload (e.g. reject >10MB) to protect the quota

---

## 2. Firestore Data Model

```
/users/{uid}
  uid, email, displayName, avatarUrl
  role: "designer" | "reviewer" | "admin"
  notificationPrefs: { newSubmission: bool, statusChange: bool, newComment: bool }
  createdAt

/categories/{categoryId}
  name, posterCount, createdBy, createdAt

/posters/{posterId}
  title: string
  category: string                     // categoryId reference
  tags: string[]
  status: "draft" | "pending" | "approved" | "changes_requested" | "rejected" | "published"
  currentVersion: number
  cloudinaryPublicId: string
  secureUrl: string                    // clean, un-watermarked
  previewUrl: string                   // watermarked if pending/changes_requested, else same as secureUrl
  uploadedBy: uid
  reviewedBy: uid | null
  createdAt, updatedAt

/posters/{posterId}/versions/{versionNumber}
  cloudinaryPublicId, secureUrl, uploadedAt, changeNote

/posters/{posterId}/comments/{commentId}
  authorId, authorRole: "designer"|"reviewer"|"admin"
  text, createdAt

/notifications/{uid}/items/{notifId}
  type: "new_submission" | "approved" | "changes_requested" | "rejected" | "new_comment"
  posterId, message, read: boolean, createdAt
```

---

## 3. Role-Based Access Control (RBAC)

| Action | Designer | Reviewer | Admin |
|---|---|---|---|
| Upload poster | ✅ (own) | ❌ | ❌ |
| Edit/resubmit own draft | ✅ | ❌ | ❌ |
| View own posters (any status) | ✅ | ✅ (all) | ✅ (all) |
| View others' pending posters | ❌ (watermarked preview only) | ✅ full | ✅ full |
| Approve / Reject / Request Changes | ❌ | ✅ | ✅ |
| Download original (un-watermarked) | ✅ (own only) | ✅ (any) | ✅ (any) |
| Comment | ✅ (own posters) | ✅ (any) | ✅ (any) |
| Manage categories | ❌ | ❌ | ✅ |
| Manage user roles | ❌ | ❌ | ✅ |

**Role assignment:** New signups default to `designer`. Only an existing `admin` can promote a user to `reviewer` or `admin` via `/dashboard/users`. No self-service role escalation — enforced both in UI (hide the option) and in Firestore rules (see below).

---

## 4. Cloudinary Signed Upload Flow

Never expose the Cloudinary API secret client-side. Flow:

1. Client requests a signature from `/app/api/cloudinary/sign/route.ts`
2. Server route generates a timestamped signature using `cloudinary.utils.api_sign_request()` with the API secret (server env var only)
3. Client uploads directly to Cloudinary using the signature + timestamp + API key (public) — file never touches your Vercel function, avoiding payload size limits
4. On upload success, Cloudinary returns `public_id` + `secure_url` — client writes the poster doc to Firestore with these values, `status: "draft"`

```typescript
// /app/api/cloudinary/sign/route.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder: "kraftdesk_posters" };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );
  return Response.json({ signature, timestamp, apiKey: process.env.CLOUDINARY_API_KEY });
}
```

---

## 5. Watermark URL Logic

Never re-upload to change watermark state — swap the Cloudinary transformation string based on `status`:

```typescript
function getPreviewUrl(publicId: string, status: string, cloudName: string): string {
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
```

**Server-side gate, not just URL hiding:** `/app/api/posters/[id]/download/route.ts` checks the caller's Firestore role/ownership before returning `secureUrl`. A designer viewing someone else's pending poster must never receive the clean URL in page props — compute `previewUrl` server-side per-request based on role, don't ship both URLs to the client and trust the UI to hide one.

---

## 6. Notification Write Logic

Fire directly from the same server action that mutates poster status — no queue/cron needed at this scale:

```typescript
async function notifyOnStatusChange(posterId: string, newStatus: string, designerId: string) {
  const messages: Record<string, string> = {
    approved: "Your poster was approved ✅",
    changes_requested: "Changes were requested on your poster",
    rejected: "Your poster was rejected",
  };
  if (!messages[newStatus]) return;

  await db.collection("notifications").doc(designerId).collection("items").add({
    type: newStatus,
    posterId,
    message: messages[newStatus],
    read: false,
    createdAt: Timestamp.now(),
  });
}

async function notifyReviewersOnSubmission(posterId: string, title: string) {
  const reviewers = await db.collection("users")
    .where("role", "in", ["reviewer", "admin"]).get();

  const batch = db.batch();
  reviewers.forEach((doc) => {
    const ref = db.collection("notifications").doc(doc.id).collection("items").doc();
    batch.set(ref, {
      type: "new_submission",
      posterId,
      message: `New poster submitted: "${title}"`,
      read: false,
      createdAt: Timestamp.now(),
    });
  });
  await batch.commit();
}
```

Client listens with `onSnapshot` on `/notifications/{uid}/items` ordered by `createdAt desc`, `where('read', '==', false)` for the badge count.

---

## 7. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function getRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == uid
        && request.resource.data.role == "designer"; // force default role on signup
      allow update: if request.auth != null && (
        request.auth.uid == uid && request.resource.data.role == resource.data.role // self-update, can't change own role
        || getRole() == "admin" // admin can change any user's role
      );
    }

    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null && getRole() == "admin";
    }

    match /posters/{posterId} {
      allow read: if true; // gating happens at the application layer (watermark logic), not read access
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uploadedBy;
      allow update: if request.auth != null && (
        request.auth.uid == resource.data.uploadedBy
        || getRole() in ["reviewer", "admin"]
      );

      match /versions/{versionNumber} {
        allow read: if true;
        allow write: if request.auth != null;
      }

      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
      }
    }

    match /notifications/{uid}/items/{notifId} {
      allow read, update: if request.auth != null && request.auth.uid == uid;
      allow create: if request.auth != null; // written by server actions on behalf of other users
    }
  }
}
```

⚠️ **Manual publish required in Firebase Console every time these rules change — cannot be automated via CLI in this workflow. Always budget this into the deploy checklist.**

---

## 8. Environment Variables

```
# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server only)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://kraftdesk.vercel.app
```

---

## 9. Non-Goals (out of scope for defense build)

- No email notifications — in-app only, per scope decision
- No payment/monetization — internal team tool, not marketplace
- No offline support — requires live internet for Firestore
- No native mobile app — mobile-first responsive web only
- Advanced version diffing (visual diff between poster versions) — nice-to-have, not core
