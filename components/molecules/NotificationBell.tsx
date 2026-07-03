"use client";

import { useState } from "react";
import { Bell, CheckCircle2, AlertTriangle, XCircle, MessageCircle, CircleDot } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications, markAsRead } from "@/lib/notifications";
import { safeFormatDistanceToNow } from "@/lib/date";
import type { NotificationType } from "@/types/notification";

const ICONS: Record<NotificationType, React.ReactNode> = {
  new_submission: <CircleDot className="h-4 w-4 text-terracotta" />,
  approved: <CheckCircle2 className="h-4 w-4 text-forest-green" />,
  changes_requested: <AlertTriangle className="h-4 w-4 text-amber" />,
  rejected: <XCircle className="h-4 w-4 text-rust-red" />,
  new_comment: <MessageCircle className="h-4 w-4 text-kraft-brown" />,
};

export function NotificationBell({ uid }: { uid: string | null }) {
  const [open, setOpen] = useState(false);
  const { items, unreadCount } = useNotifications(uid);
  const router = useRouter();

  return (
    <div className="relative">
      <button
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 hover:bg-kraft-tan/40"
      >
        <Bell className="h-5 w-5 text-charcoal" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rust-red px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border border-kraft-tan bg-warm-white shadow-lg">
            {items.length === 0 ? (
              <p className="p-6 text-center text-sm text-warm-gray">
                No notifications yet
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={async () => {
                    if (uid) await markAsRead(uid, n.id);
                    setOpen(false);
                    router.push(`/dashboard/posters/${n.posterId}`);
                  }}
                  className={`flex w-full items-start gap-2.5 border-b border-kraft-tan px-4 py-3 text-left last:border-0 hover:bg-kraft-tan/20 ${
                    !n.read ? "bg-kraft-tan/30" : "bg-warm-white"
                  }`}
                >
                  <span className="mt-0.5">{ICONS[n.type]}</span>
                  <span className="flex-1">
                    <span
                      className={`block text-sm ${
                        !n.read ? "font-semibold text-charcoal" : "font-normal text-charcoal"
                      }`}
                    >
                      {n.message}
                    </span>
                    <span className="text-xs text-warm-gray">
                      {safeFormatDistanceToNow(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
