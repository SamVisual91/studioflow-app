"use client";

import { useState } from "react";

function normalizeSpacing(value: string) {
  return value
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function improveClarity(value: string) {
  const message = normalizeSpacing(value);

  if (!message) {
    return "";
  }

  return message
    .replace(/\bjust wanted to\b/gi, "wanted to")
    .replace(/\bi think\b/gi, "I recommend")
    .replace(/\bkind of\b/gi, "")
    .replace(/\bsort of\b/gi, "")
    .replace(/\blet me know\b/gi, "please let me know")
    .replace(/\s+\./g, ".")
    .trim();
}

function shortenMessage(value: string) {
  const message = normalizeSpacing(value);

  if (!message) {
    return "";
  }

  const sentences = message
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    return message
      .replace(/\bI just wanted to\b/gi, "I wanted to")
      .replace(/\bI wanted to quickly\b/gi, "I wanted to")
      .trim();
  }

  return sentences.slice(0, 2).join(" ");
}

function warmTone(value: string, clientName: string) {
  const message = normalizeSpacing(value);
  const greeting = clientName ? `Hi ${clientName},` : "Hi,";
  const hasGreeting = /^(hi|hello|hey)\b/i.test(message);
  const hasSignoff = /(thanks|thank you|best|warmly),?\s*$/i.test(message);
  const body = hasGreeting ? message : `${greeting}\n\n${message}`;

  return hasSignoff ? body : `${body}\n\nThanks,\nSam Visual`;
}

type Props = {
  clientName: string;
  compact?: boolean;
  defaultBcc?: string;
  defaultBody?: string;
  defaultCc?: string;
  defaultSubject?: string;
  defaultTo?: string;
  showRecipients?: boolean;
};

export function ProjectEmailComposerFields({
  clientName,
  compact = false,
  defaultBcc = "",
  defaultBody = "",
  defaultCc = "",
  defaultSubject = "",
  defaultTo = "",
  showRecipients = true,
}: Props) {
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState(defaultCc);
  const [bcc, setBcc] = useState(defaultBcc);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  const fieldClassName = compact
    ? "rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
    : "rounded-[1.4rem] border border-black/[0.08] bg-white px-4 py-3.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)]";

  const textareaClassName = compact
    ? "min-h-32 rounded-[1.4rem] border border-black/[0.08] bg-white px-4 py-3 text-sm leading-7 text-[var(--ink)] outline-none transition focus:border-[var(--accent)]"
    : "min-h-40 rounded-[1.5rem] border border-black/[0.08] bg-white px-4 py-3.5 text-sm leading-7 text-[var(--ink)] outline-none transition focus:border-[var(--accent)]";

  return (
    <div className="grid gap-4">
      {showRecipients ? (
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
            To
            <input
              className={fieldClassName}
              name="to"
              onChange={(event) => setTo(event.target.value)}
              placeholder="riley@example.com, ethan@example.com"
              value={to}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
            CC
            <input
              className={fieldClassName}
              name="cc"
              onChange={(event) => setCc(event.target.value)}
              placeholder="planner@example.com"
              value={cc}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
            BCC
            <input
              className={fieldClassName}
              name="bcc"
              onChange={(event) => setBcc(event.target.value)}
              placeholder="Optional"
              value={bcc}
            />
          </label>
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
        Subject
        <input
          className={fieldClassName}
          name="subject"
          onChange={(event) => setSubject(event.target.value)}
          required
          value={subject}
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
        Message
        <textarea
          className={textareaClassName}
          name="body"
          onChange={(event) => setBody(event.target.value)}
          placeholder={`Hi ${clientName},`}
          required
          value={body}
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-black/[0.06] bg-white/78 px-4 py-3">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--muted)]">Composer assist</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Keep the message polished while staying plain-text safe.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            className="rounded-full px-3 py-1.5 text-[0.75rem] font-semibold text-[var(--muted)] transition hover:bg-[rgba(47,125,92,0.08)] hover:text-[var(--ink)]"
            onClick={() => setBody((current) => warmTone(current, clientName))}
            type="button"
          >
            Warm tone
          </button>
          <button
            className="rounded-full px-3 py-1.5 text-[0.75rem] font-semibold text-[var(--muted)] transition hover:bg-[rgba(47,125,92,0.08)] hover:text-[var(--ink)]"
            onClick={() => setBody(shortenMessage)}
            type="button"
          >
            Shorten
          </button>
          <button
            className="rounded-full px-3 py-1.5 text-[0.75rem] font-semibold text-[var(--muted)] transition hover:bg-[rgba(47,125,92,0.08)] hover:text-[var(--ink)]"
            onClick={() => setBody(improveClarity)}
            type="button"
          >
            Improve clarity
          </button>
        </div>
      </div>

      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
        Attachments
        <input
          className="rounded-[1.4rem] border border-dashed border-black/[0.16] bg-white px-4 py-3 text-sm text-[var(--muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--sidebar)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:brightness-110"
          multiple
          name="attachments"
          type="file"
        />
      </label>
    </div>
  );
}
