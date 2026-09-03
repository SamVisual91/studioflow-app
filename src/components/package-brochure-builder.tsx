"use client";

import { useMemo, useState } from "react";
import { savePackageBrochureAction, sendPackageBrochureAction } from "@/app/actions";
import { PackageBrochurePreview } from "@/components/package-brochure-preview";

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
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>(
    initiallySelectedPackageIds.length > 0 ? initiallySelectedPackageIds : packages.map((item) => item.id)
  );
  const [packageDrafts, setPackageDrafts] = useState<BrochurePackage[]>(packages);

  const previewPackages = useMemo(
    () => packageDrafts.filter((item) => selectedPackageIds.includes(item.id)),
    [packageDrafts, selectedPackageIds]
  );

  function updatePackageDraft(packageId: string, next: Partial<BrochurePackage>) {
    setPackageDrafts((current) =>
      current.map((item) => (item.id === packageId ? { ...item, ...next } : item))
    );
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
      <input name="packageSource" type="hidden" value={initialPackageSource} />
      <input name="title" type="hidden" value={title} />
      <input name="intro" type="hidden" value={intro} />
      <input name="closingNote" type="hidden" value={closingNote} />
      <input name="coverImage" type="hidden" value={coverImage} />
      <input name="recipientEmail" type="hidden" value={recipientEmail} />
      <input name="packageDrafts" type="hidden" value={JSON.stringify(packageDrafts)} />
      {selectedPackageIds.map((packageId) => <input key={packageId} name="selectedPackageIds" type="hidden" value={packageId} />)}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Client package studio</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Edit the details. See the client view live.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Everything here belongs only to {clientName}&apos;s project package. Your master templates are never changed.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]" formAction={savePackageBrochureAction}>
            Save draft
          </button>
          <button className="bg-[var(--sidebar)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110" formAction={sendPackageBrochureAction}>
            Send to client
          </button>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[21rem_minmax(0,1fr)]">
        <aside className="grid gap-5 xl:sticky xl:top-6">
          <section className="grid gap-4 border border-black/[0.08] bg-white p-5 shadow-[0_14px_36px_rgba(59,36,17,0.06)]">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Brochure details</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">These fields update the client preview immediately.</p>
            </div>
            <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">Title<input className="border border-black/[0.08] px-3 py-2.5 text-sm" onChange={(event) => setTitle(event.target.value)} value={title} /></label>
            <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">Welcome message<textarea className="min-h-28 resize-y border border-black/[0.08] px-3 py-2.5 text-sm leading-6" onChange={(event) => setIntro(event.target.value)} value={intro} /></label>
            <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">Closing note<textarea className="min-h-24 resize-y border border-black/[0.08] px-3 py-2.5 text-sm leading-6" onChange={(event) => setClosingNote(event.target.value)} value={closingNote} /></label>
            <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">Banner image URL<input className="border border-black/[0.08] px-3 py-2.5 text-sm" onChange={(event) => setCoverImage(event.target.value)} placeholder="https://..." value={coverImage} /></label>
          </section>

          <section className="grid gap-4 border border-black/[0.08] bg-white p-5 shadow-[0_14px_36px_rgba(59,36,17,0.06)]">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Delivery</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">The email address used when you send this package.</p>
            </div>
            <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">Client email<input className="border border-black/[0.08] px-3 py-2.5 text-sm" onChange={(event) => setRecipientEmail(event.target.value)} placeholder="client@email.com" type="email" value={recipientEmail} /></label>
          </section>

          <section className="grid gap-3 border border-black/[0.08] bg-white p-5 shadow-[0_14px_36px_rgba(59,36,17,0.06)]">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Collections shown</p>
            {packageDrafts.map((pkg) => {
              const isIncluded = selectedPackageIds.includes(pkg.id);
              return (
                <button key={pkg.id} className={`flex items-center justify-between gap-3 border px-3 py-3 text-left text-sm transition ${isIncluded ? "border-[rgba(47,125,92,0.28)] bg-[rgba(47,125,92,0.08)] text-[var(--forest)]" : "border-black/[0.08] bg-white text-[var(--muted)]"}`} onClick={() => togglePackage(pkg.id)} type="button">
                  <span className="min-w-0 truncate font-semibold">{pkg.name || "Untitled package"}</span>
                  <span className="shrink-0 text-xs uppercase tracking-[0.14em]">{isIncluded ? "Shown" : "Hidden"}</span>
                </button>
              );
            })}
          </section>
        </aside>

        <div className="grid gap-6">
          <section className="overflow-hidden border border-black/[0.10] bg-[linear-gradient(180deg,#f8f3ed_0%,#f3ece3_42%,#ffffff_100%)] p-4 shadow-[0_20px_60px_rgba(59,36,17,0.10)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-black/[0.08] pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Live client preview</p>
                <p className="mt-1 text-sm text-[var(--muted)]">This is the same brochure layout your client receives.</p>
              </div>
              <span className="border border-[rgba(47,125,92,0.22)] bg-[rgba(47,125,92,0.08)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">Private draft</span>
            </div>
            {previewPackages.length > 0 ? (
              <PackageBrochurePreview category={category} clientName={clientName} closingNote={closingNote} coverImage={coverImage} coverPosition={previewPackages[0]?.coverPosition || "50% 50%"} intro={intro} packages={previewPackages} projectName={projectName} title={title} />
            ) : (
              <div className="grid min-h-80 place-items-center bg-white px-6 text-center text-sm leading-7 text-[var(--muted)]">Choose at least one collection from the left to preview the client brochure.</div>
            )}
          </section>

          <section className="grid gap-4 border border-black/[0.08] bg-white p-5 shadow-[0_14px_36px_rgba(59,36,17,0.06)]">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Client package details</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Edit each project-owned collection without changing the master library.</p>
            </div>
            {packageDrafts.map((pkg) => (
              <article key={pkg.id} className="grid gap-4 border border-black/[0.08] bg-[rgba(247,241,232,0.42)] p-4 lg:grid-cols-[minmax(0,1fr)_9rem]">
                <div className="grid gap-3">
                  <input className="border border-black/[0.08] bg-white px-3 py-2.5 text-base font-semibold" onChange={(event) => updatePackageDraft(pkg.id, { name: event.target.value })} value={pkg.name} />
                  <textarea className="min-h-20 resize-y border border-black/[0.08] bg-white px-3 py-2.5 text-sm leading-6" onChange={(event) => updatePackageDraft(pkg.id, { description: event.target.value })} value={pkg.description} />
                  <textarea className="min-h-24 resize-y border border-black/[0.08] bg-white px-3 py-2.5 text-sm leading-6" onChange={(event) => updatePackageDraft(pkg.id, { sections: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} placeholder="One included item per line" value={pkg.sections.join("\n")} />
                </div>
                <label className="grid content-start gap-2 text-sm font-medium text-[var(--ink)]">Price<div className="flex items-center border border-black/[0.08] bg-white px-3"><span className="text-[var(--muted)]">$</span><input className="w-full bg-transparent py-2.5 pl-1 text-base font-semibold outline-none" min="0" onChange={(event) => updatePackageDraft(pkg.id, { amount: Number(event.target.value || 0) })} type="number" value={Number(pkg.amount || 0)} /></div></label>
              </article>
            ))}
          </section>
        </div>
      </div>
    </form>
  );
}
