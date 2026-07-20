import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PublicSiteShell } from "@/components/public-site-shell";
import { PublicWeddingMontage } from "@/components/public-wedding-montage";
import { StructuredDataScript } from "@/components/structured-data-script";
import { WeddingVideoCarousel } from "@/components/wedding-video-carousel";
import { buildMarketingMetadata } from "@/lib/marketing-metadata";
import {
  buildFaqStructuredData,
  buildLocalBusinessStructuredData,
  buildVideoObjectStructuredData,
} from "@/lib/structured-data";
import {
  featuredWeddingTestimonials,
  weddingTestimonials,
} from "@/lib/wedding-testimonials";
import { weddingVenueGroups } from "@/lib/wedding-venues";

export const metadata: Metadata = buildMarketingMetadata({
  title: "Wedding Videographer in Hickory, North Carolina",
  description:
    "Sam Visual offers cinematic wedding videography and wedding films for couples in Hickory and across North Carolina.",
  path: "/wedding-videography",
  ogImage: "/brand/eloise-ken-wedding-thumbnail.png",
});

const weddingVideos = [
  {
    title: "Eloise + Ken",
    subtitle: "Romantic Evening Portraits",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "An intimate wedding film with elegant portraits, soft light, and a timeless feel.",
    accentFrom: "#f8d8b8",
    accentTo: "#ba7d50",
    posterSrc: "/brand/eloise-ken-wedding-thumbnail.png",
    youtubeEmbedSrc: "https://www.youtube.com/embed/gN3EzWvtKXs?si=PtpaaL0vXIquUxTJ",
  },
  {
    title: "Tricia + Evan",
    subtitle: "Classic Bridal Morning",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A polished wedding film built around bridal prep, meaningful details, and quiet emotion.",
    accentFrom: "#f3dfc7",
    accentTo: "#b38961",
    posterSrc: "/brand/tricia-evan-wedding-thumbnail.png",
    videoSrc: "/work-videos/tricia-evan-wedding.mov",
  },
  {
    title: "Karina + Justin",
    subtitle: "Warm Portrait Highlight",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A joyful wedding story with warm portraits, natural chemistry, and a romantic finish.",
    accentFrom: "#f8d1b0",
    accentTo: "#c97a63",
    posterSrc: "/brand/karina-justin-wedding-thumbnail.png",
    youtubeEmbedSrc: "https://www.youtube.com/embed/3QZk8g-F9Uw?si=2zMs1Vf-AzV_xGvC",
  },
  {
    title: "Lauren + Aaron",
    subtitle: "Sparkler Exit Feature",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A cinematic wedding film with emotional portraits, celebration, and a sparkler send-off.",
    accentFrom: "#ead4be",
    accentTo: "#8d6b55",
    posterSrc: "/brand/lauren-aaron-wedding-thumbnail.png",
    youtubeEmbedSrc: "https://www.youtube.com/embed/Xg0Azl4kpLc?si=335MThcXgz3sH4NS",
  },
  {
    title: "Lindsey + Matthew",
    subtitle: "Elegant Veil Portraits",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A refined wedding film with graceful portraits, emotional ceremony moments, and a clean editorial look.",
    accentFrom: "#f4dcc4",
    accentTo: "#9f6f50",
    posterSrc: "/brand/lindsey-matthew-wedding-thumbnail.png",
    youtubeEmbedSrc: "https://www.youtube.com/embed/s-gOmqvSwLU?si=zQhsruaJxYpDKeeF",
  },
  {
    title: "Catherine + Zach",
    subtitle: "Garden Ceremony Story",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A bright wedding film with floral framing, heartfelt moments, and a romantic tone.",
    accentFrom: "#f0d7b0",
    accentTo: "#b88a5d",
    posterSrc: "/brand/catherine-zach-wedding-thumbnail.png",
    videoSrc: "/work-videos/catherine-zach-wedding.mov",
  },
  {
    title: "Emily + Alex",
    subtitle: "Wedding Party Celebration",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A lively wedding film focused on celebration, candid moments, and joyful reactions.",
    accentFrom: "#eec6b5",
    accentTo: "#9d6c62",
    posterSrc: "/brand/emily-alex-wedding-thumbnail.png",
    youtubeEmbedSrc: "https://www.youtube.com/embed/HuEV0Byr2VA?si=EQbrKZ9RIaDuJuaV",
  },
];

const weddingPhotos = [
  "/brand/wedding-photo-1.png",
  "/brand/wedding-photo-2.png",
  "/brand/wedding-photo-3.png",
];

