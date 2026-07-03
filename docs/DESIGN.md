# KraftDesk — DESIGN.md

**Product:** Digital Poster Design Management System (DPDMS) — upload, review, approve, and distribute poster designs with role-based workflow.
**Target:** Designers, reviewers, admins. Mobile-first (majority mobile access), desktop for detailed review work.
**Status:** Production-ready spec for Next.js 16 + Tailwind CSS v4 + React 19.
**Cost:** $0 — Firebase Spark (free), Cloudinary free tier, Vercel free tier.

---

## 1. Brand Identity

### Name & Positioning
**KraftDesk** — "Kraft" evokes craft/design work + the warm, tactile feel of kraft paper (the material posters get printed on). "Desk" implies the workspace/desk where review and approval happens. Unused, brandable, memorable.

### Color Palette — Light Mode Default

**Why light mode, not dark:** This is a visual design review tool. Reviewers need to judge actual poster colors accurately — dark UI chrome around a poster thumbnail distorts color perception (simultaneous contrast). Every major design tool (Figma, Canva, Adobe) defaults reviewers to light canvases for this exact reason.

| Role | Color | Hex | Use |
|---|---|---|---|
| Primary | Kraft Brown | `#8B5E34` | Primary buttons, active nav, brand accents |
| Primary Dark | Deep Kraft | `#5C3D1F` | Hover states, headings |
| Accent | Terracotta | `#C2571B` | CTAs, "pending review" badges |
| Success | Forest Green | `#15803D` | Approved status, success toasts |
| Warning | Amber | `#D97706` | Changes requested status |
| Error | Rust Red | `#DC2626` | Rejected status, errors |
| Background | Cream | `#FAF6EF` | Main app background |
| Card BG | Warm White | `#FFFFFF` | Cards, elevated surfaces |
| Border | Kraft Tan | `#E5D9C3` | Dividers, input borders |
| Text Primary | Charcoal | `#292524` | Headings, primary text |
| Text Secondary | Warm Gray | `#78716C` | Labels, hints |

### Typography
- **Headings:** Inter Bold 700 — clean, modern, doesn't compete with poster imagery
- **Body:** Inter Regular 400
- **Mono:** JetBrains Mono — for IDs, timestamps, technical metadata
- **Scale:** 16px base mobile → 18px desktop

### Animations (Framer Motion)
- Card hover: `translateY(-2px), shadow increase` (0.2s ease-out)
- Status change: `scale 0.95→1, opacity 0→1` with color-coded pulse
- Upload progress: linear progress bar, Kraft Brown fill
- Approval success: checkmark draw-in animation (SVG path animation) + subtle confetti in Kraft/Terracotta tones
- Page transition: fade + slideUp 16px, 0.25s
- Comment thread: new comment slides in from bottom, 0.2s

---

## 2. Page Map & Routing

```
/                                     # Public landing
  ├─ /gallery                         # Public gallery — published posters only
  ├─ /auth/signup                     # Signup (role defaults to designer)
  ├─ /auth/login                      # Login (email/password + Google)
  │
/dashboard                            # Authenticated root (role-gated content)
  ├─ /dashboard                       # Home — role-specific view
  ├─ /dashboard/upload                # Designer: new poster upload
  ├─ /dashboard/posters                # Designer: my posters (all statuses)
  ├─ /dashboard/posters/[posterId]    # Poster detail — versions, comments, status
  ├─ /dashboard/queue                 # Reviewer/Admin: pending review queue
  ├─ /dashboard/categories            # Admin: manage categories
  ├─ /dashboard/users                 # Admin: manage roles
  ├─ /dashboard/settings              # Profile, notification prefs
```

---

## 3. Component Architecture

### Shells
- **AppShell** — Top bar (logo + notification bell + user menu), bottom tab bar mobile (<768px): Home | Upload | Posters | Queue* | Settings (*Queue only visible to reviewer/admin), sidebar desktop
- **PublicShell** — Minimal top bar, centered content

### Atoms
- **Button** — primary (Kraft Brown), secondary (outline), danger (Rust Red), success (Forest Green)
- **Input / Textarea / Select** — 44px height mobile, Kraft Tan border, Terracotta focus ring
- **StatusBadge** — pill-shaped, color-coded per status (Draft=gray, Pending=Amber, Approved=Green, Changes Requested=Amber, Rejected=Red, Published=Kraft Brown)
- **Card** — Warm White bg, rounded-lg, subtle shadow, hover lift
- **Spinner**, **Toast**, **Modal** — consistent with palette

