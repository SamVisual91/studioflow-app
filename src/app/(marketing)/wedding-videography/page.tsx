import type { Metadata } from "next";
import Link from "next/link";
import { PublicSiteShell } from "@/components/public-site-shell";
import { StructuredDataScript } from "@/components/structured-data-script";
import { WeddingTestimonialCarousel } from "@/components/wedding-testimonial-carousel";
import { WeddingVideoCarousel } from "@/components/wedding-video-carousel";
import { buildMarketingMetadata } from "@/lib/marketing-metadata";
import {
  buildFaqStructuredData,
  buildLocalBusinessStructuredData,
  buildOrganizationStructuredData,
  buildVideoObjectStructuredData,
} from "@/lib/structured-data";
import {
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
    videoSrc: "/work-videos/eloise-ken-wedding.mov",
    youtubeEmbedSrc: "https://www.youtube.com/embed/gN3EzWvtKXs?si=PtpaaL0vXIquUxTJ",
    uploadDate: "2026-04-12",
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
    uploadDate: "2026-04-13",
  },
  {
    title: "Karina + Justin",
    subtitle: "Warm Portrait Highlight",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A joyful wedding story with warm portraits, natural chemistry, and a romantic finish.",
    accentFrom: "#f8d1b0",
    accentTo: "#c97a63",
    posterSrc: "/brand/karina-justin-wedding-thumbnail.png",
    videoSrc: "/work-videos/karina-justin-wedding.mov",
    youtubeEmbedSrc: "https://www.youtube.com/embed/3QZk8g-F9Uw?si=2zMs1Vf-AzV_xGvC",
    uploadDate: "2026-04-13",
  },
  {
    title: "Lauren + Aaron",
    subtitle: "Sparkler Exit Feature",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A cinematic wedding film with emotional portraits, celebration, and a sparkler send-off.",
    accentFrom: "#ead4be",
    accentTo: "#8d6b55",
    posterSrc: "/brand/lauren-aaron-wedding-thumbnail.png",
    videoSrc: "/work-videos/lauren-aaron-wedding.mov",
    youtubeEmbedSrc: "https://www.youtube.com/embed/Xg0Azl4kpLc?si=335MThcXgz3sH4NS",
    uploadDate: "2026-04-12",
  },
  {
    title: "Lindsey + Matthew",
    subtitle: "Elegant Veil Portraits",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A refined wedding film with graceful portraits, emotional ceremony moments, and a clean editorial look.",
    accentFrom: "#f4dcc4",
    accentTo: "#9f6f50",
    posterSrc: "/brand/lindsey-matthew-wedding-thumbnail.png",
    videoSrc: "/work-videos/lindsey-matthew-wedding.mp4",
    youtubeEmbedSrc: "https://www.youtube.com/embed/s-gOmqvSwLU?si=zQhsruaJxYpDKeeF",
    uploadDate: "2026-04-12",
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
    uploadDate: "2026-04-12",
  },
  {
    title: "Emily + Alex",
    subtitle: "Wedding Party Celebration",
    eyebrow: "Sam Visual Wedding Collection",
    detail: "A lively wedding film focused on celebration, candid moments, and joyful reactions.",
    accentFrom: "#eec6b5",
    accentTo: "#9d6c62",
    posterSrc: "/brand/emily-alex-wedding-thumbnail.png",
    videoSrc: "/work-videos/emily-alex-wedding.mp4",
    youtubeEmbedSrc: "https://www.youtube.com/embed/HuEV0Byr2VA?si=EQbrKZ9RIaDuJuaV",
    uploadDate: "2026-04-13",
  },
];

const venueHighlights = [
  {
    title: "Hickory, mountain, and estate venues",
    description:
      "We adjust the coverage to fit the light, pace, and feel of each wedding venue across Hickory and North Carolina.",
  },
];

