"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const weddingMontageSequence = [
  { src: "/work-videos/wedding-film-1.mov", durationMs: 6000, startAt: 0.08 },
  { src: "/work-videos/wedding-film-2.mov", durationMs: 8000, startAt: 0.48 },
  { src: "/work-videos/wedding-film-3.mov", durationMs: 5000, startAt: 0.76 },
  { src: "/work-videos/wedding-film-4.mov", durationMs: 7000, startAt: 0.16 },
  { src: "/work-videos/wedding-film-5.mp4", durationMs: 6000, startAt: 0.58 },
  { src: "/work-videos/wedding-film-6.mov", durationMs: 8000, startAt: 0.82 },
  { src: "/work-videos/wedding-film-7.mp4", durationMs: 5000, startAt: 0.26 },
  { src: "/work-videos/wedding-film-2.mov", durationMs: 6000, startAt: 0.14 },
  { src: "/work-videos/wedding-film-4.mov", durationMs: 5000, startAt: 0.62 },
  { src: "/work-videos/wedding-film-1.mov", durationMs: 7000, startAt: 0.71 },
  { src: "/work-videos/wedding-film-6.mov", durationMs: 6000, startAt: 0.34 },
  { src: "/work-videos/wedding-film-3.mov", durationMs: 8000, startAt: 0.52 },
];

export function PublicWeddingMontage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeClip = useMemo(
    () => weddingMontageSequence[activeIndex] ?? weddingMontageSequence[0],
    [activeIndex],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % weddingMontageSequence.length);
    }, activeClip.durationMs);

    return () => window.clearTimeout(timer);
  }, [activeClip]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const handleLoadedMetadata = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        return;
      }

      const desiredTime = Math.min(
        Math.max(video.duration * activeClip.startAt, 0),
        Math.max(video.duration - 0.35, 0),
      );

      if (Number.isFinite(desiredTime)) {
        video.currentTime = desiredTime;
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.src = activeClip.src;
    video.load();

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Ignore autoplay interruptions.
      });
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
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
          src={weddingMontageSequence[0].src}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.04),rgba(8,8,8,0.12)_55%,rgba(8,8,8,0.4)_100%)]" />
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
