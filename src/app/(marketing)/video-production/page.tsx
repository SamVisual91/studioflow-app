import Link from "next/link";
import { PublicVideoProductionMontage } from "@/components/public-video-production-montage";
import { PublicSiteShell } from "@/components/public-site-shell";

const productionServices = [
  {
    title: "Marketing Videos",
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <path
          d="M4.75 14.25V9.75A1.5 1.5 0 0 1 6.25 8.25h3.5l5.5-3.5v14l-5.5-3.5h-3.5a1.5 1.5 0 0 1-1.5-1.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
  {
    title: "Documentaries",
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <path
          d="M4.75 7.25A1.5 1.5 0 0 1 6.25 5.75h8.5a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5h-8.5a1.5 1.5 0 0 1-1.5-1.5v-9.5ZM16.25 10.25l3-1.75v7l-3-1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
  {
    title: "Corporate Videos",
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="m10 8.75 5 3.25-5 3.25v-6.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    title: "TV Commercials",
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <path
          d="M4.75 6.75h14.5v9.5H4.75zM9.5 19.25h5M8.25 4.75 12 7.5l3.75-2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
  {
    title: "Short Films",
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <path
          d="M6 5.75h12v12.5H6zM3.75 8.25H6M3.75 12H6M3.75 15.75H6M18 8.25h2.25M18 12h2.25M18 15.75h2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
  {
    title: "Product Demos",
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <path
          d="M11.75 4.75 18.5 8.5l-3.75 6.75L8 19l-2.5-4.5 3.75-6.75 2.5-3ZM11 8.5l2 2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
  {
    title: "Branded Content",
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    title: "Web Commercials",
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <path
          d="M4.75 6.75h14.5v10.5H4.75zM8.75 19.25h6.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
  {
    title: "Social Media Ads",
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <path
          d="M9 4.75h6a1.25 1.25 0 0 1 1.25 1.25v12A1.25 1.25 0 0 1 15 19.25H9A1.25 1.25 0 0 1 7.75 18V6A1.25 1.25 0 0 1 9 4.75Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      </svg>
    ),
  },
];

const productionHighlights = [
  {
    title: "Top-of-the-Line Equipment",
    icon: (
      <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
        <path
          d="M4.75 7.25h8.5v9.5h-8.5zM13.25 10.25l5-3v9l-5-3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
      </svg>
    ),
    description:
      "We use high-quality cameras, lenses, drones, lighting, audio gear, and production tools so the final work feels polished from capture through delivery.",
  },
  {
    title: "Multi-Purpose Content",
    icon: (
      <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
        <path
          d="M5.75 6.75h10v8.5h-10zM8.25 15.25h10v5h-10z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
      </svg>
    ),
    description:
      "We create content that can work across your website, social media, email campaigns, paid ads, presentations, and launch materials so the investment stretches further.",
  },
  {
    title: "Deep Production Experience",
    icon: (
      <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
        <path
          d="M8 17.25h8M9 20.25h6M12 3.75a4.75 4.75 0 0 1 2.87 8.54c-.98.74-1.62 1.73-1.62 2.71h-2.5c0-.98-.64-1.97-1.62-2.7A4.75 4.75 0 0 1 12 3.75Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
        <path d="M17.5 9.5h2M18.3 5.7l1.4-1.4M6.5 9.5h-2M5.7 5.7 4.3 4.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    ),
    description:
      "We bring years of production experience across brands, events, attractions, sports, nightlife, and story-led campaigns, and we keep refining the process every time.",
  },
  {
    title: "Pre-Production",
    icon: (
      <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
        <path
          d="M5.75 5.75v12.5h12.5M8.5 13l2.25-2.5 2.5 2 4-5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
      </svg>
    ),
    description:
      "We map the creative approach before cameras roll so the shoot has direction, the deliverables are clear, and the content supports your actual goals.",
  },
  {
    title: "Project Management",
    icon: (
      <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
        <path
          d="M6 5.75h12v9.5H9.75l-3.75 3v-12.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
        <path d="m9.25 10.5 1.75 1.75 3.75-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      </svg>
    ),
    description:
      "We keep projects organized and clients updated throughout the process so the experience feels clear, calm, and easy to follow from first call to final delivery.",
  },
  {
    title: "Post Production",
    icon: (
      <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
        <path
          d="M4.75 6.75h14.5v10.5H4.75zM8 10.25l2.25 2.25 4.25-4.25M4.75 16.25l3.75-3.75 3 3 2.5-2.5 5.25 5.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
      </svg>
    ),
    description:
      "We take care of editing, color, sound, music, pacing, thumbnails, and all the refinements that make the finished piece feel intentional and complete.",
  },
];

export default function VideoProductionPage() {
  return (
    <PublicSiteShell currentNavKey="video-production" currentPath="/video-production">
      <section className="bg-[#141414] py-16 text-white sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-white/48">Video Production</p>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Cinematic video production for brands, campaigns, events, and story-driven work.
            </h1>
            <div className="mx-auto mt-8 h-px w-44 bg-[#8ea89b]" />
            <p className="mx-auto mt-8 max-w-5xl text-lg leading-10 text-white/78">
              Sam Visual creates promotional films, commercial visuals, event pieces, documentary-style edits, and
              branded content designed to help businesses look more established, more intentional, and more memorable
              across every platform where the work lives.
            </p>
          </div>

          <PublicVideoProductionMontage />

          <div className="mt-14 grid gap-x-10 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
            {productionServices.map((service) => (
              <div className="flex items-start gap-4" key={service.title}>
                <span className="mt-1 inline-flex h-9 w-9 items-center justify-center text-[#8ea89b]">
                  {service.icon}
                </span>
                <p className="text-2xl font-semibold leading-tight text-white">{service.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#141414] pb-20 text-white">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="border-t border-white/8 pt-12">
            <div className="text-center">
              <h2 className="text-balance text-4xl font-semibold text-white sm:text-5xl">
                What To Expect From Our Award-Winning Team
              </h2>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {productionHighlights.map((item) => (
                <article className="border border-white/10 bg-[#101010] px-7 py-8" key={item.title}>
                  <div className="flex h-11 w-11 items-center justify-center text-[#8ea89b]">{item.icon}</div>
                  <h2 className="text-3xl font-semibold text-white">{item.title}</h2>
                  <p className="mt-5 text-base leading-9 text-white/76">{item.description}</p>
                </article>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap gap-3">
              <Link
                className="bg-[#c97d21] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#15120f] transition hover:brightness-110"
                href="/portfolio"
              >
                View our work
              </Link>
              <Link
                className="border border-white/14 bg-white/[0.04] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.08]"
                href="/contact"
              >
                Start your project
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
