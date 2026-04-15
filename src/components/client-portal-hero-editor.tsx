"use client";

import { useEffect, useRef, useState } from "react";
import { updateClientPortalHeroAction } from "@/app/actions";

type ClientPortalHeroEditorProps = {
  location?: string;
  portalCover: string;
  portalIntro: string;
  portalTitle: string;
  projectDateLabel?: string;
  projectId: string;
  projectType: string;
  returnPath: string;
};

export function ClientPortalHeroEditor({
  location,
  portalCover,
  portalIntro,
  portalTitle,
  projectDateLabel,
  projectId,
  projectType,
  returnPath,
}: ClientPortalHeroEditorProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [previewCover, setPreviewCover] = useState(portalCover);

  useEffect(() => {
    setPreviewCover(portalCover);
  }, [portalCover]);

  useEffect(() => {
    return () => {
      if (previewCover.startsWith("blob:")) {
        URL.revokeObjectURL(previewCover);
      }
    };
  }, [previewCover]);

  return (
    <form action={updateClientPortalHeroAction} encType="multipart/form-data" ref={formRef}>
      <input name="projectId" type="hidden" value={projectId} />
      <input name="portalCover" type="hidden" value={portalCover} />
      <input name="returnPath" type="hidden" value={returnPath} />
      <div
        className="bg-cover bg-center px-6 py-12 sm:px-8"
        style={{
          backgroundImage: `linear-gradient(135deg,rgba(19,18,22,0.88),rgba(207,114,79,0.34)),url('${previewCover}')`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-white/68">StudioFlow Client Portal</p>
          <label className="cursor-pointer rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/20">
            Change top banner
            <input
              accept="image/*"
              className="sr-only"
              name="portalCoverFile"
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
            aria-label="Portal header title"
            className="w-full max-w-4xl border-0 bg-transparent p-0 font-display text-[50px] font-black leading-[0.92] tracking-[-0.05em] text-white outline-none placeholder:text-white/45"
            defaultValue={portalTitle}
            name="portalTitle"
            onBlur={() => formRef.current?.requestSubmit()}
            required
          />
        </label>
        <label className="mt-6 grid gap-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/58">
            Sub-text
          </span>
          <textarea
            aria-label="Portal header intro"
            className="min-h-20 w-full max-w-3xl resize-none border-0 bg-transparent p-0 text-base font-medium leading-7 text-white/72 outline-none placeholder:text-white/45"
            defaultValue={portalIntro}
            name="portalIntro"
            onBlur={() => formRef.current?.requestSubmit()}
          />
        </label>
        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-semibold text-white/85">
          <span className="rounded-full border border-white/14 bg-white/10 px-4 py-2">
            {String(projectType || "Project")}
          </span>
          {projectDateLabel ? (
            <span className="rounded-full border border-white/14 bg-white/10 px-4 py-2">
              {projectDateLabel}
            </span>
          ) : null}
          {location ? (
            <span className="rounded-full border border-white/14 bg-white/10 px-4 py-2">
              {location}
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}
