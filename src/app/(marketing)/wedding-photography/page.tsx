import type { Metadata } from "next";
import Link from "next/link";
import { PhotographyLightboxCarousel } from "@/components/photography-lightbox-carousel";
import { PublicSiteShell } from "@/components/public-site-shell";
import { StructuredDataScript } from "@/components/structured-data-script";
import { buildMarketingMetadata } from "@/lib/marketing-metadata";
import {
  buildFaqStructuredData,
  buildLocalBusinessStructuredData,
} from "@/lib/structured-data";
import { weddingVenueGroups } from "@/lib/wedding-venues";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Wedding Photographer in Hickory, North Carolina",
  description:
    "Sam Visual offers wedding photography in Hickory and across North Carolina with editorial portraits, candid coverage, detail storytelling, and polished gallery delivery.",
  path: "/wedding-photography",
  ogImage: "/brand/wedding-photo-1.png",
});

const weddingPhotoHighlights = [
  {
    title: "Portrait Direction",
    description:
      "Editorial-style portraits that still feel natural, relaxed, and grounded in the pace of the day.",
  },
  {
    title: "Candid Coverage",
    description:
      "Documentary moments, family reactions, and in-between emotions captured without making the day feel staged.",
  },
  {
    title: "Gallery Experience",
    description:
      "A polished final gallery that makes the wedding feel elevated from preview through full delivery.",
  },
];

const weddingPhotoGallery = [
  "/brand/wedding-photo-1.png",
  "/brand/wedding-photo-2.png",
  "/brand/wedding-photo-3.png",
  "/brand/wedding-photo-4.png",
  "/brand/wedding-photo-5.png",
  "/brand/wedding-photo-6.png",
  "/brand/wedding-photo-7.png",
];

const faqItems = [
  {
    question: "Do you offer wedding photography and videography together?",
    answer:
      "Yes. Sam Visual can support couples who want wedding photography, wedding videography, or a combined visual coverage approach depending on the day and deliverables needed.",
  },
  {
    question: "What style of wedding photography do you shoot?",
    answer:
      "The approach blends editorial portrait direction with candid storytelling, so the final gallery feels polished and elevated without losing the honest emotion of the day.",
  },
  {
    question: "Do you travel outside Hickory for weddings?",
    answer:
      "Yes. We serve Hickory and travel across North Carolina for weddings depending on the venue, timeline, and collection.",
  },
  {
    question: "How are wedding photos delivered?",
    answer:
      "Wedding photography is delivered through a polished online gallery experience designed to feel clean, easy to browse, and simple to share with family and friends.",
  },
];

const collectionFeatures = [
  {
    title: "Portrait direction that still feels natural",
    description:
      "The photography experience is shaped around giving couples enough guidance to look polished while still letting the day breathe and feel real.",
  },
  {
    title: "Candid and detail coverage throughout the day",
    description:
      "Beyond portraits, the story includes in-between moments, ceremony emotion, family reactions, and meaningful details that help the gallery feel complete.",
  },
  {
    title: "A final gallery that feels easy to revisit",
    description:
      "The goal is not just a folder of images. It is a polished gallery presentation that feels clean, elevated, and simple to share with family and friends.",
  },
  {
    title: "An easy path to combined photo and video",
    description:
      "If you want one visual direction across both mediums, photography can pair naturally with wedding videography so the coverage feels cohesive from start to finish.",
  },
];

const serviceAreaHighlights = [
  {
    title: "Hickory Wedding Photography",
    description:
      "For couples getting married in Hickory, the photography style stays editorial, warm, and focused on both portraits and honest moments.",
  },
  {
    title: "Western North Carolina Weddings",
    description:
      "For weddings across Western North Carolina, the gallery approach is built to reflect the atmosphere of the venue while keeping people and emotion at the center.",
  },
  {
    title: "North Carolina Wedding Coverage",
    description:
      "For celebrations elsewhere in North Carolina, the same visual direction carries through details, portrait sessions, ceremony moments, and final delivery.",
  },
];

