import Link from "next/link";
import { ReactNode } from "react";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="flex h-16 items-center justify-between border-b border-kraft-tan bg-warm-white px-4 sm:px-8">
        <Link href="/" className="text-lg font-bold text-deep-kraft">
          KraftDesk
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-charcoal">
          <Link href="/gallery" className="hover:text-kraft-brown">
            Gallery
          </Link>
          <Link href="/auth/login" className="hover:text-kraft-brown">
            Log in
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
