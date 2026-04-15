"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const montageSequence = [
  { src: "/work-videos/k-pop-eras.mov", durationMs: 10000 },
  { src: "/work-videos/lake-hickory-haunts-2026-promo.mov", durationMs: 15000 },
  { src: "/work-videos/horsepower-park.mov", durationMs: 5000 },
  { src: "/work-videos/jonas-ridge-snow-tubing.mp4", durationMs: 10000 },
  { src: "/work-videos/nightmare-factory-unleashed.mov", durationMs: 5000 },
  { src: "/work-videos/truly-ad.mp4", durationMs: 10000 },
  { src: "/work-videos/bulova-octava.mp4", durationMs: 15000 },
  { src: "/work-videos/dreams-become-reality.mov", durationMs: 15000 },
  { src: "/work-videos/renowned-deck-building-game.mp4", durationMs: 10000 },
];

export function PublicVideoProductionMontage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeClip = useMemo(
    () => montageSequence[activeIndex] ?? montageSequence[0],
    [activeIndex],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % montageSequence.length);
    }, activeClip.durationMs);

    return () => window.clearTimeout(timer);
  }, [activeClip]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.src = activeClip.src;
    video.load();

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Ignore autoplay interruptions.
      });
    }
  }, [activeClip]);

  return (
    <div className="mt-12 overflow-hidden border border-white/10 bg-[#101010] shadow-[0_26px_80px_rgba(0,0,0,0.28)]">
      <div className="relative aspect-video overflow-hidden bg-black">
        <video
          autoPlay
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          ref={videoRef}
          src={montageSequence[0].src}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,6,6,0.05),rgba(6,6,6,0.12)_55%,rgba(6,6,6,0.42)_100%)]" />

        <div className="pointer-events-none absolute bottom-4 right-4 flex items-end gap-3">
          <Image
            alt="Filmchaser watermark"
            className="h-auto w-[5.5rem] object-contain opacity-80 brightness-0 invert"
            height={241}
            src="/brand/filmchaser.png"
            width={1024}
          />
          <span className="pb-[1px] text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-white/74">
            Sam Visual
          </span>
        </div>
      </div>
    </div>
  );
}
