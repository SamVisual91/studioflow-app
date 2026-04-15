import Image from "next/image";
import Link from "next/link";

function PreviewShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-white/10 bg-[#111111] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-6">
      <div className="flex items-center justify-between border-b border-white/8 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#d5b890]/72">{eyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="h-3 w-3 rounded-full bg-[#ec8a71]" />
          <span className="h-3 w-3 rounded-full bg-[#d8b46d]" />
          <span className="h-3 w-3 rounded-full bg-[#7aa792]" />
        </div>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-white/64 sm:text-base">{description}</p>
      <div className="mt-6 overflow-hidden border border-white/8 bg-[#171717]">{children}</div>
    </section>
  );
}

function MiniNav() {
  const items = ["Video Production", "Photography", "Wedding", "Social Media", "Our Work", "About"];

  return (
    <div className="flex items-center justify-between border-b border-white/8 bg-[#141414] px-5 py-4 text-white">
      <div className="text-lg font-black uppercase tracking-[0.12em]">Filmchaser</div>
      <div className="hidden items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72 lg:flex">
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="border border-[#cf8628] bg-[#cf8628] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#16120e]">
        Contact Us
      </div>
    </div>
  );
}

const logoStrip = [
  "/brand/bulova-logo.png",
  "/brand/jonas-ridge-logo-new.png",
  "/brand/cvcc-logo.png",
  "/brand/truly-logo.png",
];

const weddingFilms = [
  { title: "Eloise + Ken", src: "/brand/eloise-ken-wedding-thumbnail.png" },
  { title: "Karina + Justin", src: "/brand/karina-justin-wedding-thumbnail.png" },
  { title: "Lauren + Aaron", src: "/brand/lauren-aaron-wedding-thumbnail.png" },
];

const weddingPhotos = [
  "/brand/wedding-photo-1.png",
  "/brand/wedding-gallery-vineyard-embrace.png",
  "/brand/wedding-gallery-close-veil.png",
  "/brand/wedding-photo-6.png",
];

const productionServices = [
  "Marketing Videos",
  "Documentaries",
  "Corporate Videos",
  "TV Commercials",
  "Short Films",
  "Product Demos",
];

