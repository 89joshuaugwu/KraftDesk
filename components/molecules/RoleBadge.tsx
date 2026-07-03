import type { UserRole } from "@/types/user";

const LABELS: Record<UserRole, string> = {
  designer: "Designer",
  reviewer: "Reviewer",
  admin: "Admin",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className="inline-flex items-center rounded-full bg-kraft-tan/50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-deep-kraft">
      {LABELS[role]}
    </span>
  );
}
