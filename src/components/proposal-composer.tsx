"use client";

import { useState } from "react";

type LineItem = {
  title: string;
  description: string;
  amount: number;
};

type PackagePreset = {
  id: string;
  name: string;
  description: string;
  proposalTitle: string;
  amount: number;
  sections: string[];
  lineItems: LineItem[];
  emailSubject: string;
  emailBody: string;
};

type Props = {
  presets: PackagePreset[];
  action: (formData: FormData) => void;
  initialProjectId?: string;
  initialClient?: string;
  initialRecipientEmail?: string;
  initialTitle?: string;
  initialPresetId?: string;
};

function serializeLineItems(items: LineItem[]) {
  return items.map((item) => `${item.title} | ${item.description} | ${item.amount}`).join("\n");
}

export function ProposalComposer({
  presets,
  action,
  initialProjectId = "",
  initialClient = "",
  initialRecipientEmail = "",
  initialTitle = "",
  initialPresetId = "",
}: Props) {
  const initialPreset = presets.find((item) => item.id === initialPresetId);
  const [selectedPresetId, setSelectedPresetId] = useState(initialPresetId);
  const [client, setClient] = useState(initialClient);
  const [recipientEmail, setRecipientEmail] = useState(initialRecipientEmail);
  const [title, setTitle] = useState(initialPreset?.proposalTitle || initialTitle);
  const [amount, setAmount] = useState(initialPreset ? String(initialPreset.amount) : "");
  const [sections, setSections] = useState(initialPreset ? initialPreset.sections.join(", ") : "");
  const [lineItems, setLineItems] = useState(initialPreset ? serializeLineItems(initialPreset.lineItems) : "");
  const [emailSubject, setEmailSubject] = useState(
    initialPreset?.emailSubject || "Your proposal from StudioFlow"
  );
  const [emailBody, setEmailBody] = useState(
    initialPreset?.emailBody ||
      "Hi,\n\nYour proposal is ready. Let me know if you have any questions.\n\nThanks,"
  );

  function applyPreset(presetId: string) {
    setSelectedPresetId(presetId);
    const preset = presets.find((item) => item.id === presetId);

    if (!preset) {
      return;
    }

    setTitle(preset.proposalTitle);
    setAmount(String(preset.amount));
    setSections(preset.sections.join(", "));
    setLineItems(serializeLineItems(preset.lineItems));
    setEmailSubject(preset.emailSubject);
    setEmailBody(preset.emailBody);
  }

  return (
    <form
      action={action}
      className="rounded-[1.75rem] border border-black/[0.08] bg-white/82 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]"
    >
      <input name="projectId" type="hidden" value={initialProjectId} />
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">New proposal</p>
      <h3 className="mt-3 text-2xl font-semibold">Create and send</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        Pick a saved package preset or start from scratch, then customize anything before sending.
      </p>

      <label className="mt-6 grid gap-2 text-sm font-medium">
        Package preset
        <select
          className="rounded-2xl border border-black/[0.08] px-4 py-3"
          onChange={(event) => applyPreset(event.target.value)}
          value={selectedPresetId}
        >
          <option value="">Start blank</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Client name
          <input
            className="rounded-2xl border border-black/[0.08] px-4 py-3"
            name="client"
            onChange={(event) => setClient(event.target.value)}
            required
            value={client}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Recipient email
          <input
            className="rounded-2xl border border-black/[0.08] px-4 py-3"
            name="recipientEmail"
            onChange={(event) => setRecipientEmail(event.target.value)}
            required
            type="email"
            value={recipientEmail}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">
          Proposal title
          <input
            className="rounded-2xl border border-black/[0.08] px-4 py-3"
            name="title"
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Amount
          <input
            className="rounded-2xl border border-black/[0.08] px-4 py-3"
            min="0"
            name="amount"
            onChange={(event) => setAmount(event.target.value)}
            required
            type="number"
            value={amount}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Expires date
          <input
            className="rounded-2xl border border-black/[0.08] px-4 py-3"
            name="expiresDate"
            required
            type="date"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">
          Sections
          <input
            className="rounded-2xl border border-black/[0.08] px-4 py-3"
            name="sections"
            onChange={(event) => setSections(event.target.value)}
            placeholder="Coverage, Payment schedule, Contract terms"
            required
            value={sections}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">
          Line items
          <textarea
            className="min-h-32 rounded-2xl border border-black/[0.08] px-4 py-3"
            name="lineItems"
            onChange={(event) => setLineItems(event.target.value)}
            placeholder={"Wedding day coverage | 10 hours of filming | 5200\nSuper 8 add-on | Vintage motion coverage | 1000"}
            required
            value={lineItems}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">
          Email subject
          <input
            className="rounded-2xl border border-black/[0.08] px-4 py-3"
            name="emailSubject"
            onChange={(event) => setEmailSubject(event.target.value)}
            required
            value={emailSubject}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium sm:col-span-2">
          Email message
          <textarea
            className="min-h-36 rounded-2xl border border-black/[0.08] px-4 py-3"
            name="emailBody"
            onChange={(event) => setEmailBody(event.target.value)}
            required
            value={emailBody}
          />
        </label>
      </div>

      <button className="mt-6 rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(47,125,92,0.22)] transition hover:brightness-110">
        Create and send proposal
      </button>
    </form>
  );
}
