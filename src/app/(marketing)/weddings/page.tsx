import { PhotographyLightboxCarousel } from "@/components/photography-lightbox-carousel";
import { PublicSiteShell } from "@/components/public-site-shell";

const photographyServices = [
  "Website Photography",
  "E-Commerce Product Photography",
  "Lifestyle Photography",
  "Team Headshots",
  "Branded Content Photography",
  "Editorial Photography",
  "Commercial Photography",
  "Advertising Photography",
  "Event Photography",
];

const showcasePhotos = [
  "/brand/photography-watermarked-1.jpg",
  "/brand/photography-watermarked-3.jpg",
  "/brand/photography-gallery-sunset-portrait.png",
  "/brand/photography-gallery-black-swimwear.jpg",
  "/brand/photography-carousel-01.png",
  "/brand/photography-carousel-02.png",
  "/brand/photography-carousel-03.png",
  "/brand/samvisual-enhanced-portrait.png",
  "/brand/photography-carousel-04.png",
  "/brand/photography-carousel-05.png",
  "/brand/wedding-gallery-bride-bouquet.png",
  "/brand/wedding-gallery-portrait-soft.png",
  "/brand/wedding-gallery-close-veil.png",
  "/brand/loaded-fries-steak-slaw.png",
  "/brand/cheeseburger-crispy-bacon.png",
  "/brand/smoked-brisket-sides.png",
  "/brand/truly-flavor-explosion.png",
  "/brand/bulova-octava-luxury-gold.png",
  "/brand/whiskey-elegance-smoky-glow.png",
  "/brand/applying-cherry-red-wrap.png",
  "/brand/wrapping-gtr-satin-black.png",
  "/brand/wedding-gallery-full-train.png",
  "/brand/wedding-gallery-vineyard-embrace.png",
  "/brand/construction-forest-progress.png",
  "/brand/construction-aerial-site.png",
  "/brand/construction-lush-landscape-house.png",
  "/brand/focused-worker-cutting-pipe.png",
  "/brand/lhh-thumbnail-clean.jpg",
  "/brand/eerie-face-green-light.png",
];

export default function WeddingsPage() {
  return (
    <PublicSiteShell currentNavKey="photography" currentPath="/weddings">
      <section className="bg-[#141414] py-16 text-white sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-white/48">Photography</p>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Marketing, Brand &amp;
              <br />
              Commercial Photography
            </h1>
            <div className="mx-auto mt-8 h-px w-44 bg-[#8fb3a6]" />
            <p className="mx-auto mt-8 max-w-5xl text-lg leading-10 text-white/78">
              When it comes to your brand, consistency matters, and that starts with the visuals people see first.
              Sam Visual creates high-end photography for brands, campaigns, websites, social media, and client-facing
              marketing so your business feels more polished, more current, and more aligned across every platform.
            </p>
          </div>

          <div className="mt-12 grid gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
            {photographyServices.map((service) => (
              <div className="flex items-start gap-4" key={service}>
                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center text-[#8fb3a6]">
                  <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M5.75 6.75h12.5v10.5H5.75zM8.75 3.75v3M15.25 3.75v3M8 11.75h8M12 7.75v8"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.2"
                    />
                  </svg>
                </span>
                <p className="text-lg font-semibold leading-snug text-white">{service}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#141414] pb-20 text-white">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="border-t border-white/8 pt-12">
            <PhotographyLightboxCarousel images={showcasePhotos} />
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