const bookingSteps = [
  {
    title: "Share the date and wedding vision",
    description:
      "Start with the basics like your date, venue area, and what matters most in the photography so the coverage can be shaped around your actual priorities.",
  },
  {
    title: "Build the right gallery experience",
    description:
      "From portraits and candid moments to combined photo and video coverage, the next step is choosing the direction that fits the pace and feel of your day.",
  },
  {
    title: "Receive a polished final gallery",
    description:
      "After the wedding, the work moves into editing and presentation so the final gallery feels organized, elevated, and ready to revisit for years.",
  },
];

export default function WeddingPhotographyPage() {
  const localBusinessStructuredData = buildLocalBusinessStructuredData({
    pagePath: "/wedding-photography",
    imagePath: "/brand/wedding-photo-1.png",
    description:
      "Sam Visual offers wedding photography in Hickory and across North Carolina with editorial portraits, candid coverage, detail storytelling, and polished gallery delivery.",
    serviceTypes: [
      "Wedding photography",
      "Editorial wedding portraits",
      "Candid wedding coverage",
      "Wedding detail photography",
      "Wedding gallery delivery",
    ],
  });
  const faqStructuredData = buildFaqStructuredData(faqItems);

  return (
    <PublicSiteShell currentPath="/wedding-photography">
      <StructuredDataScript data={localBusinessStructuredData} />
      <StructuredDataScript data={faqStructuredData} />

      <section className="relative overflow-hidden bg-[#141414] py-16 text-white sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,184,148,0.18),transparent_34%),linear-gradient(180deg,rgba(20,20,20,0.88),rgba(20,20,20,1))]" />
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-[#d7b892]/72">Wedding Photography</p>
            <h1 className="mt-6 text-balance font-display text-5xl leading-[0.94] text-white sm:text-6xl lg:text-7xl">
              Wedding photography with editorial portraits, real emotion, and a polished gallery experience.
            </h1>
            <div className="mx-auto mt-8 h-px w-44 bg-[linear-gradient(90deg,rgba(215,184,146,0.15),rgba(215,184,146,0.9),rgba(215,184,146,0.15))]" />
            <p className="mx-auto mt-8 max-w-4xl text-lg leading-9 text-white/74 sm:text-[1.15rem]">
              Sam Visual photographs weddings in Hickory and across North Carolina for couples who want the day to feel
              documented beautifully, not over-directed. The focus stays on portraits, candid emotion, meaningful
              details, and a final gallery that still feels elevated years later.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              className="inline-flex items-center justify-center bg-[#d7b892] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#141414] transition hover:brightness-110"
              href="/contact"
            >
              Inquire About Wedding Photography
            </Link>
            <Link
              className="inline-flex items-center justify-center border border-white/14 bg-white/[0.04] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/[0.08]"
              href="/wedding-videography"
            >
              View Wedding Films
            </Link>
          </div>

          <div className="mt-12 grid gap-3 text-left text-white/72 sm:grid-cols-3">
            {weddingPhotoHighlights.map((item) => (
              <div className="border border-white/8 bg-white/[0.02] px-5 py-4" key={item.title}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/78">{item.title}</p>
                <p className="mt-2 text-sm leading-6">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#141414] pb-24 text-white">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="border-t border-white/8 pt-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">What&apos;s Included</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  Wedding photography built around portraits, candid moments, and polished delivery.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  Couples usually want to understand the experience before they ever ask about pricing. These are the
                  kinds of pieces the wedding photography side is built around.
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center border border-white/14 bg-white/[0.04] px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-white/[0.08]"
                href="/contact"
              >
                Ask About Photography
              </Link>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {collectionFeatures.map((item) => (
                <article className="border border-white/10 bg-[#101010] px-7 py-8" key={item.title}>
                  <h3 className="text-3xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-5 text-base leading-8 text-white/72">{item.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-16 border-t border-white/8 pt-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Service Area</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  Wedding photography for Hickory couples and celebrations across North Carolina.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  If you are searching for a wedding photographer in Hickory or planning a celebration elsewhere in
                  North Carolina, the photography experience is designed to stay polished, calm, and story-focused
                  from inquiry through final gallery delivery.
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center border border-white/14 bg-white/[0.04] px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-white/[0.08]"
                href="/contact"
              >
                Ask About Your Date
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {serviceAreaHighlights.map((item) => (
                <article className="border border-white/8 bg-white/[0.02] px-6 py-6" key={item.title}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/78">{item.title}</p>
                  <p className="mt-4 text-sm leading-7 text-white/72">{item.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-16 border-t border-white/8 pt-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Venues We&apos;ve Worked At</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  Wedding venues across North Carolina where Sam Visual has photographed real wedding days.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  Venue names also help couples who are searching around a place they already booked. This gives the
                  wedding photography page more location depth while keeping the copy grounded in real experience.
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center border border-white/14 bg-white/[0.04] px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-white/[0.08]"
                href="/contact"
              >
                Ask About Your Venue
              </Link>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {weddingVenueGroups.map((group) => (
                <article className="border border-white/10 bg-[#101010] px-7 py-8" key={group.title}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/78">{group.title}</p>
                  <p className="mt-4 text-sm leading-7 text-white/68">{group.description}</p>
                  <div className="mt-6 space-y-3">
                    {group.venues.map((venue) => (
                      <div className="border border-white/8 bg-white/[0.02] px-4 py-4" key={`${group.title}-${venue.name}`}>
                        <p className="text-base font-semibold text-white">{venue.name}</p>
                        <p className="mt-1 text-sm text-white/62">{venue.city}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-16 border-t border-white/8 pt-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Wedding Galleries</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  Portraits, details, and honest moments that still feel refined.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  This gallery gives couples a clearer look at the photography side of the work, from portrait
                  direction and ceremony emotion to details and presentation moments that complete the full story.
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center border border-[#d7b892]/34 bg-[#d7b892]/8 px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:border-[#d7b892]/58 hover:bg-[#d7b892]/14"
                href="/contact"
              >
                Start Your Inquiry
              </Link>
            </div>

            <div className="mt-10 border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] p-4 sm:p-5">
              <PhotographyLightboxCarousel images={weddingPhotoGallery} layout="vertical" />
            </div>
          </div>

          <div className="mt-16 border-t border-white/8 pt-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Booking Experience</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  A wedding photography process that stays clear and easy to trust.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  The goal is to make it simple for couples to understand how the photography side works, how it can
                  pair with video if needed, and what the final gallery experience is meant to feel like.
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center border border-[#d7b892]/34 bg-[#d7b892]/8 px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:border-[#d7b892]/58 hover:bg-[#d7b892]/14"
                href="/contact"
              >
                Check Availability
              </Link>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {bookingSteps.map((item, index) => (
                <article className="border border-white/10 bg-[#101010] px-7 py-8" key={item.title}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/72">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-4 text-3xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-5 text-base leading-8 text-white/72">{item.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-16 border-t border-white/8 pt-14">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Wedding Photography FAQ</p>
              <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                Answers couples usually want before they book.
              </h2>
            </div>

            <div className="mt-10 grid gap-4">
              {faqItems.map((item) => (
                <article className="border border-white/10 bg-[#101010] px-6 py-6 sm:px-7" key={item.question}>
                  <h3 className="text-2xl font-semibold text-white">{item.question}</h3>
                  <p className="mt-4 max-w-4xl text-base leading-8 text-white/72">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-16 border border-white/10 bg-[linear-gradient(180deg,#171717,#101010)] px-7 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:px-9">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/62">Ready To Book</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  If the gallery style feels right, the next step is sharing your date and plans.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/70">
                  Send the wedding date, venue area, and what kind of photography coverage matters most to you, and we
                  can help shape the right experience from there.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="bg-[#d7b892] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#141414] transition hover:brightness-110"
                  href="/contact"
                >
                  Start Your Inquiry
                </Link>
                <Link
                  className="border border-white/14 bg-white/[0.04] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/[0.08]"
                  href="/wedding-videography"
                >
                  Add Videography
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
