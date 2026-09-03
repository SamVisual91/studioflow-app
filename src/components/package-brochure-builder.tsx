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
  lineItems: Array<{ id?: string; title?: string; description?: string; amount?: number; quantity?: number; unitAmount?: number }>;
  coverImage?: string;
  coverPosition?: string;
  emailBody?: string;
  emailSubject?: string;
  projectId?: string;
  proposalTitle?: string;
  sourceTemplateId?: string;
  status?: string;
  subtitle?: string;
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
  initialPackageSource = "project",
  initiallySelectedPackageIds,
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
  initialPackageSource?: string;
  initiallySelectedPackageIds: string[];
  packages: BrochurePackage[];
}) {
  const [title, setTitle] = useState(initialTitle);
  const [intro, setIntro] = useState(initialIntro);
  const [closingNote, setClosingNote] = useState(initialClosingNote);
  const [coverImage, setCoverImage] = useState(initialCoverImage);
  const [recipientEmail, setRecipientEmail] = useState(initialRecipientEmail);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>(
    initiallySelectedPackageIds.length > 0 ? initiallySelectedPackageIds : packages.map((item) => item.id)
  );
  const [packageDrafts, setPackageDrafts] = useState<BrochurePackage[]>(packages);

  const previewPackages = useMemo(
    () => packageDrafts.filter((item) => selectedPackageIds.includes(item.id)),
    [packageDrafts, selectedPackageIds]
  );
  const startingAt = previewPackages.length > 0 ? Math.min(...previewPackages.map((item) => Number(item.amount || 0))) : 0;
  const heroStyle = coverImage
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(26,22,19,0.82), rgba(68,52,43,0.72)), url(${coverImage})`,
        backgroundPosition: previewPackages[0]?.coverPosition || "50% 50%",
      }
    : { backgroundImage: "linear-gradient(135deg,rgba(26,22,19,0.92),rgba(68,52,43,0.82))" };

  function updatePackage(packageId: string, next: Partial<BrochurePackage>) {
    setPackageDrafts((current) => current.map((item) => (item.id === packageId ? { ...item, ...next } : item)));
  }

  function togglePackage(packageId: string) {
    setSelectedPackageIds((current) =>
      current.includes(packageId) ? current.filter((id) => id !== packageId) : [...current, packageId]
    );
  }

  function updateSection(packageId: string, index: number, value: string) {
    const packageDraft = packageDrafts.find((item) => item.id === packageId);
    if (!packageDraft) return;
    const sections = [...packageDraft.sections];
    sections[index] = value;
    updatePackage(packageId, { sections });
  }

  function removeSection(packageId: string, index: number) {
    const packageDraft = packageDrafts.find((item) => item.id === packageId);
    if (!packageDraft) return;
    updatePackage(packageId, { sections: packageDraft.sections.filter((_, currentIndex) => currentIndex !== index) });
  }

  function addSection(packageId: string) {
    const packageDraft = packageDrafts.find((item) => item.id === packageId);
    if (!packageDraft) return;
    updatePackage(packageId, { sections: [...packageDraft.sections, "New included item"] });
  }

  return (
    <form className="grid gap-6">
      <input name="projectId" type="hidden" value={projectId} />
      <input name="category" type="hidden" value={category} />
      <input name="returnPath" type="hidden" value={returnPath} />
      <input name="selectionIntent" type="hidden" value="custom" />
      <input name="packageSource" type="hidden" value={initialPackageSource} />
      <input name="title" type="hidden" value={title} />
      <input name="intro" type="hidden" value={intro} />
      <input name="closingNote" type="hidden" value={closingNote} />
      <input name="coverImage" type="hidden" value={coverImage} />
      <input name="recipientEmail" type="hidden" value={recipientEmail} />
      <input name="packageDrafts" type="hidden" value={JSON.stringify(packageDrafts)} />
      {selectedPackageIds.map((packageId) => <input key={packageId} name="selectedPackageIds" type="hidden" value={packageId} />)}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Live client brochure</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Click any text in the brochure to edit it. These changes belong only to {clientName}&apos;s project.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]" formAction={savePackageBrochureAction}>
            Save draft
          </button>
          <button className="bg-[var(--sidebar)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110" formAction={sendPackageBrochureAction}>
            Send to client
          </button>
        </div>
      </div>

      <section className="overflow-hidden border border-black/[0.10] bg-[linear-gradient(180deg,#f8f3ed_0%,#f3ece3_42%,#ffffff_100%)] p-4 shadow-[0_20px_60px_rgba(59,36,17,0.10)] sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.08] pb-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Client preview</p>
          <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
            <span>Sending to {recipientEmail || "client email not set"}</span>
            <button className="font-semibold text-[var(--forest)] underline underline-offset-4" onClick={() => setIsEditingCover((value) => !value)} type="button">
              {isEditingCover ? "Done" : "Change cover"}
            </button>
          </div>
        </div>

        {isEditingCover ? (
          <div className="mb-5 grid gap-2 border border-black/[0.08] bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <input className="min-w-0 border-0 bg-transparent text-sm outline-none" onChange={(event) => setCoverImage(event.target.value)} placeholder="Paste a cover image URL" value={coverImage} />
            <input className="min-w-0 border-l border-black/[0.08] bg-transparent pl-3 text-sm outline-none" onChange={(event) => setRecipientEmail(event.target.value)} placeholder="Client email" type="email" value={recipientEmail} />
          </div>
        ) : null}

        {previewPackages.length > 0 ? (
          <div className="grid gap-10">
            <div className="overflow-hidden border border-black/[0.08] bg-cover bg-center text-white shadow-[0_30px_80px_rgba(36,24,14,0.16)]" style={heroStyle}>
              <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12">
                <div className="grid gap-5">
                  <p className="text-xs uppercase tracking-[0.32em] text-white/66">{category} brochure</p>
                  <input className="w-full border-0 bg-transparent p-0 font-display text-[clamp(2.8rem,6vw,5.25rem)] leading-[0.96] text-white outline-none placeholder:text-white/70" onChange={(event) => setTitle(event.target.value)} placeholder={projectName} value={title} />
                  <textarea className="min-h-28 max-w-2xl resize-none border-0 bg-transparent p-0 text-base leading-8 text-white/76 outline-none placeholder:text-white/60 sm:text-lg" onChange={(event) => setIntro(event.target.value)} placeholder="Write a short welcome message" value={intro} />
                </div>
                <div className="grid content-start gap-4 border border-white/10 bg-white/8 p-6">
                  <div><p className="text-xs uppercase tracking-[0.24em] text-white/58">Included collections</p><p className="mt-3 text-4xl font-semibold">{previewPackages.length}</p></div>
                  <div><p className="text-xs uppercase tracking-[0.24em] text-white/58">Starting at</p><p className="mt-3 text-2xl font-semibold">{currencyFormatter.format(startingAt)}</p></div>
                  <textarea className="min-h-28 resize-none border-0 bg-transparent p-0 text-sm leading-7 text-white/68 outline-none placeholder:text-white/56" onChange={(event) => setClosingNote(event.target.value)} placeholder="Add a closing note" value={closingNote} />
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {previewPackages.map((pkg, index) => (
                <article key={pkg.id} className="grid overflow-hidden border border-black/[0.08] bg-white shadow-[0_20px_60px_rgba(36,24,14,0.08)]">
                  <div className="relative h-40 border-b border-black/[0.06] bg-cover bg-center" style={pkg.coverImage ? { backgroundImage: `linear-gradient(180deg, rgba(234,226,214,0.44), rgba(66,58,52,0.82)), url(${pkg.coverImage})`, backgroundPosition: pkg.coverPosition || "50% 50%" } : { backgroundImage: "linear-gradient(180deg, rgba(234,226,214,0.88) 0%, rgba(82,74,67,0.92) 100%)" }}>
                    <div className="absolute inset-x-0 bottom-0 grid gap-2 bg-gradient-to-t from-black/34 via-black/10 to-transparent px-5 pb-5 pt-10 text-white">
                      <input className="w-full border-0 bg-transparent p-0 font-display text-[2rem] leading-none text-white outline-none placeholder:text-white/70" onChange={(event) => updatePackage(pkg.id, { name: event.target.value })} placeholder="Collection name" value={pkg.name} />
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/88">{index === 0 ? "Primary Collection" : `Collection ${index + 1}`}</p>
                    </div>
                  </div>
                  <div className="grid gap-5 px-6 py-6">
                    <textarea className="min-h-28 resize-none border-0 bg-transparent p-0 text-[0.98rem] leading-10 text-[var(--ink)] outline-none placeholder:text-[var(--muted)]" onChange={(event) => updatePackage(pkg.id, { description: event.target.value })} placeholder="Describe this collection" value={pkg.description} />
                    <div className="grid gap-3">
                      <p className="text-sm font-semibold text-[var(--ink)]">Here&apos;s what you&apos;ll get:</p>
                      <div className="grid gap-4">
                        {pkg.sections.map((section, sectionIndex) => (
                          <div key={`${pkg.id}-${sectionIndex}`} className="group flex gap-3">
                            <span className="pt-1 text-sm text-[var(--ink)]">-</span>
                            <input className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-9 text-[var(--ink)] outline-none placeholder:text-[var(--muted)]" onChange={(event) => updateSection(pkg.id, sectionIndex, event.target.value)} value={section} />
                            <button aria-label="Remove included item" className="text-xs text-[var(--muted)] opacity-0 transition hover:text-[var(--accent)] focus:opacity-100 group-hover:opacity-100" onClick={() => removeSection(pkg.id, sectionIndex)} type="button">×</button>
                          </div>
                        ))}
                        <button className="w-fit text-left text-xs font-semibold uppercase tracking-[0.16em] text-[var(--forest)]" onClick={() => addSection(pkg.id)} type="button">+ Add included item</button>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 border-t border-black/[0.06] px-6 py-5">
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex items-end gap-2"><span className="font-display text-3xl font-semibold leading-none text-[#7e6858]">$</span><input className="w-28 border-0 bg-transparent p-0 font-display text-4xl font-semibold leading-none text-[#7e6858] outline-none" min="0" onChange={(event) => updatePackage(pkg.id, { amount: Number(event.target.value || 0) })} type="number" value={Number(pkg.amount || 0)} /></div>
                      <button className="bg-[rgba(149,141,126,0.74)] px-5 py-3 text-sm font-semibold text-white" onClick={() => togglePackage(pkg.id)} type="button">Hide</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid min-h-80 place-items-center bg-white px-6 text-center text-sm leading-7 text-[var(--muted)]">Choose a collection to preview the client brochure.</div>
        )}

        {packageDrafts.some((pkg) => !selectedPackageIds.includes(pkg.id)) ? (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-black/[0.08] pt-5">
            <span className="py-2 text-sm text-[var(--muted)]">Hidden collections:</span>
            {packageDrafts.filter((pkg) => !selectedPackageIds.includes(pkg.id)).map((pkg) => <button key={pkg.id} className="border border-black/[0.08] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)]" onClick={() => togglePackage(pkg.id)} type="button">Show {pkg.name || "collection"}</button>)}
          </div>
        ) : null}
      </section>
    </form>
  );
}
