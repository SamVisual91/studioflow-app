"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type PhotographyLightboxCarouselProps = {
  images: string[];
};

export function PhotographyLightboxCarousel({ images }: PhotographyLightboxCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedIndex(null);
        return;
      }

      if (event.key === "ArrowRight") {
        setSelectedIndex((current) => (current === null ? current : (current + 1) % images.length));
      }

      if (event.key === "ArrowLeft") {
        setSelectedIndex((current) => (current === null ? current : (current - 1 + images.length) % images.length));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [images.length, selectedIndex]);

  const activeImage = selectedIndex === null ? null : images[selectedIndex];

  const scrollByAmount = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollBy({
      left: direction === "left" ? -632 : 632,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div className="mt-10">
        <div className="mb-5 flex items-center justify-end gap-3">
          <button
            aria-label="Scroll photography gallery left"
            className="inline-flex h-11 w-11 items-center justify-center border border-white/14 bg-[#101010] text-white transition hover:border-white/24 hover:bg-white/[0.06]"
            onClick={() => scrollByAmount("left")}
            type="button"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            aria-label="Scroll photography gallery right"
            className="inline-flex h-11 w-11 items-center justify-center border border-white/14 bg-[#101010] text-white transition hover:border-white/24 hover:bg-white/[0.06]"
            onClick={() => scrollByAmount("right")}
            type="button"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto pb-3 scrollbar-hide" ref={scrollContainerRef}>
          <div className="grid min-w-max auto-cols-[300px] grid-flow-col grid-rows-2 auto-rows-[600px] gap-4">
            {images.map((photo, index) => (
              <button
                className="snap-start overflow-hidden border border-white/10 bg-[#101010] text-left transition hover:border-white/22"
                key={photo}
                onClick={() => setSelectedIndex(index)}
                type="button"
              >
                <div className="relative h-[600px] w-[300px]">
                  <Image
                    alt={`Photography showcase ${index + 1}`}
                    className="object-cover"
                    fill
                    quality={100}
                    sizes="300px"
                    src={photo}
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-black/6 transition hover:bg-black/10" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeImage ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/88 px-4 py-6 backdrop-blur-sm">
          <button
            aria-label="Close full photo"
            className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-black/32 text-white transition hover:bg-black/52"
            onClick={() => setSelectedIndex(null)}
            type="button"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>

          {images.length > 1 ? (
            <button
              aria-label="Previous photo"
              className="absolute left-5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-black/32 text-white transition hover:bg-black/52"
              onClick={() => setSelectedIndex((current) => (current === null ? current : (current - 1 + images.length) % images.length))}
              type="button"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          ) : null}

          <div className="relative h-[82vh] w-full max-w-6xl">
            <Image
              alt="Expanded photography showcase"
              className="object-contain"
              fill
              priority
              quality={100}
              sizes="100vw"
              src={activeImage}
              unoptimized
            />
          </div>

          {images.length > 1 ? (
            <button
              aria-label="Next photo"
              className="absolute right-5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-black/32 text-white transition hover:bg-black/52"
              onClick={() => setSelectedIndex((current) => (current === null ? current : (current + 1) % images.length))}
              type="button"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
