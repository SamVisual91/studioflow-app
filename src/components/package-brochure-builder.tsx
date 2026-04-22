"use client";

import { useMemo, useState } from "react";
import { savePackageBrochureAction, sendPackageBrochureAction } from "@/app/actions";
import { currencyFormatter } from "@/lib/formatters";

type BrochurePackage = {
  id: string;
  name: string;
  description: string;
  amount: number;
  sections: string[];
  lineItems: Array<{ title?: string; description?: string; amount?: number }>;
};

type PackageOverride = {
  name: string;
  description: string;
  amount: number;
};

export function PackageBrochureBuilder({
  category,
  projectId,
  projectName,
  clientName,
  returnPath,
  initialTitle,
  initialIntro,
  initialClosingNote,
  initialCoverImage,
  initialRecipientEmail,
  initiallySelectedPackageIds,
  initialPackageOverrides,
  packages,
}: {
  category: string;
  projectId: string;
  projectName: string;
  clientName: string;
  returnPath: string;
  initialTitle: string;
  initialIntro: string;
  initialClosingNote: string;
  initialCoverImage: string;
  initialRecipientEmail: string;
  initiallySelectedPackageIds: string[];
  initialPackageOverrides: Record<string, PackageOverride>;
  packages: BrochurePackage[];
}) {
  const [title, setTitle] = useState(initialTitle);
  const [intro, setIntro] = useState(initialIntro);
  const [closingNote, setClosingNote] = useState(initialClosingNote);
  const [coverImage, setCoverImage] = useState(initialCoverImage);
  const [recipientEmail, setRecipientEmail] = useState(initialRecipientEmail);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>(
    initiallySelectedPackageIds.length > 0 ? initiallySelectedPackageIds : packages.map((item) => item.id)
  );
  const [packageOverrides, setPackageOverrides] =
    useState<Record<string, PackageOverride>>(initialPackageOverrides);
  const [isEditingCover, setIsEditingCover] = useState(false);

  const previewPackages = useMemo(
    () =>
      packages
        .filter((item) => selectedPackageIds.includes(item.id))
        .map((item) => {
          const override = packageOverrides[item.id];
          return {
            ...item,
            name: override?.name || item.name,
            description: override?.description || item.description,
            amount: typeof override?.amount === "number" ? override.amount : item.amount,
          };
        }),
    [packageOverrides, packages, selectedPackageIds]
  );

  const startingAt =
    previewPackages.length > 0 ? Math.min(...previewPackages.map((item) => Number(item.amount || 0))) : 0;
  const heroStyle = coverImage
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(26,22,19,0.82), rgba(68,52,43,0.72)), url(${coverImage})`,
      }
    : {
        backgroundImage: "linear-gradient(135deg,rgba(26,22,19,0.92),rgba(68,52,43,0.82))",
      };

  function updatePackageOverride(packageId: string, next: Partial<PackageOverride>) {
    setPackageOverrides((current) => ({
      ...current,
      [packageId]: {
        name: next.name ?? current[packageId]?.name ?? packages.find((item) => item.id === packageId)?.name ?? "",
        description:
          next.description ??
          current[packageId]?.description ??
          packages.find((item) => item.id === packageId)?.description ??
          "",
        amount:
          typeof next.amount === "number"
            ? next.amount
            : current[packageId]?.amount ??
              packages.find((item) => item.id === packageId)?.amount ??
              0,
      },
    }));
  }

  function togglePackage(packageId: string) {
    setSelectedPackageIds((current) =>
      current.includes(packageId) ? current.filter((id) => id !== packageId) : [...current, packageId]
    );
  }

  return (
    <form className="grid gap-6">
      <input name="projectId" type="hidden" value={projectId} />
      <input name="category" type="hidden" value={category} />
      <input name="returnPath" type="hidden" value={returnPath} />
      <input name="selectionIntent" type="hidden" value="custom" />
      <input name="title" type="hidden" value={title} />
      <input name="intro" type="hidden" value={intro} />
      <input name="closingNote" type="hidden" value={closingNote} />
      <input name="coverImage" type="hidden" value={coverImage} />
      <input name="recipientEmail" type="hidden" value={recipientEmail} />
      <input name="packageOverrides" type="hidden" value={JSON.stringify(packageOverrides)} />
      {selectedPackageIds.map((packageId) => (
        <input key={packageId} name="selectedPackageIds" type="hidden" value={packageId} />
      ))}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Live brochure preview</p>
          <h2 className="mt-2 text-xl font-semibold">Click directly on the brochure to edit it</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
            formAction={savePackageBrochureAction}
          >
            Save brochure
          </button>
          <button
            className="bg-[var(--sidebar)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            formAction={sendPackageBrochureAction}
          >
            Send brochure to client
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-[1.35rem] border border-black/[0.08] bg-white/84 p-5 shadow-[0_14px_36px_rgba(59,36,17,0.06)]">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Delivery email</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            This is the inbox the package brochure will be sent to. Double-check it before you click send.
          </p>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]">
          Client email
          <input
            className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm"
            onChange={(event) => setRecipientEmail(event.target.value)}
            placeholder="client@email.com"
            type="email"
            value={recipientEmail}
          />
        </label>
      </div>

      <div
        className="overflow-hidden border border-black/[0.08] bg-cover bg-center text-white shadow-[0_30px_80px_rgba(36,24,14,0.16)]"
        style={heroStyle}
      >
        <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12">
          <div className="grid gap-5">
            <p className="text-xs uppercase tracking-[0.32em] text-white/66">{category} brochure</p>
            <input
              className="border-0 bg-transparent p-0 font-display text-[clamp(2.8rem,6vw,5.25rem)] leading-[0.96] text-white outline-none placeholder:text-white/80"
              onChange={(event) => setTitle(event.target.value)}
              placeholder={`${projectName}`}
              value={title}
            />
            <textarea
              className="min-h-24 max-w-2xl resize-none border-0 bg-transparent p-0 text-base leading-8 text-white/76 outline-none placeholder:text-white/64 sm:text-lg"
              onChange={(event) => setIntro(event.target.value)}
              placeholder={`Introduce the ${category.toLowerCase()} brochure here.`}
              value={intro}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="border border-white/16 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/16"
                onClick={() => setIsEditingCover((value) => !value)}
                type="button"
              >
                {coverImage ? "Change banner" : "Add banner"}
              </button>
              <span className="text-xs uppercase tracking-[0.18em] text-white/58">
                {clientName} brochure preview
              </span>
            </div>
            {isEditingCover ? (
              <input
                className="max-w-xl border border-white/16 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/58"
                onChange={(event) => setCoverImage(event.target.value)}
                placeholder="Paste banner image URL"
                value={coverImage}
              />
            ) : null}
          </div>

          <div className="grid content-start gap-4 border border-white/10 bg-white/8 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/58">Included collections</p>
              <p className="mt-3 text-4xl font-semibold">{previewPackages.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/58">Starting at</p>
              <p className="mt-3 text-2xl font-semibold">
                {previewPackages.length > 0 ? currencyFormatter.format(startingAt) : "Select packages"}
              </p>
            </div>
            <textarea
              className="min-h-28 resize-none border-0 bg-transparent p-0 text-sm leading-7 text-white/68 outline-none placeholder:text-white/56"
              onChange={(event) => setClosingNote(event.target.value)}
              placeholder="Add a short note that appears in the hero panel."
              value={closingNote}
            />
            <div className="grid gap-2 border-t border-white/10 pt-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/58">Send to</p>
              <input
                className="border border-white/12 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/56"
                onChange={(event) => setRecipientEmail(event.target.value)}
                placeholder="client@example.com"
                type="email"
                value={recipientEmail}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Included packages</p>
            <h3 className="mt-2 text-xl font-semibold">Toggle packages on or off right here</h3>
          </div>
          <p className="text-sm text-[var(--muted)]">{previewPackages.length} selected</p>
        </div>

        <section className="grid gap-4 border border-black/[0.08] bg-white p-5 shadow-[0_16px_34px_rgba(59,36,17,0.07)]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Choose packages for this brochure</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Click a package below to include or hide it from the final brochure.
            </p>
          </div>

          {packages.length === 0 ? (
            <div className="border border-dashed border-black/[0.12] bg-[rgba(247,241,232,0.42)] px-4 py-5 text-sm leading-7 text-[var(--muted)]">
              No packages were found for this category yet. Add packages in the package manager first, then come back here.
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {packages.map((preset) => {
                const isIncluded = selectedPackageIds.includes(preset.id);
                return (
                  <button
                    key={`quick-toggle-${preset.id}`}
                    className={`px-4 py-3 text-left text-sm font-semibold transition ${
                      isIncluded
                        ? "bg-[var(--forest)] text-white"
                        : "border border-black/[0.08] bg-[rgba(247,241,232,0.42)] text-[var(--ink)] hover:border-[var(--forest)]"
                    }`}
                    onClick={() => togglePackage(preset.id)}
                    type="button"
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {packages.map((preset, index) => {
          const isIncluded = selectedPackageIds.includes(preset.id);
          const override = packageOverrides[preset.id];
          const displayName = override?.name || preset.name;
          const displayDescription = override?.description || preset.description;
          const displayAmount =
            typeof override?.amount === "number" ? override.amount : Number(preset.amount || 0);

          return (
            <article
              key={preset.id}
              className={`overflow-hidden border shadow-[0_20px_60px_rgba(36,24,14,0.08)] transition ${
                isIncluded
                  ? "border-black/[0.08] bg-white"
                  : "border-black/[0.06] bg-[rgba(247,241,232,0.34)] opacity-65"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-6 py-4">
                <div className="flex items-center gap-3">
                  <button
                    className={`px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                      isIncluded
                        ? "bg-[var(--forest)] text-white"
                        : "border border-black/[0.08] bg-white text-[var(--ink)]"
                    }`}
                    onClick={() => togglePackage(preset.id)}
                    type="button"
                  >
                    {isIncluded ? "Included" : "Hidden"}
                  </button>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Collection {String(index + 1).padStart(2, "0")}
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  Click the text below to edit
                </p>
              </div>

              <div className="grid gap-6 px-6 py-6 lg:grid-cols-[0.9fr_0.55fr] lg:px-8">
                <div className="grid gap-4">
                  <input
                    className="border-0 bg-transparent p-0 text-3xl font-semibold outline-none"
                    disabled={!isIncluded}
                    onChange={(event) => updatePackageOverride(preset.id, { name: event.target.value })}
                    value={displayName}
                  />
                  <textarea
                    className="min-h-24 resize-none border-0 bg-transparent p-0 text-sm leading-7 text-[var(--muted)] outline-none"
                    disabled={!isIncluded}
                    onChange={(event) =>
                      updatePackageOverride(preset.id, { description: event.target.value })
                    }
                    value={displayDescription}
                  />
                </div>

                <div className="grid content-start gap-2 border border-black/[0.06] bg-[rgba(247,241,232,0.62)] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Investment</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-semibold text-[var(--accent)]">$</span>
                    <input
                      className="w-full border-0 bg-transparent p-0 text-3xl font-semibold text-[var(--accent)] outline-none"
                      disabled={!isIncluded}
                      min="0"
                      onChange={(event) =>
                        updatePackageOverride(preset.id, { amount: Number(event.target.value || 0) })
                      }
                      type="number"
                      value={displayAmount}
                    />
                  </div>
                  <p className="text-sm leading-7 text-[var(--muted)]">
                    Final package customizations can always be adjusted before booking.
                  </p>
                </div>
              </div>

              {isIncluded ? (
                <div className="grid gap-8 border-t border-black/[0.06] px-6 py-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-8">
                  <div className="grid gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">What&apos;s included</p>
                      <div className="mt-4 grid gap-3">
                        {preset.sections.length > 0 ? (
                          preset.sections.map((section) => (
                            <div
                              key={section}
                              className="border border-black/[0.06] bg-[rgba(247,241,232,0.54)] px-4 py-3 text-sm font-medium leading-6"
                            >
                              {section}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm leading-7 text-[var(--muted)]">No package sections added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Package breakdown</p>
                    <div className="mt-4 overflow-hidden border border-black/[0.06]">
                      <table className="min-w-full border-collapse text-left">
                        <thead className="bg-[rgba(247,241,232,0.62)] text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Item</th>
                            <th className="px-4 py-3 font-semibold">Description</th>
                            <th className="px-4 py-3 text-right font-semibold">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preset.lineItems.length > 0 ? (
                            preset.lineItems.map((item) => (
                              <tr
                                key={`${preset.id}-${item.title}-${item.amount}`}
                                className="border-t border-black/[0.06]"
                              >
                                <td className="px-4 py-4 text-sm font-semibold">{item.title || "Line item"}</td>
                                <td className="px-4 py-4 text-sm leading-7 text-[var(--muted)]">
                                  {item.description || "Package detail"}
                                </td>
                                <td className="px-4 py-4 text-right text-sm font-semibold">
                                  {currencyFormatter.format(Number(item.amount || 0))}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr className="border-t border-black/[0.06]">
                              <td className="px-4 py-4 text-sm text-[var(--muted)]" colSpan={3}>
                                No line items added yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </form>
  );
}
