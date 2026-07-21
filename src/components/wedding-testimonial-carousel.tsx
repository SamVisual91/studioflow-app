"use client";

import { MediaCarousel } from "@/components/media-carousel";
import type { WeddingTestimonial } from "@/lib/wedding-testimonials";

type WeddingTestimonialCarouselProps = {
  items: WeddingTestimonial[];
};

export function WeddingTestimonialCarousel({ items }: WeddingTestimonialCarouselProps) {
  return (
    <MediaCarousel itemCount={items.length}>
      {items.map((item) => (
        <article
          className="h-full overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] px-6 py-6 text-left"
          key={`${item.author}-${item.source}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d7b892]/78">
            5-star review | {item.source}
          </p>
          <p className="mt-5 text-base leading-8 text-white/76">&ldquo;{item.quote}&rdquo;</p>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-white/62">{item.author}</p>
        </article>
      ))}
    </MediaCarousel>
  );
}
