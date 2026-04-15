"use client";

import { useState } from "react";
import { submitPackageBrochureSelectionAction } from "@/app/actions";
import { PackageBrochurePreview } from "@/components/package-brochure-preview";

type PreviewPackage = {
  id: string;
  name: string;
  description: string;
  amount: number;
  sections: string[];
  lineItems: Array<{ title?: string; description?: string; amount?: number }>;
};

export function PackageBrochureSelection({
  brochureToken,
  category,
  clientName,
  closingNote,
  coverImage,
  coverPosition,
  initialEmail,
  intro,
  packages,
  projectName,
  title,
}: {
  brochureToken: string;
  category: string;
  clientName: string;
  closingNote: string;
  coverImage: string;
  coverPosition?: string;
  initialEmail: string;
  intro: string;
  packages: PreviewPackage[];
  projectName: string;
  title: string;
}) {
  const [selectedPackageId, setSelectedPackageId] = useState(packages[0]?.id || "");

  return (
    <form className="grid gap-8">
      <input name="token" type="hidden" value={brochureToken} />
      <input name="packageId" type="hidden" value={selectedPackageId} />
      <input name="clientEmail" type="hidden" value={initialEmail} />
      <input name="clientName" type="hidden" value={clientName} />
      <input name="clientNote" type="hidden" value="" />

      <PackageBrochurePreview
        category={category}
        clientName={clientName}
        closingNote={closingNote}
        coverImage={coverImage}
        coverPosition={coverPosition}
        intro={intro}
        onSelectPackage={setSelectedPackageId}
        packages={packages}
        projectName={projectName}
        selectedPackageId={selectedPackageId}
        title={title}
      />

      <section className="border border-black/[0.08] bg-white p-6 shadow-[0_18px_40px_rgba(36,24,14,0.08)]">
        <div className="grid gap-4 border border-black/[0.06] bg-[rgba(247,241,232,0.54)] p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">What happens next</p>
            <div className="grid gap-3 text-sm leading-7 text-[var(--muted)]">
              <p>1. Select the collection that fits best.</p>
              <p>2. Click submit and your selection will be emailed back right away.</p>
              <p>3. We will the contact you to set up a Virtual or in-person meeting.</p>
            </div>
            <button
              className="mt-2 bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedPackageId}
              formAction={submitPackageBrochureSelectionAction}
              type="submit"
            >
              Submit selection
            </button>
        </div>
      </section>
    </form>
  );
}
