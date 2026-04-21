"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPackageTemplateBundleAction } from "@/app/actions";

type PackageCategory = {
  value: string;
  label: string;
};

type InitialTemplatePackage = {
  amount: string;
  coverPosition: string;
  coverPreviewUrl: string;
  description: string;
  id: string;
  lineItems: LineItem[];
  name: string;
  proposalTitle: string;
  sections: string[];
  subtitle: string;
  emailBody: string;
  emailSubject: string;
};

type EditableTextProps = {
  as?: "div" | "h1" | "h2" | "p" | "span";
  className: string;
  editingClassName?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
  wrapperClassName?: string;
};

type LineItem = {
  title: string;
  description: string;
  amount: number;
};

type PackageCard = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  proposalTitle: string;
  amount: string;
  sections: string[];
  lineItems: LineItem[];
  coverPreviewUrl: string;
  coverPosition: string;
  emailSubject: string;
  emailBody: string;
};

function EditableText({
  as = "div",
  className,
  editingClassName,
  multiline = false,
  onChange,
  placeholder,
  value,
  wrapperClassName,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange?.(length, length);
    }
  }, [isEditing]);

  const sharedClassName =
    "cursor-text border border-transparent transition outline-none hover:border-black/15 hover:bg-black/[0.04] focus:border-black/15 focus:bg-black/[0.04]";

  function beginEditing(event?: {
    preventDefault?: () => void;
    stopPropagation?: () => void;
  }) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setIsEditing(true);
  }

  if (isEditing) {
    if (multiline) {
      return (
        <div className={`group relative ${wrapperClassName || "block"}`}>
          <textarea
            ref={(node) => {
              inputRef.current = node;
            }}
            className={editingClassName || className}
            onBlur={() => setIsEditing(false)}
            onChange={(event) => onChange(event.target.value)}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            placeholder={placeholder}
            rows={3}
            value={value}
          />
        </div>
      );
    }

    return (
      <div className={`group relative ${wrapperClassName || "block"}`}>
        <input
          ref={(node) => {
            inputRef.current = node;
          }}
          className={editingClassName || className}
          onBlur={() => setIsEditing(false)}
          onChange={(event) => onChange(event.target.value)}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          placeholder={placeholder}
          value={value}
        />
      </div>
    );
  }

  const Tag = as;
  return (
    <div className={`group relative ${wrapperClassName || "block"}`}>
      <Tag
        className={`${className} ${sharedClassName}`}
        onClick={(event) => beginEditing(event)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            beginEditing(event);
          }
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        role="button"
        tabIndex={0}
      >
        {value || placeholder}
      </Tag>
    </div>
  );
}

function createDefaultPackage(
  id: string,
  name: string,
  subtitle: string,
  amount: string,
  sections: string[]
) {
  return {
    id,
    name,
    subtitle,
    description: "Click to edit this package description directly on the design.",
    proposalTitle: `${name} Proposal`,
    amount,
    sections,
    lineItems: [
      {
        title: "Coverage",
        description: "Primary filming or photo coverage",
        amount: Math.round(Number(amount) * 0.65),
      },
    ],
    coverPreviewUrl: "",
    coverPosition: "50% 50%",
    emailSubject: `${name} package preview`,
    emailBody: `Hi,\n\nI put together ${name} for you. Let me know what you'd like to adjust.\n\nThanks,`,
  } satisfies PackageCard;
}

function createBlankPackage(index: number) {
  return createDefaultPackage(
    `pkg-${Date.now()}-${index}`,
    `Collection ${index}`,
    "Custom Edition",
    "5500",
    ["Click to edit what this package includes"]
  );
}

