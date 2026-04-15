"use client";

import Image from "next/image";
import { useState } from "react";

export function PublicWorkVideoLauncher({
  title,
  posterSrc,
  videoSrc,
}: {
  title: string;
  posterSrc: string;
  videoSrc?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="mt-12 overflow-hidden border border-white/10 bg-[#0f0f0f] shadow-[0_26px_80px_rgba(0,0,0,0.3)]">
      <div className="relative aspect-[16/9]">
        {isPlaying && videoSrc ? (
          <video
            autoPlay
            className="h-full w-full bg-black object-cover"
            controls
            playsInline
            src={videoSrc}
          />
        ) : (
          <>
            <Image alt={title} className="h-full w-full object-cover" fill priority src={posterSrc} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.1),rgba(8,8,8,0.28)_48%,rgba(8,8,8,0.74)_100%)]" />
            <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-end justify-between gap-6 p-6 sm:p-8">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-white/56">Featured Presentation</p>
                <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Case study preview</h2>
              </div>
              {videoSrc ? (
                <button
                  className="inline-flex items-center gap-3 border border-white/18 bg-black/35 px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/82 backdrop-blur transition hover:border-white/28 hover:bg-black/50"
                  onClick={() => setIsPlaying(true)}
                  type="button"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-lg">▶</span>
                  Project spotlight
                </button>
              ) : (
                <div className="inline-flex items-center gap-3 border border-white/14 bg-black/25 px-5 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/54 backdrop-blur">
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-white/14 bg-white/5 text-lg">•</span>
                  Visual preview
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
