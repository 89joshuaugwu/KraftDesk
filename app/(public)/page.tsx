import Link from "next/link";
import { Upload, CheckCircle2, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div>
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center sm:pt-28">
        <h1 className="text-4xl font-bold text-deep-kraft sm:text-5xl">
          From Draft to Published. Tracked.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-warm-gray">
          Poster design workflow for teams — upload, review, approve, distribute.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/signup"
            className="min-h-[48px] rounded-lg bg-kraft-brown px-6 py-3 font-medium text-warm-white hover:bg-deep-kraft"
          >
            Get Started
          </Link>
          <Link
            href="/gallery"
            className="min-h-[48px] rounded-lg border border-kraft-brown px-6 py-3 font-medium text-kraft-brown hover:bg-kraft-tan/40"
          >
            Browse Gallery
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 px-6 pb-24 sm:grid-cols-3">
        {[
          { icon: Upload, title: "Upload & Version", body: "Track every revision of a poster from first draft to final art." },
          { icon: CheckCircle2, title: "Review & Approve", body: "Reviewers approve, request changes, or reject with a comment." },
          { icon: Globe, title: "Public Distribution", body: "Publish approved posters straight to a public gallery." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-lg border border-kraft-tan bg-warm-white p-5">
            <Icon className="h-6 w-6 text-terracotta" />
            <h3 className="mt-3 font-bold text-deep-kraft">{title}</h3>
            <p className="mt-1 text-sm text-warm-gray">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
