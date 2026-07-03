"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";
import {
  Home,
  Upload,
  Image as ImageIcon,
  ClipboardList,
  Settings,
  Tags,
  Users,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { useUserRole, canReview, isAdmin } from "@/lib/roles";
import { NotificationBell } from "@/components/molecules/NotificationBell";
import { logout } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Home", icon: Home, roles: ["designer", "reviewer", "admin"] },
  { href: "/dashboard/upload", label: "Upload", icon: Upload, roles: ["designer"] },
  { href: "/dashboard/posters", label: "My Posters", icon: ImageIcon, roles: ["designer"] },
  { href: "/dashboard/queue", label: "Queue", icon: ClipboardList, roles: ["reviewer", "admin"] },
  { href: "/dashboard/categories", label: "Categories", icon: Tags, roles: ["admin"] },
  { href: "/dashboard/users", label: "Users", icon: Users, roles: ["admin"] },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["designer", "reviewer", "admin"] },
];

// Bottom tab bar (mobile) shows a trimmed subset; sidebar (desktop) shows all.
const MOBILE_TABS = ["/dashboard", "/dashboard/upload", "/dashboard/posters", "/dashboard/queue", "/dashboard/settings"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role } = useUserRole();

  const visibleNav = NAV.filter((item) => !role || item.roles.includes(role));
  const mobileNav = visibleNav.filter((item) => MOBILE_TABS.includes(item.href));

  async function handleLogout() {
    await logout();
    toast.success("Signed out");
    router.push("/");
  }

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-kraft-tan bg-warm-white md:flex">
        <div className="flex items-center gap-2 px-5 py-5 text-xl font-bold text-deep-kraft">
          <img src="/kraftdesk-logo.svg" alt="" className="h-[26px] w-[26px]" />
          KraftDesk
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {visibleNav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-kraft-brown text-warm-white"
                    : "text-charcoal hover:bg-kraft-tan/40"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="mx-3 mb-5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-warm-gray hover:bg-kraft-tan/40"
        >
          <LogOut className="h-4.5 w-4.5" /> Log out
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-kraft-tan bg-warm-white px-4 sm:px-6">
          <span className="flex items-center gap-2 text-lg font-bold text-deep-kraft md:hidden">
            <img src="/kraftdesk-logo.svg" alt="" className="h-[22px] w-[22px]" />
            KraftDesk
          </span>
          <span className="hidden md:block" />
          <NotificationBell uid={user?.uid ?? null} />
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* Mobile bottom tab bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-kraft-tan bg-warm-white md:hidden">
          {mobileNav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
              >
                <Icon
                  className={`h-5 w-5 ${active ? "text-kraft-brown" : "text-warm-gray"}`}
                />
                <span className={active ? "text-kraft-brown" : "text-warm-gray"}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
