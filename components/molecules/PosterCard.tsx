import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { safeFormatDistanceToNow } from "@/lib/date";
import type { Poster } from "@/types/poster";

export function PosterCard({ poster }: { poster: Poster }) {
  return (
    <Link href={`/dashboard/posters/${poster.id}`}>
      <Card className="overflow-hidden">
        <div className="relative aspect-[4/3] w-full bg-kraft-tan/30">
          <Image
            src={poster.previewUrl}
            alt={poster.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 font-semibold text-charcoal">{poster.title}</p>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <StatusBadge status={poster.status} />
            <span className="text-xs text-warm-gray">
              {safeFormatDistanceToNow(poster.updatedAt)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
