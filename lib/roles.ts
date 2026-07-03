"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import type { UserRole, KraftUser } from "@/types/user";

export async function getUserRole(uid: string): Promise<UserRole | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return (snap.data().role as UserRole) ?? "designer";
}

interface UseUserRoleResult {
  user: User | null;
  profile: KraftUser | null;
  role: UserRole | null;
  loading: boolean;
}

// Client hook: tracks auth state + live Firestore profile/role.
export function useUserRole(): UseUserRoleResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<KraftUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubDoc = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as KraftUser);
      }
      setLoading(false);
    });
    return () => unsubDoc();
  }, [user]);

  return { user, profile, role: profile?.role ?? null, loading };
}

export function canReview(role: UserRole | null): boolean {
  return role === "reviewer" || role === "admin";
}

export function isAdmin(role: UserRole | null): boolean {
  return role === "admin";
}
