"use client";

import { useState } from "react";

type ProjectReplyLoggerProps = {
  action: (formData: FormData) => void | Promise<void>;
  clientName: string;
  projectId: string;
};

export function ProjectReplyLogger({ action, clientName, projectId }: ProjectReplyLoggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="rounded-full border border-black/[0.08] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Log client reply
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,15,14,0.52)] px-4 py-8">
          <div className="w-full max-w-2xl rounded-[1.9rem] border border-black/[0.08] bg-white p-6 shadow-[0_28px_70px_rgba(17,15,14,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Client activity</p>
                <h2 className="mt-3 text-2xl font-semibold">Log a client reply</h2>
              </div>
              <button
                aria-label="Close"
                className="rounded-full border border-black/[0.08] px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-black/[0.03] hover:text-[var(--ink)]"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Paste the client&apos;s reply here and we&apos;ll add it to the project thread and recent activity so the
              conversation stays complete in one place.
            </p>

            <form action={action} className="mt-6 grid gap-4">
              <input name="projectId" type="hidden" value={projectId} />
              <input name="clientName" type="hidden" value={clientName} />

              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                Subject
                <input
                  className="rounded-2xl border border-black/[0.08] px-4 py-3"
                  defaultValue={`Re: ${clientName}`}
                  name="subject"
                  placeholder="Re: Wedding details"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                Client message
                <textarea
                  className="min-h-[220px] rounded-[1.5rem] border border-black/[0.08] px-4 py-3"
                  name="body"
                  placeholder="Paste the client's reply here..."
                  required
                />
              </label>

              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  type="submit"
                >
                  Save to thread
                </button>
                <button
                  className="rounded-full border border-black/[0.08] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
