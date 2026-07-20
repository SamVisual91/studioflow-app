import type { Metadata } from "next";
import Link from "next/link";
import { PhotographyLightboxCarousel } from "@/components/photography-lightbox-carousel";
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
    "Sam Visual creates cinematic wedding films, emotional portrait coverage, and heirloom visuals for couples in Hickory and across North Carolina.",
  path: "/wedding-videography",
  ogImage: "/brand/eloise-ken-wedding-thumbnail.png",
});

const weddingVideos = [
  {
    title: "Eloise + Ken",
    subtitle: "Romantic Evening Portraits",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "An intimate wedding film centered on elegant portraits, soft light, and a timeless evening feel.",
    accentFrom: "#f8d8b8",
    accentTo: "#ba7d50",
    posterSrc: "/brand/eloise-ken-wedding-thumbnail.png",
    youtubeEmbedSrc: "https://www.youtube.com/embed/gN3EzWvtKXs?si=PtpaaL0vXIquUxTJ",
  },
  {
    title: "Tricia + Evan",
    subtitle: "Classic Bridal Morning",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A polished story built around bridal prep, refined details, and the calm emotion before the ceremony.",
    accentFrom: "#f3dfc7",
    accentTo: "#b38961",
    posterSrc: "/brand/tricia-evan-wedding-thumbnail.png",
    videoSrc: "/work-videos/tricia-evan-wedding.mov",
  },
  {
    title: "Karina + Justin",
    subtitle: "Warm Portrait Highlight",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A joyful couple story with warm portrait work, natural chemistry, and a soft romantic finish.",
    accentFrom: "#f8d1b0",
    accentTo: "#c97a63",
    posterSrc: "/brand/karina-justin-wedding-thumbnail.png",
    youtubeEmbedSrc: "https://www.youtube.com/embed/3QZk8g-F9Uw?si=2zMs1Vf-AzV_xGvC",
  },
  {
    title: "Lauren + Aaron",
    subtitle: "Sparkler Exit Feature",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A cinematic wedding piece with emotional portraits, celebration energy, and a standout sparkler send-off.",
    accentFrom: "#ead4be",
    accentTo: "#8d6b55",
    posterSrc: "/brand/lauren-aaron-wedding-thumbnail.png",
    youtubeEmbedSrc: "https://www.youtube.com/embed/Xg0Azl4kpLc?si=335MThcXgz3sH4NS",
  },
  {
    title: "Lindsey + Matthew",
    subtitle: "Elegant Veil Portraits",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A refined wedding film focused on graceful portraiture, emotional ceremony moments, and a clean editorial look.",
    accentFrom: "#f4dcc4",
    accentTo: "#9f6f50",
    posterSrc: "/brand/lindsey-matthew-wedding-thumbnail.png",
    youtubeEmbedSrc: "https://www.youtube.com/embed/s-gOmqvSwLU?si=zQhsruaJxYpDKeeF",
  },
  {
    title: "Catherine + Zach",
    subtitle: "Garden Ceremony Story",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A bright, emotional wedding story with floral framing, heartfelt moments, and a cinematic romantic tone.",
    accentFrom: "#f0d7b0",
    accentTo: "#b88a5d",
    posterSrc: "/brand/catherine-zach-wedding-thumbnail.png",
    videoSrc: "/work-videos/catherine-zach-wedding.mov",
  },
  {
    title: "Emily + Alex",
    subtitle: "Wedding Party Celebration",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A lively wedding feature that leans into the wedding party, celebration energy, and candid joyful reactions.",
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
  "/brand/wedding-photo-4.png",
  "/brand/wedding-photo-5.png",
  "/brand/wedding-photo-6.png",
  "/brand/wedding-photo-7.png",
];

const serviceAreaHighlights = [
  {
    title: "Hickory Wedding Videography",
    description:
      "For couples getting married in Hickory, Sam Visual creates wedding films that feel cinematic, calm, and emotionally grounded without losing the real pace of the day.",
  },
  {
    title: "Western North Carolina Weddings",
    description:
      "For venues across Western North Carolina, the focus stays on natural storytelling, location atmosphere, and polished film delivery that still feels personal.",
  },
  {
    title: "North Carolina Wedding Films",
    description:
      "For couples traveling or planning celebrations elsewhere in North Carolina, the same editorial visual style carries through from prep to final gallery and film.",
  },
];

const faqItems = [
  {
    question: "Do you offer wedding videography in Hickory, North Carolina?",
    answer:
      "Yes. Sam Visual offers wedding videography in Hickory, North Carolina for couples who want cinematic coverage, emotional storytelling, and a polished final film.",
  },
  {
    question: "Do you travel outside Hickory for wedding films?",
    answer:
      "Yes. We serve Hickory, Western North Carolina, and weddings across North Carolina depending on the venue, timeline, and collection.",
  },
  {
    question: "What style of wedding videography do you create?",
    answer:
      "The work blends cinematic pacing, editorial portrait direction, honest emotion, and clean presentation so the wedding film still feels elevated years later.",
  },
  {
    question: "Can couples book both wedding videography and photography together?",
    answer:
      "Yes. Couples can inquire about wedding videography on its own or combine it with wedding photography when they want one visual direction across both deliverables.",
  },
];

const collectionFeatures = [
  {
    title: "Coverage built around the real day",
    description:
      "Collections can be tailored for intimate coverage or fuller wedding-day storytelling, with planning shaped around the moments that matter most to you.",
  },
  {
    title: "Highlight films and longer-form edits",
    description:
      "Depending on the collection, deliverables can include trailers, highlight films, longer wedding edits, and keepsake pieces that hold onto the full emotion of the day.",
  },
  {
    title: "Ceremony and reception story moments",
    description:
      "Couples often want more than portraits alone, so ceremony coverage, speeches, toasts, and first-dance moments can all be part of the final story depending on the collection.",
  },
  {
    title: "Drone and polished delivery when available",
    description:
      "Drone coverage can be included when weather, venue rules, and local airspace allow, and final delivery is presented in a way that feels organized and easy to revisit.",
  },
];

const bookingSteps = [
  {
    title: "Start with the date and priorities",
    description:
      "Tell us your date, venue area, and what parts of the wedding matter most so the coverage can be shaped around your real priorities.",
  },
  {
    title: "Choose the right level of coverage",
    description:
      "From simpler coverage to fuller multi-filmmaker collections, the goal is to match the timeline, deliverables, and pace of your day without overcomplicating the process.",
  },
  {
    title: "Receive a polished wedding film experience",
    description:
      "After the wedding, the focus moves to clean editing, emotional pacing, strong presentation, and delivery that still feels premium when you come back to it later.",
  },
];

const venueHighlights = [
  {
    title: "Lakefront weddings around Hickory",
    description:
      "For lakefront ceremonies and waterfront receptions around Hickory, the coverage leans into open light, natural movement, reflections, and wide establishing moments that help the setting feel part of the story.",
  },
  {
    title: "Mountain venues across Western North Carolina",
    description:
      "For mountain weddings and elevated venues across Western North Carolina, the pace of the film can lean more atmospheric, pairing landscape, weather, and quieter emotional moments without losing the people at the center.",
  },
  {
    title: "Estates, gardens, and polished indoor venues",
    description:
      "For estate weddings, garden ceremonies, and elegant indoor receptions, the visual direction stays clean and editorial with stronger portrait framing, intentional lighting, and detail-focused coverage.",
  },
];

const venuePlanningPoints = [
  "Timeline planning for ceremony light, sunset portraits, and transitions between venue spaces.",
  "Drone coverage only when weather, venue rules, and local airspace make it possible.",
  "Coverage shaped around the venue flow so the film feels natural instead of rushed or over-produced.",
];

export default function WeddingVideographyPage() {
  const finalCtaReview = featuredWeddingTestimonials[0];
  const localBusinessStructuredData = buildLocalBusinessStructuredData({
    aggregateRating: {
      ratingValue: 5,
      reviewCount: weddingTestimonials.length,
    },
    pagePath: "/wedding-videography",
    imagePath: "/brand/eloise-ken-wedding-thumbnail.png",
    description:
      "Sam Visual creates cinematic wedding films, emotional portrait coverage, and heirloom visuals for couples in Hickory and across North Carolina.",
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
      <section className="relative overflow-hidden bg-[#141414] py-16 text-white sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,184,148,0.18),transparent_34%),linear-gradient(180deg,rgba(20,20,20,0.88),rgba(20,20,20,1))]" />
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-[#d7b892]/72">Wedding Videography</p>
            <h1 className="mt-6 text-balance font-display text-5xl leading-[0.94] text-white sm:text-6xl lg:text-7xl">
              Wedding videography in Hickory, North Carolina designed to feel heirloom, cinematic, and emotionally true.
            </h1>
            <div className="mx-auto mt-8 h-px w-44 bg-[linear-gradient(90deg,rgba(215,184,146,0.15),rgba(215,184,146,0.9),rgba(215,184,146,0.15))]" />
            <p className="mx-auto mt-8 max-w-4xl text-lg leading-9 text-white/74 sm:text-[1.15rem]">
              Sam Visual creates wedding films in Hickory and across North Carolina for couples who want more than a
              recap. This collection is built around cinematic storytelling, editorial portrait direction, and keepsake
              visuals that still feel elevated years later.
            </p>
          </div>

          <div className="mt-12 overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-4">
            <PublicWeddingMontage />
          </div>

          <div className="mt-6 grid gap-3 text-left text-white/72 sm:grid-cols-3">
            <div className="border border-white/8 bg-white/[0.02] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/78">Approach</p>
              <p className="mt-2 text-sm leading-6">Editorial portraiture, honest emotion, and pacing that still feels timeless.</p>
            </div>
            <div className="border border-white/8 bg-white/[0.02] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/78">Deliverables</p>
              <p className="mt-2 text-sm leading-6">Highlight films, full-story wedding edits, keepsake visuals, and photo presentation.</p>
            </div>
            <div className="border border-white/8 bg-white/[0.02] px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/78">Experience</p>
              <p className="mt-2 text-sm leading-6">A calm, polished client experience built to feel personal from first meeting to final delivery.</p>
            </div>
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
                  Wedding videography collections built around story, coverage, and keepsake delivery.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  Couples usually want to know what the experience actually includes before they inquire. These are the
                  kinds of pieces Sam Visual builds into wedding film collections depending on the coverage level you
                  choose.
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center border border-white/14 bg-white/[0.04] px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-white/[0.08]"
                href="/contact"
              >
                Ask About Collections
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
                  Wedding videography for Hickory couples and celebrations across North Carolina.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  The local search goal here is simple: make it clear where Sam Visual works and what couples can
                  expect. If you are looking for a wedding videographer in Hickory, or planning a wedding elsewhere in
                  North Carolina, the experience is built to stay calm, polished, and story-first from inquiry to
                  final delivery.
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
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Venue Style</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  Wedding films shaped around the kind of venue and atmosphere your day actually has.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  Venue context matters for SEO, but it also matters for the final film. The way a wedding is filmed at
                  a lakefront venue near Hickory is different from the way it is approached at a mountain property,
                  estate, garden, or polished indoor space across North Carolina.
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center border border-white/14 bg-white/[0.04] px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-white/[0.08]"
                href="/contact"
              >
                Tell Us About Your Venue
              </Link>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {venueHighlights.map((item) => (
                <article className="border border-white/10 bg-[#101010] px-7 py-8" key={item.title}>
                  <h3 className="text-3xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-5 text-base leading-8 text-white/72">{item.description}</p>
                </article>
              ))}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {venuePlanningPoints.map((item) => (
                <div className="border border-white/8 bg-white/[0.02] px-5 py-4 text-sm leading-7 text-white/72" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 border-t border-white/8 pt-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Venues We&apos;ve Worked At</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  Wedding venues across North Carolina where Sam Visual has already captured real celebrations.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  Specific venue names can help couples feel confident they are in the right place, especially when
                  they are searching for a wedding videographer tied to a venue, city, or venue region they already
                  know.
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

          <div className="border-t border-white/8 pt-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Wedding Films</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  A curated film gallery built to feel like a luxury wedding collection.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  Explore the wedding films as a collection instead of a simple video list. Each piece is framed to help
                  couples quickly understand the tone, emotion, and visual language behind the work.
                </p>
              </div>
              <a
                className="inline-flex items-center justify-center border border-[#d7b892]/34 bg-[#d7b892]/8 px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:border-[#d7b892]/58 hover:bg-[#d7b892]/14"
                href="/contact"
              >
                Inquire About Our Packages
              </a>
            </div>

            <div className="mt-10 border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] p-4 sm:p-5">
              <WeddingVideoCarousel items={weddingVideos} />
            </div>
          </div>

          <div className="mt-16 border-t border-white/8 pt-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Wedding Photos</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  Portraits, keepsake visuals, and moments that feel elevated without losing warmth.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  The image gallery is there to show how the same visual direction carries through stills, details, and
                  presentation pieces, so couples can see the full wedding experience in one place.
                </p>
                <div className="mt-6">
                  <Link
                    className="inline-flex items-center justify-center border border-white/14 bg-white/[0.04] px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-white/[0.08]"
                    href="/wedding-photography"
                  >
                    Explore Wedding Photography
                  </Link>
                </div>
              </div>
              <a
                className="inline-flex items-center justify-center border border-[#d7b892]/34 bg-[#d7b892]/8 px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:border-[#d7b892]/58 hover:bg-[#d7b892]/14"
                href="/contact"
              >
                Inquire About Our Packages
              </a>
            </div>

            <div className="mt-10 border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] p-4 sm:p-5">
              <PhotographyLightboxCarousel images={weddingPhotos} />
            </div>
          </div>

          <div className="mt-16 border-t border-white/8 pt-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Booking Experience</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  A booking process that stays clear, calm, and easy to follow.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  Trust matters just as much as the work itself. The process is built to help couples understand what
                  they are booking, what the coverage can look like, and how the final wedding film experience comes
                  together.
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
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Kind Words</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  Fifteen five-star reviews from couples and clients who trusted Sam Visual with meaningful moments.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                  These testimonials speak to the experience couples remember most: strong communication, calm
                  professionalism, thoughtful storytelling, and wedding films that still feel meaningful long after the
                  day is over.
                </p>
              </div>
              <div className="flex items-center gap-3 border border-[#d7b892]/26 bg-[#d7b892]/8 px-5 py-4 text-white">
                <span className="text-3xl font-semibold">5.0</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#d7b892]/82">Client Rating</p>
                  <p className="mt-1 text-sm text-white/72">{weddingTestimonials.length} five-star reviews</p>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {featuredWeddingTestimonials.map((item) => (
                <article className="border border-white/10 bg-[#101010] px-7 py-8" key={item.author}>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d7b892]/74">
                    5-star review | {item.source}
                  </p>
                  <p className="mt-5 text-base leading-8 text-white/76">&ldquo;{item.quote}&rdquo;</p>
                  <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-white/68">{item.author}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-16 border-t border-white/8 pt-14">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Wedding Videography FAQ</p>
              <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                Questions couples usually ask before they book a wedding videographer.
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
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/62">Ready To Book</p>
                <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  If the films feel like the right fit, the next step is simply checking your date.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-white/70">
                  Share your wedding date, venue area, and what kind of film coverage you are hoping for. From there,
                  we can help shape the right collection for your day.
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
                  href="/wedding-photography"
                >
                    Add Photography
                  </Link>
                </div>
              </div>

              {finalCtaReview ? (
                <article className="border border-white/10 bg-[#101010] px-6 py-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d7b892]/74">
                    5-star review | {finalCtaReview.source}
                  </p>
                  <p className="mt-5 text-base leading-8 text-white/76">&ldquo;{finalCtaReview.quote}&rdquo;</p>
                  <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-white/68">
                    {finalCtaReview.author}
                  </p>
                </article>
              ) : null}
            </div>
          </div>
      </section>
    </PublicSiteShell>
  );
}
