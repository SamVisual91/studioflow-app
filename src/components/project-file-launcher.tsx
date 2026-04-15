"use client";

import { useMemo, useState } from "react";
import { sendPackageBrochureAction } from "@/app/actions";
import { smartFileTypes } from "@/lib/project-files";

type PackagePreset = {
  id: string;
  category: string;
  name: string;
  description: string;
  amount: number;
  sections: string[];
  lineItems: Array<{
    title: string;
    description: string;
    amount: number;
  }>;
  coverImage?: string;
  templateSetId?: string;
  templateSetName?: string;
  templateSetOrder?: number;
};

type TemplateUsage = {
  count: number;
  lastUsedAt: string;
};

type TemplateFilter = "MOST_USED" | "RECENT" | "ALL" | "Wedding" | "Business" | "Others";

function normalizeProjectCategory(projectType: string) {
  const value = projectType.trim().toLowerCase();

  if (value === "wedding") {
    return "Wedding";
  }

  if (
    value === "business" ||
    value === "brand" ||
    value === "commercial" ||
    value === "campaign" ||
    value === "corporate"
  ) {
    return "Business";
  }

  return "Others";
}

function normalizePackagePresetCategory(category: string) {
  const value = category.trim().toLowerCase();

  if (value === "wedding" || value === "weddings") {
    return "Wedding";
  }

  if (value === "business" || value === "businesses" || value === "brand" || value === "commercial") {
    return "Business";
  }

  return "Others";
}

