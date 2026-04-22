"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createDefaultContractDocument, getContractDocumentSummary, serializeContractDocument, type ContractDocument } from "@/lib/contracts";

type Props = {
  action: (formData: FormData) => Promise<void>;
  initialDocument: ContractDocument;
  formId: string;
  hiddenFields?: Record<string, string>;
  saveLabel: string;
  titleLabel: string;
  helperText: string;
};

const signatureFont = '"Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive';

function sanitizeRichText(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

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

function RichTextToolbar({
  activeEditor,
  onKeepSelection,
  onFormatBlock,
  onRun,
}: {
  activeEditor: boolean;
  onKeepSelection: () => void;
  onRun: (command: string, value?: string) => void;
  onFormatBlock: (value: string) => void;
}) {
  const buttonClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-black/[0.08] bg-white px-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[rgba(31,27,24,0.06)] disabled:cursor-not-allowed disabled:opacity-45";
  const keepSelection = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    onKeepSelection();
  };

  return (
    <div className="sticky top-3 z-20 flex flex-wrap items-center gap-2 rounded-[0.9rem] border border-black/[0.08] bg-[#f4efe7] px-3 py-2 shadow-[0_10px_24px_rgba(59,36,17,0.08)]">
      <select
        className="h-9 rounded-md border border-black/[0.08] bg-white px-3 text-sm text-[var(--ink)] outline-none disabled:cursor-not-allowed disabled:opacity-45"
        disabled={!activeEditor}
        onMouseDown={keepSelection}
        onChange={(event) => {
          onFormatBlock(event.target.value);
          event.currentTarget.value = "";
        }}
        defaultValue=""
      >
        <option value="" disabled>
          Format
        </option>
        <option value="P">Paragraph</option>
        <option value="H3">Heading</option>
        <option value="H4">Subheading</option>
        <option value="BLOCKQUOTE">Quote</option>
      </select>
      <button className={buttonClass} disabled={!activeEditor} onClick={() => onRun("bold")} onMouseDown={keepSelection} type="button">
        B
      </button>
      <button className={buttonClass} disabled={!activeEditor} onClick={() => onRun("italic")} onMouseDown={keepSelection} type="button">
        <span className="italic">I</span>
      </button>
      <button className={buttonClass} disabled={!activeEditor} onClick={() => onRun("underline")} onMouseDown={keepSelection} type="button">
        <span className="underline">U</span>
      </button>
      <input
        aria-label="Text color"
        className="h-9 w-11 rounded-md border border-black/[0.08] bg-white p-1 disabled:cursor-not-allowed disabled:opacity-45"
        defaultValue="#1f1b18"
        disabled={!activeEditor}
        onClick={onKeepSelection}
        onMouseDown={keepSelection}
        onChange={(event) => onRun("foreColor", event.target.value)}
        type="color"
      />
      <button className={buttonClass} disabled={!activeEditor} onClick={() => onRun("justifyLeft")} onMouseDown={keepSelection} type="button">
        L
      </button>
      <button className={buttonClass} disabled={!activeEditor} onClick={() => onRun("justifyCenter")} onMouseDown={keepSelection} type="button">
        C
      </button>
      <button className={buttonClass} disabled={!activeEditor} onClick={() => onRun("justifyRight")} onMouseDown={keepSelection} type="button">
        R
      </button>
      <button className={buttonClass} disabled={!activeEditor} onClick={() => onRun("insertUnorderedList")} onMouseDown={keepSelection} type="button">
        •
      </button>
      <button className={buttonClass} disabled={!activeEditor} onClick={() => onRun("insertOrderedList")} onMouseDown={keepSelection} type="button">
        1.
      </button>
      <button className={buttonClass} disabled={!activeEditor} onClick={() => onRun("outdent")} onMouseDown={keepSelection} type="button">
        &lt;
      </button>
      <button className={buttonClass} disabled={!activeEditor} onClick={() => onRun("indent")} onMouseDown={keepSelection} type="button">
        &gt;
      </button>
      <button className={buttonClass} disabled={!activeEditor} onClick={() => onRun("removeFormat")} onMouseDown={keepSelection} type="button">
        Tx
      </button>
    </div>
  );
}

