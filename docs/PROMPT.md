# KraftDesk — PROMPT.md

Feed to Antigravity **one phase at a time**, attaching DESIGN.md + CONTEXT.md as context files. Verify each phase runs before moving to the next.

---

## PHASE 0 — Project Bootstrap

```
Using DESIGN.md and CONTEXT.md as reference, bootstrap a new Next.js 16 project named
"kraftdesk" with:

- App Router, TypeScript, Tailwind CSS v4, React 19
- Folder structure:
  /app
    /(public)/page.tsx
    /(public)/gallery/page.tsx
    /(public)/auth/signup/page.tsx
    /(public)/auth/login/page.tsx
    /(dashboard)/dashboard/page.tsx
    /(dashboard)/dashboard/upload/page.tsx
    /(dashboard)/dashboard/posters/page.tsx
    /(dashboard)/dashboard/posters/[posterId]/page.tsx
    /(dashboard)/dashboard/queue/page.tsx
    /(dashboard)/dashboard/categories/page.tsx
    /(dashboard)/dashboard/users/page.tsx
    /(dashboard)/dashboard/settings/page.tsx
    /api/cloudinary/sign/route.ts
    /api/posters/[id]/download/route.ts
  /components
    /ui         → Button, Input, Textarea, Select, StatusBadge, Card, Spinner, Toast, Modal
    /molecules  → NotificationBell, PosterCard, PosterUploadForm, CommentThread, VersionHistory, ReviewActionBar, CategoryFilterBar, RoleBadge
    /organisms  → DesignerDashboard, ReviewerQueue, PosterDetailView, PublicGallery, UserManagementTable, CategoryManager
    /shells     → AppShell, PublicShell
  /lib
    /firebase.ts, /firebase-admin.ts
    /cloudinary.ts        → upload helper, watermark URL builder (per CONTEXT.md Section 5)
    /notifications.ts     → write + listen helpers (per CONTEXT.md Section 6)
  /types
    /poster.ts, /user.ts, /notification.ts

Install: firebase, firebase-admin, cloudinary, framer-motion, lucide-react,
react-hot-toast, date-fns.

Set up Tailwind CSS v4 theme using exact Kraft palette from DESIGN.md Section 1
(Kraft Brown #8B5E34 primary, Cream #FAF6EF background, light mode only — no dark
mode toggle, per the color-accuracy rationale in DESIGN.md).

Do not scaffold page content yet — folder structure, typed empty components,
Firebase + Cloudinary config with placeholder env vars, working `npm run dev`.

Output .env.local.example with all keys from CONTEXT.md Section 8.
```

---

## PHASE 1 — Auth & Role Assignment

```
Using DESIGN.md "Auth" section and CONTEXT.md Section 3 (RBAC), build:

1. /app/(public)/auth/signup/page.tsx
2. /app/(public)/auth/login/page.tsx
3. /lib/auth.ts — signUpWithEmail, loginWithEmail, loginWithGoogle, logout
4. /components/shells/PublicShell.tsx
5. middleware.ts protecting all /dashboard/* routes

Requirements:
- Email/password + Google OAuth via Firebase Auth
- On signup: create /users/{uid} doc with role: "designer" (hardcoded — no role
  picker in the signup UI, matches CONTEXT.md's "no self-service escalation" rule)
- Mobile-first centered form, Kraft Tan borders, Terracotta focus ring per DESIGN.md
- react-hot-toast for errors (wrong password, email exists, weak password)
- Redirect to /dashboard on success
- middleware.ts: redirect unauthenticated users to /auth/login for any /dashboard/* path

Complete, deployable files.
```

---

## PHASE 2 — App Shell, Roles-Aware Navigation, Dashboard Home

```
Using DESIGN.md Sections "Navigation" and "Dashboard Home", build:

1. /components/shells/AppShell.tsx
2. /app/(dashboard)/dashboard/page.tsx
3. /components/organisms/DesignerDashboard.tsx
4. /components/organisms/ReviewerQueue.tsx (preview version — top 3 pending, full version in Phase 5)
5. /lib/roles.ts — getUserRole(uid) helper, useUserRole() client hook

Requirements:
- AppShell: bottom tab bar mobile (<768px) — Home, Upload, My Posters, Queue*, Settings
  (*Queue tab conditionally rendered only if role is reviewer/admin), sidebar desktop
  per DESIGN.md nav spec
- Dashboard home renders DesignerDashboard OR a reviewer/admin variant based on
  fetched role — stats row, recent activity, role-appropriate CTA
- Wire AppShell into (dashboard) route group layout.tsx
- NotificationBell component (badge only for now — full dropdown in Phase 6) placed
  in AppShell top bar

Complete, deployable files.
```

