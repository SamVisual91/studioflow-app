"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type WeddingVideoCarouselItem = {
  title: string;
  subtitle: string;
  eyebrow: string;
  detail: string;
  accentFrom: string;
  accentTo: string;
  posterSrc?: string;
  videoSrc?: string;
  youtubeEmbedSrc?: string;
};

type WeddingVideoCarouselProps = {
  items: WeddingVideoCarouselItem[];
};

export function WeddingVideoCarousel({ items }: WeddingVideoCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const activeItem = selectedIndex === null ? null : items[selectedIndex];
  const activeMediaType = useMemo(() => {
    if (!activeItem) {
      return null;
    }

    if (activeItem.youtubeEmbedSrc) {
      return "youtube";
    }

    if (activeItem.videoSrc) {
      return "video";
    }

    return null;
  }, [activeItem]);

  useEffect(() => {
    if (!activeItem) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [activeItem]);

  return (
    <>
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-max grid-flow-col gap-5 sm:gap-6 xl:gap-6">
          {items.map((item, index) => (
            <button
              className="group relative w-[18rem] overflow-hidden border border-white/12 bg-[#101010] text-left transition hover:border-white/26 sm:w-[20rem] xl:w-[15.9rem]"
              key={`${item.title}-${index}`}
              onClick={() => setSelectedIndex(index)}
              type="button"
            >
              <div className="relative aspect-[0.7] overflow-hidden">
                {item.posterSrc ? (
                  <Image
                    alt={item.title}
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    fill
                    sizes="(max-width: 640px) 78vw, (max-width: 1280px) 20rem, 16rem"
                    src={item.posterSrc}
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at top left, ${item.accentFrom}2e 0%, transparent 42%), radial-gradient(circle at bottom right, ${item.accentTo}28 0%, transparent 36%), linear-gradient(135deg, #111111 0%, #171717 50%, #0d0d0d 100%)`,
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.42),rgba(5,5,5,0.18)_28%,rgba(5,5,5,0.36)_62%,rgba(5,5,5,0.7)_100%)] transition duration-300 group-hover:bg-[linear-gradient(180deg,rgba(5,5,5,0.34),rgba(5,5,5,0.12)_28%,rgba(5,5,5,0.3)_62%,rgba(5,5,5,0.62)_100%)]" />
                <p className="font-cherie absolute left-5 top-5 pr-4 text-[1.1rem] uppercase tracking-[0.18em] text-[#f2e4cf] sm:text-[1.15rem]">
                  {item.title}
                </p>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/88 text-[#171515] shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition duration-300 group-hover:scale-105 group-hover:bg-white">
                    <svg aria-hidden="true" className="ml-1 h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="m7 5 8 5-8 5V5Z" />
                    </svg>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeItem ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(4,4,4,0.9)] px-4 py-6 backdrop-blur-md"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            aria-label="Close wedding video"
            className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-black/32 text-white transition hover:bg-black/52"
            onClick={() => setSelectedIndex(null)}
            type="button"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>

          <div
            className="w-full max-w-6xl overflow-hidden border border-white/10 bg-[linear-gradient(180deg,#090909,#121212)] shadow-[0_24px_90px_rgba(0,0,0,0.52)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 text-white">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/54">
                  {activeItem.eyebrow}
                </p>
                <h3 className="font-cherie mt-2 text-2xl uppercase leading-none tracking-[0.06em] sm:text-[2rem]">
                  {activeItem.title}
                </h3>
                <p className="mt-2 text-sm text-white/62">{activeItem.subtitle}</p>
              </div>
              <button
                className="inline-flex h-10 items-center justify-center border border-white/14 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:border-white/24 hover:text-white"
                onClick={() => setSelectedIndex(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="aspect-video w-full bg-black">
              {activeMediaType === "youtube" ? (
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={activeItem.youtubeEmbedSrc}
                  title={activeItem.title}
                />
              ) : activeMediaType === "video" ? (
                <video
                  autoPlay
                  className="h-full w-full bg-black object-contain"
                  controls
                  playsInline
                  src={activeItem.videoSrc}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/62">
                  Video source unavailable.
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-5 py-4 text-sm leading-7 text-white/68">
              {activeItem.detail}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