export default function SquarespacePreviewPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <section className="border-b border-white/8 bg-[radial-gradient(circle_at_top,rgba(208,160,99,0.18),transparent_34%),linear-gradient(180deg,#141414,#0f0f0f)] py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.38em] text-[#d5b890]/72">Squarespace Preview</p>
          <h1 className="mt-6 max-w-5xl text-balance font-display text-5xl leading-[0.95] text-white sm:text-6xl lg:text-7xl">
            A visual direction for how the public website could feel once it is rebuilt on Squarespace.
          </h1>
          <p className="mt-8 max-w-4xl text-lg leading-9 text-white/68">
            This preview is focused on the public-facing side only. It keeps the darker cinematic style, cleaner
            page structure, and premium presentation while separating it from the app and client portal system.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="border border-[#cf8628] bg-[#cf8628] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#16120e] transition hover:brightness-110"
              href="/home"
            >
              Back To Home
            </Link>
            <Link
              className="border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/[0.08]"
              href="/contact"
            >
              Start Inquiry
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-12 sm:px-8 sm:py-14">
        <PreviewShell
          eyebrow="Homepage"
          title="Business-Facing Home"
          description="A darker, cleaner landing page with a full-width video hero, logo credibility strip, grouped work categories, and a stronger call-to-action path."
        >
          <MiniNav />
          <div className="bg-[#111111]">
            <div className="relative min-h-[28rem] overflow-hidden">
              <video
                autoPlay
                className="absolute inset-0 h-full w-full object-cover"
                loop
                muted
                playsInline
                src="/brand/splash-hero.mp4"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,12,12,0.28),rgba(12,12,12,0.58)_42%,rgba(12,12,12,0.92))]" />
              <div className="relative flex min-h-[28rem] flex-col items-center justify-end px-6 pb-14 text-center sm:px-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/56">Hickory, North Carolina</p>
                <h3 className="mt-6 max-w-4xl text-balance text-4xl font-semibold uppercase leading-[0.95] text-white sm:text-6xl">
                  We Are Storytellers
                </h3>
                <div className="mt-6 h-px w-32 bg-[#8ea89b]" />
                <p className="mt-6 max-w-3xl text-base leading-8 text-white/76 sm:text-lg">
                  Cinematic visuals for brands, campaigns, launches, events, and stories that need stronger presence.
                </p>
              </div>
            </div>

            <div className="border-t border-white/8 px-6 py-10 sm:px-10">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.34em] text-white/42">Trusted By</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {logoStrip.map((logo) => (
                  <div className="flex min-h-16 items-center justify-center bg-white/[0.02] px-4 py-3" key={logo}>
                    <Image
                      alt=""
                      className="h-auto w-full max-w-[8rem] object-contain brightness-0 invert"
                      height={120}
                      src={logo}
                      width={320}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 border-t border-white/8 px-6 py-10 sm:px-10 lg:grid-cols-2">
              {[
                { title: "Attractions & Destination Campaigns", src: "/brand/lake-hickory-haunts-horror-entrance.png" },
                { title: "Brand Launches & Commercials", src: "/brand/bulova-octava-thumbnail.png" },
                { title: "Sports, Events & Community", src: "/brand/kpop-eras-night-thumbnail.png" },
                { title: "Portraits, Editorial & Keepsakes", src: "/brand/megan-portrait-thumbnail.png" },
              ].map((item) => (
                <div className="group relative min-h-[15rem] overflow-hidden" key={item.title}>
                  <Image alt={item.title} className="absolute inset-0 h-full w-full object-cover" height={900} src={item.src} width={1400} />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.16),rgba(8,8,8,0.78))]" />
                  <div className="relative flex min-h-[15rem] items-end px-5 py-5">
                    <p className="text-xl font-semibold text-white">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PreviewShell>

        <PreviewShell
          eyebrow="Wedding"
          title="Wedding Collection"
          description="A more editorial wedding page with a refined montage, curated film row, and warm portrait gallery presentation tailored for couples."
        >
          <MiniNav />
          <div className="bg-[#121212]">
            <div className="border-b border-white/8 px-6 py-10 text-center sm:px-10 sm:py-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/72">Wedding</p>
              <h3 className="mx-auto mt-5 max-w-4xl text-balance text-4xl font-semibold leading-[0.98] text-white sm:text-5xl">
                Wedding films and imagery designed to feel heirloom, cinematic, and emotionally true.
              </h3>
            </div>

            <div className="px-6 py-8 sm:px-10">
              <div className="overflow-hidden border border-white/8 bg-black">
                <video
                  autoPlay
                  className="aspect-[16/7] w-full object-cover"
                  loop
                  muted
                  playsInline
                  src="/work-videos/eloise-ken-wedding.mov"
                />
              </div>
            </div>

            <div className="grid gap-6 border-t border-white/8 px-6 py-10 sm:px-10 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Wedding Films</p>
                    <h4 className="mt-3 text-3xl font-semibold text-white">Curated film collection</h4>
                  </div>
                  <span className="border border-[#d7b892]/34 bg-[#d7b892]/8 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
                    Inquire About Packages
                  </span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {weddingFilms.map((film) => (
                    <div className="overflow-hidden border border-white/8 bg-white/[0.02]" key={film.title}>
                      <div className="relative aspect-[4/5]">
                        <Image alt={film.title} className="h-full w-full object-cover" fill src={film.src} />
                      </div>
                      <div className="px-4 py-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white">{film.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Wedding Photos</p>
                    <h4 className="mt-3 text-3xl font-semibold text-white">Gallery preview</h4>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {weddingPhotos.map((photo) => (
                    <div className="relative aspect-[3/4] overflow-hidden border border-white/8 bg-white/[0.02]" key={photo}>
                      <Image alt="" className="h-full w-full object-cover" fill src={photo} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </PreviewShell>

        <PreviewShell
          eyebrow="Video Production"
          title="Commercial Video Page"
          description="A clearer service page with a top montage, cleaner offer list, and polished production process section designed to translate well into Squarespace blocks."
        >
          <MiniNav />
          <div className="bg-[#121212]">
            <div className="border-b border-white/8 px-6 py-10 text-center sm:px-10 sm:py-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/48">Video Production</p>
              <h3 className="mx-auto mt-5 max-w-4xl text-balance text-4xl font-semibold leading-[1] text-white sm:text-5xl">
                Cinematic video production for brands, campaigns, events, and story-driven work.
              </h3>
              <div className="mx-auto mt-6 h-px w-32 bg-[#8ea89b]" />
            </div>

            <div className="px-6 py-8 sm:px-10">
              <div className="overflow-hidden border border-white/8 bg-black">
                <video
                  autoPlay
                  className="aspect-[16/7] w-full object-cover"
                  loop
                  muted
                  playsInline
                  src="/work-videos/bulova-octava.mov"
                />
              </div>
            </div>

            <div className="grid gap-x-8 gap-y-6 border-t border-white/8 px-6 py-10 sm:grid-cols-2 sm:px-10 lg:grid-cols-3">
              {productionServices.map((service) => (
                <div className="border border-white/8 bg-white/[0.02] px-5 py-5" key={service}>
                  <p className="text-xl font-semibold text-white">{service}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-5 border-t border-white/8 px-6 py-10 sm:px-10 lg:grid-cols-3">
              {[
                "Top-of-the-Line Equipment",
                "Multi-Purpose Content",
                "Deep Production Experience",
                "Pre-Production",
                "Project Management",
                "Post Production",
              ].map((item) => (
                <div className="border border-white/8 bg-white/[0.02] px-5 py-6" key={item}>
                  <p className="text-2xl font-semibold text-white">{item}</p>
                  <p className="mt-3 text-sm leading-7 text-white/64">
                    Clean layout, short supporting copy, and a structure that translates naturally into Squarespace cards.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </PreviewShell>
      </div>
    </div>
  );
}
