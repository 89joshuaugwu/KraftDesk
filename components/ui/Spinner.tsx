import { Loader2 } from "lucide-react";

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return <Loader2 className={`animate-spin text-kraft-brown ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-kraft-tan bg-warm-white p-3">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="skeleton mt-3 h-4 w-3/4" />
      <div className="skeleton mt-2 h-3 w-1/2" />
    </div>
  );
}
