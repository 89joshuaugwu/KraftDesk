# KraftDesk

Digital Poster Design Management System — upload, review, approve, and
distribute poster designs with role-based workflow. Built with Next.js 15
(App Router), TypeScript, Tailwind CSS v4, Firebase Auth + Firestore, and
Cloudinary. $0-cost stack, no email infrastructure — notifications are
in-app only.

This repo is the implementation of `DESIGN.md`, `CONTEXT.md`, and
`PROMPT.md` (included in `/docs`), built end-to-end rather than fed to
Antigravity phase-by-phase.

---

## Technical & Non-Technical Guides

To help developers, designers, and non-coders understand the mechanics of the project, we have created a set of detailed documentation guides:

1. **[System Architecture & Tech Stack](file:///c:/Users/JOSHUA%20ZAZA/Downloads/kraftdesk/docs/architecture_and_tech_stack.md)**: Conceptual walkthrough of KraftDesk, systems architecture Mermaid diagram, stack details, and directory index.
2. **[Data Model & Database Architecture](file:///c:/Users/JOSHUA%20ZAZA/Downloads/kraftdesk/docs/database_and_security.md)**: Detailed Firestore database schema description, entity relationships, and line-by-line breakdown of security rules.
3. **[Authentication & Access Control (RBAC)](file:///c:/Users/JOSHUA%20ZAZA/Downloads/kraftdesk/docs/authentication_and_authorization.md)**: Explanation of signup/login flows, session guards, user hooks, the role permissions matrix, and admin bootstrapping.
4. **[Cloudinary & Media Lifecycle Management](file:///c:/Users/JOSHUA%20ZAZA/Downloads/kraftdesk/docs/media_and_cloudinary_handling.md)**: Walkthrough of the signed direct upload flow, status-based watermarking, secure download gating, and image optimizations.
5. **[Page Walkthrough & UX Audit](file:///c:/Users/JOSHUA%20ZAZA/Downloads/kraftdesk/docs/pages_and_features_guide.md)**: Screen-by-screen breakdown of all features, responsive design layouts (mobile tab bar/desktop sidebar), and permissions per page.
6. **[API Endpoints & Notification System](file:///c:/Users/JOSHUA%20ZAZA/Downloads/kraftdesk/docs/api_reference_and_notifications.md)**: Complete backend API schema reference (payload formats, responses) and notifications fan-out details.

---

## 1. Local setup

```bash
npm install
cp .env.local.example .env.local
# fill in .env.local — see Section 2 below for where each value comes from
npm run dev
```

Open http://localhost:3000.

## 2. Firebase project setup

1. Create a project at https://console.firebase.google.com
2. **Authentication** → Sign-in method → enable **Email/Password** and **Google**
3. **Firestore Database** → Create database → start in production mode (the
   rules below replace the defaults)
4. Project settings → General → "Your apps" → add a **Web app** → copy the
   config values into `NEXT_PUBLIC_FIREBASE_*` in `.env.local`
5. Project settings → Service accounts → **Generate new private key** →
   this JSON gives you `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`,
   and `FIREBASE_ADMIN_PRIVATE_KEY`.
   - Paste the private key into `.env.local` **with the `\n` sequences kept
     literal** (the app un-escapes them at runtime in `lib/firebase-admin.ts`).
     If you're pasting into Vercel's env var UI, paste it as one line with
     `\n` characters intact — don't paste an actual multi-line key.

### Publish the security rules — manual step, every time

Firebase Console → Firestore Database → **Rules** tab → paste the contents
of `firebase/firestore.rules` → **Publish**.

⚠️ This cannot be automated via the Firebase CLI in this workflow. Repeat
this step every time `firebase/firestore.rules` changes. Budget it into your
deploy checklist (Section 6).

`firebase/database.rules.json` is also included, locking the Realtime
Database down to no read/write access. **KraftDesk does not use the Realtime
Database** — Firestore is the only database in this stack — this file exists
so the Firebase project has a safe rule set for every product rather than
being left in its permissive fresh-project default, in case Realtime
Database ever gets enabled on this project for something unrelated. If you
never enable Realtime Database in the console, this file is inert.

If you use the Firebase CLI (`firebase deploy --only firestore:rules`), the
`firebase/firebase.json` in this repo already points at both rule files.

## 3. Cloudinary setup

1. Create an account at https://cloudinary.com (free tier)
2. Dashboard → copy your **Cloud name** into `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
3. Settings → Access Keys → copy **API Key** / **API Secret** into
   `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` (server-only, never exposed
   to the browser — see `lib/cloudinary.ts` and
   `app/api/cloudinary/sign/route.ts`)
4. Settings → Upload → make sure signed uploads are allowed (this app never
   uses an unsigned upload preset)

⚠️ **Cloudinary's free tier (25 credits/mo, covering storage + bandwidth +
transformations combined) is the tightest constraint in this whole stack —
tighter than Firebase's free tier.** Monitor usage weekly in the Cloudinary
dashboard. The app already mitigates this by:
- always serving `q_auto,f_auto` transformations, never raw uploads
- caching transformation URL strings in Firestore (`previewUrl`) instead of
  regenerating params on every render
- rejecting uploads over 10MB client-side (`lib/cloudinary.ts`)

## 4. Bootstrap your first admin account

There's no admin on a fresh deploy, so the first promotion is manual:

1. Sign up normally through the app (you'll get `role: "designer"`)
2. Firebase Console → Firestore Database → `users` collection → your user
   doc → edit the `role` field to `"admin"`
3. Refresh the app — you'll now see the Queue, Categories, and Users nav
   items

From then on, promote other accounts to `reviewer` or `admin` from
`/dashboard/users` (admin-only page) instead of the console.

## 5. Deploying to Vercel

1. Push this repo to GitHub
2. Import it in Vercel → set every variable from `.env.local.example` in
   Project Settings → Environment Variables
3. Deploy
4. Set `NEXT_PUBLIC_APP_URL` to your real Vercel URL and redeploy if it
   changed from the placeholder

## 6. Deploy checklist

```
1. Push to GitHub
2. Vercel: connect repo, set all env vars from .env.local.example
3. ⚠️ MANUAL — Firebase Console → Firestore → Rules → paste
   firebase/firestore.rules → Publish. Repeat every time rules change.
4. Firebase Console → Authentication → enable Email/Password + Google
5. Cloudinary → confirm uploads are signed-only (not unsigned)
6. Sign up → promote your own account to "admin" in Firestore console
   (Section 4 above — one-time bootstrap, no admin exists on a fresh deploy)
7. Test the full flow:
   signup as designer → upload → submit for review
   → promote a second test account to reviewer
   → approve / reject / request changes
   → confirm the notification badge updates in real time
   → publish an approved poster as admin
   → confirm it appears at /gallery
8. Monitor Cloudinary usage weekly — see Section 3 warning
```

## 7. Security model — read this before changing Firestore rules

`firebase/firestore.rules` sets `allow read: if true` on `/posters/{posterId}`.
That means the **raw Firestore document — including its `secureUrl`
field — is technically fetchable by anyone who knows the document ID**, even
though the UI never surfaces that field for unauthorized viewers. This is
intentional, matching CONTEXT.md Section 5 ("gating happens at the
application layer, not read access").

The actual protection has two layers:

1. **The UI never renders `secureUrl` directly.** Every poster image in the
   app (`PosterCard`, `PosterDetailView`, `ReviewerQueue`, `PublicGallery`)
   renders `previewUrl` only — the watermarked-or-clean URL computed by
   `getPreviewUrl()` in `lib/cloudinary.ts` based on status. `secureUrl`
   never appears in a client-rendered `<img>` or `<a href>`.
2. **The server-side gate**: `app/api/posters/[id]/download/route.ts` is the
   *only* place `secureUrl` is ever returned to a client, and it re-checks
   the caller's Firebase Auth token + Firestore role/ownership on every
   request before doing so — a designer requesting someone else's pending
   poster gets a 403, regardless of what's sitting in the Firestore document.
   `PosterDetailView`'s "Download original" button calls this route on
   demand; it never reads `poster.secureUrl` from the live Firestore
   snapshot it already has in memory.

If you tighten the Firestore rule instead (e.g. restrict poster reads to
`request.auth != null`), that's a reasonable defense-in-depth improvement,
but it doesn't replace the download route — keep both.

## 8. Project structure

```
/app
  /(public)/            — landing, gallery, auth (no auth required)
  /(dashboard)/          — role-gated app shell, all under /dashboard
  /api/cloudinary/sign   — signed upload endpoint
  /api/posters/[id]/download   — role-gated original-file download
  /api/posters/[id]/status     — approve / request changes / reject / publish
  /api/posters/[id]/comments   — post a comment, notifies the other party
  /api/posters/notify-submission — fan-out notify to reviewers/admins
/components
  /ui         — Button, Input, Textarea, Select, StatusBadge, Card, Spinner, Modal, EmptyState
  /molecules  — NotificationBell, PosterCard, PosterUploadForm, CommentThread, VersionHistory, ReviewActionBar, CategoryFilterBar, RoleBadge
  /organisms  — DesignerDashboard, ReviewerQueue, PosterDetailView, PublicGallery, UserManagementTable, CategoryManager
  /shells     — AppShell (bottom tabs mobile / sidebar desktop), PublicShell
/lib
  firebase.ts, firebase-admin.ts   — client vs. server-only Firebase init
  cloudinary.ts                    — client-safe upload + watermark URL helpers
  auth.ts, roles.ts                — sign-up/in/out, role hook
  notifications.ts                 — client-side listeners
  notifications-server.ts          — server-only cross-user notification writers
/types        — Poster, User, Notification, Category types
/firebase     — firestore.rules, database.rules.json, firebase.json
/docs         — original DESIGN.md, CONTEXT.md, PROMPT.md
```

## 9. Non-goals (unchanged from the original spec)

- No email notifications — in-app only
- No payment/monetization — internal team tool
- No offline support — requires live internet for Firestore
- No native mobile app — mobile-first responsive web only
- No visual version-diffing between poster versions
#   K r a f t D e s k  
 