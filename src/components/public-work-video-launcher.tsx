"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export function PublicWorkVideoLauncher({
  title,
  posterSrc,
  videoSrc,
  youtubeEmbedSrc,
}: {
  title: string;
  posterSrc: string;
  videoSrc?: string;
  youtubeEmbedSrc?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaType = useMemo(() => {
    if (youtubeEmbedSrc) {
      return "youtube";
    }

    if (videoSrc) {
      return "video";
    }

    return null;
  }, [videoSrc, youtubeEmbedSrc]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isPlaying]);

  return (
    <>
      <div className="mt-12 overflow-hidden border border-white/10 bg-[#0f0f0f] shadow-[0_26px_80px_rgba(0,0,0,0.3)]">
        <div className="relative aspect-[16/9]">
          <Image alt={title} className="h-full w-full object-cover" fill priority src={posterSrc} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.1),rgba(8,8,8,0.28)_48%,rgba(8,8,8,0.74)_100%)]" />
          <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-end justify-between gap-6 p-6 sm:p-8">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-white/56">
                Featured Presentation
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Case study preview</h2>
            </div>
            {mediaType ? (
              <button
                className="inline-flex items-center gap-3 border border-white/18 bg-black/35 px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/82 backdrop-blur transition hover:border-white/28 hover:bg-black/50"
                onClick={() => setIsPlaying(true)}
                type="button"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-lg">
                  ▶
                </span>
                Project spotlight
              </button>
            ) : (
              <div className="inline-flex items-center gap-3 border border-white/14 bg-black/25 px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/54 backdrop-blur">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-white/14 bg-white/5 text-lg">
                  •
                </span>
                Visual preview
              </div>
            )}
          </div>
        </div>
      </div>

      {isPlaying && mediaType ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(4,4,4,0.9)] px-4 py-6 backdrop-blur-md"
          onClick={() => setIsPlaying(false)}
        >
          <button
            aria-label="Close featured project video"
            className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-black/32 text-white transition hover:bg-black/52"
            onClick={() => setIsPlaying(false)}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
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
                  Featured Presentation
                </p>
                <h3 className="mt-2 font-display text-2xl leading-none sm:text-[2rem]">{title}</h3>
              </div>
              <button
                className="inline-flex h-10 items-center justify-center border border-white/14 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:border-white/24 hover:text-white"
                onClick={() => setIsPlaying(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="aspect-video w-full bg-black">
              {mediaType === "youtube" ? (
                <iframe
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                  referrerPolicy="strict-origin-when-cross-origin"
                  src={youtubeEmbedSrc}
                  title={title}
                />
              ) : (
                <video
                  autoPlay
                  className="h-full w-full bg-black object-contain"
                  controls
                  playsInline
                  src={videoSrc}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
