"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { DEFAULT_NOTIFICATION_PREFS } from "@/types/user";

// Lightweight session cookie so middleware.ts (edge runtime) can gate
// /dashboard/* without reading Firebase's IndexedDB session. This is a
// presence flag only — real authorization still happens against Firebase
// Auth + Firestore on the client and in API routes.
function setSessionCookie() {
  document.cookie = "kraftdesk_session=1; path=/; max-age=2592000; samesite=lax";
}
function clearSessionCookie() {
  document.cookie = "kraftdesk_session=; path=/; max-age=0";
}

// Creates the /users/{uid} doc with role hardcoded to "designer".
// No role picker in the UI — matches CONTEXT.md's "no self-service escalation"
// rule, and is also enforced server-side by Firestore rules.
async function ensureUserDoc(user: User) {
  const ref = doc(db, "users", user.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;

  await setDoc(ref, {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "New user",
    avatarUrl: user.photoURL ?? "",
    role: "designer",
    notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
    createdAt: serverTimestamp(),
  });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  await ensureUserDoc(cred.user);
  setSessionCookie();
  return cred.user;
}

export async function loginWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  setSessionCookie();
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserDoc(cred.user);
  setSessionCookie();
  return cred.user;
}

export async function logout() {
  await signOut(auth);
  clearSessionCookie();
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("Not signed in.");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

// Friendly copies for Firebase Auth error codes, shown via react-hot-toast.
export function friendlyAuthError(code: string): string {
  const map: Record<string, string> = {
    "auth/email-already-in-use": "That email is already registered.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "No account found with that email.",
    "auth/too-many-requests": "Too many attempts. Try again in a moment.",
    "auth/popup-closed-by-user": "Google sign-in was closed before finishing.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}
