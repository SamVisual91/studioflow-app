"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type TemplateSetCard = {
  groupId: string;
  previewImage: string;
  previewImagePosition?: string;
  presetId: string;
  priceLabel: string;
  representativeDescription: string;
  representativeTemplateSetId: string;
  setName: string;
  templateCount: number;
};

export function PackagesTemplateGrid({
  activeCategory,
  deleteAction,
  items,
  reorderAction,
}: {
  activeCategory: string;
  deleteAction: (formData: FormData) => Promise<void>;
  items: TemplateSetCard[];
  reorderAction: (formData: FormData) => Promise<void>;
}) {
  const [cards, setCards] = useState(items);
  const dragIdRef = useRef<string>("");
  const reorderFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    setCards(items);
  }, [items]);

  function moveCard(sourceId: string, targetId: string) {
    if (!sourceId || !targetId || sourceId === targetId) {
      return;
    }

    setCards((current) => {
      const sourceIndex = current.findIndex((item) => item.groupId === sourceId);
      const targetIndex = current.findIndex((item) => item.groupId === targetId);

      if (sourceIndex === -1 || targetIndex === -1) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  function submitReorder() {
    reorderFormRef.current?.requestSubmit();
  }

  return (
    <>
      <form action={reorderAction} ref={reorderFormRef}>
        <input name="activeCategory" type="hidden" value={activeCategory} />
        {cards.map((item) => (
          <input key={`template-set-${item.groupId}`} name="orderedTemplateSetIds" type="hidden" value={item.representativeTemplateSetId} />
        ))}
        {cards.map((item) => (
          <input key={`representative-${item.groupId}`} name="orderedRepresentativeIds" type="hidden" value={item.presetId} />
        ))}
      </form>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((templateSet, index) => (
          <article
            key={templateSet.groupId}
            className="group relative grid overflow-hidden border border-black/[0.08] bg-white shadow-[0_10px_28px_rgba(59,36,17,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(59,36,17,0.1)]"
            draggable
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDragStart={() => {
              dragIdRef.current = templateSet.groupId;
            }}
            onDrop={(event) => {
              event.preventDefault();
              moveCard(dragIdRef.current, templateSet.groupId);
              dragIdRef.current = "";
              submitReorder();
            }}
            onDragEnd={() => {
              dragIdRef.current = "";
            }}
          >
            <Link
              className="absolute inset-0 z-0"
              href={`/packages/new?category=${encodeURIComponent(activeCategory)}&templateSetId=${encodeURIComponent(templateSet.representativeTemplateSetId || "")}&presetId=${encodeURIComponent(templateSet.presetId)}`}
            >
              <span className="sr-only">Open {templateSet.setName}</span>
            </Link>

            <form action={deleteAction} className="absolute right-3 top-3 z-20">
              <input name="templateSetId" type="hidden" value={templateSet.groupId} />
              <input name="resolvedTemplateSetId" type="hidden" value={templateSet.representativeTemplateSetId} />
              <input name="representativeId" type="hidden" value={templateSet.presetId} />
              <input name="activeCategory" type="hidden" value={activeCategory} />
              <button
                aria-label={`Delete ${templateSet.setName}`}
                className="inline-flex h-10 w-10 items-center justify-center bg-white/92 text-lg text-[var(--ink)] shadow-sm transition hover:text-[var(--accent)]"
                onClick={(event) => event.stopPropagation()}
                type="submit"
              >
                &#128465;
              </button>
            </form>

            <div
              className="relative min-h-[210px] bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(12,10,9,0.34)), url(${templateSet.previewImage})`,
                backgroundPosition: templateSet.previewImagePosition || "50% 50%",
              }}
            >
              <div className="absolute inset-x-0 bottom-0 grid gap-2 p-4 text-white">
                <p className="text-[10px] uppercase tracking-[0.28em] text-white/78">
                  Template {String(index + 1).padStart(2, "0")}
                </p>
                <p className="max-w-[16rem] text-xl font-semibold leading-tight">{templateSet.setName}</p>
              </div>
            </div>

            <div className="grid gap-3 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                    Template
                  </p>
                  <h3 className="text-xl font-semibold leading-tight">{templateSet.setName}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    {templateSet.templateCount} collections
                  </p>
                </div>
                <p className="text-base font-semibold text-[var(--accent)]">
                  {templateSet.priceLabel}
                </p>
              </div>

              <p className="line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                {templateSet.representativeDescription || "No description added yet."}
              </p>

              <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                <span>{templateSet.templateCount} saved collections</span>
                <span className="font-medium text-[var(--ink)]">Drag or open studio</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
