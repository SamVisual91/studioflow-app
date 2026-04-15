"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { updateProjectHeroBannerAction } from "@/app/actions";
import { useRouter } from "next/navigation";

type ProjectHeroBannerEditorProps = {
  clientName: string;
  description: string;
  fallbackCover: string;
  initialCoverImage?: string;
  initialCoverPosition?: string;
  projectDateLabel?: string;
  projectId: string;
  projectType: string;
};

export function ProjectHeroBannerEditor({
  clientName,
  description,
  fallbackCover,
  initialCoverImage = "",
  initialCoverPosition = "50% 50%",
  projectDateLabel,
  projectId,
  projectType,
}: ProjectHeroBannerEditorProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPositionX: number;
    startPositionY: number;
  } | null>(null);
  const lastSavedPositionRef = useRef(initialCoverPosition);
  const [coverImage, setCoverImage] = useState(initialCoverImage);
  const [coverPosition, setCoverPosition] = useState(initialCoverPosition);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (coverImage.startsWith("blob:")) {
        URL.revokeObjectURL(coverImage);
      }
    };
  }, [coverImage]);

  const hasCustomCover = Boolean(coverImage);
  const backgroundStyle = {
    backgroundImage: `url(${coverImage || fallbackCover})`,
    backgroundPosition: hasCustomCover ? coverPosition : "50% 50%",
  };

  function persistBanner(nextPosition: string, file?: File) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("coverPosition", nextPosition);
      if (file) {
        formData.set("coverFile", file);
      }
      await updateProjectHeroBannerAction(formData);
      lastSavedPositionRef.current = nextPosition;
      router.refresh();
    });
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!hasCustomCover) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("[data-no-hero-drag='true']")) {
      return;
    }

    const [currentX = "50%", currentY = "50%"] = coverPosition.split(" ");
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPositionX: Number(currentX.replace("%", "") || 50),
      startPositionY: Number(currentY.replace("%", "") || 50),
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = ((event.clientX - drag.startX) / Math.max(event.currentTarget.clientWidth, 1)) * 100;
    const deltaY = ((event.clientY - drag.startY) / Math.max(event.currentTarget.clientHeight, 1)) * 100;
    const nextX = Math.min(100, Math.max(0, drag.startPositionX + deltaX));
    const nextY = Math.min(100, Math.max(0, drag.startPositionY + deltaY));

    setCoverPosition(`${nextX}% ${nextY}%`);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (hasCustomCover && coverPosition !== lastSavedPositionRef.current) {
        persistBanner(coverPosition);
      }
    }
  }

  return (
    <div>
      <div
        className={`relative overflow-hidden rounded-[2rem] border border-black/[0.08] bg-cover shadow-[0_28px_80px_rgba(59,36,17,0.16)] ${
          hasCustomCover ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        }`}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={backgroundStyle}
      >
        <input
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            const objectUrl = URL.createObjectURL(file);
            setCoverImage((current) => {
              if (current.startsWith("blob:")) {
                URL.revokeObjectURL(current);
              }
              return objectUrl;
            });
            const nextPosition = "50% 50%";
            setCoverPosition(nextPosition);
            persistBanner(nextPosition, file);
            event.currentTarget.value = "";
          }}
          ref={inputRef}
          type="file"
        />
        <div className="bg-[linear-gradient(90deg,rgba(17,15,14,0.72),rgba(17,15,14,0.22),rgba(17,15,14,0.08))] px-8 py-10 sm:px-10 sm:py-14">
          <div className="flex items-start justify-between gap-4">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/80 transition hover:text-white"
              href="/projects"
            >
              Projects
            </Link>
          </div>
          <div className="mt-16 max-w-2xl">
            <h1 className="font-display text-5xl leading-none text-white sm:text-6xl">{clientName}</h1>
            <p className="mt-5 text-lg font-semibold text-white/90">
              {projectType || "Project"} {projectDateLabel ? `| ${projectDateLabel}` : ""}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/78">{description}</p>
          </div>
        </div>
        <button
          aria-label={hasCustomCover ? "Change banner image" : "Upload banner image"}
          className="absolute bottom-0 right-0 z-20 h-0 w-0 border-b-[3.8rem] border-l-[3.8rem] border-b-[rgba(255,255,255,0.86)] border-l-transparent text-transparent transition hover:border-b-white"
          data-no-hero-drag="true"
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
          type="button"
        >
          Upload banner
        </button>
        <div className="pointer-events-none absolute bottom-3 right-3 z-20 text-[var(--ink)]">
          {isPending ? (
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white">Saving</span>
          ) : (
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