function RichTextField({
  editorId,
  onActivate,
  onChange,
  registerEditor,
  value,
}: {
  editorId: string;
  value: string;
  onChange: (value: string) => void;
  onActivate: (id: string) => void;
  registerEditor: (id: string, node: HTMLDivElement | null) => void;
}) {
  const lastValue = useRef(value);

  useEffect(() => {
    lastValue.current = value;
  }, [value]);

  return (
    <div
      ref={(node) => {
        registerEditor(editorId, node);
        if (node && node.innerHTML !== value) {
          node.innerHTML = value;
        }
      }}
      className="min-h-[5rem] rounded-[0.8rem] border border-black/[0.06] bg-[rgba(31,27,24,0.025)] px-3 py-2 text-[inherit] text-[var(--ink)] outline-none transition focus:border-[var(--forest)] focus:bg-[rgba(47,125,92,0.05)] [&_blockquote]:border-l-4 [&_blockquote]:border-black/20 [&_blockquote]:pl-4 [&_h3]:text-[1.05rem] [&_h3]:font-bold [&_h4]:text-[0.98rem] [&_h4]:font-bold [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_p]:last:mb-0 [&_ul]:list-disc [&_ul]:pl-5"
      contentEditable
      onBlur={(event) => onChange(sanitizeRichText(event.currentTarget.innerHTML))}
      onFocus={() => onActivate(editorId)}
      onInput={(event) => {
        const html = sanitizeRichText(event.currentTarget.innerHTML);
        if (html !== lastValue.current) {
          lastValue.current = html;
          onChange(html);
        }
      }}
      suppressContentEditableWarning
    />
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-8 text-center">
      <div className="mx-auto h-px w-full bg-black/[0.16]" />
      <h3 className="mt-5 text-[1.45rem] font-bold text-[var(--ink)]">{children}</h3>
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
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);
  const [autosaveState, setAutosaveState] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const editorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const savedRangeRef = useRef<Range | null>(null);
  const autosaveResetTimeoutRef = useRef<number | null>(null);
  const hasMountedRef = useRef(false);
  const autosaveProjectId = hiddenFields?.projectId || "";
  const autosaveFileId = hiddenFields?.fileId || "";
  const canAutosave = Boolean(autosaveProjectId && autosaveFileId);

  useEffect(() => {
    setDocument(createDefaultContractDocument(initialDocument));
  }, [initialDocument]);

  useEffect(() => {
    function handleSelectionChange() {
      const selection = globalThis.document.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      const editorId = activeEditorId;
      const editor = editorId ? editorRefs.current[editorId] : null;
      if (!editor) {
        return;
      }

      if (editor.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }

    globalThis.document.addEventListener("selectionchange", handleSelectionChange);
    return () => globalThis.document.removeEventListener("selectionchange", handleSelectionChange);
  }, [activeEditorId]);

  const serializedDocument = useMemo(() => serializeContractDocument(document), [document]);
  const summary = useMemo(() => getContractDocumentSummary(document), [document]);

  useEffect(() => {
    if (!canAutosave) {
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    setAutosaveState("dirty");

    const timeout = window.setTimeout(async () => {
      setAutosaveState("saving");

      try {
        const response = await fetch(`/api/projects/${autosaveProjectId}/files/${autosaveFileId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileType: hiddenFields?.fileType || "CONTRACT",
            title: document.contractTitle,
            summary,
            status: document.clientSignature.signedAt ? "Signed" : "Draft",
            visibility: "Shared",
            body: serializedDocument,
          }),
        });

        if (!response.ok) {
          setAutosaveState("error");
          return;
        }

        setAutosaveState("saved");
        setLastSavedAt(
          new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date())
        );

        if (autosaveResetTimeoutRef.current) {
          window.clearTimeout(autosaveResetTimeoutRef.current);
        }

        autosaveResetTimeoutRef.current = window.setTimeout(() => {
          setAutosaveState((current) => (current === "saved" ? "idle" : current));
        }, 2400);
      } catch {
        setAutosaveState("error");
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [canAutosave, autosaveProjectId, autosaveFileId, hiddenFields?.fileType, document, serializedDocument, summary]);

  useEffect(() => {
    return () => {
      if (autosaveResetTimeoutRef.current) {
        window.clearTimeout(autosaveResetTimeoutRef.current);
      }
    };
  }, []);

  const autosaveLabel =
    autosaveState === "saving"
      ? "Saving"
      : autosaveState === "saved"
        ? lastSavedAt
          ? `Saved at ${lastSavedAt}`
          : "Saved"
        : autosaveState === "error"
          ? "Autosave issue"
          : autosaveState === "dirty"
            ? "Unsaved"
            : canAutosave
              ? "Autosave on"
              : "Save once to enable autosave";

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

  function registerEditor(id: string, node: HTMLDivElement | null) {
    editorRefs.current[id] = node;
  }

  function restoreSelection() {
    const selection = globalThis.document.getSelection();
    const savedRange = savedRangeRef.current;
    if (!selection || !savedRange) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(savedRange);
  }

  function runEditorCommand(command: string, value?: string) {
    const editorId = activeEditorId;
    const editor = editorId ? editorRefs.current[editorId] : null;
    if (!editor || !editorId) {
      return;
    }

    editor.focus();
    restoreSelection();
    globalThis.document.execCommand(command, false, value);
    const sectionIndex = Number(editorId.replace("section-body-", ""));
    if (!Number.isNaN(sectionIndex)) {
      updateSection(sectionIndex, "body", sanitizeRichText(editor.innerHTML));
    }
  }

  function formatBlock(value: string) {
    const normalized = value === "P" ? "p" : value.toLowerCase();
    runEditorCommand("formatBlock", normalized);
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
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {autosaveLabel}
          </p>
        </div>
        <button className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
          {saveLabel}
        </button>
      </div>

      <RichTextToolbar
        activeEditor={Boolean(activeEditorId)}
        onKeepSelection={restoreSelection}
        onFormatBlock={formatBlock}
        onRun={runEditorCommand}
      />

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
          <div className="grid gap-8 text-[0.94rem] leading-7 text-[var(--muted)]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink)]">
                {document.contractLabel}
              </p>
              <div className="mt-5 text-center">
                <InlineField
                  className="mx-auto max-w-md text-center text-[1.6rem] font-semibold text-[var(--ink)]"
                  onChange={(value) => updateField("contractTitle", value)}
                  value={document.contractTitle}
                />
                <div className="mt-5 border-t border-black/[0.16] pt-5">
                  <InlineField
                    className="mx-auto max-w-xl text-center text-[2rem] font-bold text-[var(--ink)]"
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

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-base font-bold text-[var(--ink)]">Vendor</p>
                <InlineField align="left" className="w-full text-left" onChange={(value) => updateField("businessName", value)} value={document.businessName} />
                <InlineField align="left" className="w-full text-left" onChange={(value) => updateField("businessEmail", value)} value={document.businessEmail} />
                <InlineField align="left" className="w-full text-left" onChange={(value) => updateField("businessAddress", value)} value={document.businessAddress} />
                <InlineField align="left" className="w-full text-left" onChange={(value) => updateField("businessPhone", value)} value={document.businessPhone} />
              </div>
              <div className="space-y-2">
                <p className="text-base font-bold text-[var(--ink)]">Client</p>
                <InlineField align="left" className="w-full text-left" onChange={(value) => updateField("clientName", value)} value={document.clientName} />
                <InlineField align="left" className="w-full text-left" onChange={(value) => updateField("clientEmail", value)} value={document.clientEmail} />
                <InlineField align="left" className="w-full text-left" onChange={(value) => updateField("clientAddress", value)} value={document.clientAddress} />
                <InlineField align="left" className="w-full text-left" onChange={(value) => updateField("clientPhone", value)} value={document.clientPhone} />
              </div>
            </div>
            <div className="space-y-3">
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

                  {section.heading !== "Terms" ? (
                    <AutoGrowTextarea
                      className="text-[1.2rem] font-bold leading-[1.25] text-[var(--ink)]"
                      onChange={(value) => updateSection(index, "heading", value)}
                      value={section.heading}
                    />
                  ) : null}

                  <RichTextField
                    editorId={`section-body-${index}`}
                    onActivate={setActiveEditorId}
                    onChange={(value) => updateSection(index, "body", value)}
                    registerEditor={registerEditor}
                    value={section.body}
                  />
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
