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

export function MessageAiAssistant({ clientName }: { clientName: string }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const applyBodyUpdate = (update: (value: string) => string) => {
    setBody((current) => update(current));
  };

  return (
    <div className="grid gap-3">
      <label className="grid gap-2 text-sm font-medium">
        Subject
        <input
          className="rounded-2xl border border-black/[0.08] px-4 py-3"
          name="subject"
          onChange={(event) => setSubject(event.target.value)}
          required
          value={subject}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Message
        <textarea
          className="min-h-36 rounded-2xl border border-black/[0.08] px-4 py-3"
          name="body"
          onChange={(event) => setBody(event.target.value)}
          required
          value={body}
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-full border border-black/[0.06] bg-white/64 px-3 py-2">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[var(--muted)]">AI assist</p>
        <div className="flex flex-wrap gap-1.5">
            <button
              className="rounded-full px-2.5 py-1 text-[0.72rem] font-semibold text-[var(--muted)] transition hover:bg-[rgba(47,125,92,0.08)] hover:text-[var(--ink)]"
              onClick={() => applyBodyUpdate((current) => warmTone(current, clientName))}
              type="button"
            >
              Change tone
            </button>
            <button
              className="rounded-full px-2.5 py-1 text-[0.72rem] font-semibold text-[var(--muted)] transition hover:bg-[rgba(47,125,92,0.08)] hover:text-[var(--ink)]"
              onClick={() => applyBodyUpdate(shortenMessage)}
              type="button"
            >
              Shorten
            </button>
            <button
              className="rounded-full px-2.5 py-1 text-[0.72rem] font-semibold text-[var(--muted)] transition hover:bg-[rgba(47,125,92,0.08)] hover:text-[var(--ink)]"
              onClick={() => applyBodyUpdate(improveClarity)}
              type="button"
            >
              Improve clarity
            </button>
        </div>
      </div>
    </div>
  );
}
