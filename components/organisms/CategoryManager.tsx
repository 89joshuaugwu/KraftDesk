"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/types/poster";

export function CategoryManager({ uid }: { uid: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Category, "id">) }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    });
    return () => unsub();
  }, []);

  async function addCategory() {
    if (!newName.trim()) return;
    await addDoc(collection(db, "categories"), {
      name: newName.trim(),
      posterCount: 0,
      createdBy: uid,
      createdAt: serverTimestamp(),
    });
    setNewName("");
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    await updateDoc(doc(db, "categories", id), { name: editName.trim() });
    setEditingId(null);
  }

  async function removeCategory(cat: Category) {
    if (cat.posterCount > 0) {
      toast.error(
        `Can't delete "${cat.name}" — ${cat.posterCount} poster(s) still use it.`
      );
      return;
    }
    await deleteDoc(doc(db, "categories", cat.id));
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-xl font-bold text-deep-kraft">Categories</h1>

      <div className="mt-4 flex gap-2">
        <Input
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
        />
        <Button onClick={addCategory}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex items-center justify-between rounded-lg border border-kraft-tan bg-warm-white px-3 py-2.5"
          >
            {editingId === cat.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit(cat.id)}
                onBlur={() => saveEdit(cat.id)}
                className="flex-1 rounded border border-kraft-tan px-2 py-1 text-sm"
              />
            ) : (
              <span className="text-sm font-medium text-charcoal">
                {cat.name}{" "}
                <span className="text-xs text-warm-gray">({cat.posterCount})</span>
              </span>
            )}
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setEditingId(cat.id);
                  setEditName(cat.name);
                }}
                className="rounded p-1.5 hover:bg-kraft-tan/40"
                aria-label={`Edit ${cat.name}`}
              >
                <Pencil className="h-4 w-4 text-warm-gray" />
              </button>
              <button
                onClick={() => removeCategory(cat)}
                className="rounded p-1.5 hover:bg-kraft-tan/40"
                aria-label={`Delete ${cat.name}`}
              >
                <Trash2 className="h-4 w-4 text-rust-red" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
