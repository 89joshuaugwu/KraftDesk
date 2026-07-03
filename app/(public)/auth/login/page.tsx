"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginWithEmail, loginWithGoogle, friendlyAuthError } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const nextPath = searchParams.get("next") || "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      router.push(nextPath);
    } catch (err: any) {
      toast.error(friendlyAuthError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push(nextPath);
    } catch (err: any) {
      toast.error(friendlyAuthError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-deep-kraft">Welcome back</h1>
        <p className="mt-1 text-sm text-warm-gray">Log in to your KraftDesk account.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" fullWidth loading={loading}>
            Log in
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-warm-gray">
          <div className="h-px flex-1 bg-kraft-tan" /> or <div className="h-px flex-1 bg-kraft-tan" />
        </div>

        <Button variant="secondary" fullWidth onClick={handleGoogle} loading={loading}>
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-warm-gray">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-medium text-kraft-brown hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
