"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export function PublicWeddingMontage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleSound = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);

    if (!nextMuted) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          video.muted = true;
          setIsMuted(true);
        });
      }
    }
  };

  return (
    <div className="mt-12 overflow-hidden border border-white/10 bg-[#101010] shadow-[0_26px_80px_rgba(0,0,0,0.28)]">
      <div className="relative aspect-video overflow-hidden bg-black">
        <video
          autoPlay
          className="h-full w-full object-cover"
          loop
          muted={isMuted}
          playsInline
          preload="auto"
          ref={videoRef}
          src="/work-videos/wedding-hero.mp4"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.04),rgba(8,8,8,0.12)_55%,rgba(8,8,8,0.4)_100%)]" />
        <button
          className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/18 bg-black/42 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-black/58 focus:outline-none focus:ring-2 focus:ring-white/70"
          onClick={toggleSound}
          type="button"
        >
          <span aria-hidden="true">{isMuted ? "Audio" : "Live"}</span>
          {isMuted ? "Sound on" : "Sound off"}
        </button>
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
