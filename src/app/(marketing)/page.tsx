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

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-white/58">
              Filmchaser Media
            </p>
            <p className="mt-3 text-sm uppercase tracking-[0.3em] text-white/56">Sam Visual</p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs uppercase tracking-[0.28em] text-white/48">
          <p>Hickory, North Carolina</p>
          <p>Filmchaser Media x Sam Visual</p>
        </div>
      </div>

      <div className="relative z-20 grid justify-items-center gap-6 text-center">
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
