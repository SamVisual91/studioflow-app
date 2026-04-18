import Link from "next/link";

export default function SplashPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111111] px-6 text-white">
      <div className="grid justify-items-center gap-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.34em] text-white/70">
          Welcome to Filmchaser Media
        </p>
        <h1 className="font-display text-5xl leading-none sm:text-6xl">Sam Visual</h1>
        <Link
          className="inline-flex min-h-12 items-center justify-center border border-white/20 bg-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#111111] transition hover:bg-transparent hover:text-white"
          href="/home"
        >
          Enter site
        </Link>
      </div>
    </main>
  );
}
