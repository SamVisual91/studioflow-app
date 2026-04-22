"use client";

import Image from "next/image";

export function PublicWeddingMontage() {
  return (
    <div className="mt-12 overflow-hidden border border-white/10 bg-[#101010] shadow-[0_26px_80px_rgba(0,0,0,0.28)]">
      <div className="relative aspect-video overflow-hidden bg-black">
        <video
          autoPlay
          className="h-full w-full object-cover"
          loop
          muted
          playsInline
          preload="auto"
          src="/work-videos/wedding-hero.mp4"
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