### Molecules
- **NotificationBell** — badge with unread count, dropdown panel, real-time via `onSnapshot`
- **PosterCard** — thumbnail (Cloudinary `q_auto,f_auto,w_400`), title, category tag, status badge, uploaded date
- **PosterUploadForm** — drag-drop zone, title/category/tags inputs, progress bar
- **CommentThread** — chronological list, author role tag (Designer/Reviewer), input box at bottom
- **VersionHistory** — timeline of versions with thumbnails, "current" indicator
- **ReviewActionBar** — Approve / Request Changes / Reject buttons (reviewer/admin only), comment required for Request Changes/Reject
- **CategoryFilterBar** — horizontal scrollable chips (mobile), sidebar list (desktop)
- **RoleBadge** — small tag showing user role in comment threads / user management

### Organisms
- **DesignerDashboard** — stats (drafts, pending, approved counts), recent activity, quick upload CTA
- **ReviewerQueue** — list/grid of pending posters, sorted oldest-first, tap to open review screen
- **PosterDetailView** — full-size preview (watermarked if not approved, respecting role), version history, comment thread, review action bar (role-gated)
- **PublicGallery** — masonry/grid of published posters, category filter, lightbox on tap
- **UserManagementTable** — admin: list users, role dropdown per row
- **CategoryManager** — admin: add/edit/delete categories

---

## 4. Mobile-First Design Spec

### Breakpoints
- Mobile: 320–767px (primary)
- Tablet: 768–1024px
- Desktop: 1025px+

### Mobile Constraints
- Tap targets: 48×48px minimum
- Poster grid: 2 columns mobile, 3 tablet, 4–5 desktop
- Upload: full-screen drag-drop zone on mobile (tap to open file picker, since drag-drop is a desktop-only gesture)
- Review actions: sticky bottom bar on mobile (Approve/Request Changes/Reject always visible while scrolling poster detail)
- Comment input: sticky above keyboard, auto-scroll to latest comment
- Gallery lightbox: swipe left/right between posters, pinch-to-zoom

### Navigation (mobile bottom tab bar)
```
[Home] [Upload] [My Posters] [Queue*] [Settings]
*Queue tab hidden for designer role, visible only to reviewer/admin
```

### Navigation (desktop sidebar)
```
KraftDesk
├─ Dashboard
├─ Upload
├─ My Posters
├─ Review Queue        (reviewer/admin only)
├─ Categories           (admin only)
├─ Users                (admin only)
└─ Settings
```

---

## 5. Page-by-Page UX Flow

### Landing (/)
```
[Header: Logo | [Gallery] [Login] [Signup]]

[Hero]
  H1: "From Draft to Published. Tracked."
  Sub: "Poster design workflow for teams — upload, review, approve, distribute."
  [Get Started] → /auth/signup
  [Browse Gallery] → /gallery

[Feature cards: Upload & Version | Review & Approve | Public Distribution]

[Footer]
```

### Gallery (/gallery) — public, no auth
```
[Header: Logo | [Login]]
[Category filter chips, horizontal scroll mobile]
[Poster grid: 2 col mobile / 4-5 col desktop]
  Each card: thumbnail, title, category
  Tap → lightbox (full image, swipe between posters)
```

### Auth (/auth/signup, /auth/login)
```
[Centered form, full-height mobile]
[Email] [Password] [If signup: Confirm password]
[Signup only: role defaults to "designer" — no self-select for reviewer/admin,
 those are admin-promoted only]
[Submit]
[Divider "or"] [Continue with Google]
[Toggle link to opposite flow]
```

### Dashboard Home — role-adaptive

**Designer view:**
```
[Stats row: Drafts: 2 | Pending: 3 | Approved: 8 | Changes Needed: 1]
[Quick upload button — FAB]
[Recent activity: "Poster 'Health Campaign' approved" / "Comment on 'Sports Day'"]
[My recent posters — horizontal scroll cards]
```

**Reviewer/Admin view:**
```
[Stats row: Pending Review: 5 | Approved Today: 3 | Total Posters: 142]
[Pending queue preview — top 3, "View all" → /dashboard/queue]
[Recent approvals/rejections activity feed]
```

