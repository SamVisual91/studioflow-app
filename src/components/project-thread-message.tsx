"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProjectMessageAction, markProjectMessageReadAction } from "@/app/actions";

type ProjectThreadMessageProps = {
  dateLabel: string;
  direction: string;
  from: string;
  messageId: string;
  preview: string;
  projectId: string;
  subject: string;
  unread: boolean;
  userAvatar?: string;
};

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("") || "C"
  ).toUpperCase();
}

export function ProjectThreadMessage({
  dateLabel,
  direction,
  from,
  messageId,
  preview,
  projectId,
  subject,
  unread,
  userAvatar = "",
}: ProjectThreadMessageProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isUnread, setIsUnread] = useState(unread);
  const [isPending, startTransition] = useTransition();
  const isOutbound = direction === "OUTBOUND";

  function handleToggle(nextOpen: boolean) {
    setIsOpen(nextOpen);

    if (!nextOpen || !isUnread || direction !== "INBOUND" || isPending) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("messageId", messageId);
      await markProjectMessageReadAction(formData);
      setIsUnread(false);
      router.refresh();
    });
  }

  return (
    <details
      className="relative rounded-[1.5rem] border border-black/[0.08] bg-[rgba(247,241,232,0.54)]"
      onToggle={(event) => handleToggle((event.currentTarget as HTMLDetailsElement).open)}
      open={isOpen}
    >
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 px-5 py-4 pr-16">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
            <span
              className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[0.65rem] font-semibold normal-case tracking-normal ${
                isOutbound
                  ? "bg-[var(--sidebar)] text-white"
                  : "bg-[rgba(247,241,232,0.96)] text-[var(--ink)]"
              }`}
              style={isOutbound && userAvatar ? { backgroundImage: `url(${userAvatar})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            >
              {isOutbound ? (userAvatar ? "" : "You") : getInitials(from)}
            </span>
            <span>{isOutbound ? "Sent by you" : "From client"} | Email</span>
          </div>
          <h3 className="mt-2 text-lg font-semibold">{subject}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">{from}</p>
        </div>
        <div className="flex items-center gap-3">
          {isUnread && direction === "INBOUND" ? (
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
          ) : null}
          <p className="text-sm text-[var(--muted)]">{dateLabel}</p>
          <span className="text-base font-semibold leading-none text-[var(--muted)]" aria-hidden="true">
            v
          </span>
        </div>
      </summary>
      <form action={deleteProjectMessageAction} className="absolute right-4 top-4">
        <input name="projectId" type="hidden" value={projectId} />
        <input name="messageId" type="hidden" value={messageId} />
        <button
          aria-label="Delete message"
          className="grid h-9 w-9 place-items-center rounded-full border border-[rgba(207,114,79,0.22)] bg-white/80 text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.10)] hover:text-[var(--accent)]"
          title="Delete message"
          type="submit"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v5" />
            <path d="M14 11v5" />
          </svg>
        </button>
      </form>
      <div className="border-t border-black/[0.08] px-5 py-4">
        <p className="text-sm leading-7 text-[var(--ink)]">{preview}</p>
      </div>
    </details>
  );
}
