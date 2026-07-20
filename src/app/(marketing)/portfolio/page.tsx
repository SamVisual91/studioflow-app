import type { Metadata } from "next";
import Link from "next/link";
import { PublicWorkBrowser } from "@/components/public-work-browser";
import { PublicSiteShell } from "@/components/public-site-shell";
import { buildMarketingMetadata } from "@/lib/marketing-metadata";
import { publicWorkSections } from "@/lib/public-work";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Wedding Films, Brand Campaigns, and Commercial Portfolio",
  description:
    "Browse Sam Visual portfolio work across wedding films, brand campaigns, commercial photography, event visuals, and cinematic marketing projects.",
  path: "/portfolio",
  ogImage: "/brand/bulova-octava-thumbnail.png",
});

export default function PortfolioPage() {
  return (
    <PublicSiteShell currentNavKey="our-work" currentPath="/portfolio">
      <PublicWorkBrowser sections={publicWorkSections} />

      <section className="bg-[#141414] pb-20 text-white">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="border-t border-white/8 pt-12">
            <div className="mb-12 grid gap-5 lg:grid-cols-3">
              <article className="border border-white/10 bg-[#101010] px-6 py-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/72">For Couples</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">Wedding Videography</h2>
                <p className="mt-4 text-base leading-8 text-white/70">
                  If the portfolio brought you here because you need a wedding videographer in Hickory or elsewhere in
                  North Carolina, the wedding films page is the best next stop.
                </p>
                <Link
                  className="mt-5 inline-flex items-center text-sm font-semibold uppercase tracking-[0.2em] text-[#d7b892] transition hover:text-white"
                  href="/wedding-videography"
                >
                  Explore wedding videography
                </Link>
              </article>

              <article className="border border-white/10 bg-[#101010] px-6 py-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/72">For Couples</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">Wedding Photography</h2>
                <p className="mt-4 text-base leading-8 text-white/70">
                  Looking for stills instead of films? The wedding photography page has galleries, FAQs, and coverage
                  details built for couples comparing options.
                </p>
                <Link
                  className="mt-5 inline-flex items-center text-sm font-semibold uppercase tracking-[0.2em] text-[#d7b892] transition hover:text-white"
                  href="/wedding-photography"
                >
                  Explore wedding photography
                </Link>
              </article>

              <article className="border border-white/10 bg-[#101010] px-6 py-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/72">For Brands</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">Business Marketing</h2>
                <p className="mt-4 text-base leading-8 text-white/70">
                  If you are here for commercial work, brand content, or social media support, head to the business
                  marketing page for a clearer breakdown of services.
                </p>
                <Link
                  className="mt-5 inline-flex items-center text-sm font-semibold uppercase tracking-[0.2em] text-[#d7b892] transition hover:text-white"
                  href="/business"
                >
                  Explore business marketing
                </Link>
              </article>
            </div>

            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/42">Start A Project</p>
                <h2 className="mt-4 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  Want something like this built for your brand, event, or campaign?
                </h2>
                <p className="mt-4 text-base leading-8 text-white/66">
                  If you already know the kind of work you want, the next step is easy. Reach out and we can shape the
                  right approach for your project.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="bg-[#c97d21] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#15120f] transition hover:brightness-110"
                  href="/contact"
                >
                  Start your project
                </Link>
                <Link
                  className="border border-white/14 bg-white/[0.04] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.08]"
                  href="/business"
                >
                  See capabilities
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
