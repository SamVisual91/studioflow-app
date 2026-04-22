"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  createDefaultContractDocument,
  getContractDocumentSummary,
  serializeContractDocument,
  type ContractDocument,
} from "@/lib/contracts";

type Props = {
  action: (formData: FormData) => Promise<void>;
  initialDocument: ContractDocument;
  formId: string;
  hiddenFields?: Record<string, string>;
  saveLabel: string;
  titleLabel: string;
  helperText: string;
};

type PricingKey =
  | "packagePrice"
  | "creditAmount"
  | "addOnAmount"
  | "travelAmount"
  | "retainerPercent"
  | "retainerDueToday"
  | "remainingBalance"
  | "finalPaymentDue";

const pricingFields: Array<{ label: string; key: PricingKey }> = [
  { label: "Wedding Package", key: "packagePrice" },
  { label: "Credit / Discount", key: "creditAmount" },
  { label: "Add-ons Total", key: "addOnAmount" },
  { label: "Travel fees", key: "travelAmount" },
  { label: "Retainer %", key: "retainerPercent" },
  { label: "Retainer due today", key: "retainerDueToday" },
  { label: "Total Amt Due after retainer", key: "remainingBalance" },
  { label: "Due in full by", key: "finalPaymentDue" },
];

const signatureFont = '"Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive';

