import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicSiteShell } from "@/components/public-site-shell";
import { PublicWorkVideoLauncher } from "@/components/public-work-video-launcher";
import { findPublicWorkBySlug, publicWorks } from "@/lib/public-work";

export function generateStaticParams() {
  return publicWorks.map((item) => ({ slug: item.slug }));
}

export default async function PortfolioProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const work = findPublicWorkBySlug(slug);

  if (!work) {
    notFound();
  }

  const relatedWork = publicWorks
    .filter((item) => item.slug !== work.slug && item.category === work.category)
    .slice(0, 3);

  return (
    <PublicSiteShell currentPath="/portfolio">
      <section className="bg-[#141414] py-16 text-white sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="mb-8 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/50">
            <Link className="transition hover:text-white" href="/home">
              Home
            </Link>
            <span>/</span>
            <Link className="transition hover:text-white" href="/portfolio">
              Portfolio
            </Link>
            <span>/</span>
            <span className="text-white/72">{work.title}</span>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/48">{work.category}</p>
              <h1 className="mt-5 text-balance font-display text-5xl leading-[0.92] text-white sm:text-6xl">
                {work.title}
              </h1>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.24em] text-[#d2a25e]">{work.subtitle}</p>
              <p className="mt-8 max-w-3xl text-lg leading-9 text-white/76">{work.summary}</p>
            </div>

            <div className="grid gap-4 self-end text-sm text-white/70 sm:grid-cols-3 lg:grid-cols-1">
              <div className="border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/44">Client</p>
                <p className="mt-3 text-base font-semibold text-white">{work.client}</p>
              </div>
              <div className="border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/44">Project Type</p>
                <p className="mt-3 text-base font-semibold text-white">{work.subtitle}</p>
              </div>
              <div className="border border-white/10 bg-white/[0.04] p-5">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/44">Creative Focus</p>
                <p className="mt-3 text-base font-semibold text-white">{work.category}</p>
              </div>
            </div>
          </div>

          <PublicWorkVideoLauncher posterSrc={work.image} title={work.title} videoSrc={work.videoSrc} />

          <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="border border-white/10 bg-[#101010] p-7 sm:p-8">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-white/44">Overview</p>
              <p className="mt-5 text-base leading-8 text-white/76">{work.description}</p>
            </article>

            <div className="grid gap-8">
              <article className="border border-white/10 bg-[#101010] p-7 sm:p-8">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-white/44">Deliverables</p>
                <div className="mt-5 grid gap-3">
                  {work.deliverables.map((item) => (
                    <div className="border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/78" key={item}>
                      {item}
                    </div>
                  ))}
                </div>
              </article>

              <article className="border border-white/10 bg-[#101010] p-7 sm:p-8">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-white/44">Services</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {work.services.map((item) => (
                    <span className="border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            </div>
          </div>

          {relatedWork.length ? (
            <div className="mt-16">
              <div className="mb-6 flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/48">More In This Category</p>
                <Link className="text-xs font-semibold uppercase tracking-[0.24em] text-white/68 transition hover:text-[#d2a25e]" href="/portfolio">
                  View portfolio
                </Link>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                {relatedWork.map((item) => (
                  <Link
                    className="group relative overflow-hidden border border-white/10 bg-[#101010]"
                    href={`/portfolio/${item.slug}`}
                    key={item.slug}
                  >
                    <div className="relative aspect-[16/10]">
                      <Image alt={item.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" fill src={item.image} />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.02),rgba(6,6,6,0.28)_45%,rgba(6,6,6,0.82)_100%)]" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="text-xl font-bold uppercase leading-[1.05] tracking-[0.02em] text-white">{item.title}</p>
                      <p className="mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/70">{item.subtitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </PublicSiteShell>
  );
}
