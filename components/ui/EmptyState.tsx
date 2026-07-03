import { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-kraft-tan bg-warm-white/60 px-6 py-14 text-center">
      <div className="text-kraft-brown">{icon}</div>
      <p className="text-lg font-bold text-deep-kraft">{title}</p>
      <p className="max-w-xs text-sm text-warm-gray">{subtitle}</p>
      {action}
    </div>
  );
}
