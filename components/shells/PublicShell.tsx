import Link from "next/link";
import { ReactNode } from "react";
import { PublicHeader } from "@/components/shells/PublicHeaderClient";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="flex h-16 items-center justify-between border-b border-kraft-tan bg-warm-white px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-deep-kraft">
          <img src="/kraftdesk-logo.svg" alt="" className="h-[28px] w-[28px]" />
          KraftDesk
        </Link>
        {/* Auth-aware nav: shows "Dashboard" when signed in, "Log in" otherwise. */}
        <PublicHeader />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