const collectionFeatures = [
  {
    title: "Built around your day",
    description:
      "Choose intimate coverage or fuller wedding-day storytelling based on what matters most to you.",
  },
  {
    title: "Highlight films and full edits",
    description:
      "Collections can include trailers, highlight films, longer wedding edits, and keepsake films.",
  },
  {
    title: "Ceremony and reception coverage",
    description:
      "Ceremony moments, speeches, toasts, and first dances can all be part of the final film.",
  },
  {
    title: "Drone coverage when available",
    description:
      "Drone footage is available when weather, venue rules, and airspace allow.",
  },
];

const serviceAreaHighlights = [
  "Wedding videography in Hickory, North Carolina with a calm, story-first style.",
  "Coverage at venues across Western North Carolina.",
  "North Carolina wedding films that feel clean, emotional, and lasting.",
];

const venueHighlights = [
  {
    title: "Lakefront weddings around Hickory",
    description:
      "Open light, movement, and reflections help the setting feel like part of the story.",
  },
  {
    title: "Mountain venues across Western North Carolina",
    description:
      "Mountain weddings often call for a slower, more atmospheric wedding film.",
  },
  {
    title: "Estates, gardens, and polished indoor venues",
    description:
      "These venues work well for clean portraits, thoughtful lighting, and refined detail coverage.",
  },
];

const venuePlanningPoints = [
  "Timeline planning for ceremony light, sunset portraits, and room changes.",
  "Drone coverage only when weather, venue rules, and airspace allow.",
  "Coverage that follows the venue flow so the film feels natural.",
];

const faqItems = [
  {
    question: "Do you offer wedding videography in Hickory, North Carolina?",
    answer:
      "Yes. Sam Visual offers wedding videography in Hickory, North Carolina with cinematic coverage and a polished final film.",
  },
  {
    question: "Do you travel outside Hickory for wedding films?",
    answer:
      "Yes. We film weddings in Hickory, Western North Carolina, and across North Carolina.",
  },
  {
    question: "What style of wedding videography do you create?",
    answer:
      "Our wedding videography blends cinematic storytelling, clean visuals, and real emotion.",
  },
  {
    question: "Can couples book both wedding videography and photography together?",
    answer:
      "Yes. You can book wedding videography on its own or add wedding photography for one visual style across both.",
  },
];

const heroMetrics = [
  { value: "15", label: "North Carolina venues filmed" },
  { value: "5.0", label: "client rating" },
  { value: "7", label: "featured wedding films" },
];

const featuredVenues = weddingVenueGroups.flatMap((group) =>
  group.venues.map((venue) => `${venue.name} - ${venue.city}`)
);