### Upload (/dashboard/upload)
```
[H2: "Upload a new poster"]
[Drag-drop zone (desktop) / Tap-to-select (mobile)]
  Accepts: JPG, PNG, WebP, PDF (Cloudinary handles PDF preview generation)
[Title input]
[Category select] (from admin-managed list)
[Tags input] (comma-separated or chip input)
[Upload progress bar during Cloudinary signed upload]
[Submit → creates poster with status "draft"]
[After upload: "Submit for review" button appears → status becomes "pending"]
```

### Poster Detail (/dashboard/posters/[posterId])
```
[Header: Poster title | StatusBadge]

[Image preview — full width mobile]
  If status is pending/changes_requested AND viewer is not reviewer/admin/owner:
    watermarked preview only
  If approved/published OR viewer is reviewer/admin/owner:
    clean preview + [Download] button

[Version history — horizontal timeline, tap to view older version]

[Review action bar — ONLY visible to reviewer/admin, sticky bottom on mobile]
  [Approve] [Request Changes] [Reject]
  Request Changes / Reject require a comment before submitting

[Comment thread]
  Each comment: role badge + author + timestamp + text
  Input box at bottom (sticky above mobile keyboard)

[If designer owns poster AND status is changes_requested]
  [Upload new version] button → creates version N+1, resets to pending
```

### Review Queue (/dashboard/queue) — reviewer/admin only
```
[H2: "Pending review (5)"]
[List sorted oldest-first]
  Each row: thumbnail, title, designer name, submitted date, [Review] button
[Tap row → /dashboard/posters/[posterId]]
```

### Categories (/dashboard/categories) — admin only
```
[List of categories with poster counts]
[+ Add category] → inline input
[Edit/Delete per category] (delete blocked if posters still reference it)
```

### Users (/dashboard/users) — admin only
```
[Table/card list: name, email, current role]
[Role dropdown per user: Designer | Reviewer | Admin]
[Search/filter by name or email]
```

### Settings (/dashboard/settings)
```
[Profile: avatar (Cloudinary upload), display name, email (read-only)]
[Notification prefs: toggle in-app notifications for New Submission (reviewer),
 Status Change (designer), New Comment (both)]
[Password change]
```

---

## 6. Cloudinary Visual Handling

- **Thumbnails:** `q_auto,f_auto,w_400` — grid/card views
- **Full preview:** `q_auto,f_auto,w_1200`
- **Pending watermark overlay:** `l_text:Arial_60_bold:PENDING%20REVIEW,co_white,o_45,g_center,a_-30`
- **Changes requested watermark:** same overlay, text "CHANGES REQUESTED", Amber tint
- Once approved: URL regenerates without overlay param — no re-upload needed, just swap the transformation string
- PDF uploads: Cloudinary auto-generates a page-1 JPG preview (`pg_1,f_jpg`) for the thumbnail

---

## 7. Notification UX (in-app only — no email)

```
[Bell icon, top bar]
  Badge: red dot + count if unread > 0

[Dropdown panel on tap]
  List of notifications, newest first
  Unread: bold + Kraft Tan background
  Read: normal weight, white background
  Each: icon (per type) + message + relative time ("2h ago")
  Tap → navigate to poster, mark as read

Types:
  🔵 New submission (reviewer/admin only)
  ✅ Approved (designer)
  ⚠️ Changes requested (designer)
  ❌ Rejected (designer)
  💬 New comment (whoever didn't post it)
```

---

## 8. Accessibility

- Contrast: Charcoal `#292524` on Cream `#FAF6EF` = 12.6:1 (well above WCAG AAA)
- All interactive elements: visible focus ring (Terracotta, 2px)
- Status conveyed by color AND text label (never color alone) — critical since color-blind reviewers must distinguish Approved/Rejected/Changes Requested
- Tap targets: 48px minimum
- Alt text on all poster thumbnails (auto-generated from title field)

---

## 9. Empty & Loading States

```
No posters yet (designer):
  [Illustration] "No posters yet" "Upload your first design to get started" [Upload button]

No pending reviews (reviewer):
  [Illustration] "All caught up!" "No posters waiting for review"

Loading: skeleton cards (Kraft Tan pulse animation) matching PosterCard dimensions
```

This DESIGN.md pairs with CONTEXT.md for full phase-by-phase scaffolding in Antigravity.