---

## PHASE 3 — Cloudinary Signed Upload & Poster Creation

```
Using DESIGN.md "Upload" section and CONTEXT.md Sections 4 and 5, build:

1. /app/api/cloudinary/sign/route.ts — signature generation per CONTEXT.md Section 4
2. /app/(dashboard)/dashboard/upload/page.tsx
3. /components/molecules/PosterUploadForm.tsx
4. /lib/cloudinary.ts — uploadToCloudinary(file, signature), getPreviewUrl(publicId, status, cloudName)
   (implement getPreviewUrl exactly per CONTEXT.md Section 5 watermark logic)

Requirements:
- Drag-drop zone desktop, tap-to-select mobile, accepts JPG/PNG/WebP/PDF
- Reject files >10MB client-side with a clear toast (protects Cloudinary free tier
  per CONTEXT.md Section 1 warning)
- On file select: request signature from /api/cloudinary/sign, upload directly to
  Cloudinary from the browser (never route the file through a Vercel function)
- Progress bar during upload (Kraft Brown fill per DESIGN.md)
- Title, category (dropdown populated from /categories), tags (chip input) fields
- On upload success: write /posters/{posterId} doc with status: "draft",
  cloudinaryPublicId, secureUrl, previewUrl computed via getPreviewUrl
- After creation: show "Submit for review" button → updates status to "pending"
  and calls notifyReviewersOnSubmission() per CONTEXT.md Section 6

Complete, deployable files.
```

---

## PHASE 4 — Poster Detail, Versions, Comments, Review Actions

```
Using DESIGN.md "Poster Detail" section and CONTEXT.md Sections 3, 5, 6, build:

1. /app/(dashboard)/dashboard/posters/[posterId]/page.tsx
2. /components/organisms/PosterDetailView.tsx
3. /components/molecules/VersionHistory.tsx
4. /components/molecules/CommentThread.tsx
5. /components/molecules/ReviewActionBar.tsx
6. /app/api/posters/[id]/download/route.ts — role-gated original download
   per CONTEXT.md Section 5 ("server-side gate, not just URL hiding")

Requirements:
- Fetch poster + compute previewUrl server-side based on viewer's role/ownership
  (never ship the clean secureUrl to a non-authorized client in page props)
- VersionHistory: horizontal timeline of /posters/{id}/versions, tap to preview
  older version (read-only, doesn't change current status)
- CommentThread: real-time via onSnapshot on /posters/{id}/comments ordered by
  createdAt, role badge per DESIGN.md (Designer/Reviewer/Admin tag), sticky input
  on mobile above keyboard
- ReviewActionBar: only rendered if viewer's role is reviewer or admin
  - Approve → status: "approved", calls notifyOnStatusChange()
  - Request Changes → requires a comment first (block submit until comment text
    entered), status: "changes_requested", notify designer
  - Reject → requires a comment, status: "rejected", notify designer
  - Sticky bottom bar on mobile per DESIGN.md
- If viewer owns the poster AND status is "changes_requested": show
  "Upload new version" button → creates /posters/{id}/versions/{n+1} doc,
  updates currentVersion, resets status to "pending", re-notifies reviewers
- /api/posters/[id]/download: checks Firestore role + ownership server-side,
  returns secureUrl only if authorized, otherwise 403

Complete, deployable files.
```

---

## PHASE 5 — Review Queue, Categories, User Management (Admin/Reviewer tools)

