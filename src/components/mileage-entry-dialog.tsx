"use client";

import { useState } from "react";
import { MileageLogForm } from "@/components/mileage-log-form";

type MileageEntryDialogProps = {
  projects: Array<{
    id: string;
    name: string;
    client: string;
  }>;
};

export function MileageEntryDialog({ projects }: MileageEntryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="rounded-full bg-[var(--forest)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        New mileage trip
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[1.8rem] border border-black/[0.08] bg-[var(--paper)] p-5 shadow-[0_24px_90px_rgba(16,33,52,0.24)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Mileage entry</p>
                <h2 className="mt-2 text-3xl font-semibold">Log a drive</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Add the route details, calculate the mileage, and save the trip directly into the ledger sheet.
                </p>
              </div>
              <button
                aria-label="Close mileage entry"
                className="rounded-full border border-black/[0.08] bg-white px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-black/[0.03] hover:text-[var(--ink)]"
                type="button"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-5">
              <MileageLogForm projects={projects} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
