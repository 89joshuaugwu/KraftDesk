"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/Input";
import type { KraftUser, UserRole } from "@/types/user";

// Only an admin can change roles — enforced here (disabled dropdown for
// non-admins) AND in Firestore rules per CONTEXT.md Section 7, as a
// UX safeguard, not just a security one.
export function UserManagementTable({ viewerRole }: { viewerRole: UserRole }) {
  const [users, setUsers] = useState<KraftUser[]>([]);
  const [search, setSearch] = useState("");
  const isAdmin = viewerRole === "admin";

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => d.data() as KraftUser));
    });
    return () => unsub();
  }, []);

  async function changeRole(uid: string, role: UserRole) {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, "users", uid), { role });
      toast.success("Role updated.");
    } catch {
      toast.error("Couldn't update role.");
    }
  }

  const filtered = users.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-bold text-deep-kraft">Users</h1>
      <div className="mt-4">
        <Input
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {filtered.map((u) => (
          <li
            key={u.uid}
            className="flex items-center justify-between gap-3 rounded-lg border border-kraft-tan bg-warm-white px-3 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-charcoal">{u.displayName}</p>
              <p className="truncate text-xs text-warm-gray">{u.email}</p>
            </div>
            <select
              disabled={!isAdmin}
              value={u.role}
              onChange={(e) => changeRole(u.uid, e.target.value as UserRole)}
              className="rounded-lg border border-kraft-tan bg-warm-white px-2.5 py-2 text-sm disabled:opacity-50"
            >
              <option value="designer">Designer</option>
              <option value="reviewer">Reviewer</option>
              <option value="admin">Admin</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
