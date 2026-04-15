"use client";

import { useEffect, useRef, useState } from "react";
import { updateProjectDeliverablesGalleryAction } from "@/app/actions";

type MediaGalleryBannerEditorProps = {
  galleryCover: string;
  galleryIntro: string;
  galleryTitle: string;
  lockedCount: number;
  photoCount: number;
  projectId: string;
  returnPath: string;
  unlockedCount: number;
};

export function MediaGalleryBannerEditor({
  galleryCover,
  galleryIntro,
  galleryTitle,
  lockedCount,
  photoCount,
  projectId,
  returnPath,
  unlockedCount,
}: MediaGalleryBannerEditorProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [previewCover, setPreviewCover] = useState(galleryCover);

  useEffect(() => {
    setPreviewCover(galleryCover);
  }, [galleryCover]);

  useEffect(() => {
    return () => {
      if (previewCover.startsWith("blob:")) {
        URL.revokeObjectURL(previewCover);
      }
    };
  }, [previewCover]);

  return (
    <form action={updateProjectDeliverablesGalleryAction} encType="multipart/form-data" ref={formRef}>
      <input name="projectId" type="hidden" value={projectId} />
      <input name="galleryCover" type="hidden" value={galleryCover} />
      <input name="returnPath" type="hidden" value={returnPath} />
      <div
        className="bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(90deg,rgba(12,11,10,0.94),rgba(12,11,10,0.58),rgba(12,11,10,0.18)),url('${previewCover}')`,
        }}
      >
        <div className="px-6 py-12 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Media Gallery</p>
            <label className="cursor-pointer rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/20">
              Change media banner
              <input
                accept="image/*"
                className="sr-only"
                name="galleryCoverFile"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (!file) {
                    return;
                  }

                  const objectUrl = URL.createObjectURL(file);
                  setPreviewCover((current) => {
                    if (current.startsWith("blob:")) {
                      URL.revokeObjectURL(current);
                    }
                    return objectUrl;
                  });
                  formRef.current?.requestSubmit();
                }}
                type="file"
              />
            </label>
          </div>
          <label className="mt-6 grid gap-2">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/58">
              Header text
            </span>
            <input
              aria-label="Gallery title"
              className="w-full max-w-3xl border-0 bg-transparent p-0 font-display text-[50px] font-black leading-[0.92] tracking-[-0.05em] text-white outline-none placeholder:text-white/45"
              defaultValue={galleryTitle}
              name="galleryTitle"
              onBlur={() => formRef.current?.requestSubmit()}
              required
            />
          </label>
          <label className="mt-6 grid gap-2">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/58">
              Sub-text
            </span>
            <textarea
              aria-label="Gallery intro"
              className="min-h-20 w-full max-w-2xl resize-none border-0 bg-transparent p-0 text-base font-medium leading-7 text-white/72 outline-none placeholder:text-white/45"
              defaultValue={galleryIntro}
              name="galleryIntro"
              onBlur={() => formRef.current?.requestSubmit()}
            />
          </label>
          <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
            <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
              {unlockedCount} unlocked
            </span>
            <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
              {photoCount} galleries
            </span>
            <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
              {lockedCount} locked
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
