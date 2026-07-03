"use client";

import Link from "next/link";
import { useUserRole } from "@/lib/roles";

export function PublicHeader() {
  const { user } = useUserRole() as { user: any };

  return (
    <nav className="flex items-center gap-4 text-sm font-medium text-charcoal">
      <Link href="/gallery" className="hover:text-kraft-brown">
        Gallery
      </Link>
      {user ? (
        <Link href="/dashboard" className="hover:text-kraft-brown">
          Dashboard
        </Link>
      ) : (
        <Link href="/auth/login" className="hover:text-kraft-brown">
          Log in
        </Link>
      )}
    </nav>
  );
}
