# KraftDesk — Pages & Features Walkthrough

This document conducts a walkthrough of every screen in KraftDesk, detailing who has access to them, what they accomplish, and how they behave on mobile and desktop.

---

## 1. Page Map & Access Gating

KraftDesk splits its routes into two layout categories: **Public Routes** (accessible to anyone) and **Dashboard Routes** (protected by our Edge session gate and role-based permissions).

```
/ (Landing Page)
 ├── /gallery (Public, Published Posters Only)
 ├── /auth/login (Un-authenticated Users)
 └── /auth/signup (Un-authenticated Users, Default Role: "designer")
 
/dashboard (Edge Protected Root)
 ├── /dashboard (Adaptive Home — Designer Stats OR Review Queue preview)
 ├── /dashboard/upload (Designer: Upload forms)
 ├── /dashboard/posters (Designer: List own drafts/submissions)
 ├── /dashboard/posters/[posterId] (Detail: Comments timeline, version tree, status actions)
 ├── /dashboard/queue (Reviewer/Admin: Full pending approval list)
 ├── /dashboard/categories (Admin: Categories management table)
 ├── /dashboard/users (Admin: Role modification table)
 └── /dashboard/settings (All Users: Profile avatar, notifications toggle, password reset)
```

---

## 2. Public Pages Walks

### 1. Landing Page (`/`)
* **URL**: `/`
* **Access**: Public
* **Purpose**: Introduces KraftDesk. Pitching features like upload trackers, version timeline, review channels, and public galleries.
* **Layout**: Warm layout featuring action buttons leading to Signup (`/auth/signup`) or Browse Gallery (`/gallery`).

### 2. Public Gallery (`/gallery`)
* **URL**: `/gallery`
* **Access**: Public
* **Purpose**: Display area for completed and approved posters.
* **Layout**:
  - Horizontal chip scroll bar of categories at the top.
  - A masonry style grid showing only posters whose status is set to `"published"`.
  - Hovering over a poster card lifts it slightly and darkens the border.
  - Tapping a poster card triggers a fullscreen image lightbox, enabling image inspection.

### 3. Authentication (`/auth/login` & `/auth/signup`)
* **URL**: `/auth/login` or `/auth/signup`
* **Access**: Public (Redirects to `/dashboard` if already logged in)
* **Purpose**: Onboard users and establish credentials.
* **Layout**:
  - Centered forms optimized for easy mobile inputs.
  - Large button targets (height > 44px) complying with accessibility guidelines.
  - Features quick-click "Continue with Google" OAuth buttons alongside default email signups.
  - Alerts users via popup error toasts if email formats are bad or password entries fail.

---

## 3. Dashboard Pages Walk (Authenticated)

### 1. Adaptive Dashboard Home (`/dashboard`)
* **URL**: `/dashboard`
* **Access**: Logged-in Users
* **Behavior**:
  - **Designers**: Renders the **Designer Dashboard**. Displays counters summarizing drafts, pending reviews, requested edits, and approved sheets. Shows a horizontal slider of their recent creations and a prominent upload CTA button.
  - **Reviewers & Admins**: Renders a **Reviewer Dashboard** detailing a preview list of the top 3 oldest pending reviews waiting for approval. Provides a link to access the full review queue.

---

### 2. Poster Upload (`/dashboard/upload`)
* **URL**: `/dashboard/upload`
* **Access**: Designers only (Admins/Reviewers redirect away with an error toast)
* **Behavior**:
  - Displays a drag-and-drop file upload zone (which converts to a tap-to-select zone on mobile).
  - Validates image types (PNG/JPG/WebP/PDF) and file sizes (< 10MB) client-side.
  - Features a linear progress bar with a Kraft Brown fill to indicate upload status.
  - Provides text inputs for Title, Category dropdown (loaded from Firestore), and tags.
  - Saving creates a `draft` status document. A secondary button appears to submit the file for review.

---

### 3. My Posters (`/dashboard/posters`)
* **URL**: `/dashboard/posters`
* **Access**: Designers only
* **Behavior**:
  - Lists all uploaded posters in reverse-chronological order.
  - Each item displays a status badge (e.g. `"Draft"` in gray, `"Pending"` in yellow, `"Approved"` in green).
  - Tapping a card opens the Poster Detail screen.

---

### 4. Poster Detail & Feedback (`/dashboard/posters/[posterId]`)
* **URL**: `/dashboard/posters/[posterId]`
* **Access**: Logged-in Users
* **Behavior**: This is the core page of KraftDesk, containing three major panels:
  1. **Visual Preview Canvas**: Displays the image. Watermarks are applied dynamically if the poster is pending review or changes have been requested (unless viewed by the owner, a reviewer, or an admin). Authorized users see a "Download Original" button.
  2. **Timeline Version History**: Displays previous revision tags in a horizontal timeline. Tapping past nodes loads historical images in read-only mode so reviewers can compare adjustments.
  3. **Timeline Comments Thread & Review Bar**:
     - Lists feedback comments in real-time. Comments are styled with Role Badges (`Designer`, `Reviewer`, `Admin`) to distinguish feedback.
     - The commenting form sticks to the bottom of the viewport on mobile devices.
     - **Review Actions**: If the user is a Reviewer or Admin, a sticky action bar appears at the bottom with options to **Approve**, **Request Changes**, or **Reject**. Choosing "Request Changes" or "Reject" blocks submission until a feedback comment is written.
     - **Revision Action**: If a designer's poster is marked `"changes_requested"`, they see a box prompting them to upload a new file along with a change note. Submitting increments the version and resets status to `"pending"`.

---

### 5. Review Queue (`/dashboard/queue`)
* **URL**: `/dashboard/queue`
* **Access**: Reviewers & Admins only
* **Behavior**:
  - Lists all posters currently in `"pending"` status, sorted oldest-first to prioritize outstanding reviews.
  - Displays poster thumbnails, titles, upload dates, and creator names.

---

### 6. Category Manager (`/dashboard/categories`)
* **URL**: `/dashboard/categories`
* **Access**: Admins only
* **Behavior**:
  - Provides a dashboard showing all categories and their poster counts.
  - Allows Admins to add new categories inline.
  - **Deletion Safeguard**: Admins cannot delete categories that are currently referenced by active posters. If attempted, a toast alert blocks the action.

---

### 7. User Manager (`/dashboard/users`)
* **URL**: `/dashboard/users`
* **Access**: Admins only
* **Behavior**:
  - Lists all registered users in a responsive table.
  - Features an inline role dropdown for each user row (Designer, Reviewer, Admin).
  - Selecting a role immediately writes the change to the user's Firestore document.

---

### 8. Settings (`/dashboard/settings`)
* **URL**: `/dashboard/settings`
* **Access**: Logged-in Users
* **Behavior**:
  - **Profile Section**: Allows users to change their display name and upload a new profile picture.
  - **Notifications**: Toggles preferences for in-app alert categories (`newSubmission`, `statusChange`, `newComment`).
  - **Change Password**: Prompts for current and new password values, authenticating the request via Firebase Auth.

---

## 4. Navigation Layout Design

To ensure usability across all devices, KraftDesk switches its navigation wrapper dynamically:

- **Desktop Layout (> 768px)**: Displays a fixed sidebar on the left containing the logo and full route links.
- **Mobile Layout (< 768px)**: Renders a compact top bar containing the logo and the notification bell dropdown. Navigation is handled via a **Sticky Bottom Tab Bar** showing 5 core endpoints (`Home`, `Upload`, `My Posters`, `Queue` [if reviewer/admin], `Settings`). This ensures touch targets are within easy thumb reach.