```
Using DESIGN.md "Review Queue", "Categories", "Users" sections and CONTEXT.md
Section 3 RBAC table, build:

1. /app/(dashboard)/dashboard/queue/page.tsx (full version, role-gated — redirect
   designers away if they navigate here directly)
2. /app/(dashboard)/dashboard/categories/page.tsx (admin only)
3. /app/(dashboard)/dashboard/users/page.tsx (admin only)
4. /components/organisms/CategoryManager.tsx
5. /components/organisms/UserManagementTable.tsx
6. /components/molecules/CategoryFilterBar.tsx

Requirements:
- Queue: all posters where status == "pending", sorted oldest-first, thumbnail +
  title + designer name + submitted date, tap → poster detail
- Categories: list with poster counts, add/edit/delete (block delete if
  posterCount > 0, show a toast explaining why)
- Users: table/card list, role dropdown per row — only admin can change roles,
  changing a role writes directly to /users/{uid}.role (enforced by Firestore
  rules per CONTEXT.md Section 7, but also disable the dropdown in UI for
  non-admins as a UX safeguard, not just a security one)
- Route-level guard: if a designer directly navigates to /dashboard/queue,
  /categories, or /users, redirect to /dashboard with a toast
  "You don't have access to that page"

Complete, deployable files.
```

---

## PHASE 6 — In-App Notifications (full system)

```
Using DESIGN.md "Notification UX" section and CONTEXT.md Section 6, build:

1. /components/molecules/NotificationBell.tsx (full dropdown version)
2. /lib/notifications.ts — complete with notifyOnStatusChange, notifyReviewersOnSubmission,
   notifyOnComment, markAsRead, useUnreadCount() hook

Requirements:
- Bell badge: red dot + count, real-time via onSnapshot on
  /notifications/{uid}/items where read == false
- Dropdown panel: newest first, unread bold + Kraft Tan bg, read normal weight,
  icon per type (🔵✅⚠️❌💬 per DESIGN.md), relative timestamps ("2h ago") via date-fns
- Tap notification → navigate to /dashboard/posters/[posterId], mark read: true
- Wire notifyOnComment() into the CommentThread submit handler from Phase 4
  (notify the other party — if designer comments, notify reviewer/admin who's
  assigned; if reviewer comments, notify the poster's uploadedBy)
- Settings page notification toggles (from Phase 7) should gate whether these
  writes fire — check /users/{uid}.notificationPrefs before writing a notification

Complete, deployable files.
```

---

## PHASE 7 — Public Gallery & Settings

```
Using DESIGN.md "Gallery" and "Settings" sections, build:

1. /app/(public)/gallery/page.tsx
2. /components/organisms/PublicGallery.tsx
3. /app/(dashboard)/dashboard/settings/page.tsx

Requirements:
- Gallery: fetch posters where status == "published" only, masonry/grid layout
  (2 col mobile, 4-5 col desktop per DESIGN.md), CategoryFilterBar at top,
  tap → lightbox with swipe-between-posters and pinch-to-zoom (mobile)
- No auth required to view gallery — public route
- Settings: profile (avatar upload via Cloudinary, display name), notification
  prefs toggles (wired to /users/{uid}.notificationPrefs), password change
  (Firebase Auth updatePassword with re-auth)
- "Published" status is a manual admin action from PosterDetailView — add a
  "Publish to gallery" button visible only to admin on approved posters (this
  wasn't in earlier phases, add it now to PosterDetailView + ReviewActionBar)

Complete, deployable files.
```

---

## Deploy Checklist

```
1. Push to GitHub (89joshuaugwu/kraftdesk or similar)
2. Connect to Vercel, set all env vars from CONTEXT.md Section 8
3. ⚠️ MANUAL STEP — Firebase Console → Firestore Rules → paste from CONTEXT.md
   Section 7 → click Publish. Repeat every time rules change.
4. Firebase Console → Authentication → enable Email/Password + Google
5. Cloudinary dashboard → create upload preset scoped to signed uploads only
   (not unsigned — signed uploads use the API route from Phase 3)
6. Manually promote your own account to "admin" directly in Firestore console
   after first signup (no admin exists yet on a fresh deploy — this is the
   one-time bootstrap step)
7. Test full flow: signup as designer → upload → submit → promote a second
   test account to reviewer → approve/reject/request changes → verify
   notification badge updates in real-time → publish an approved poster →
   confirm it appears in /gallery
8. Monitor Cloudinary usage dashboard weekly — free tier credit burn is the
   tightest constraint in this stack (per CONTEXT.md Section 1)
```

---

Run in order, verify each phase (`npm run dev`, click through) before starting the next.
