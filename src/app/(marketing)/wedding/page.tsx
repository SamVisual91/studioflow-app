import { PhotographyLightboxCarousel } from "@/components/photography-lightbox-carousel";
import { PublicSiteShell } from "@/components/public-site-shell";
import { PublicWeddingMontage } from "@/components/public-wedding-montage";
import { WeddingVideoCarousel } from "@/components/wedding-video-carousel";

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

export default function WeddingPage() {
  return (
    <PublicSiteShell currentNavKey="wedding" currentPath="/wedding">
      <section className="relative overflow-hidden bg-[#141414] py-16 text-white sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,184,148,0.18),transparent_34%),linear-gradient(180deg,rgba(20,20,20,0.88),rgba(20,20,20,1))]" />
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-[#d7b892]/72">Wedding</p>
            <h1 className="mt-6 text-balance font-display text-5xl leading-[0.94] text-white sm:text-6xl lg:text-7xl">
              Wedding films and imagery designed to feel heirloom, cinematic, and emotionally true.
            </h1>
            <div className="mx-auto mt-8 h-px w-44 bg-[linear-gradient(90deg,rgba(215,184,146,0.15),rgba(215,184,146,0.9),rgba(215,184,146,0.15))]" />
            <p className="mx-auto mt-8 max-w-4xl text-lg leading-9 text-white/74 sm:text-[1.15rem]">
              The wedding collection is built for couples who want more than a recap. It is where Sam Visual presents
              films, portraits, and keepsake moments with a cleaner editorial feel, so every piece still feels
              elevated years later.
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
        </div>
      </section>
    </PublicSiteShell>
  );
}
