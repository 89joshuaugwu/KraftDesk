"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { CategoryFilterBar } from "@/components/molecules/CategoryFilterBar";
import { SkeletonCard } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Globe } from "lucide-react";
import type { Poster, Category } from "@/types/poster";

export function PublicGallery() {
  const [posters, setPosters] = useState<Poster[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, "id">) })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Public gallery only ever fetches status == "published" posters —
    // clean secureUrl is fine to show here since publishing is itself the
    // public-release action.
    const q = query(collection(db, "posters"), where("status", "==", "published"), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosters(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Poster, "id">) })));
    });
    return () => unsub();
  }, []);

  const filtered = posters?.filter((p) => !activeCategory || p.category === activeCategory) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <CategoryFilterBar categories={categories} active={activeCategory} onChange={setActiveCategory} />

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {posters === null &&
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        {filtered.map((p, i) => (
          <button key={p.id} onClick={() => setLightboxIndex(i)} className="text-left">
            <div className="overflow-hidden rounded-lg border border-kraft-tan bg-warm-white">
              <img src={p.previewUrl} alt={p.title} className="aspect-[4/3] w-full object-cover" />
              <div className="p-2">
                <p className="truncate text-sm font-semibold text-charcoal">{p.title}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {posters?.length === 0 && (
        <EmptyState
          icon={<Globe className="h-10 w-10" />}
          title="No posters published yet"
          subtitle="Check back soon — approved posters appear here once published."
        />
      )}

      <AnimatePresence>
        {lightboxIndex !== null && filtered[lightboxIndex] && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
          >
            <button
              className="absolute right-4 top-4 rounded-full bg-warm-white/10 p-2 text-warm-white"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              className="absolute left-2 rounded-full bg-warm-white/10 p-2 text-warm-white sm:left-6"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i !== null ? (i - 1 + filtered.length) % filtered.length : null));
              }}
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <img
              src={filtered[lightboxIndex].previewUrl}
              alt={filtered[lightboxIndex].title}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-[90vw] touch-pinch-zoom rounded-lg object-contain"
            />
            <button
              className="absolute right-2 rounded-full bg-warm-white/10 p-2 text-warm-white sm:right-6"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i !== null ? (i + 1) % filtered.length : null));
              }}
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
