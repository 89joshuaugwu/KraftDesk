import { NextRequest, NextResponse } from "next/server";

// Route-level guard for /dashboard/*. Firebase Auth's client SDK stores its
// session in IndexedDB, which middleware (edge runtime) cannot read directly,
// so we rely on a lightweight session cookie ("kraftdesk_session") that
// /lib/auth.ts sets on successful sign-in and clears on sign-out. This keeps
// unauthenticated users from ever rendering dashboard shells, while the real
// per-page role checks (designer/reviewer/admin) still happen client-side
// against live Firestore data, since roles can change without a fresh login.
export function middleware(req: NextRequest) {
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");
  if (!isDashboardRoute) return NextResponse.next();

  const session = req.cookies.get("kraftdesk_session")?.value;
  if (!session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
