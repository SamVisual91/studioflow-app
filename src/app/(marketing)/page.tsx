import Link from "next/link";

export default function SplashPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#111111] text-white">
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

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.34),rgba(8,8,8,0.52)_30%,rgba(8,8,8,0.76)_72%,rgba(8,8,8,0.92)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-white/58">Filmchaser Media</p>
            <p className="mt-3 text-sm uppercase tracking-[0.3em] text-white/56">Sam Visual</p>
          </div>
          <Link className="text-xs font-semibold uppercase tracking-[0.26em] text-white/68 transition hover:text-white" href="/login">
            Studio Login
          </Link>
        </div>

        <div className="flex flex-1 items-end py-10 sm:items-center sm:py-14">
          <div className="grid w-full gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div className="max-w-4xl">
              <p className="text-xs uppercase tracking-[0.42em] text-white/62">Cinematic storytelling for every kind of client</p>
              <h1 className="mt-6 text-balance font-display text-5xl font-semibold uppercase leading-[0.92] sm:text-6xl lg:text-[5.15rem]">
                Choose Your Experience
              </h1>
              <div className="mt-7 h-px w-36 bg-[#d0b18a]" />
              <p className="mt-7 max-w-2xl text-lg leading-9 text-white/80 sm:text-[1.24rem]">
                Enter through the side that fits you best. Explore our business and brand work, or step into our
                wedding experience built for couples who want films and photos that feel elevated, emotional, and
                lasting.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Link
                className="group relative overflow-hidden px-1 py-6 transition"
                href="/home"
              >
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(208,177,138,0.18),transparent_55%)] opacity-0 blur-2xl transition duration-500 group-hover:opacity-100" />
                <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)] opacity-0 blur-md transition duration-700 group-hover:left-full group-hover:opacity-100" />
                <div className="relative border-l border-white/14 pl-5 transition duration-500 group-hover:border-[#d0b18a] group-hover:pl-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/54 transition duration-300 group-hover:text-[#d0b18a]">
                    Business
                  </p>
                  <h2 className="mt-4 text-3xl font-display text-white transition duration-300 group-hover:translate-x-1">
                    Brands, Campaigns &amp; Content
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-8 text-white/72 transition duration-300 group-hover:text-white/86">
                    Video production, photography, social media campaigns, and client work built for modern brands.
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d0b18a] transition group-hover:translate-x-1">
                      Enter business site
                    </span>
                    <span className="h-px w-10 bg-white/18 transition duration-500 group-hover:w-20 group-hover:bg-[#d0b18a]" />
                  </div>
                </div>
              </Link>

              <Link
                className="group relative overflow-hidden px-1 py-6 transition"
                href="/wedding"
              >
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(208,177,138,0.18),transparent_55%)] opacity-0 blur-2xl transition duration-500 group-hover:opacity-100" />
                <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)] opacity-0 blur-md transition duration-700 group-hover:left-full group-hover:opacity-100" />
                <div className="relative border-l border-white/14 pl-5 transition duration-500 group-hover:border-[#d0b18a] group-hover:pl-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/54 transition duration-300 group-hover:text-[#d0b18a]">
                    Wedding
                  </p>
                  <h2 className="mt-4 text-3xl font-display text-white transition duration-300 group-hover:translate-x-1">
                    Films, Photos &amp; Keepsakes
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-8 text-white/72 transition duration-300 group-hover:text-white/86">
                    A more editorial wedding experience with curated films, portraits, and a luxury presentation.
                  </p>
                  <div className="mt-6 flex items-center gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d0b18a] transition group-hover:translate-x-1">
                      Enter wedding site
                    </span>
                    <span className="h-px w-10 bg-white/18 transition duration-500 group-hover:w-20 group-hover:bg-[#d0b18a]" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-xs uppercase tracking-[0.28em] text-white/48">
          <p>Hickory, North Carolina</p>
          <p>Filmchaser Media x Sam Visual</p>
        </div>
      </div>
    </main>
  );
}
