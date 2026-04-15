import Image from "next/image";
import Link from "next/link";
import { MediaCarousel } from "@/components/media-carousel";
import { PublicSiteShell } from "@/components/public-site-shell";
import { PublicHeroReel } from "@/components/public-hero-reel";
import { publicWorkSections } from "@/lib/public-work";

const trustedByLogos = [
  {
    label: "Bulova",
    src: "/brand/bulova-logo.png",
    widthClass: "max-w-[8.5rem]",
  },
  {
    label: "Jonas Ridge Snow Tubing",
    src: "/brand/jonas-ridge-logo-new.png",
    widthClass: "max-w-[9.5rem]",
    imageClassName: "opacity-100 brightness-0 invert contrast-[1.45] saturate-0 mix-blend-screen",
  },
  {
    label: "CVCC",
    src: "/brand/cvcc-logo.png",
    widthClass: "max-w-[5rem]",
  },
  {
    label: "Truly Hard Seltzer",
    src: "/brand/truly-logo.png",
    widthClass: "max-w-[8.75rem]",
  },
  {
    label: "Lake Hickory Haunts",
    src: "/brand/lake-hickory-haunts-logo-design-source.png",
    widthClass: "max-w-[10rem]",
    imageClassName: "opacity-90 grayscale contrast-[0.96]",
  },
  {
    label: "FFI",
    src: "/brand/ffi-logo-tagline-yellow-1.png",
    widthClass: "max-w-[9rem]",
  },
];

export default function HomePage() {
  return (
    <PublicSiteShell currentPath="/home">
      <section className="relative isolate overflow-hidden bg-[#121212]">
        <div className="absolute inset-0">
          <PublicHeroReel />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,14,0.08),rgba(14,14,14,0.34)_34%,rgba(14,14,14,0.62)_68%,rgba(14,14,14,0.96)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(20,20,20,0),#141414_88%)]" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-5.25rem)] w-full max-w-7xl items-end px-5 pb-20 pt-16 sm:px-8 lg:pb-24">
          <div className="mx-auto max-w-4xl text-center text-white">
            <p className="text-xs uppercase tracking-[0.42em] text-white/58">Hickory, North Carolina video production and photography</p>
            <h1 className="mt-8 text-balance font-display text-5xl font-semibold uppercase leading-[0.94] sm:text-6xl lg:text-[5.6rem]">
              We Are Storytellers
            </h1>
            <div className="mx-auto mt-7 h-px w-40 bg-[#8ea89b]" />
            <p className="mx-auto mt-8 max-w-3xl text-lg leading-9 text-white/84 sm:text-[1.35rem]">
              Sam Visual is a cinematic video production and photography studio creating elevated content for brands,
              celebrations, and campaigns that need clear story, strong visuals, and a polished client experience.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#141414] py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="pb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/48">Trusted By</p>
            <div className="mt-8 grid gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-6">
              {trustedByLogos.map((logo) => (
                <div
                  className="flex min-h-16 items-center justify-center px-3 py-4"
                  key={logo.label}
                >
                  <Image
                    alt={logo.label}
                    className={`h-auto w-full ${logo.widthClass} object-contain ${
                      logo.imageClassName || "opacity-88 brightness-0 invert mix-blend-screen"
                    }`}
                    height={180}
                    src={logo.src}
                    width={520}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-14">
            {publicWorkSections.map((section) => (
              <div key={section.heading}>
                <div className="mb-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white">{section.heading}</p>
                </div>
                <MediaCarousel itemCount={section.items.length}>
                  {section.items.map((item) => (
                    <Link
                      className="group relative overflow-hidden bg-white/[0.03] text-white shadow-[0_18px_48px_rgba(0,0,0,0.16)]"
                      href={`/portfolio/${item.slug}`}
                      key={`${section.heading}-${item.slug}`}
                    >
                      {item.image ? (
                        <div className="absolute inset-0">
                          <Image
                            alt={item.title}
                            className="h-full w-full object-cover"
                            height={900}
                            src={item.image}
                            width={1440}
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,0.08),rgba(7,7,7,0.12)_38%,rgba(7,7,7,0.3)_100%)] transition duration-300 group-hover:bg-[linear-gradient(180deg,rgba(7,7,7,0.18),rgba(7,7,7,0.28)_38%,rgba(7,7,7,0.78)_100%)]" />
                        </div>
                      ) : null}
                      <div className="relative flex min-h-[15rem] items-end px-6 py-7">
                        <div className="translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <p className="text-2xl font-bold uppercase leading-[1.05] tracking-[0.02em]">{item.title}</p>
                          {item.subtitle ? (
                            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.24em] text-white/72">
                              {item.subtitle}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </MediaCarousel>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#141414] pb-20">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="border-t border-white/8 pt-12 text-center text-white/88">
            <p className="mx-auto max-w-5xl text-lg leading-10 sm:text-[1.28rem]">
              At Sam Visual, we create cinematic content that helps brands, venues, events, and personal stories feel
              elevated, intentional, and worth remembering. Based in Hickory, North Carolina, we produce promotional
              films, branded campaigns, social media content, portraits, and story-driven visuals designed to connect
              with real people and leave a strong first impression.
            </p>
            <p className="mx-auto mt-10 max-w-5xl text-lg leading-10 sm:text-[1.28rem]">
              Our work is built around visual storytelling that feels polished without losing authenticity. Whether you
              need a campaign for a seasonal attraction, a commercial product spot, a high-energy event promo, or a
              portrait session with editorial direction, we shape each project to fit the tone, audience, and purpose
              behind it.
            </p>
            <p className="mx-auto mt-10 max-w-5xl text-lg leading-10 sm:text-[1.28rem]">
              We focus on helping clients turn ideas into visuals that drive attention, build trust, and create a more
              premium experience across every touchpoint. From concept to final delivery, Sam Visual combines strong
              direction, clean execution, and cinematic presentation to make the work feel cohesive, modern, and ready
              to stand out.
            </p>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
