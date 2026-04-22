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
          aria-label={isMuted ? "Turn sound on" : "Turn sound off"}
          className="absolute left-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-black/42 text-white transition hover:bg-black/58 focus:outline-none focus:ring-2 focus:ring-white/70"
          onClick={toggleSound}
          type="button"
        >
          {isMuted ? (
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M11 5 6.8 8.5H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2.8L11 19a1 1 0 0 0 1.6-.8V5.8A1 1 0 0 0 11 5Z"
                fill="currentColor"
              />
              <path
                d="M16 9.5 21 14.5M21 9.5 16 14.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M11 5 6.8 8.5H4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2.8L11 19a1 1 0 0 0 1.6-.8V5.8A1 1 0 0 0 11 5Z"
                fill="currentColor"
              />
              <path
                d="M15.5 9.2a4.7 4.7 0 0 1 0 5.6M18.3 7a7.8 7.8 0 0 1 0 10"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
            </svg>
          )}
          <span className="sr-only">{isMuted ? "Sound off" : "Sound on"}</span>
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
