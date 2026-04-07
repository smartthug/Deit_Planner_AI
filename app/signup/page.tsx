"use client";

import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = SignupSchema.safeParse({ email, password });
    if (!parsed.success) {
      const msg =
        parsed.error.issues?.[0]?.message ?? "Please check your details.";
      setError(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "Signup failed");
        return;
      }

      router.push("/onboarding");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-zinc-200/70 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6 dark:border-white/10 dark:bg-black/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Signup</h1>
              <p className="mt-2 text-sm text-black dark:text-white">
                Create your account to start onboarding.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:border-[#FF0000]/40 sm:w-auto dark:border-white/10 dark:bg-black/30 dark:text-white"
            >
              Back
            </Link>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200/70 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[#FF0000]/40 focus:ring-0 dark:border-white/10 dark:bg-black/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200/70 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[#FF0000]/40 focus:ring-0 dark:border-white/10 dark:bg-black/30"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-[#FF0000]/20 bg-[#FF0000]/10 p-4 text-sm font-semibold text-[#950101] dark:bg-[#950101]/10 dark:text-[#FF0000]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#FF0000] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#950101] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Signup"}
            </button>

            <p className="text-center text-xs text-zinc-600 dark:text-zinc-300">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#950101] hover:underline dark:text-[#FF0000]"
              >
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

