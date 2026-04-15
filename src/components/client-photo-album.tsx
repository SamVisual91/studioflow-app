"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { createPhotoDeliverableCheckoutAction, updatePhotoAlbumCategoriesAction } from "@/app/actions";

type ClientPhoto = {
  id: string;
  title: string;
  caption: string;
  filePath: string;
  section: string;
  accessType: "FREE" | "PAID";
  price: number;
  purchasedAt: string;
  purchaseToken: string;
};

type ClientPhotoAlbumProps = {
  albumTitle: string;
  albumCover: string;
  downloadAllUrl: string;
  photos: ClientPhoto[];
  projectId: string;
  returnPath: string;
  canEdit: boolean;
  initialOpen?: boolean;
  showPurchaseActions?: boolean;
  previewActions?: ReactNode;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function downloadUrl(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.download = "";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function isPhotoUnlocked(photo: ClientPhoto) {
  return photo.accessType !== "PAID" || Boolean(photo.purchasedAt);
}

export function ClientPhotoAlbum({
  albumTitle,
  albumCover,
  downloadAllUrl,
  photos,
  projectId,
  returnPath,
  canEdit,
  initialOpen = false,
  showPurchaseActions = true,
  previewActions,
}: ClientPhotoAlbumProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState("All");
  const unlockedPhotos = useMemo(() => photos.filter(isPhotoUnlocked), [photos]);
  const selectedPhotos = useMemo(
    () => unlockedPhotos.filter((photo) => selectedIds.includes(photo.id)),
    [selectedIds, unlockedPhotos]
  );
  const sections = useMemo(() => {
    const grouped = new Map<string, ClientPhoto[]>();

    for (const photo of photos) {
      const section = photo.section || "All";
      grouped.set(section, [...(grouped.get(section) || []), photo]);
    }

    return Array.from(grouped.entries());
  }, [photos]);
  const customSectionNames = sections
    .map(([section]) => section)
    .filter((section) => section !== "All" && section !== "Gallery");
  const sectionNames = ["All", ...customSectionNames];
  const visiblePhotos =
    activeSection === "All"
      ? photos.filter((photo) => !photo.section || photo.section === "All" || photo.section === "Gallery")
      : photos.filter((photo) => photo.section === activeSection);
  const visibleUnlockedPhotos = visiblePhotos.filter(isPhotoUnlocked);
  const hasLockedPhotos = photos.some((photo) => !isPhotoUnlocked(photo));

  const togglePhoto = (id: string) => {
    const photo = photos.find((item) => item.id === id);
    if (!photo || !isPhotoUnlocked(photo)) {
      return;
    }

    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const selectVisible = () => {
    setSelectedIds(visibleUnlockedPhotos.map((photo) => photo.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const downloadSelected = () => {
    selectedPhotos.forEach((photo, index) => {
      window.setTimeout(() => downloadUrl(photo.filePath), index * 150);
    });
  };

  const downloadAll = () => {
    if (!hasLockedPhotos && downloadAllUrl) {
      window.open(downloadAllUrl, "_blank", "noopener,noreferrer");
      return;
    }

    unlockedPhotos.forEach((photo, index) => {
      window.setTimeout(() => downloadUrl(photo.filePath), index * 150);
    });
  };

  return (
    <>
      <article className="group relative h-full overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/[0.06] transition hover:-translate-y-1 hover:bg-white/[0.09]">
        <div
          className="flex h-full w-full cursor-pointer flex-col text-left"
          onClick={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div
            className="aspect-video bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
            style={{ backgroundImage: `url(${albumCover})` }}
          />
          <div className="flex flex-1 flex-col p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(134,239,172,0.8)]">
                  Photo album
                </p>
                <h5 className="mt-2 truncate text-base font-semibold text-white">{albumTitle}</h5>
              </div>
              {previewActions ? (
                <div
                  className="flex shrink-0 items-center gap-2"
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  {previewActions}
                </div>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-white/58">
              {photos.length} photo{photos.length === 1 ? "" : "s"} across {sections.length} categor
              {sections.length === 1 ? "y" : "ies"}.
            </p>
            <span className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#11100f] transition group-hover:bg-white/86">
              Open album
            </span>
          </div>
        </div>
      </article>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/72 px-4 py-6 backdrop-blur-md">
          <section className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[1.8rem] border border-white/12 bg-[#11100f] text-white shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="border-b border-white/10 bg-[#151312] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/44">Photo album</p>
                  <h3 className="mt-2 text-3xl font-semibold">{albumTitle}</h3>
                  <p className="mt-2 text-sm text-white/52">
                    {selectedIds.length} selected of {unlockedPhotos.length} available photo
                    {unlockedPhotos.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-full border border-white/14 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={visibleUnlockedPhotos.length === 0}
                    onClick={selectVisible}
                    type="button"
                  >
                    Select visible
                  </button>
                  <button
                    className="rounded-full border border-white/14 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                    onClick={clearSelection}
                    type="button"
                  >
                    Clear
                  </button>
                  <button
                    className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#11100f] transition hover:bg-white/86 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={selectedPhotos.length === 0}
                    onClick={downloadSelected}
                    type="button"
                  >
                    Download selected
                  </button>
                  <button
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={unlockedPhotos.length === 0}
                    onClick={downloadAll}
                    type="button"
                  >
                    Download all available
                  </button>
                  <button
                    className="rounded-full border border-white/14 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                    onClick={() => setIsOpen(false)}
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {sectionNames.map((section) => (
                  <button
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                      activeSection === section
                        ? "bg-white text-[#11100f]"
                        : "border border-white/14 text-white hover:bg-white/10"
                    }`}
                    key={section}
                    onClick={() => setActiveSection(section)}
                    type="button"
                  >
                    {section}
                  </button>
                ))}
              </div>

              {canEdit ? (
                <form
                  action={updatePhotoAlbumCategoriesAction}
                  className="mt-5 grid gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.05] p-4 sm:grid-cols-[1fr_auto]"
                >
                  <input name="projectId" type="hidden" value={projectId} />
                  <input
                    name="returnPath"
                    type="hidden"
                    value={`${returnPath}${returnPath.includes("?") ? "&" : "?"}openAlbum=${encodeURIComponent(albumTitle)}`}
                  />
                  <input name="assignments" type="hidden" value={JSON.stringify(selectedIds)} />
                  <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                    Create or choose category for selected photos
                    <input
                      className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold normal-case tracking-normal text-[#11100f]"
                      list={`album-categories-${albumTitle}`}
                      name="category"
                      placeholder="Example: Ceremony, Reception, Family"
                      required
                    />
                    <datalist id={`album-categories-${albumTitle}`}>
                      {sections.map(([section]) => (
                        <option key={section} value={section} />
                      ))}
                    </datalist>
                  </label>
                  <button
                    className="self-end rounded-full bg-[rgba(134,239,172,0.92)] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#11100f] transition hover:bg-[rgba(134,239,172,0.78)] disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={selectedIds.length === 0}
                    type="submit"
                  >
                    Save category
                  </button>
                </form>
              ) : null}
            </div>

            <div className="max-h-[62vh] overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visiblePhotos.map((photo) => {
                  const unlocked = isPhotoUnlocked(photo);
                  const isSelected = unlocked && selectedIds.includes(photo.id);

                  return (
                    <article
                      key={photo.id}
                      className={`group overflow-hidden rounded-[1.2rem] border bg-white/[0.06] transition hover:-translate-y-1 hover:bg-white/[0.09] ${
                        isSelected
                          ? "border-[rgba(134,239,172,0.82)]"
                          : unlocked
                            ? "border-white/10"
                            : "border-[rgba(207,114,79,0.22)]"
                      }`}
                    >
                      <button
                        className="relative block w-full text-left"
                        onClick={() => togglePhoto(photo.id)}
                        type="button"
                      >
                        <div
                          className={`aspect-[4/3] bg-cover bg-center transition duration-500 group-hover:scale-[1.03] ${
                            unlocked ? "" : "brightness-[0.72] saturate-[0.72]"
                          }`}
                          style={{ backgroundImage: `url(${photo.filePath})` }}
                        />
                        {!unlocked ? <div className="absolute inset-0 bg-black/18" /> : null}
                        <span
                          className={`absolute right-3 top-3 grid min-h-8 min-w-8 place-items-center rounded-full border px-2 text-[0.62rem] font-black uppercase tracking-[0.12em] ${
                            isSelected
                              ? "border-[rgba(134,239,172,0.8)] bg-[rgba(134,239,172,0.92)] text-[#11100f]"
                              : unlocked
                                ? "border-white/28 bg-black/50 text-white"
                                : "border-[rgba(207,114,79,0.32)] bg-[rgba(17,16,15,0.76)] text-white"
                          }`}
                        >
                          {isSelected ? "Selected" : unlocked ? "" : "Locked"}
                        </span>
                        {unlocked ? (
                          <span
                            aria-label={`Download ${photo.title}`}
                            className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/18 bg-black/58 text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:bg-black/72"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              downloadUrl(photo.filePath);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.stopPropagation();
                                downloadUrl(photo.filePath);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
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
                              <path d="M12 3v11" />
                              <path d="m7 10 5 5 5-5" />
                              <path d="M5 21h14" />
                            </svg>
                          </span>
                        ) : (
                          <span className="absolute bottom-3 right-3 rounded-full border border-[rgba(207,114,79,0.28)] bg-[rgba(17,16,15,0.78)] px-3 py-2 text-[0.62rem] font-black uppercase tracking-[0.14em] text-white">
                            {money.format(photo.price || 0)}
                          </span>
                        )}
                      </button>
                      <div className="p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-[rgba(134,239,172,0.8)]">
                          {photo.section || "Gallery"}
                        </p>
                        <h5 className="mt-2 text-base font-semibold text-white">{photo.title}</h5>
                        {photo.caption ? (
                          <p className="mt-2 text-sm leading-6 text-white/58">{photo.caption}</p>
                        ) : null}
                        {unlocked ? (
                          <a
                            className="mt-3 inline-flex text-sm font-semibold text-white underline decoration-white/30 underline-offset-4 transition hover:text-white/76"
                            href={photo.filePath}
                            target="_blank"
                          >
                            Open full size
                          </a>
                        ) : showPurchaseActions ? (
                          <form action={createPhotoDeliverableCheckoutAction} className="mt-4 grid gap-3">
                            <input name="photoToken" type="hidden" value={photo.purchaseToken} />
                            <input name="returnPath" type="hidden" value={returnPath} />
                            <div className="flex items-center justify-between gap-3 text-sm text-white/66">
                              <span>Buy this photo</span>
                              <span className="font-semibold text-white">{money.format(photo.price || 0)}</span>
                            </div>
                            <button className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
                              Buy photo
                            </button>
                          </form>
                        ) : (
                          <div className="mt-4 rounded-[1rem] border border-[rgba(207,114,79,0.18)] bg-[rgba(207,114,79,0.08)] px-4 py-3 text-sm text-white/70">
                            Client purchase required: {money.format(photo.price || 0)}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
