import Link from "next/link";

export default function SplashPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#111111] px-6 text-white">
      <video
        autoPlay
        className="absolute inset-0 h-full w-full object-cover"
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="/brand/splash-hero.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.42),rgba(8,8,8,0.62)_45%,rgba(8,8,8,0.78)_100%)]" />

      <div className="relative grid justify-items-center gap-6 text-center">
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
