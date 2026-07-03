import type { PosterStatus } from "@/types/poster";

const STATUS_CONFIG: Record<
  PosterStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  draft: { label: "Draft", bg: "bg-warm-gray/15", text: "text-warm-gray", dot: "bg-warm-gray" },
  pending: { label: "Pending Review", bg: "bg-amber/15", text: "text-amber", dot: "bg-amber" },
  approved: { label: "Approved", bg: "bg-forest-green/15", text: "text-forest-green", dot: "bg-forest-green" },
  changes_requested: { label: "Changes Requested", bg: "bg-amber/15", text: "text-amber", dot: "bg-amber" },
  rejected: { label: "Rejected", bg: "bg-rust-red/15", text: "text-rust-red", dot: "bg-rust-red" },
  published: { label: "Published", bg: "bg-kraft-brown/15", text: "text-kraft-brown", dot: "bg-kraft-brown" },
};

// Status is conveyed by color AND text label — never color alone.
// Per DESIGN.md Section 8 accessibility.
export function StatusBadge({ status }: { status: PosterStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
