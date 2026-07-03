"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signUpWithEmail, loginWithGoogle, friendlyAuthError } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      toast.success("Welcome to KraftDesk!");
      router.push("/dashboard");
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
      toast.success("Welcome to KraftDesk!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(friendlyAuthError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-deep-kraft">Create your account</h1>
        <p className="mt-1 text-sm text-warm-gray">
          New accounts start as a Designer. Reviewer and Admin access is granted
          by an admin afterward.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          <Input label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
          <Button type="submit" fullWidth loading={loading}>
            Sign up
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-warm-gray">
          <div className="h-px flex-1 bg-kraft-tan" /> or <div className="h-px flex-1 bg-kraft-tan" />
        </div>

        <Button variant="secondary" fullWidth onClick={handleGoogle} loading={loading}>
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-warm-gray">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-kraft-brown hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