export function ProjectFileLauncher({
  clientName,
  packagePresets,
  projectId,
  projectName,
  projectType,
}: {
  clientName: string;
  packagePresets: PackagePreset[];
  projectId: string;
  projectName: string;
  projectType: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPackageChooserOpen, setIsPackageChooserOpen] = useState(false);
  const [usageMap, setUsageMap] = useState<Record<string, TemplateUsage>>(() => {
    if (typeof window === "undefined") {
      return {};
    }
    try {
      const stored = window.localStorage.getItem("studioflow-package-template-usage");
      return stored ? (JSON.parse(stored) as Record<string, TemplateUsage>) : {};
    } catch {
      return {};
    }
  });
  const [activeTemplateFilter, setActiveTemplateFilter] = useState<TemplateFilter>("MOST_USED");
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const items = useMemo(() => smartFileTypes, []);
  const packageCategory = normalizeProjectCategory(projectType);

  const brochureTemplates = useMemo(() => {
    return Array.from(
      packagePresets.reduce((groups, preset) => {
        const key = preset.templateSetId || preset.id;
        const current = groups.get(key) || [];
        current.push(preset);
        groups.set(key, current);
        return groups;
      }, new Map<string, PackagePreset[]>())
    )
      .map(([groupId, presets]) => {
        const sortedPresets = [...presets].sort((left, right) => {
          const orderDelta = Number(left.templateSetOrder || 0) - Number(right.templateSetOrder || 0);
          if (orderDelta !== 0) {
            return orderDelta;
          }
          return Number(left.amount || 0) - Number(right.amount || 0);
        });
        const representative = sortedPresets[0];
        const category = normalizePackagePresetCategory(representative.category);

        return {
          category,
          count: sortedPresets.length,
          groupId,
          isSuggested: category === packageCategory,
          packages: sortedPresets.map((preset) => ({
            amount: Number(preset.amount || 0),
            description: preset.description || "",
            id: preset.id,
            lineItems: preset.lineItems || [],
            name: preset.name,
            sections: preset.sections || [],
          })),
          presetId: representative.id,
          previewImage: representative.coverImage || "",
          setName: representative.templateSetName || representative.name,
          summary:
            representative.description ||
            `Use this ${category.toLowerCase()} brochure template for the client package flow.`,
          templateSetId: representative.templateSetId || "",
        };
      })
      .sort((left, right) => {
        const suggestedDelta = Number(right.isSuggested) - Number(left.isSuggested);
        if (suggestedDelta !== 0) {
          return suggestedDelta;
        }
        const orderDelta = Number(left.packages[0]?.amount || 0) - Number(right.packages[0]?.amount || 0);
        if (orderDelta !== 0) {
          return orderDelta;
        }
        return left.setName.localeCompare(right.setName);
      });
  }, [packageCategory, packagePresets]);

  const filteredBrochureTemplates = useMemo(() => {
    const templatesWithUsage = brochureTemplates.map((template) => ({
      ...template,
      usage: usageMap[template.templateSetId || template.groupId] || { count: 0, lastUsedAt: "" },
    }));

    let filteredTemplates = templatesWithUsage;

    if (activeTemplateFilter === "MOST_USED") {
      filteredTemplates = [...templatesWithUsage]
        .sort((left, right) => {
          const countDelta = right.usage.count - left.usage.count;
          if (countDelta !== 0) {
            return countDelta;
          }
          return Number(right.isSuggested) - Number(left.isSuggested);
        })
        .filter((template, index) => template.usage.count > 0 || index < 6);
    } else if (activeTemplateFilter === "RECENT") {
      filteredTemplates = [...templatesWithUsage]
        .sort((left, right) => {
          const leftTime = left.usage.lastUsedAt ? new Date(left.usage.lastUsedAt).getTime() : 0;
          const rightTime = right.usage.lastUsedAt ? new Date(right.usage.lastUsedAt).getTime() : 0;
          return rightTime - leftTime;
        })
        .filter((template, index) => template.usage.lastUsedAt || index < 6);
    } else if (activeTemplateFilter !== "ALL") {
      filteredTemplates = templatesWithUsage.filter((template) => template.category === activeTemplateFilter);
    }

    const searchValue = templateSearch.trim().toLowerCase();
    if (!searchValue) {
      return filteredTemplates;
    }

    return filteredTemplates.filter((template) => {
      return (
        template.setName.toLowerCase().includes(searchValue) ||
        template.summary.toLowerCase().includes(searchValue) ||
        template.category.toLowerCase().includes(searchValue)
      );
    });
  }, [activeTemplateFilter, brochureTemplates, templateSearch, usageMap]);

  const selectedTemplate =
    filteredBrochureTemplates.find((template) => template.groupId === selectedTemplateId) ||
    brochureTemplates.find((template) => template.groupId === selectedTemplateId) ||
    filteredBrochureTemplates[0] ||
    brochureTemplates[0] ||
    null;

  function trackTemplateUsage(templateKey: string) {
    const timestamp = new Date().toISOString();
    setUsageMap((current) => {
      const next = {
        ...current,
        [templateKey]: {
          count: Number(current[templateKey]?.count || 0) + 1,
          lastUsedAt: timestamp,
        },
      };
      try {
        window.localStorage.setItem("studioflow-package-template-usage", JSON.stringify(next));
      } catch {
        // Ignore local storage write issues.
      }
      return next;
    });
  }

  function openTemplateStudio() {
    if (!selectedTemplate) {
      return;
    }

    trackTemplateUsage(selectedTemplate.templateSetId || selectedTemplate.groupId);
    window.open(
      `/packages/new?category=${encodeURIComponent(selectedTemplate.category)}&templateSetId=${encodeURIComponent(selectedTemplate.templateSetId || "")}&presetId=${encodeURIComponent(selectedTemplate.presetId)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function openBuilder(fileType: string) {
    const params = new URLSearchParams({ type: fileType });
    if (fileType === "PACKAGES") {
      setActiveTemplateFilter((current) => {
        if (current === "MOST_USED" || current === "RECENT") {
          return current;
        }
        return packageCategory;
      });
      setTemplateSearch("");
      setSelectedTemplateId("");
      setIsPackageChooserOpen(true);
      setIsOpen(false);
      return;
    }
    if (fileType === "INVOICE") {
      window.open(`/projects/${projectId}/invoices/new`, "_blank", "noopener,noreferrer");
      setIsOpen(false);
      return;
    }
    if (fileType === "VIDEO_PAYWALL") {
      window.open(`/projects/${projectId}/video-paywalls/new`, "_blank", "noopener,noreferrer");
      setIsOpen(false);
      return;
    }
    window.open(`/projects/${projectId}/files/new?${params.toString()}`, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        className="rounded-full bg-[var(--sidebar)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        Create file
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-30 mt-3 min-w-[15rem] overflow-hidden rounded-[1.25rem] border border-black/[0.08] bg-white shadow-[0_18px_40px_rgba(59,36,17,0.14)]">
          <div className="border-b border-black/[0.06] px-4 py-3 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
            Choose file type
          </div>
          <div className="grid">
            {items.map((item) => (
              <button
                key={item.value}
                className="px-4 py-3 text-left text-sm font-medium text-[var(--ink)] transition hover:bg-[rgba(207,114,79,0.08)] hover:text-[var(--accent)]"
                onClick={() => openBuilder(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {isPackageChooserOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 px-4 py-8">
          <div className="flex max-h-[88vh] w-full max-w-7xl flex-col overflow-hidden border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(36,24,14,0.18)]">
            <div className="flex items-center justify-between gap-4 border-b border-black/[0.08] px-6 py-4">
              <p className="text-base font-medium text-[var(--ink)]">
                Create package brochure in {projectName}
              </p>
              <button
                aria-label="Close package chooser"
                className="text-2xl leading-none text-[var(--muted)] transition hover:text-[var(--ink)]"
                onClick={() => setIsPackageChooserOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[15rem_minmax(20rem,28rem)_minmax(0,1fr)]">
              <aside className="overflow-y-auto border-r border-black/[0.08] bg-[rgba(249,249,247,0.92)] px-4 py-5">
                <div className="grid gap-1">
                  {[
                    { value: "MOST_USED" as const, label: "Most used templates" },
                    { value: "RECENT" as const, label: "Recent templates used" },
                    { value: "ALL" as const, label: "Template gallery" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      className={`px-2 py-2 text-left text-sm font-medium transition ${
                        activeTemplateFilter === item.value
                          ? "bg-[rgba(15,23,42,0.06)] text-[var(--ink)]"
                          : "text-[var(--muted)] hover:bg-black/[0.03] hover:text-[var(--ink)]"
                      }`}
                      onClick={() => setActiveTemplateFilter(item.value)}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="mt-5 border-t border-black/[0.08] pt-4">
                  <p className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    All categories
                  </p>
                  <div className="mt-2 grid gap-1">
                    {[
                      { value: "Wedding" as const, label: "Weddings" },
                      { value: "Business" as const, label: "Business" },
                      { value: "Others" as const, label: "Others" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        className={`px-2 py-2 text-left text-sm font-medium transition ${
                          activeTemplateFilter === item.value
                            ? "bg-[rgba(15,23,42,0.06)] text-[var(--ink)]"
                            : "text-[var(--muted)] hover:bg-black/[0.03] hover:text-[var(--ink)]"
                        }`}
                        onClick={() => setActiveTemplateFilter(item.value)}
                        type="button"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="flex min-h-0 flex-col border-r border-black/[0.08]">
                <div className="border-b border-black/[0.08] px-5 py-4">
                  <label className="flex items-center gap-2 border border-black/[0.08] bg-white px-4 py-2.5 text-sm text-[var(--muted)]">
                    <span aria-hidden="true">⌕</span>
                    <input
                      className="w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                      onChange={(event) => setTemplateSearch(event.target.value)}
                      placeholder="Search templates"
                      type="text"
                      value={templateSearch}
                    />
                  </label>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { value: "Wedding" as const, label: "Weddings" },
                      { value: "Business" as const, label: "Business" },
                      { value: "Others" as const, label: "Others" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        className={`px-3 py-2 text-sm font-medium transition ${
                          activeTemplateFilter === item.value
                            ? "bg-[rgba(92,111,255,0.14)] text-[#4356d6]"
                            : "bg-[rgba(15,23,42,0.04)] text-[var(--ink)] hover:bg-[rgba(15,23,42,0.08)]"
                        }`}
                        onClick={() => setActiveTemplateFilter(item.value)}
                        type="button"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  <span>
                    {filteredBrochureTemplates.length} template
                    {filteredBrochureTemplates.length === 1 ? "" : "s"} available
                  </span>
                  <span>{packageCategory} suggested first</span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto border-t border-black/[0.08]">
                  {filteredBrochureTemplates.length === 0 ? (
                    <div className="px-5 py-10 text-sm leading-7 text-[var(--muted)]">
                      No templates match this view yet. Try another category or create a new template first.
                    </div>
                  ) : (
                    filteredBrochureTemplates.map((option) => {
                      const isSelected = (selectedTemplate?.groupId || "") === option.groupId;
                      return (
                        <button
                          key={option.groupId}
                          className={`grid min-h-[5rem] w-full grid-cols-[3.5rem_minmax(0,1fr)] gap-4 border-b border-black/[0.08] px-5 py-4 text-left transition ${
                            isSelected ? "bg-[rgba(15,23,42,0.05)]" : "bg-white hover:bg-[rgba(15,23,42,0.02)]"
                          }`}
                          onClick={() => {
                            setSelectedTemplateId(option.groupId);
                            trackTemplateUsage(option.templateSetId || option.groupId);
                          }}
                          type="button"
                        >
                          <div
                            className="h-12 w-14 border border-black/[0.08] bg-[rgba(15,23,42,0.04)] bg-cover bg-center"
                            style={
                              option.previewImage
                                ? { backgroundImage: `url(${option.previewImage})` }
                                : undefined
                            }
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--ink)]">
                              {option.setName}
                            </p>
                            <p className="mt-1 text-xs text-[var(--muted)]">
                              {option.count} collection{option.count === 1 ? "" : "s"} in {option.category}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex min-h-0 flex-col bg-[rgba(250,248,244,0.72)]">
                {selectedTemplate ? (
                  <>
                    <div className="flex items-center justify-between gap-4 border-b border-black/[0.08] px-6 py-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Preview</p>
                        <h3 className="mt-1 text-lg font-semibold text-[var(--ink)]">
                          {selectedTemplate.setName}
                        </h3>
                      </div>
                      <button
                        className="border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                        onClick={openTemplateStudio}
                        type="button"
                      >
                        Edit template
                      </button>
                    </div>

                    <div className="grid min-h-0 flex-1 content-start gap-5 px-6 py-6">
                      <div className="border border-black/[0.08] bg-white p-5">
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                          Selected template
                        </p>
                        <h4 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                          {selectedTemplate.setName}
                        </h4>
                        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                          {selectedTemplate.summary}
                        </p>
                      </div>

                      <div className="border border-black/[0.08] bg-white p-5">
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                          Included collections
                        </p>
                        <div className="mt-4 grid gap-3">
                          {selectedTemplate.packages.map((preset, index) => (
                            <div
                              key={preset.id}
                              className="flex items-center justify-between gap-4 border border-black/[0.06] bg-[rgba(247,241,232,0.42)] px-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--ink)]">
                                  Collection {index + 1}: {preset.name}
                                </p>
                                <p className="mt-1 text-xs text-[var(--muted)]">
                                  {selectedTemplate.category}
                                </p>
                              </div>
                              <p className="shrink-0 text-sm font-semibold text-[var(--ink)]">
                                ${Number(preset.amount || 0).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <form className="border-t border-black/[0.08] bg-white px-6 py-4">
                      <input name="projectId" type="hidden" value={projectId} />
                      <input name="category" type="hidden" value={selectedTemplate.category} />
                      <input name="returnPath" type="hidden" value={`/projects/${projectId}`} />
                      <input name="selectionIntent" type="hidden" value="custom" />
                      <input name="title" type="hidden" value={projectName} />
                      <input
                        name="intro"
                        type="hidden"
                        value={`${clientName}, here is the current ${selectedTemplate.category.toLowerCase()} package brochure. Everything on this page stays synced with the latest package templates, so you are always seeing the current lineup.`}
                      />
                      <input
                        name="closingNote"
                        type="hidden"
                        value="Reply directly to your email thread when you are ready, and I can tailor the right collection around your priorities, timeline, or coverage needs."
                      />
                      <input name="coverImage" type="hidden" value={selectedTemplate.previewImage || ""} />
                      {selectedTemplate.packages.map((preset) => (
                        <input key={preset.id} name="selectedPackageIds" type="hidden" value={preset.id} />
                      ))}
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-[var(--muted)]">Send this template lineup directly to {clientName}.</p>
                        <div className="flex items-center gap-3">
                          <button
                            className="border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                            onClick={openTemplateStudio}
                            type="button"
                          >
                            Edit template
                          </button>
                          <button
                            className="bg-[var(--sidebar)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                            formAction={sendPackageBrochureAction}
                            type="submit"
                          >
                            Send to client
                          </button>
                        </div>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="grid min-h-full place-items-center px-6 py-16 text-center text-sm text-[var(--muted)]">
                    Choose a package template to preview it here before sending.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
