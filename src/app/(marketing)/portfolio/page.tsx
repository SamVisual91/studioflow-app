import Link from "next/link";
import { PublicWorkBrowser } from "@/components/public-work-browser";
import { PublicSiteShell } from "@/components/public-site-shell";
import { publicWorkSections } from "@/lib/public-work";

export default function PortfolioPage() {
  return (
    <PublicSiteShell currentNavKey="our-work" currentPath="/portfolio">
      <PublicWorkBrowser sections={publicWorkSections} />

      <section className="bg-[#141414] pb-20 text-white">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="border-t border-white/8 pt-12">
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