function InlineField({
  align = "center",
  className = "",
  onChange,
  placeholder,
  value,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <input
      className={`inline-flex min-w-[7rem] border-0 border-b border-dotted border-[#8f877c] bg-[rgba(31,27,24,0.06)] px-2 py-0.5 text-[inherit] text-[var(--ink)] outline-none transition focus:border-[var(--forest)] focus:bg-[rgba(47,125,92,0.10)] ${
        align === "left" ? "text-left" : "text-center"
      } ${className}`}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}

function AutoGrowTextarea({
  className = "",
  onChange,
  value,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    ref.current.style.height = "0px";
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={`w-full overflow-hidden resize-none border-0 bg-transparent p-0 text-[inherit] text-[var(--ink)] outline-none transition focus:bg-[rgba(47,125,92,0.05)] ${className}`}
      onChange={(event) => onChange(event.target.value)}
      rows={1}
      value={value}
    />
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-8 text-center">
      <div className="mx-auto h-px w-full bg-black/[0.16]" />
      <h3 className="mt-5 text-[1.9rem] font-semibold text-[var(--ink)]">{children}</h3>
    </div>
  );
}

function SignatureBlock({
  dateLabel,
  email,
  name,
  onClickSign,
  personLabel,
}: {
  name: string;
  email: string;
  dateLabel: string;
  personLabel: string;
  onClickSign: () => void;
}) {
  return (
    <button className="w-full text-left" onClick={onClickSign} type="button">
      <div className="min-h-16 border-b-2 border-dashed border-[#7f776b] pb-1">
        <p
          className={`text-[3rem] leading-none text-[var(--ink)] transition ${name ? "" : "opacity-40"}`}
          style={{ fontFamily: signatureFont }}
        >
          {name || "Click to sign"}
        </p>
      </div>
      <div className="mt-2 grid gap-1 text-sm text-[var(--muted)]">
        <p className="font-semibold text-[var(--ink)]">{personLabel}</p>
        <p>{email || "No email added"}</p>
        <p>Signed: {dateLabel || "Pending"}</p>
      </div>
    </button>
  );
}

function getServiceHeading(serviceType: string) {
  const label = serviceType.trim() || "Services";
  return `SERVICES TO BE PROVIDED BY ${label.toUpperCase()}`;
}

export function ContractWorkspace({
  action,
  formId,
  helperText,
  hiddenFields,
  initialDocument,
  saveLabel,
  titleLabel,
}: Props) {
  const [document, setDocument] = useState<ContractDocument>(() => createDefaultContractDocument(initialDocument));

  useEffect(() => {
    setDocument(createDefaultContractDocument(initialDocument));
  }, [initialDocument]);

  const serializedDocument = useMemo(() => serializeContractDocument(document), [document]);
  const summary = useMemo(() => getContractDocumentSummary(document), [document]);

  function updateField<Key extends keyof ContractDocument>(key: Key, value: ContractDocument[Key]) {
    setDocument((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateSection(index: number, key: "heading" | "body", value: string) {
    setDocument((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index
          ? {
              ...section,
              [key]: value,
            }
          : section
      ),
    }));
  }

  function updateDeliverable(index: number, value: string) {
    setDocument((current) => ({
      ...current,
      deliverables: current.deliverables.map((deliverable, deliverableIndex) =>
        deliverableIndex === index ? value : deliverable
      ),
    }));
  }

  function signVendor() {
    setDocument((current) => ({
      ...current,
      vendorSignature: {
        ...current.vendorSignature,
        name: current.vendorSignature.name || current.businessOwner,
        signedAt: new Date().toISOString().slice(0, 10),
        email: current.vendorSignature.email || current.businessEmail,
      },
    }));
  }

  function signClient() {
    setDocument((current) => ({
      ...current,
      clientSignature: {
        ...current.clientSignature,
        name: current.clientSignature.name || current.clientName,
        signedAt: new Date().toISOString().slice(0, 10),
        email: current.clientSignature.email || current.clientEmail,
      },
    }));
  }

  return (
    <form action={action} className="grid gap-6" id={formId}>
      {Object.entries(hiddenFields || {}).map(([key, value]) => (
        <input key={key} name={key} type="hidden" value={value} />
      ))}
      <input name="title" type="hidden" value={document.contractTitle} />
      <input name="summary" type="hidden" value={summary} />
      <input name="status" type="hidden" value={document.clientSignature.signedAt ? "Signed" : "Draft"} />
      <input name="visibility" type="hidden" value="Shared" />
      <input name="body" type="hidden" value={serializedDocument} />

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[1.4rem] border border-black/[0.08] bg-white p-5 shadow-[0_18px_40px_rgba(58,34,17,0.08)]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">{titleLabel}</p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--ink)]">{document.contractTitle}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">{helperText}</p>
        </div>
        <button className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
          {saveLabel}
        </button>
      </div>

      <section className="overflow-hidden rounded-[0.6rem] border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(59,36,17,0.10)]">
        <div
          className="relative overflow-hidden px-8 py-9 text-white sm:px-10"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(17,16,15,0.64), rgba(17,16,15,0.16)), url(${document.heroImage})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="max-w-xl">
            <div className="grid gap-2">
              <InlineField
                align="left"
                className="max-w-xl bg-transparent px-0 text-4xl font-semibold leading-none text-white placeholder:text-white/60 focus:bg-transparent"
                onChange={(value) => updateField("businessName", value)}
                value={document.businessName}
              />
              <InlineField
                align="left"
                className="max-w-md bg-transparent px-0 text-2xl font-semibold text-white placeholder:text-white/60 focus:bg-transparent"
                onChange={(value) => updateField("businessOwner", value)}
                value={document.businessOwner}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[8.5in] px-6 py-8 sm:px-8">
          <div className="grid gap-8 text-[1.02rem] leading-8 text-[var(--muted)]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink)]">
                {document.contractLabel}
              </p>
              <div className="mt-5 text-center">
                <InlineField
                  className="mx-auto max-w-md text-center text-[2rem] font-semibold text-[var(--ink)]"
                  onChange={(value) => updateField("contractTitle", value)}
                  value={document.contractTitle}
                />
                <div className="mt-5 border-t border-black/[0.16] pt-5">
                  <InlineField
                    className="mx-auto max-w-xl text-center text-[2.35rem] font-semibold text-[var(--ink)]"
                    onChange={(value) => updateField("agreementTitle", value)}
                    value={document.agreementTitle}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 text-center">
              <p>
                Entered into on{" "}
                <InlineField
                  className="w-40 text-base"
                  onChange={(value) => updateField("enteredOn", value)}
                  value={document.enteredOn}
                />
                .
              </p>
              <p>
                Event is on{" "}
                <InlineField
                  className="w-40 text-base"
                  onChange={(value) => updateField("eventDate", value)}
                  value={document.eventDate}
                />{" "}
                at{" "}
                <InlineField
                  className="w-56 text-base"
                  onChange={(value) => updateField("venue", value)}
                  value={document.venue}
                />
                .
              </p>
            </div>

            <div className="space-y-5">
              <p>Parties:</p>
              <div className="space-y-2">
                <p>Known as &quot;Vendors&quot;</p>
                <InlineField align="left" className="w-44 text-left" onChange={(value) => updateField("businessName", value)} value={document.businessName} />
                <InlineField align="left" className="w-60 text-left" onChange={(value) => updateField("businessEmail", value)} value={document.businessEmail} />
                <InlineField align="left" className="w-full max-w-xl text-left" onChange={(value) => updateField("businessAddress", value)} value={document.businessAddress} />
                <InlineField align="left" className="w-48 text-left" onChange={(value) => updateField("businessPhone", value)} value={document.businessPhone} />
              </div>
              <p>and</p>
              <div className="space-y-2">
                <p>Known as &quot;Client&quot;</p>
                <InlineField align="left" className="w-48 text-left" onChange={(value) => updateField("clientName", value)} value={document.clientName} />
                <InlineField align="left" className="w-60 text-left" onChange={(value) => updateField("clientEmail", value)} value={document.clientEmail} />
                <InlineField align="left" className="w-full max-w-xl text-left" onChange={(value) => updateField("clientAddress", value)} value={document.clientAddress} />
                <InlineField align="left" className="w-full max-w-md text-left" onChange={(value) => updateField("clientPhone", value)} value={document.clientPhone} />
              </div>
              <p>
                Collectively, all of the above people or businesses entering this Agreement will be referred to as the &quot;Parties.&quot;
              </p>
            </div>

            <SectionHeading>Purpose of the Agreement</SectionHeading>

            <div className="space-y-3">
              <p>
                Client wishes to hire Vendors to provide services relating to Client&apos;s{" "}
                <InlineField
                  className="w-36 text-base"
                  onChange={(value) => updateField("serviceType", value)}
                  value={document.serviceType}
                />{" "}
                as detailed in this Agreement. Vendor has agreed to provide such services according to the terms of this Agreement.
              </p>
            </div>

            {document.sections.map((section, index) => {
              const isServices = section.heading.toLowerCase().includes("services");
              const isPleaseRead =
                section.heading.toLowerCase().includes("cancellation") ||
                section.heading.toLowerCase().includes("illness") ||
                section.heading.toLowerCase().includes("reschedule");

              return (
                <div className="space-y-4" key={`${section.heading}-${index}`}>
                  {isPleaseRead ? (
                    <p className="pt-5 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--ink)]">
                      Please read
                    </p>
                  ) : null}

                  {section.heading === "Terms" ? (
                    <SectionHeading>
                      <span className="underline decoration-black/[0.45] underline-offset-4">Terms</span>
                    </SectionHeading>
                  ) : null}

                  {isServices ? (
                    <div className="pt-2 text-center">
                      <h4 className="text-[1.65rem] font-semibold text-[var(--ink)]">{section.heading}</h4>
                      <p className="mt-8 text-[1.45rem] font-semibold uppercase text-[var(--ink)]">
                        {getServiceHeading(document.businessName)}
                      </p>
                    </div>
                  ) : section.heading !== "Terms" ? (
                    <AutoGrowTextarea
                      className="text-[1.85rem] font-semibold leading-[1.25] text-[var(--ink)]"
                      onChange={(value) => updateSection(index, "heading", value)}
                      value={section.heading}
                    />
                  ) : null}

                  {isServices ? (
                    <div className="space-y-6">
                      <div className="italic text-[var(--muted)]">
                        <InlineField
                          align="left"
                          className="w-72 text-left italic"
                          onChange={(value) => updateField("packageName", value)}
                          value={document.packageName}
                        />
                      </div>

                      <div className="space-y-2">
                        {document.deliverables.map((deliverable, deliverableIndex) => (
                          <InlineField
                            key={`deliverable-${deliverableIndex}`}
                            align="left"
                            className="w-full text-left"
                            onChange={(value) => updateDeliverable(deliverableIndex, value)}
                            value={deliverable}
                          />
                        ))}
                      </div>

                      <div className="space-y-3 pt-4">
                        <p className="font-semibold uppercase tracking-[0.06em] text-[var(--ink)]">
                          Breakdown
                        </p>
                        <div className="space-y-2">
                          {pricingFields.map(({ label, key }) => (
                            <p key={key}>
                              <span className="font-medium text-[var(--ink)]">{label}:</span>{" "}
                              <InlineField
                                align="left"
                                className="w-48 text-left text-base"
                                onChange={(value) => updateField(key, value)}
                                value={String(document[key] || "")}
                              />
                            </p>
                          ))}
                        </div>
                      </div>

                      <label className="grid gap-2 pt-2">
                        <span className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--ink)]">
                          Package notes
                        </span>
                        <AutoGrowTextarea
                          className="leading-8"
                          onChange={(value) => updateField("packageOverview", value)}
                          value={document.packageOverview}
                        />
                      </label>
                    </div>
                  ) : (
                    <AutoGrowTextarea
                      className="whitespace-pre-wrap leading-8"
                      onChange={(value) => updateSection(index, "body", value)}
                      value={section.body}
                    />
                  )}
                </div>
              );
            })}

            <SectionHeading>General Provisions</SectionHeading>

            <div className="space-y-4">
              <p>
                The undersigned have read this contract, understand its terms, and agree to be bound thereby. Any additions, deletions, or revisions must be made in writing and approved by all responsible parties. The parties agree that this contract is the complete and exclusive statement of the mutual understanding of the parties.
              </p>
              <p>
                <span className="font-semibold text-[var(--ink)]">Notice.</span> Parties shall provide effective notice to each other via approved written delivery methods including email.
              </p>
              <div className="space-y-2 pl-4">
                <p>
                  1. Vendor&apos;s Email:{" "}
                  <InlineField
                    align="left"
                    className="w-72 text-left text-base"
                    onChange={(value) => updateField("businessEmail", value)}
                    value={document.businessEmail}
                  />
                </p>
                <p>
                  2. Client Email:{" "}
                  <InlineField
                    align="left"
                    className="w-72 text-left text-base"
                    onChange={(value) => updateField("clientEmail", value)}
                    value={document.clientEmail}
                  />
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t border-black/[0.16] pt-12">
              <div className="grid gap-12 lg:grid-cols-2">
                <SignatureBlock
                  dateLabel={document.vendorSignature.signedAt}
                  email={document.businessEmail}
                  name={document.vendorSignature.name}
                  onClickSign={signVendor}
                  personLabel={document.businessOwner || "Vendor"}
                />
                <SignatureBlock
                  dateLabel={document.clientSignature.signedAt}
                  email={document.clientEmail}
                  name={document.clientSignature.name}
                  onClickSign={signClient}
                  personLabel={document.clientName || "Client"}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}
