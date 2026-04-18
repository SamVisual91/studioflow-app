"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { MediaCarousel } from "@/components/media-carousel";

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
      <MediaCarousel className="mt-10" itemCount={items.length}>
        {items.map((item, index) => (
          <button
            className="group snap-start overflow-hidden border border-white/10 bg-[#101010] text-left transition hover:border-white/22"
            key={`${item.title}-${index}`}
            onClick={() => setSelectedIndex(index)}
            type="button"
          >
            <div className="relative aspect-video overflow-hidden">
              {item.posterSrc ? (
                <Image
                  alt={item.title}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 85vw, (max-width: 1280px) 50vw, 33vw"
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
              <div
                className="absolute inset-0 opacity-90 transition duration-300 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(180deg, rgba(8,8,8,0.08) 0%, rgba(8,8,8,0.24) 34%, rgba(8,8,8,0.74) 68%, rgba(8,8,8,0.94) 100%), linear-gradient(135deg, ${item.accentFrom}88 0%, transparent 42%, ${item.accentTo}60 100%)`,
                }}
              />
              <div
                className="absolute inset-x-0 top-0 h-1 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: `linear-gradient(90deg, ${item.accentFrom}, ${item.accentTo})` }}
              />
              <div className="absolute left-4 top-4 max-w-[75%]">
                <p className="inline-flex border border-white/16 bg-black/28 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-white/84 backdrop-blur-sm sm:text-[10px]">
                  {item.eyebrow}
                </p>
              </div>
              <div className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-black/30 text-white backdrop-blur transition duration-300 group-hover:scale-105 group-hover:bg-black/42">
                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="m7 5 8 5-8 5V5Z" />
                </svg>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(8,8,8,0),rgba(8,8,8,0.78)_65%,rgba(8,8,8,0.96)_100%)]" />
            </div>
            <div className="space-y-3 px-5 pb-5 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/56">{item.subtitle}</p>
              <h3 className="font-display text-[1.9rem] leading-none text-white sm:text-[2rem]">{item.title}</h3>
              <p className="max-w-[24rem] text-sm leading-6 text-white/70">{item.detail}</p>
              <div className="flex items-center gap-3 pt-1">
                <span
                  aria-hidden="true"
                  className="h-px w-14"
                  style={{ background: `linear-gradient(90deg, ${item.accentFrom}, ${item.accentTo})` }}
                />
                <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/52">Play film</span>
              </div>
            </div>
          </button>
        ))}
      </MediaCarousel>

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
                <h3 className="mt-2 font-display text-2xl leading-none sm:text-[2rem]">{activeItem.title}</h3>
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
