"use client";

import { useEffect, useMemo, useState } from "react";
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

const pricingFields: Array<{ label: string; key: keyof Pick<
  ContractDocument,
  | "packagePrice"
  | "creditAmount"
  | "addOnAmount"
  | "travelAmount"
  | "retainerPercent"
  | "retainerDueToday"
  | "remainingBalance"
  | "finalPaymentDue"
> }> = [
  { label: "Package", key: "packagePrice" },
  { label: "Credit / Discount", key: "creditAmount" },
  { label: "Add-ons", key: "addOnAmount" },
  { label: "Travel", key: "travelAmount" },
  { label: "Retainer %", key: "retainerPercent" },
  { label: "Retainer due today", key: "retainerDueToday" },
  { label: "Remaining balance", key: "remainingBalance" },
  { label: "Final payment due", key: "finalPaymentDue" },
];

const signatureFont = '"Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive';

function EditableField({
  value,
  onChange,
  className = "",
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <input
      className={`min-w-0 border-0 border-b border-dashed border-[#a9a29a] bg-[rgba(31,27,24,0.04)] px-2 py-1 text-center text-[inherit] text-[var(--ink)] outline-none transition focus:border-[var(--forest)] focus:bg-[rgba(47,125,92,0.08)] ${className}`}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}

function SignatureBlock({
  email,
  label,
  name,
  onClickSign,
  signedAt,
}: {
  email: string;
  label: string;
  name: string;
  onClickSign: () => void;
  signedAt: string;
}) {
  return (
    <button
      className="grid gap-2 rounded-[1.2rem] border border-black/[0.08] bg-white px-4 py-4 text-left transition hover:border-[var(--forest)] hover:bg-[rgba(47,125,92,0.04)]"
      onClick={onClickSign}
      type="button"
    >
      <div className="border-b border-dashed border-[#7e776d] pb-2">
        <p
          className={`min-h-10 text-[2.1rem] leading-none text-[var(--ink)] ${name ? "" : "opacity-45"}`}
          style={{ fontFamily: signatureFont }}
        >
          {name || "Click to sign"}
        </p>
      </div>
      <div className="flex items-start justify-between gap-4 text-sm text-[var(--muted)]">
        <div>
          <p className="font-semibold text-[var(--ink)]">{label}</p>
          <p className="mt-1">{email || "No email added"}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-[var(--ink)]">Signed</p>
          <p className="mt-1">{signedAt || "Pending"}</p>
        </div>
      </div>
    </button>
  );
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

      <section className="overflow-hidden rounded-[1.6rem] border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(59,36,17,0.10)]">
        <div
          className="relative overflow-hidden px-8 py-10 text-white"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(17,16,15,0.72), rgba(17,16,15,0.18)), url(${document.heroImage})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.32em] text-white/70">{document.contractLabel}</p>
            <div className="mt-6 grid gap-3">
              <EditableField
                className="max-w-xl text-left text-4xl font-semibold leading-none text-white placeholder:text-white/55"
                onChange={(value) => updateField("businessName", value)}
                placeholder="Business name"
                value={document.businessName}
              />
              <EditableField
                className="max-w-sm text-left text-xl font-semibold text-white placeholder:text-white/55"
                onChange={(value) => updateField("businessOwner", value)}
                placeholder="Business owner"
                value={document.businessOwner}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-8 px-7 py-8 text-[var(--ink)] sm:px-8">
          <div className="grid gap-4 text-center">
            <EditableField
              className="mx-auto max-w-sm text-center text-3xl font-semibold"
              onChange={(value) => updateField("contractTitle", value)}
              placeholder="Contract title"
              value={document.contractTitle}
            />
            <div className="border-t border-black/[0.14] pt-5">
              <EditableField
                className="mx-auto max-w-md text-center text-4xl font-semibold"
                onChange={(value) => updateField("agreementTitle", value)}
                placeholder="Agreement title"
                value={document.agreementTitle}
              />
            </div>
          </div>

          <div className="grid gap-4 text-center text-lg leading-8 text-[var(--muted)]">
            <p>
              Entered into on{" "}
              <EditableField
                className="w-40 text-base"
                onChange={(value) => updateField("enteredOn", value)}
                value={document.enteredOn}
              />{" "}
              .
            </p>
            <p>
              Event is on{" "}
              <EditableField
                className="w-40 text-base"
                onChange={(value) => updateField("eventDate", value)}
                value={document.eventDate}
              />{" "}
              at{" "}
              <EditableField
                className="w-56 text-base"
                onChange={(value) => updateField("venue", value)}
                value={document.venue}
              />{" "}
              .
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="grid gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Vendor</p>
              <EditableField className="text-left text-lg font-semibold" onChange={(value) => updateField("businessName", value)} value={document.businessName} />
              <EditableField className="text-left" onChange={(value) => updateField("businessEmail", value)} value={document.businessEmail} />
              <EditableField className="text-left" onChange={(value) => updateField("businessAddress", value)} value={document.businessAddress} />
              <EditableField className="text-left" onChange={(value) => updateField("businessPhone", value)} value={document.businessPhone} />
            </div>
            <div className="grid gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Client</p>
              <EditableField className="text-left text-lg font-semibold" onChange={(value) => updateField("clientName", value)} value={document.clientName} />
              <EditableField className="text-left" onChange={(value) => updateField("clientEmail", value)} value={document.clientEmail} />
              <EditableField className="text-left" onChange={(value) => updateField("clientAddress", value)} value={document.clientAddress} />
              <EditableField className="text-left" onChange={(value) => updateField("clientPhone", value)} value={document.clientPhone} />
            </div>
          </div>

          <div className="grid gap-3 rounded-[1.3rem] bg-[rgba(247,241,232,0.58)] p-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Service type</p>
                <EditableField className="text-left font-semibold" onChange={(value) => updateField("serviceType", value)} value={document.serviceType} />
              </div>
              <div className="grid gap-2">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Collection</p>
                <EditableField className="text-left font-semibold" onChange={(value) => updateField("packageName", value)} value={document.packageName} />
              </div>
            </div>
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Overview</span>
              <textarea
                className="min-h-20 rounded-[1rem] border border-black/[0.08] bg-white px-4 py-3 text-sm leading-7 text-[var(--ink)] outline-none transition focus:border-[var(--forest)]"
                onChange={(event) => updateField("packageOverview", event.target.value)}
                value={document.packageOverview}
              />
            </label>
            <div className="grid gap-2">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Deliverables</p>
              <div className="grid gap-2">
                {document.deliverables.map((deliverable, index) => (
                  <EditableField
                    key={`deliverable-${index}`}
                    className="text-left"
                    onChange={(value) => updateDeliverable(index, value)}
                    value={deliverable}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.3rem] bg-[rgba(247,241,232,0.58)] p-5 md:grid-cols-2 xl:grid-cols-4">
            {pricingFields.map(({ label, key }) => (
              <label className="grid gap-2" key={key}>
                <span className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</span>
                <EditableField
                  className="text-left font-semibold"
                  onChange={(value) => updateField(key, value)}
                  value={String(document[key] || "")}
                />
              </label>
            ))}
          </div>

          <div className="grid gap-6">
            {document.sections.map((section, index) => (
              <div className="grid gap-3 border-t border-black/[0.12] pt-6" key={`${section.heading}-${index}`}>
                <EditableField
                  className="max-w-xl text-left text-2xl font-semibold"
                  onChange={(value) => updateSection(index, "heading", value)}
                  value={section.heading}
                />
                <textarea
                  className="min-h-32 rounded-[1rem] border border-black/[0.08] bg-white px-4 py-3 text-base leading-8 text-[var(--ink)] outline-none transition focus:border-[var(--forest)]"
                  onChange={(event) => updateSection(index, "body", event.target.value)}
                  value={section.body}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 border-t border-black/[0.12] pt-8 lg:grid-cols-2">
            <SignatureBlock
              email={document.vendorSignature.email || document.businessEmail}
              label={document.businessOwner || "Vendor"}
              name={document.vendorSignature.name}
              onClickSign={signVendor}
              signedAt={document.vendorSignature.signedAt}
            />
            <SignatureBlock
              email={document.clientSignature.email || document.clientEmail}
              label={document.clientName || "Client"}
              name={document.clientSignature.name}
              onClickSign={signClient}
              signedAt={document.clientSignature.signedAt}
            />
          </div>
        </div>
      </section>
    </form>
  );
}
