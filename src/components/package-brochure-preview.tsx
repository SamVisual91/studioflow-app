import { currencyFormatter } from "@/lib/formatters";

type PackageLineItem = {
  title?: string;
  description?: string;
  amount?: number;
};

type PackageBrochurePreviewProps = {
  category: string;
  projectName: string;
  clientName: string;
  title: string;
  intro: string;
  closingNote: string;
  coverImage: string;
  coverPosition?: string;
  selectedPackageId?: string;
  selectionButtonLabel?: string;
  onSelectPackage?: (packageId: string) => void;
  packages: Array<{
    id: string;
    name: string;
    description: string;
    amount: number;
    sections: string[];
    lineItems: PackageLineItem[];
    coverImage?: string;
    coverPosition?: string;
  }>;
};

export function getDefaultPackageBrochureContent({
  category,
  projectName,
  clientName,
}: {
  category: string;
  projectName: string;
  clientName: string;
}) {
  return {
    title: projectName,
    intro: `${clientName}, here is the current ${category.toLowerCase()} package brochure. Everything on this page stays synced with the latest package templates, so you are always seeing the current lineup.`,
    closingNote:
      "Reply directly to your email thread when you are ready, and I can tailor the right collection around your priorities, timeline, or coverage needs.",
    coverImage: "",
  };
}

export function PackageBrochurePreview({
  category,
  title,
  intro,
  closingNote,
  coverImage,
  coverPosition = "50% 50%",
  selectedPackageId,
  selectionButtonLabel = "Select this package",
  onSelectPackage,
  packages,
}: PackageBrochurePreviewProps) {
  const startingAt = Math.min(...packages.map((item) => Number(item.amount || 0)));
  const heroStyle = coverImage
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(26,22,19,0.82), rgba(68,52,43,0.72)), url(${coverImage})`,
        backgroundPosition: coverPosition,
      }
    : {
        backgroundImage: "linear-gradient(135deg,rgba(26,22,19,0.92),rgba(68,52,43,0.82))",
      };

  return (
    <div className="grid gap-10">
      <div
        className="overflow-hidden border border-black/[0.08] bg-cover bg-center text-white shadow-[0_30px_80px_rgba(36,24,14,0.16)]"
        style={heroStyle}
      >
        <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12">
          <div className="grid gap-5">
            <p className="text-xs uppercase tracking-[0.32em] text-white/66">{category} brochure</p>
            <h1 className="font-display text-[clamp(2.8rem,6vw,5.25rem)] leading-[0.96]">{title}</h1>
            <p className="max-w-2xl text-base leading-8 text-white/76 sm:text-lg">{intro}</p>
          </div>

          <div className="grid content-start gap-4 border border-white/10 bg-white/8 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/58">Included collections</p>
              <p className="mt-3 text-4xl font-semibold">{packages.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/58">Starting at</p>
              <p className="mt-3 text-2xl font-semibold">{currencyFormatter.format(startingAt)}</p>
            </div>
            <p className="text-sm leading-7 text-white/68">{closingNote}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {packages.map((preset, index) => {
          const isSelected = selectedPackageId === preset.id;
          const hasActiveSelection = Boolean(selectedPackageId);
          return (
          <article
            key={preset.id}
            className={`grid overflow-hidden border bg-white shadow-[0_20px_60px_rgba(36,24,14,0.08)] transition ${
              isSelected
                ? "border-[rgba(47,125,92,0.4)] ring-1 ring-[rgba(47,125,92,0.18)] shadow-[0_26px_75px_rgba(47,125,92,0.12)]"
                : "border-black/[0.08]"
            }`}
          >
            <div
              className={`relative h-40 border-b border-black/[0.06] bg-cover bg-center transition ${
                isSelected
                  ? "brightness-110 saturate-110"
                  : hasActiveSelection
                    ? "brightness-[0.9] saturate-[0.78]"
                    : ""
              }`}
              style={
                preset.coverImage
                  ? {
                      backgroundImage: isSelected
                        ? `linear-gradient(180deg, rgba(234,226,214,0.16), rgba(66,58,52,0.42)), url(${preset.coverImage})`
                        : `linear-gradient(180deg, rgba(234,226,214,0.44), rgba(66,58,52,0.82)), url(${preset.coverImage})`,
                      backgroundPosition: preset.coverPosition || "50% 50%",
                    }
                  : {
                      backgroundImage: isSelected
                        ? "linear-gradient(180deg, rgba(241,234,225,0.92) 0%, rgba(108,97,87,0.82) 100%)"
                        :
                        "linear-gradient(180deg, rgba(234,226,214,0.88) 0%, rgba(82,74,67,0.92) 100%)",
                    }
              }
            >
              <div className="absolute inset-x-0 bottom-0 grid gap-2 bg-gradient-to-t from-black/34 via-black/10 to-transparent px-5 pb-5 pt-10 text-white">
                <p className="font-display text-[2rem] leading-none">{preset.name}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/88">
                  {index === 0 ? "Primary Collection" : `Collection ${index + 1}`}
                </p>
              </div>
            </div>

            <div className="grid gap-5 px-6 py-6">
              <p className="text-[0.98rem] leading-10 text-[var(--ink)]">
                {preset.description || "A curated package built for this type of project."}
              </p>

              <div className="grid gap-3">
                <p className="text-sm font-semibold text-[var(--ink)]">Here&apos;s what you&apos;ll get:</p>
                <div className="grid gap-4">
                  {preset.sections.length > 0 ? (
                    preset.sections.map((section) => (
                      <div key={section} className="flex gap-3">
                        <span className="pt-1 text-sm text-[var(--ink)]">-</span>
                        <p className="text-sm leading-9 text-[var(--ink)]">{section}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-7 text-[var(--muted)]">No package sections added yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 border-t border-black/[0.06] px-6 py-5">
              <div className="flex items-end justify-between gap-3">
                <div className="flex items-end gap-2">
                  <span className="font-display text-3xl font-semibold leading-none text-[#7e6858]">$</span>
                  <p className="font-display text-4xl font-semibold leading-none text-[#7e6858]">
                    {Number(preset.amount || 0).toLocaleString()}
                  </p>
                </div>
                {onSelectPackage ? (
                  <button
                    className={`min-w-[6.75rem] px-5 py-3 text-sm font-semibold transition ${
                      isSelected
                        ? "border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.10)] text-[var(--forest)] hover:bg-[rgba(47,125,92,0.16)]"
                        : "bg-[rgba(149,141,126,0.74)] text-white hover:brightness-110"
                    }`}
                    onClick={() => onSelectPackage(preset.id)}
                    type="button"
                  >
                    {isSelected ? "Selected" : selectionButtonLabel}
                  </button>
                ) : (
                  <span className="bg-[rgba(149,141,126,0.74)] px-5 py-3 text-sm font-semibold text-white">
                    Select
                  </span>
                )}
              </div>
            </div>
          </article>
          );
        })}
      </div>
    </div>
  );
}
