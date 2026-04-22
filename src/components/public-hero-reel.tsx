"use client";

const heroVideoSrc = "/work-videos/website-hero.mp4";

export function PublicHeroReel() {
  return (
    <div className="h-full w-full">
      <video
        autoPlay
        className="h-full w-full object-cover"
        loop
        muted
        playsInline
        preload="metadata"
        src={heroVideoSrc}
      />
    </div>
  );
}
