import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { getDefaultAppPath } from "@/lib/roles";

export const metadata: Metadata = {
  title: "StudioFlow Login",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect(getDefaultAppPath(user.role));
  }

  const params = await searchParams;
  const hasError = params.error === "invalid" || params.error === "missing";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-black/[0.08] bg-white/82 shadow-[0_24px_80px_rgba(58,34,17,0.12)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="bg-[linear-gradient(160deg,rgba(29,27,31,0.96),rgba(47,125,92,0.92))] px-8 py-10 text-white sm:px-10 sm:py-12">
          <p className="text-xs uppercase tracking-[0.34em] text-white/65">StudioFlow</p>
          <h1 className="mt-5 font-display text-5xl leading-none sm:text-6xl">
            Sign in to your client operating system.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/76">
            StudioFlow uses a local SQLite database with session auth and protected routes
            for your CRM, proposals, invoices, scheduling, messages, projects, and automation modules.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
            <p className="text-sm font-semibold">Team access</p>
            <p className="mt-3 text-sm text-white/76">
              Each person can have their own StudioFlow login. Add or reset accounts from the in-app
              Users page after you sign in.
            </p>
          </div>
        </section>

        <section className="px-8 py-10 sm:px-10 sm:py-12">
          <div className="mx-auto max-w-md">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Login</p>
            <h2 className="mt-4 text-3xl font-semibold">Welcome back</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Sign in with your StudioFlow email and password. Ask your admin to create an account for you if you do not have one yet.
            </p>

            {hasError ? (
              <div className="mt-6 rounded-2xl border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-4 py-3 text-sm text-[var(--accent)]">
                The email or password was missing or incorrect.
              </div>
            ) : null}

            <form action={loginAction} className="mt-8 grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                Email
                <input
                  className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3 outline-none ring-0 transition focus:border-[var(--forest)]"
                  name="email"
                  placeholder="you@samthao.com"
                  type="email"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Password
                <input
                  className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3 outline-none ring-0 transition focus:border-[var(--forest)]"
                  name="password"
                  placeholder="Enter your password"
                  type="password"
                />
              </label>

              <button className="mt-2 rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(47,125,92,0.22)] transition hover:brightness-110">
                Sign in
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
