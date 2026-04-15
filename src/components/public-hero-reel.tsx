"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const heroReelSequence = [
  { src: "/work-videos/k-pop-eras.mov", durationMs: 10000 },
  { src: "/work-videos/lake-hickory-haunts-2026-promo.mov", durationMs: 15000 },
  { src: "/work-videos/horsepower-park.mov", durationMs: 5000 },
  { src: "/work-videos/jonas-ridge-snow-tubing.mp4", durationMs: 10000 },
  { src: "/work-videos/nightmare-factory-unleashed.mov", durationMs: 5000 },
  { src: "/work-videos/truly-ad.mp4", durationMs: 10000 },
  { src: "/work-videos/bulova-octava.mp4", durationMs: 15000 },
  { src: "/work-videos/edm-nights.mov", durationMs: 5000 },
  { src: "/work-videos/dreams-become-reality.mov", durationMs: 15000 },
  { src: "/work-videos/renowned-deck-building-game.mp4", durationMs: 10000 },
  { src: "/work-videos/lake-hickory-haunts-2026-promo.mov", durationMs: 5000 },
  { src: "/work-videos/k-pop-eras.mov", durationMs: 5000 },
  { src: "/work-videos/truly-ad.mp4", durationMs: 5000 },
  { src: "/work-videos/bulova-octava.mp4", durationMs: 10000 },
  { src: "/work-videos/nightmare-factory-unleashed.mov", durationMs: 10000 },
];

export function PublicHeroReel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeClip = useMemo(
    () => heroReelSequence[activeIndex] ?? heroReelSequence[0],
    [activeIndex],
  );

  function goToNextClip() {
    setActiveIndex((current) => (current + 1) % heroReelSequence.length);
  }

  useEffect(() => {
    const timer = window.setTimeout(goToNextClip, activeClip.durationMs);
    return () => window.clearTimeout(timer);
  }, [activeClip, activeClip.durationMs]);

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
        // Ignore autoplay interruptions from the browser.
      });
    }
  }, [activeClip]);

  return (
    <div className="h-full w-full">
      <video
        autoPlay
        className="h-full w-full object-cover"
        muted
        playsInline
        preload="auto"
        ref={videoRef}
        src={heroReelSequence[0].src}
      />
    </div>
  );
}
