"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type MediaCarouselProps = {
  children: ReactNode;
  className?: string;
  itemCount: number;
};

export function MediaCarousel({ children, className = "", itemCount }: MediaCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const shouldCarousel = itemCount > 3;
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(shouldCarousel);

  useEffect(() => {
    const track = trackRef.current;

    if (!track || !shouldCarousel) {
      return;
    }

    const updateControls = () => {
      const maxScrollLeft = track.scrollWidth - track.clientWidth;
      setCanScrollLeft(track.scrollLeft > 8);
      setCanScrollRight(maxScrollLeft - track.scrollLeft > 8);
    };

    updateControls();
    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);

    return () => {
      track.removeEventListener("scroll", updateControls);
      window.removeEventListener("resize", updateControls);
    };
  }, [shouldCarousel, itemCount]);

  function scrollTrack(direction: "left" | "right") {
    const track = trackRef.current;

    if (!track || !shouldCarousel) {
      return;
    }

    const firstCard = track.firstElementChild as HTMLElement | null;
    const gap = 16;
    const cardWidth = firstCard?.getBoundingClientRect().width ?? track.clientWidth * 0.84;

    track.scrollBy({
      left: direction === "right" ? cardWidth + gap : -(cardWidth + gap),
      behavior: "smooth",
    });
  }

  if (!shouldCarousel) {
    return (
      <div className={className}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          aria-label="Previous"
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur transition ${
            canScrollLeft
              ? "border-white/14 bg-[#141210]/88 text-white hover:bg-[#1b1816]"
              : "cursor-default border-white/8 bg-[#141210]/38 text-white/25"
          }`}
          disabled={!canScrollLeft}
          onClick={() => scrollTrack("left")}
          type="button"
        >
          <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          aria-label="Next"
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur transition ${
            canScrollRight
              ? "border-white/14 bg-[#141210]/88 text-white hover:bg-[#1b1816]"
              : "cursor-default border-white/8 bg-[#141210]/38 text-white/25"
          }`}
          disabled={!canScrollRight}
          onClick={() => scrollTrack("right")}
          type="button"
        >
          <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="relative">
        {canScrollLeft ? (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#11100f] via-[#11100f]/88 to-transparent" />
        ) : null}
        {canScrollRight ? (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#11100f] via-[#11100f]/88 to-transparent" />
        ) : null}

        <div
          ref={trackRef}
          className="no-scrollbar overflow-x-auto scroll-smooth pb-2"
        >
          <div className="grid grid-flow-col auto-cols-[85%] gap-4 snap-x snap-mandatory md:auto-cols-[calc((100%_-_1rem)/2)] xl:auto-cols-[calc((100%_-_2rem)/3)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
