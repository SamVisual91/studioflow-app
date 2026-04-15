import Link from "next/link";
import { PublicSiteShell } from "@/components/public-site-shell";

const capabilities = [
  {
    title: "Websites",
    description:
      "Custom websites built to present your brand clearly, look premium on every screen, and turn attention into inquiries.",
  },
  {
    title: "Content Planning",
    description:
      "Monthly or campaign-based planning that gives you a clear roadmap for what to post, when to post it, and why it matters.",
  },
  {
    title: "Profile Management",
    description:
      "Ongoing support for keeping your brand pages polished, active, and aligned across the platforms your audience actually uses.",
  },
  {
    title: "Account Creation",
    description:
      "Platform setup for brands that need clean, professional accounts launched the right way from the beginning.",
  },
  {
    title: "Content Production",
    description:
      "Cinematic video, photography, reels, promo assets, and short-form content created to make your brand feel stronger and more current.",
  },
];

const supportPoints = [
  "Strategy that fits your business goals",
  "Visual production that matches your brand",
  "Content systems that are easier to maintain",
];

export default function BusinessPage() {
  return (
    <PublicSiteShell currentNavKey="social-media-marketing" currentPath="/business">
      <section className="bg-[#141414] py-16 text-white sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="self-center">
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-white/48">Social media marketing</p>
            <h1 className="mt-6 text-balance font-display text-5xl leading-[0.94] text-white sm:text-6xl">
              Content support that helps your brand look consistent, current, and worth following.
            </h1>
            <p className="mt-8 max-w-3xl text-lg leading-9 text-white/74">
              Sam Visual helps businesses build a stronger online presence through content planning, platform setup,
              profile support, content production, and web experiences that feel cohesive from the first click to the
              final post.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="bg-[#c97d21] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#15120f] transition hover:brightness-110"
                href="/contact"
              >
                Start a project
              </Link>
              <Link
                className="border border-white/14 bg-white/[0.04] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.08]"
                href="/portfolio"
              >
                View portfolio
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {supportPoints.map((point) => (
                <div className="border border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-medium text-white/72" key={point}>
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden border border-white/10 bg-[linear-gradient(180deg,#171717,#101010)] shadow-[0_26px_80px_rgba(0,0,0,0.3)]">
            <div className="grid gap-px bg-white/10">
              {capabilities.map((capability, index) => (
                <div className="bg-[#111111] p-6 sm:p-7" key={capability.title}>
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 text-xs font-semibold uppercase tracking-[0.28em] text-[#d2a25e]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h2 className="text-2xl font-semibold text-white">{capability.title}</h2>
                      <p className="mt-3 max-w-2xl text-sm leading-8 text-white/68">{capability.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#141414] pb-20 text-white">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="border-t border-white/8 pt-12">
            <div className="text-center">
              <h2 className="text-balance text-4xl font-semibold text-white sm:text-5xl">
                What to Expect From Our Social Media Marketing Services
              </h2>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              <article className="border border-white/10 bg-[#101010] px-7 py-8">
                <div className="flex h-11 w-11 items-center justify-center text-white">
                  <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <h3 className="mt-7 text-3xl font-semibold text-white">Custom Social Media Strategy</h3>
                <p className="mt-5 max-w-xl text-base leading-9 text-white/76">
                  We build a brand-centered strategy around your goals, audience, and offers so your content direction
                  feels intentional instead of random.
                </p>
              </article>

              <article className="border border-white/10 bg-[#101010] px-7 py-8">
                <div className="flex h-11 w-11 items-center justify-center text-white">
                  <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M7 3.75v3M17 3.75v3M4.75 9.25h14.5M6.25 6.75h11.5A1.5 1.5 0 0 1 19.25 8.25v9.5a1.5 1.5 0 0 1-1.5 1.5H6.25a1.5 1.5 0 0 1-1.5-1.5v-9.5a1.5 1.5 0 0 1 1.5-1.5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="mt-7 text-3xl font-semibold text-white">Content Creation &amp; Planning</h3>
                <p className="mt-5 max-w-xl text-base leading-9 text-white/76">
                  We plan content around campaigns, posting rhythms, and launches while producing the videos, photos,
                  and assets needed to keep your channels active.
                </p>
              </article>

              <article className="border border-white/10 bg-[#101010] px-7 py-8">
                <div className="flex h-11 w-11 items-center justify-center text-white">
                  <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M4.75 14.25V9.75A1.5 1.5 0 0 1 6.25 8.25h3.5l5.5-3.5v14l-5.5-3.5h-3.5a1.5 1.5 0 0 1-1.5-1.5ZM17.75 9.25a4.75 4.75 0 0 1 0 5.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="mt-7 text-3xl font-semibold text-white">Paid &amp; Organic Social Campaigns</h3>
                <p className="mt-5 max-w-xl text-base leading-9 text-white/76">
                  We help brands support both organic growth and campaign-based promotion with content that is built to
                  reach people and move attention in the right direction.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