const venuePlanningPoints = [
  "Coverage shaped around the light, the venue flow, and the pace of the day.",
  "Drone coverage only when weather, venue rules, and airspace allow.",
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
  const organizationStructuredData = buildOrganizationStructuredData();
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
      uploadDate: item.uploadDate,
    })
  );
  const faqStructuredData = buildFaqStructuredData(faqItems);

  return (
    <PublicSiteShell currentNavKey="wedding" currentPath="/wedding-videography">
      <StructuredDataScript data={organizationStructuredData} />
      <StructuredDataScript data={localBusinessStructuredData} />
      <StructuredDataScript data={weddingVideoStructuredData} />
      <StructuredDataScript data={faqStructuredData} />

      <section className="relative overflow-hidden bg-[#141414] text-white">
        <video
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
          loop
          muted
          playsInline
          poster="/brand/eloise-ken-wedding-thumbnail.png"
          preload="auto"
          src="/work-videos/wedding-hero.mp4"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.24),rgba(8,8,8,0.48)_36%,rgba(8,8,8,0.72)_68%,rgba(20,20,20,0.96)_100%),radial-gradient(circle_at_top_left,rgba(215,184,146,0.22),transparent_28%),radial-gradient(circle_at_80%_14%,rgba(143,179,166,0.12),transparent_22%)]" />
        <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-24 sm:px-8 sm:pb-24 sm:pt-28">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-[#d7b892]/78">Wedding Videography</p>
            <h1 className="mt-7 flex flex-col items-center gap-2 text-center">
              <span
                className="font-cherie text-[3.2rem] uppercase leading-[0.82] tracking-[0.05em] text-[#ecd6bb] sm:text-[4.2rem] lg:text-[5.5rem]"
              >
                Timeless
              </span>
              <span className="font-cherie whitespace-nowrap text-[2.55rem] font-normal uppercase leading-[0.9] tracking-[0.12em] text-[#e6dbc7] sm:text-[3.45rem] lg:text-[4.45rem]">
                Wedding Films
              </span>
            </h1>
            <div className="mt-8 h-px w-44 bg-[linear-gradient(90deg,rgba(215,184,146,0.15),rgba(215,184,146,0.9),rgba(215,184,146,0.15))]" />
            <p className="mt-8 max-w-3xl text-lg leading-9 text-white/78 sm:text-[1.1rem]">
              Wedding videography in Hickory, North Carolina for couples who want a film that feels real, timeless,
              and personal.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                className="bg-[#d7b892] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#141414] transition hover:brightness-110"
                href="/contact"
              >
                Check Your Date
              </Link>
              <Link
                className="border border-white/14 bg-white/[0.08] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/[0.14]"
                href="/wedding-photography"
              >
                Add Photography
              </Link>
            </div>

          </div>

          <div className="mt-14 grid gap-4 border-t border-white/10 pt-8 md:grid-cols-3">
            {heroMetrics.map((item) => (
              <div
                className="border-l border-[#d7b892]/26 pl-5 text-center md:first:border-l-0 md:first:pl-0"
                key={item.label}
              >
                <p className="font-cherie text-4xl leading-none text-white">{item.value}</p>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-white/52">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#141414] pb-24 text-white">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="mt-10 border-t border-white/8 pt-14">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="max-w-5xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Wedding Films</p>
                <h2 className="font-cherie mt-5 text-balance text-4xl uppercase leading-[0.98] tracking-[0.06em] text-white sm:text-5xl">
                  You Deserve to remember how it felt, and relive every part of your day.
                </h2>
              </div>
              <Link
                className="inline-flex items-center justify-center border border-[#d7b892]/34 bg-[#d7b892]/8 px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:border-[#d7b892]/58 hover:bg-[#d7b892]/14"
                href="/contact"
              >
                Inquire About Collections
              </Link>
            </div>

            <div className="mt-10">
              <WeddingVideoCarousel items={weddingVideos} />
            </div>
          </div>

          <div className="mt-16 grid gap-16 border-t border-white/8 pt-16 lg:grid-cols-[0.98fr_1.02fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Venue Awareness</p>
              <h2 className="font-cherie mt-5 max-w-3xl text-balance text-4xl uppercase leading-[0.98] tracking-[0.06em] text-white sm:text-5xl">
                We shape each wedding film around the venue and the light.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/68">
                Weddings in Hickory, the mountains, and estate venues across North Carolina all move differently. We
                keep the coverage natural to the setting.
              </p>

              <div className="mt-8 space-y-6">
                {venueHighlights.map((item) => (
                  <article className="border-l border-[#d7b892]/34 pl-5" key={item.title}>
                    <h3 className="font-cherie text-xl font-semibold uppercase tracking-[0.05em] text-white">{item.title}</h3>
                    <p className="mt-3 text-base leading-8 text-white/70">{item.description}</p>
                  </article>
                ))}
              </div>

              <div className="mt-8 grid gap-3">
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
                  <h2 className="font-cherie mt-5 text-balance text-4xl uppercase leading-[0.98] tracking-[0.06em] text-white sm:text-5xl">
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
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Kind Words</p>
            <h2 className="font-cherie mt-5 text-balance text-4xl uppercase leading-[0.98] tracking-[0.06em] text-white sm:text-5xl">
              Reviews
            </h2>
            <div className="mt-8">
              <WeddingTestimonialCarousel items={weddingTestimonials} />
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 px-1 pt-10 sm:px-0">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/62">Ready To Book</p>
            <h2 className="font-cherie mt-5 max-w-3xl text-balance text-4xl uppercase leading-[0.98] tracking-[0.06em] text-white sm:text-[2.85rem]">
              If the work feels right, the next step is checking your date.
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/70">
              Send your wedding date, venue, and what kind of coverage you want. We will help you choose the best fit.
            </p>

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
          </div>

          <div className="mt-12 border-t border-white/10 px-1 pt-10 sm:px-0">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Frequently Asked</p>
            <h2 className="font-cherie mt-5 max-w-4xl text-balance text-4xl uppercase leading-[0.98] tracking-[0.06em] text-white sm:text-5xl">
              Questions couples usually ask before booking.
            </h2>
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {faqItems.map((item) => (
                <article className="border-b border-white/10 pb-5" key={item.question}>
                  <h3 className="font-cherie text-xl font-semibold uppercase tracking-[0.05em] text-white">{item.question}</h3>
                  <p className="mt-4 text-base leading-8 text-white/72">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