export function PackageTemplateCanvasEditor({
  initialHeroCoverImage,
  initialHeroCoverPosition,
  initialPackages,
  packageCategories,
  initialCategory,
  initialTemplateSetName,
  representativeId,
  templateSetId,
}: {
  initialHeroCoverImage?: string;
  initialHeroCoverPosition?: string;
  initialPackages?: InitialTemplatePackage[];
  packageCategories: PackageCategory[];
  initialCategory: string;
  initialTemplateSetName?: string;
  representativeId?: string;
  templateSetId?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const heroCoverInputRef = useRef<HTMLInputElement | null>(null);
  const packageCoverUrlsRef = useRef<Record<string, string>>({});
  const initializedRef = useRef(false);
  const suppressAutosaveRef = useRef(false);
  const heroDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPositionX: number;
    startPositionY: number;
  } | null>(null);
  const packageDragRef = useRef<{
    packageId: string;
    pointerId: number;
    startX: number;
    startY: number;
    startPositionX: number;
    startPositionY: number;
  } | null>(null);
  const [isSaving, startSavingTransition] = useTransition();
  const [currentTemplateSetId, setCurrentTemplateSetId] = useState(templateSetId || "");
  const [currentRepresentativeId, setCurrentRepresentativeId] = useState(representativeId || "");
  const [autosaveMessage, setAutosaveMessage] = useState(
    templateSetId || representativeId ? "All changes saved" : "Autosave ready"
  );
  const [category, setCategory] = useState(initialCategory);
  const [heroLabel, setHeroLabel] = useState(`${initialCategory} package template`);
  const [heroTitle, setHeroTitle] = useState(initialTemplateSetName || "Build Your Collection Lineup");
  const [heroDescription, setHeroDescription] = useState(
    "Click directly on the design to shape your package brochure. Edit the banner, titles, copy, pricing, and inclusions exactly where they appear."
  );
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(initialHeroCoverImage || "");
  const [heroCoverPosition, setHeroCoverPosition] = useState(initialHeroCoverPosition || "50% 50%");
  const [packages, setPackages] = useState<PackageCard[]>(
    initialPackages && initialPackages.length > 0
      ? initialPackages.map((item) => ({
          ...createDefaultPackage(item.id, item.name, item.subtitle, item.amount, item.sections),
          coverPosition: item.coverPosition || "50% 50%",
          coverPreviewUrl: item.coverPreviewUrl,
          description: item.description,
          lineItems: item.lineItems,
          proposalTitle: item.proposalTitle,
          emailSubject: item.emailSubject,
          emailBody: item.emailBody,
        }))
      : [
          createDefaultPackage("pkg-1", "Collection I", "Silver Edition", "2500", [
            "6 hours of coverage",
            "3-5 minute film",
            "60 second trailer",
            "1 filmmaker",
            "Digital download link",
          ]),
          createDefaultPackage("pkg-2", "Collection II", "Gold Edition", "3500", [
            "8 hours of coverage",
            "7 minute highlight film",
            "60 second trailer",
            "1 filmmaker",
            "Raw speeches and first dances",
            "Drone coverage",
            "Online gallery",
            "Delivered within 30-90 days",
          ]),
          createDefaultPackage("pkg-3", "Collection III", "Platinum Edition", "4500", [
            "10 hours of coverage",
            "2 filmmakers",
            "10-12 minute wedding film",
            "Ceremony film (25 min+)",
            "Drone coverage",
            "Full toast edits / speeches / first dances",
            "Delivered within 30-90 days",
          ]),
        ]
  );

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  useEffect(() => {
    const packageCoverUrls = packageCoverUrlsRef.current;
    return () => {
      Object.values(packageCoverUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const heroStyle = coverPreviewUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(24,22,20,0.72), rgba(68,52,43,0.54)), url(${coverPreviewUrl})`,
        backgroundPosition: heroCoverPosition,
      }
    : {
        backgroundImage:
          "linear-gradient(135deg, rgba(44,40,35,0.98) 0%, rgba(111,96,80,0.88) 100%)",
      };

  const bundlePayload = JSON.stringify(
    packages.map((item) => ({
      name: item.name,
      subtitle: item.subtitle,
      description: item.description,
      proposalTitle: item.proposalTitle,
      amount: Number(item.amount || 0),
      coverPosition: item.coverPosition,
      sections: item.sections,
      lineItems: item.lineItems,
      emailSubject: item.emailSubject,
      emailBody: item.emailBody,
    }))
  );

  const autosaveFingerprint = JSON.stringify({
    bundlePayload,
    category,
    coverPreviewUrl,
    currentRepresentativeId,
    currentTemplateSetId,
    heroCoverPosition,
    heroTitle,
    packageCoverPreviewUrls: packages.map((item) => item.coverPreviewUrl),
  });

  const clearPendingFileInputs = useCallback(() => {
    if (!formRef.current) {
      return;
    }

    formRef.current
      .querySelectorAll<HTMLInputElement>("input[type='file']")
      .forEach((input) => {
        input.value = "";
      });
  }, []);

  const autosaveBundle = useCallback(() => {
    if (!formRef.current) {
      return;
    }

    setAutosaveMessage("Saving changes...");
    startSavingTransition(async () => {
      const result = await createPackageTemplateBundleAction(new FormData(formRef.current!));

      if (!result?.ok) {
        setAutosaveMessage("Complete the required package details to autosave");
        return;
      }

      suppressAutosaveRef.current = true;

      setCurrentTemplateSetId(result.templateSetId);
      setCurrentRepresentativeId(result.representativeId);
      setAutosaveMessage("All changes saved");

      setCoverPreviewUrl((current) => {
        if (current.startsWith("blob:") && current !== result.templateSetCoverImage) {
          URL.revokeObjectURL(current);
        }
        return result.templateSetCoverImage || current;
      });

      setPackages((current) =>
        current.map((item, index) => {
          const savedPackage = result.packages[index];
          const nextCoverImage = savedPackage?.coverImage || item.coverPreviewUrl;
          const currentPreviewUrl = item.coverPreviewUrl;
          if (currentPreviewUrl.startsWith("blob:") && currentPreviewUrl !== nextCoverImage) {
            URL.revokeObjectURL(currentPreviewUrl);
          }
          delete packageCoverUrlsRef.current[item.id];
          return {
            ...item,
            coverPreviewUrl: nextCoverImage,
            id: savedPackage?.id || item.id,
          };
        })
      );

      clearPendingFileInputs();

      const nextParams = new URLSearchParams({
        category: result.category,
        presetId: result.representativeId,
      });
      if (result.templateSetId) {
        nextParams.set("templateSetId", result.templateSetId);
      }
      router.replace(`/packages/new?${nextParams.toString()}`, { scroll: false });
    });
  }, [clearPendingFileInputs, router]);

  function updatePackage(id: string, next: Partial<PackageCard>) {
    setPackages((current) =>
      current.map((item) => (item.id === id ? { ...item, ...next } : item))
    );
  }

  function updateSection(packageId: string, sectionIndex: number, value: string) {
    setPackages((current) =>
      current.map((item) =>
        item.id === packageId
          ? {
              ...item,
              sections: item.sections.map((section, index) =>
                index === sectionIndex ? value : section
              ),
            }
          : item
      )
    );
  }

  function addSection(packageId: string) {
    setPackages((current) =>
      current.map((item) =>
        item.id === packageId ? { ...item, sections: [...item.sections, "New section"] } : item
      )
    );
  }

  function removeSection(packageId: string, sectionIndex: number) {
    setPackages((current) =>
      current.map((item) =>
        item.id === packageId
          ? { ...item, sections: item.sections.filter((_, index) => index !== sectionIndex) }
          : item
      )
    );
  }

  function addPackage() {
    setPackages((current) => [...current, createBlankPackage(current.length + 1)]);
  }

  function removePackage(packageId: string) {
    setPackages((current) => current.filter((item) => item.id !== packageId));
    const previousUrl = packageCoverUrlsRef.current[packageId];
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
      delete packageCoverUrlsRef.current[packageId];
    }
  }

  function beginPackageDrag(packageId: string, event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("[data-no-package-drag='true']")) {
      return;
    }

    const currentPackage = packages.find((item) => item.id === packageId);
    if (!currentPackage?.coverPreviewUrl) {
      return;
    }

    const [currentX = "50%", currentY = "50%"] = currentPackage.coverPosition.split(" ");
    packageDragRef.current = {
      packageId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPositionX: Number(currentX.replace("%", "") || 50),
      startPositionY: Number(currentY.replace("%", "") || 50),
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function movePackageDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = packageDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = ((event.clientX - drag.startX) / Math.max(event.currentTarget.clientWidth, 1)) * 100;
    const deltaY = ((event.clientY - drag.startY) / Math.max(event.currentTarget.clientHeight, 1)) * 100;
    const nextX = Math.min(100, Math.max(0, drag.startPositionX + deltaX));
    const nextY = Math.min(100, Math.max(0, drag.startPositionY + deltaY));

    setPackages((current) =>
      current.map((item) =>
        item.id === drag.packageId ? { ...item, coverPosition: `${nextX}% ${nextY}%` } : item
      )
    );
  }

  function endPackageDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (packageDragRef.current?.pointerId === event.pointerId) {
      packageDragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  }

  function beginHeroDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!coverPreviewUrl) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("[data-no-hero-drag='true']")) {
      return;
    }

    const [currentX = "50%", currentY = "50%"] = heroCoverPosition.split(" ");
    heroDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPositionX: Number(currentX.replace("%", "") || 50),
      startPositionY: Number(currentY.replace("%", "") || 50),
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveHeroDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = heroDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = ((event.clientX - drag.startX) / Math.max(event.currentTarget.clientWidth, 1)) * 100;
    const deltaY = ((event.clientY - drag.startY) / Math.max(event.currentTarget.clientHeight, 1)) * 100;
    const nextX = Math.min(100, Math.max(0, drag.startPositionX + deltaX));
    const nextY = Math.min(100, Math.max(0, drag.startPositionY + deltaY));

    setHeroCoverPosition(`${nextX}% ${nextY}%`);
  }

  function endHeroDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (heroDragRef.current?.pointerId === event.pointerId) {
      heroDragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  }

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    if (suppressAutosaveRef.current) {
      suppressAutosaveRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      autosaveBundle();
    }, 700);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [autosaveBundle, autosaveFingerprint]);

  return (
    <form className="grid gap-8" encType="multipart/form-data" ref={formRef}>
      <input name="category" type="hidden" value={category} />
      <input name="packageBundle" type="hidden" value={bundlePayload} />
      <input name="templateSetName" type="hidden" value={heroTitle} />
      <input name="templateSetId" type="hidden" value={currentTemplateSetId} />
      <input name="templateSetCoverPosition" type="hidden" value={heroCoverPosition} />
      <input name="representativeId" type="hidden" value={currentRepresentativeId} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
          <Link
            className="font-medium text-[var(--ink)] transition hover:text-[var(--forest)]"
            href={`/packages?category=${encodeURIComponent(category)}`}
          >
            Back to package library
          </Link>
          <span>/</span>
          <span>New template</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {packageCategories.map((option) => (
            <button
              key={option.value}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                category === option.value
                  ? "bg-[var(--ink)] text-white"
                  : "bg-[rgba(247,241,232,0.72)] text-[var(--ink)] hover:bg-[rgba(15,23,42,0.08)]"
              }`}
              onClick={() => setCategory(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
          <div className="rounded-full border border-black/[0.08] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {isSaving ? "Saving..." : autosaveMessage}
          </div>
        </div>
      </div>

      <div
        className={`group relative block min-h-[360px] overflow-hidden border border-black/[0.08] bg-cover bg-center shadow-[0_30px_80px_rgba(36,24,14,0.16)] ${
          coverPreviewUrl ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
        }`}
        onPointerDown={beginHeroDrag}
        onPointerMove={moveHeroDrag}
        onPointerUp={endHeroDrag}
        onPointerCancel={endHeroDrag}
        style={heroStyle}
      >
        <input
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="hidden"
          ref={heroCoverInputRef}
          name="templateSetCoverImage"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            const objectUrl = URL.createObjectURL(file);
            setCoverPreviewUrl((current) => {
              if (current && current.startsWith("blob:")) {
                URL.revokeObjectURL(current);
              }
              return objectUrl;
            });
          }}
          type="file"
        />
        <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/20" />
        <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2" data-no-hero-drag="true">
          <button
            className="flex h-9 min-w-[10.75rem] items-center justify-center bg-white/14 px-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm transition hover:bg-white/22"
            data-no-hero-drag="true"
            onClick={() => heroCoverInputRef.current?.click()}
            type="button"
          >
            {coverPreviewUrl ? "Change banner" : "Upload banner"}
          </button>
        </div>
        <button
          className="absolute inset-0 z-0 block h-full w-full"
          data-no-hero-drag={coverPreviewUrl ? "true" : undefined}
          onClick={() => {
            if (!coverPreviewUrl) {
              heroCoverInputRef.current?.click();
            }
          }}
          type="button"
        />
        <div className="relative z-10 grid min-h-[360px] content-end gap-5 px-8 py-8 text-white sm:px-10 sm:py-10">
          <EditableText
            as="span"
            className="w-fit text-xs uppercase tracking-[0.3em] text-white/72"
            editingClassName="w-fit border-0 bg-transparent p-0 text-xs uppercase tracking-[0.3em] text-white outline-none"
            onChange={setHeroLabel}
            placeholder="Package template"
            value={heroLabel}
            wrapperClassName="w-fit"
          />
          <EditableText
            as="h1"
            className="max-w-4xl text-[clamp(3rem,7vw,5.4rem)] leading-[0.92] text-white"
            editingClassName="max-w-4xl border-0 bg-transparent p-0 text-[clamp(3rem,7vw,5.4rem)] leading-[0.92] text-white outline-none"
            onChange={setHeroTitle}
            placeholder="Build your package lineup"
            value={heroTitle}
            wrapperClassName="max-w-4xl"
          />
          <EditableText
            as="p"
            className="max-w-3xl text-base leading-8 text-white/80 sm:text-lg"
            editingClassName="min-h-28 max-w-3xl resize-none border-0 bg-transparent p-0 text-base leading-8 text-white outline-none sm:text-lg"
            multiline
            onChange={setHeroDescription}
            placeholder="Click to describe this package template."
            value={heroDescription}
            wrapperClassName="max-w-3xl"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Collections
          </p>
          <p className="text-sm text-[var(--muted)]">
            Add or remove package cards as you build the final lineup.
          </p>
        </div>
        <button
          className="inline-flex h-12 w-12 items-center justify-center bg-[var(--ink)] text-2xl font-light text-white transition hover:brightness-110"
          onClick={addPackage}
          type="button"
        >
          +
        </button>
      </div>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {packages.map((item, index) => (
          <article
            key={item.id}
            className="grid overflow-hidden border border-black/[0.08] bg-white shadow-[0_18px_38px_rgba(59,36,17,0.06)]"
          >
            <div
              className={`relative h-40 border-b border-black/[0.06] ${
                item.coverPreviewUrl ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              }`}
              onPointerDown={(event) => beginPackageDrag(item.id, event)}
              onPointerMove={movePackageDrag}
              onPointerUp={endPackageDrag}
              onPointerCancel={endPackageDrag}
            >
              <div
                className="absolute inset-0 z-0 block h-full w-full bg-cover bg-center transition hover:brightness-95"
                style={
                  item.coverPreviewUrl
                    ? {
                        backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.03), rgba(12,10,9,0.18)), url(${item.coverPreviewUrl})`,
                        backgroundPosition: item.coverPosition,
                      }
                    : {
                        backgroundImage:
                          "linear-gradient(135deg, rgba(238,232,223,1) 0%, rgba(216,205,191,1) 100%)",
                      }
                }
              />
              <input
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                id={`cover-image-${item.id}`}
                name={`coverImage_${index}`}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  const objectUrl = URL.createObjectURL(file);
                  const previousUrl = packageCoverUrlsRef.current[item.id];
                  if (previousUrl) {
                    URL.revokeObjectURL(previousUrl);
                  }
                  packageCoverUrlsRef.current[item.id] = objectUrl;
                  updatePackage(item.id, { coverPreviewUrl: objectUrl });
                }}
                type="file"
              />
              <button
                aria-label={`Upload banner image for ${item.name}`}
                className="absolute bottom-0 right-0 z-20 h-0 w-0 border-b-[3.4rem] border-l-[3.4rem] border-b-[rgba(149,141,126,0.92)] border-l-transparent text-transparent transition hover:border-b-[var(--forest)]"
                data-no-package-drag="true"
                onClick={(event) => {
                  event.stopPropagation();
                  const input = document.getElementById(`cover-image-${item.id}`) as HTMLInputElement | null;
                  input?.click();
                }}
                type="button"
              >
                Upload banner
              </button>
              <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-20 text-white">
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
              </div>
              <div className="absolute inset-x-0 bottom-0 z-10 grid gap-2 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-5 pb-5 pt-10 text-white">
                  <EditableText
                    as="h2"
                  className="w-fit text-[2rem] leading-none text-white hover:bg-white/10"
                  editingClassName="w-fit border-0 bg-transparent p-0 text-[2rem] leading-none text-white outline-none"
                  onChange={(value) => updatePackage(item.id, { name: value })}
                  placeholder="Collection name"
                  value={item.name}
                  wrapperClassName="w-fit"
                />
                <EditableText
                  as="span"
                  className="w-fit text-xs font-semibold uppercase tracking-[0.18em] text-white/84 hover:bg-white/10"
                  editingClassName="w-fit border-0 bg-transparent p-0 text-xs font-semibold uppercase tracking-[0.18em] text-white outline-none"
                  onChange={(value) => updatePackage(item.id, { subtitle: value })}
                  placeholder="Edition"
                    value={item.subtitle}
                    wrapperClassName="w-fit"
                  />
                </div>
              </div>

            <div className="grid gap-4 px-6 py-6">
              <EditableText
                as="p"
                className="text-sm leading-7 text-[var(--ink)]"
                editingClassName="min-h-28 resize-none border-0 bg-transparent p-0 text-sm leading-7 text-[var(--ink)] outline-none"
                multiline
                onChange={(value) => updatePackage(item.id, { description: value })}
                placeholder="Click to describe this package."
                value={item.description}
              />

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--ink)]">Here&apos;s what you&apos;ll get:</p>
                  <button
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--forest)]"
                    onClick={() => addSection(item.id)}
                    type="button"
                  >
                    Add
                  </button>
                </div>

                <div className="grid gap-2">
                  {item.sections.map((section, sectionIndex) => (
                    <div key={`${item.id}-${sectionIndex}`} className="group flex gap-3">
                      <span className="pt-2 text-sm text-[var(--ink)]">-</span>
                      <EditableText
                        as="div"
                        className="flex-1 py-1 text-sm leading-7 text-[var(--ink)]"
                        editingClassName="flex-1 border-0 bg-transparent p-0 py-1 text-sm leading-7 text-[var(--ink)] outline-none"
                        onChange={(value) => updateSection(item.id, sectionIndex, value)}
                        placeholder="New section"
                        value={section}
                      />
                      <button
                        className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--accent)]"
                        onClick={() => removeSection(item.id, sectionIndex)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 border-t border-black/[0.06] px-6 py-5">
              <div className="flex items-end justify-between gap-3">
                <div className="inline-flex items-end gap-2">
                  <span className="font-display text-3xl font-semibold text-[#7e6858]">$</span>
                  <EditableText
                    as="div"
                    className="text-4xl font-semibold leading-none text-[#7e6858]"
                    editingClassName="border-0 bg-transparent p-0 text-4xl font-semibold leading-none text-[#7e6858] outline-none"
                    onChange={(value) => updatePackage(item.id, { amount: value })}
                    placeholder="2500"
                    value={item.amount}
                    wrapperClassName="w-fit"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    aria-label={`Delete ${item.name}`}
                    className="inline-flex h-[3.125rem] w-[3.125rem] items-center justify-center border border-black/[0.08] bg-white text-lg text-[var(--ink)] transition hover:text-[var(--accent)]"
                    onClick={(event) => {
                      event.stopPropagation();
                      removePackage(item.id);
                    }}
                    type="button"
                  >
                    &#128465;
                  </button>
                  <span className="bg-[rgba(149,141,126,0.74)] px-5 py-3 text-sm font-semibold text-white">
                    Select
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </form>
  );
}
