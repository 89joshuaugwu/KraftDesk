import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream px-6 text-center">
      <h1 className="text-3xl font-bold text-deep-kraft">Page not found</h1>
      <p className="text-warm-gray">That page doesn&apos;t exist.</p>
      <Link href="/" className="mt-2 rounded-lg bg-kraft-brown px-4 py-2 text-warm-white">
        Back home
      </Link>
    </div>
  );
}