export default function WeddingVideographyPage() {
  const heroReview = featuredWeddingTestimonials[0];
  const reviewSpotlight = featuredWeddingTestimonials[2] || heroReview;
  const finalCtaReview = featuredWeddingTestimonials[1] || featuredWeddingTestimonials[0];
  const localBusinessStructuredData = buildLocalBusinessStructuredData({
    aggregateRating: {
      ratingValue: 5,
      reviewCount: weddingTestimonials.length,
    },
    pagePath: "/wedding-videography",
    imagePath: "/brand/eloise-ken-wedding-thumbnail.png",
    description:
      "Sam Visual offers cinematic wedding videography and wedding films for couples in Hickory and across North Carolina.",
    reviews: weddingTestimonials.map((item) => ({
      author: item.author,
      rating: item.rating,
      reviewBody: item.quote,
    })),
    serviceTypes: [
      "Wedding videography",
      "Wedding photography",
      "Wedding highlight films",
      "Wedding keepsake visuals",
      "Cinematic wedding coverage",
    ],
  });
  const weddingVideoStructuredData = weddingVideos.map((item) =>
    buildVideoObjectStructuredData({
      name: `${item.title} | ${item.subtitle}`,
      description: item.detail,
      pagePath: "/wedding-videography",
      thumbnailPath: item.posterSrc || "/brand/eloise-ken-wedding-thumbnail.png",
      embedUrl: item.youtubeEmbedSrc,
      contentUrl: item.videoSrc,
    })
  );
  const faqStructuredData = buildFaqStructuredData(faqItems);

  return (
    <PublicSiteShell currentNavKey="wedding" currentPath="/wedding-videography">
      <StructuredDataScript data={localBusinessStructuredData} />
      <StructuredDataScript data={weddingVideoStructuredData} />
      <StructuredDataScript data={faqStructuredData} />

      <section className="relative overflow-hidden bg-[#141414] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(215,184,146,0.18),transparent_32%),radial-gradient(circle_at_85%_12%,rgba(143,179,166,0.12),transparent_24%),linear-gradient(180deg,rgba(20,20,20,0.88),rgba(20,20,20,1))]" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20">
          <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.42em] text-[#d7b892]/72">Wedding Videography</p>
              <h1 className="mt-7 max-w-5xl text-balance font-display text-5xl leading-[0.9] text-white sm:text-6xl lg:text-[5.35rem]">
                Wedding videography for North Carolina couples who want a film that feels real.
              </h1>
              <div className="mt-8 h-px w-44 bg-[linear-gradient(90deg,rgba(215,184,146,0.15),rgba(215,184,146,0.9),rgba(215,184,146,0.15))]" />
              <p className="mt-8 max-w-3xl text-lg leading-9 text-white/74 sm:text-[1.1rem]">
                Sam Visual films weddings in Hickory and across North Carolina with calm direction, clean visuals, and
                a story-first approach.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  className="bg-[#d7b892] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#141414] transition hover:brightness-110"
                  href="/contact"
                >
                  Check Your Date
                </Link>
                <Link
                  className="border border-white/14 bg-white/[0.04] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/[0.08]"
                  href="/wedding-photography"
                >
                  Add Photography
                </Link>
              </div>

              {heroReview ? (
                <div className="mt-10 max-w-2xl border-l border-[#d7b892]/42 pl-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/78">
                    5-star review | {heroReview.source}
                  </p>
                  <p className="mt-4 text-base leading-8 text-white/76">&ldquo;{heroReview.quote}&rdquo;</p>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/64">{heroReview.author}</p>
                </div>
              ) : null}
            </div>

            <div>
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:p-4">
                <PublicWeddingMontage />
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-4 border-t border-white/10 pt-8 md:grid-cols-3">
            {heroMetrics.map((item) => (
              <div className="border-l border-[#d7b892]/26 pl-5 md:first:border-l-0 md:first:pl-0" key={item.label}>
                <p className="font-display text-4xl leading-none text-white">{item.value}</p>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-white/52">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#141414] pb-24 text-white">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="grid gap-16 border-t border-white/8 pt-16 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Signature Coverage</p>
              <h2 className="mt-5 max-w-4xl text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                Simple, clean coverage that follows the day naturally.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                We keep the process calm and focused so your wedding film feels polished, personal, and easy to relive.
              </p>

              <div className="mt-10 border-t border-white/10">
                {collectionFeatures.map((item) => (
                  <article className="grid gap-4 border-b border-white/10 py-6 sm:grid-cols-[0.32fr_0.68fr]" key={item.title}>
                    <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
                    <p className="text-base leading-8 text-white/70">{item.description}</p>
                  </article>
                ))}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {serviceAreaHighlights.map((item) => (
                  <div className="border-l border-[#d7b892]/36 pl-4 text-sm leading-7 text-white/68" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                {weddingPhotos.map((photo, index) => (
                  <div
                    className={`${index === 0 ? "sm:row-span-2 sm:min-h-[28rem]" : "min-h-[13.5rem]"} relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#101010]`}
                    key={photo}
                  >
                    <Image
                      alt={`Wedding visual preview ${index + 1}`}
                      className="object-cover"
                      fill
                      sizes={index === 0 ? "(max-width: 640px) 100vw, 55vw" : "(max-width: 640px) 100vw, 28vw"}
                      src={photo}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,12,12,0.02),rgba(12,12,12,0.3)_62%,rgba(12,12,12,0.72)_100%)]" />
                  </div>
                ))}
              </div>

              <div className="rounded-[2.2rem] border border-[#d7b892]/14 bg-[radial-gradient(circle_at_top_left,rgba(215,184,146,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-7 py-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/78">Wedding Photography</p>
                <h3 className="mt-4 max-w-lg font-display text-[2rem] leading-[1.02] text-white">
                  Want your photos to match the film?
                </h3>
                <p className="mt-5 text-base leading-8 text-white/70">
                  Explore wedding photography with the same clean style and direction across both photo and video.
                </p>
                <Link
                  className="mt-7 inline-flex items-center justify-center border border-white/14 bg-white/[0.04] px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-white/[0.08]"
                  href="/wedding-photography"
                >
                  Explore Wedding Photography
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-16 border-t border-white/8 pt-16 lg:grid-cols-[0.98fr_1.02fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Venue Awareness</p>
              <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                Every wedding film changes with the venue, the light, and the pace of the day.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                A wedding in Hickory feels different from a mountain venue, vineyard, or estate. We shape the coverage
                around the setting so the final film feels natural.
              </p>

              <div className="mt-10 space-y-8">
                {venueHighlights.map((item) => (
                  <article className="border-l border-[#d7b892]/34 pl-5" key={item.title}>
                    <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-base leading-8 text-white/70">{item.description}</p>
                  </article>
                ))}
              </div>

              <div className="mt-10 grid gap-3">
                {venuePlanningPoints.map((item) => (
                  <div className="border-b border-white/10 pb-3 text-sm leading-7 text-white/68" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Venues We&apos;ve Worked At</p>
                  <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                    Real North Carolina venues couples already know.
                  </h2>
                </div>
                <Link
                  className="inline-flex items-center justify-center border border-white/14 bg-white/[0.04] px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-white/[0.08]"
                  href="/contact"
                >
                  Tell Us About Your Venue
                </Link>
              </div>

              <div className="mt-10 grid gap-x-8 gap-y-4 border-t border-white/10 pt-8 sm:grid-cols-2">
                {featuredVenues.map((venue) => (
                  <span className="border-b border-white/8 pb-4 text-sm leading-7 text-white/68" key={venue}>
                    {venue}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-16 border-t border-white/8 pt-16">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Wedding Films</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  A wedding film gallery that is easy to explore.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  Watch a few real films to get a feel for the style, pacing, and emotion of the work.
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center border border-[#d7b892]/34 bg-[#d7b892]/8 px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:border-[#d7b892]/58 hover:bg-[#d7b892]/14"
                href="/contact"
              >
                Inquire About Collections
              </Link>
            </div>

            <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))] p-4 sm:p-5">
              <WeddingVideoCarousel items={weddingVideos} />
            </div>
          </div>

          <div className="mt-16 grid gap-16 border-t border-white/8 pt-16 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Kind Words</p>
              <h2 className="mt-5 max-w-3xl text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                Trusted by couples who wanted wedding films that felt personal and honest.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                Couples often mention the same things: clear communication, calm direction, and a film they love coming back to.
              </p>

              {reviewSpotlight ? (
                <article className="mt-10 border-t border-white/10 pt-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/78">
                    5-star review | {reviewSpotlight.source}
                  </p>
                  <p className="mt-6 max-w-2xl font-display text-[1.9rem] leading-[1.18] text-white sm:text-[2.25rem]">
                    &ldquo;{reviewSpotlight.quote}&rdquo;
                  </p>
                  <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-white/64">
                    {reviewSpotlight.author}
                  </p>
                </article>
              ) : null}
            </div>

            <div className="rounded-[2.3rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(215,184,146,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.01))] px-7 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:px-8 sm:py-9">
              <div className="grid gap-8 border-b border-white/10 pb-8 sm:grid-cols-2">
                {featuredWeddingTestimonials.slice(0, 2).map((item) => (
                  <article className="border-l border-[#d7b892]/30 pl-4" key={item.author}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d7b892]/72">
                      5-star review | {item.source}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-white/74">&ldquo;{item.quote}&rdquo;</p>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/58">{item.author}</p>
                  </article>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/62">Ready To Book</p>
                <h2 className="mt-5 max-w-3xl text-balance font-display text-4xl leading-[0.98] text-white sm:text-[2.85rem]">
                  If the work feels right, the next step is checking your date.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/70">
                  Send your wedding date, venue, and what kind of coverage you want. We will help you choose the best fit.
                </p>
              </div>

              <div className="mt-8 grid gap-5 border-t border-white/10 pt-8 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d7b892]/70">Step 1</p>
                  <p className="mt-3 text-sm leading-7 text-white/68">Send your date, venue, and whether you want photo, video, or both.</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d7b892]/70">Step 2</p>
                  <p className="mt-3 text-sm leading-7 text-white/68">We recommend the collection that best fits your day.</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d7b892]/70">Step 3</p>
                  <p className="mt-3 text-sm leading-7 text-white/68">If it feels right, we reserve the date and start planning.</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="bg-[#d7b892] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#141414] transition hover:brightness-110"
                  href="/contact"
                >
                  Start Your Inquiry
                </Link>
                <Link
                  className="border border-white/14 bg-white/[0.04] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/[0.08]"
                  href="/wedding-photography"
                >
                  Add Photography
                </Link>
              </div>

              <div className="mt-10 border-t border-white/10 pt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Frequently Asked</p>
                <div className="mt-6 space-y-5">
                  {faqItems.map((item) => (
                    <article className="border-b border-white/10 pb-5" key={item.question}>
                      <h3 className="text-xl font-semibold text-white">{item.question}</h3>
                      <p className="mt-4 text-base leading-8 text-white/72">{item.answer}</p>
                    </article>
                  ))}
                </div>
              </div>

              {finalCtaReview ? (
                <div className="mt-8 border-l border-[#d7b892]/34 pl-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/78">
                    5-star review | {finalCtaReview.source}
                  </p>
                  <p className="mt-4 text-base leading-8 text-white/76">&ldquo;{finalCtaReview.quote}&rdquo;</p>
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-white/64">
                    {finalCtaReview.author}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
