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
  const [isPaused, setIsPaused] = useState(false);

  function getStepSize(track: HTMLDivElement) {
    const firstCard = track.firstElementChild as HTMLElement | null;
    const gap = 16;
    const cardWidth = firstCard?.getBoundingClientRect().width ?? track.clientWidth * 0.84;
    return cardWidth + gap;
  }

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

    const maxScrollLeft = Math.max(track.scrollWidth - track.clientWidth, 0);
    const stepSize = getStepSize(track);
    const atStart = track.scrollLeft <= 8;
    const atEnd = maxScrollLeft - track.scrollLeft <= 8;

    if (direction === "right" && atEnd) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }

    if (direction === "left" && atStart) {
      track.scrollTo({ left: maxScrollLeft, behavior: "smooth" });
      return;
    }

    track.scrollBy({
      left: direction === "right" ? stepSize : -stepSize,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    const track = trackRef.current;

    if (!track || !shouldCarousel || isPaused) {
      return;
    }

    const timer = window.setInterval(() => {
      const maxScrollLeft = Math.max(track.scrollWidth - track.clientWidth, 0);
      const atEnd = maxScrollLeft - track.scrollLeft <= 8;

      if (atEnd) {
        track.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      track.scrollBy({ left: getStepSize(track), behavior: "smooth" });
    }, 3000);

    return () => window.clearInterval(timer);
  }, [isPaused, shouldCarousel, itemCount]);

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
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/14 bg-[#141210]/88 text-white backdrop-blur transition hover:bg-[#1b1816] focus:outline-none focus:ring-2 focus:ring-white/60"
          onClick={() => scrollTrack("left")}
          type="button"
        >
          <svg aria-hidden="true" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          aria-label="Next"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/14 bg-[#141210]/88 text-white backdrop-blur transition hover:bg-[#1b1816] focus:outline-none focus:ring-2 focus:ring-white/60"
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
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
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
