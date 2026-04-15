"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { deletePackagePresetAction, updatePackagePresetAction } from "@/app/actions";
import { currencyFormatter } from "@/lib/formatters";

type PackageCategory = {
  value: string;
  label: string;
};

type PackageLineItem = {
  title: string;
  description: string;
  amount: number;
};

type PackagePreset = {
  id: string;
  category: string;
  name: string;
  description: string;
  proposalTitle: string;
  amount: number;
  sections: string[];
  lineItems: PackageLineItem[];
  coverImage: string;
  emailSubject: string;
  emailBody: string;
};

export function PackagePresetStudio({
  preset,
  packageCategories,
  relatedPresets,
}: {
  preset: PackagePreset;
  packageCategories: PackageCategory[];
  relatedPresets: PackagePreset[];
}) {
  const [category, setCategory] = useState(preset.category);
  const [name, setName] = useState(preset.name);
  const [description, setDescription] = useState(preset.description);
  const [proposalTitle, setProposalTitle] = useState(preset.proposalTitle);
  const [amount, setAmount] = useState(String(preset.amount));
  const [sections, setSections] = useState<string[]>(
    preset.sections.length > 0 ? preset.sections : ["Coverage"]
  );
  const [lineItems, setLineItems] = useState<PackageLineItem[]>(
    preset.lineItems.length > 0
      ? preset.lineItems
      : [{ title: "Line item", description: "Describe what is included.", amount: 0 }]
  );
  const [emailSubject, setEmailSubject] = useState(preset.emailSubject);
  const [emailBody, setEmailBody] = useState(preset.emailBody);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  const heroImage = removeCoverImage ? "" : coverPreviewUrl || preset.coverImage;
  const heroStyle = heroImage
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(18,17,19,0.82), rgba(42,39,45,0.68)), url(${heroImage})`,
      }
    : {
        backgroundImage: "linear-gradient(135deg,rgba(17,17,19,0.96),rgba(62,55,48,0.86))",
      };

  const numericAmount = Number(amount || 0);
  const sectionsInput = sections.map((section) => section.trim()).filter(Boolean).join(", ");
  const lineItemsInput = lineItems
    .map((item) => `${item.title} | ${item.description} | ${Number(item.amount || 0)}`)
    .join("\n");

  function updateSection(index: number, value: string) {
    setSections((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function addSection() {
    setSections((current) => [...current, "New section"]);
  }

  function removeSection(index: number) {
    setSections((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateLineItem(index: number, next: Partial<PackageLineItem>) {
    setLineItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...next,
            }
          : item
      )
    );
  }

  function addLineItem() {
    setLineItems((current) => [
      ...current,
      {
        title: "New line item",
        description: "Describe what is included.",
        amount: 0,
      },
    ]);
  }

  function removeLineItem(index: number) {
    setLineItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <form action={updatePackagePresetAction} className="grid gap-8" encType="multipart/form-data">
      <input name="id" type="hidden" value={preset.id} />
      <input name="activeCategory" type="hidden" value={category} />
      <input name="name" type="hidden" value={name} />
      <input name="description" type="hidden" value={description} />
      <input name="proposalTitle" type="hidden" value={proposalTitle} />
      <input name="amount" type="hidden" value={amount} />
      <input name="sections" type="hidden" value={sectionsInput} />
      <input name="lineItems" type="hidden" value={lineItemsInput} />
      <input name="emailSubject" type="hidden" value={emailSubject} />
      <input name="emailBody" type="hidden" value={emailBody} />
      <input name="category" type="hidden" value={category} />
      {removeCoverImage ? <input name="removeCoverImage" type="hidden" value="1" /> : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border border-black/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,242,0.94))] px-5 py-4 shadow-[0_14px_34px_rgba(59,36,17,0.05)]">
        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
          <Link
            className="font-medium text-[var(--ink)] transition hover:text-[var(--forest)]"
            href={`/packages?category=${encodeURIComponent(category)}`}
          >
            Back to package library
          </Link>
          <span>/</span>
          <span>{name || "Package studio"}</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
            Save changes
          </button>
          <button
            className="border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.12)]"
            formAction={deletePackagePresetAction}
          >
            Delete package
          </button>
        </div>
      </div>

      <section
        className="overflow-hidden border border-black/[0.08] bg-cover bg-center text-white shadow-[0_28px_70px_rgba(36,24,14,0.16)]"
        style={heroStyle}
      >
        <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-12">
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="border border-white/14 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white outline-none"
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                {packageCategories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="cursor-pointer border border-white/14 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/16">
                {heroImage ? "Change banner" : "Add banner"}
                <input
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  name="coverImage"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      setCoverPreviewUrl("");
                      return;
                    }
                    const objectUrl = URL.createObjectURL(file);
                    setCoverPreviewUrl((current) => {
                      if (current) {
                        URL.revokeObjectURL(current);
                      }
                      return objectUrl;
                    });
                    setRemoveCoverImage(false);
                  }}
                  type="file"
                />
              </label>
              {preset.coverImage ? (
                <button
                  className="border border-white/14 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/16"
                  onClick={() => setRemoveCoverImage((value) => !value)}
                  type="button"
                >
                  {removeCoverImage ? "Keep banner" : "Remove banner"}
                </button>
              ) : null}
            </div>

            <input
              className="border-0 bg-transparent p-0 font-display text-[clamp(3rem,7vw,5.4rem)] leading-[0.94] text-white outline-none placeholder:text-white/74"
              onChange={(event) => setName(event.target.value)}
              placeholder="Package name"
              value={name}
            />

            <textarea
              className="min-h-28 max-w-3xl resize-none border-0 bg-transparent p-0 text-base leading-8 text-white/78 outline-none placeholder:text-white/62 sm:text-lg"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Write the package story the client will see."
              value={description}
            />
          </div>

          <div className="grid content-start gap-4 border border-white/10 bg-white/8 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/58">Proposal title</p>
              <input
                className="mt-3 w-full border-0 bg-transparent p-0 text-2xl font-semibold text-white outline-none placeholder:text-white/62"
                onChange={(event) => setProposalTitle(event.target.value)}
                placeholder="Proposal title"
                value={proposalTitle}
              />
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/58">Investment</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-semibold text-white">$</span>
                <input
                  className="w-full border-0 bg-transparent p-0 text-5xl font-semibold text-white outline-none placeholder:text-white/62"
                  min="0"
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0"
                  type="number"
                  value={amount}
                />
              </div>
              <p className="mt-2 text-sm text-white/62">
                {currencyFormatter.format(numericAmount)} starting value shown in brochure.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 border border-black/[0.08] bg-white p-6 shadow-[0_16px_34px_rgba(59,36,17,0.07)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Collection lineup</p>
            <h3 className="mt-2 text-2xl font-semibold">See the full category together</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Open any collection below to refine it while keeping the full package story in view.
            </p>
          </div>
          <p className="text-sm text-[var(--muted)]">{relatedPresets.length} collections in this category</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {relatedPresets.map((item, index) => {
            const isActive = item.id === preset.id;
            const cardImage = item.coverImage || heroImage;

            return (
              <Link
                key={item.id}
                className={`grid overflow-hidden border transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(59,36,17,0.08)] ${
                  isActive
                    ? "border-[var(--forest)] bg-[rgba(47,125,92,0.04)]"
                    : "border-black/[0.08] bg-[rgba(255,252,246,0.86)]"
                }`}
                href={`/packages/${item.id}`}
              >
                <div
                  className="relative min-h-[170px] bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.02), rgba(12,10,9,0.38)), url(${cardImage})`,
                  }}
                >
                  <div className="absolute inset-x-0 bottom-0 grid gap-1 p-4 text-white">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/76">
                      Collection {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="text-lg font-semibold leading-tight">{item.name}</p>
                  </div>
                </div>

                <div className="grid gap-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold leading-6 text-[var(--ink)]">{item.name}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        {isActive ? "Currently editing" : "Open collection"}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[var(--accent)]">
                      {currencyFormatter.format(Number(item.amount || 0))}
                    </p>
                  </div>
                  <p className="line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                    {item.description || "A curated package built for this type of project."}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="grid content-start gap-4">
          <div className="grid gap-4 border border-black/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(250,247,242,0.92))] p-6 shadow-[0_16px_34px_rgba(59,36,17,0.07)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">What&apos;s included</p>
              <button
                className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)]"
                onClick={addSection}
                type="button"
              >
                Add section
              </button>
            </div>

            <div className="grid gap-3">
              {sections.map((section, index) => (
                <div key={`${index}-${section}`} className="flex gap-3">
                  <input
                    className="flex-1 border border-black/[0.06] bg-[rgba(247,241,232,0.56)] px-4 py-3 text-sm font-medium leading-6 outline-none"
                    onChange={(event) => updateSection(index, event.target.value)}
                    value={section}
                  />
                  <button
                    className="px-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)] transition hover:text-[var(--accent)]"
                    onClick={() => removeSection(index)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 border border-black/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(250,247,242,0.92))] p-6 shadow-[0_16px_34px_rgba(59,36,17,0.07)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Email defaults</p>
            <input
              className="border-0 bg-transparent p-0 text-xl font-semibold outline-none"
              onChange={(event) => setEmailSubject(event.target.value)}
              placeholder="Email subject"
              value={emailSubject}
            />
            <textarea
              className="min-h-44 resize-none border-0 bg-transparent p-0 text-sm leading-7 text-[var(--muted)] outline-none"
              onChange={(event) => setEmailBody(event.target.value)}
              placeholder="Email body"
              value={emailBody}
            />
          </div>
        </div>

        <div className="grid gap-4 border border-black/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(250,247,242,0.92))] p-6 shadow-[0_16px_34px_rgba(59,36,17,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Package breakdown</p>
            <button
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)]"
              onClick={addLineItem}
              type="button"
            >
              Add line item
            </button>
          </div>

          <div className="overflow-hidden border border-black/[0.06]">
            <table className="min-w-full border-collapse text-left">
              <thead className="bg-[rgba(247,241,232,0.62)] text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold"> </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={`${index}-${item.title}`} className="border-t border-black/[0.06]">
                    <td className="px-4 py-4 align-top">
                      <input
                        className="w-full border-0 bg-transparent p-0 text-sm font-semibold outline-none"
                        onChange={(event) => updateLineItem(index, { title: event.target.value })}
                        value={item.title}
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <textarea
                        className="min-h-20 w-full resize-none border-0 bg-transparent p-0 text-sm leading-7 text-[var(--muted)] outline-none"
                        onChange={(event) =>
                          updateLineItem(index, { description: event.target.value })
                        }
                        value={item.description}
                      />
                    </td>
                    <td className="px-4 py-4 align-top text-right">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-sm font-semibold">$</span>
                        <input
                          className="w-24 border-0 bg-transparent p-0 text-right text-sm font-semibold outline-none"
                          min="0"
                          onChange={(event) =>
                            updateLineItem(index, { amount: Number(event.target.value || 0) })
                          }
                          type="number"
                          value={item.amount}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-right">
                      <button
                        className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)] transition hover:text-[var(--accent)]"
                        onClick={() => removeLineItem(index)}
                        type="button"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </form>
  );
}
