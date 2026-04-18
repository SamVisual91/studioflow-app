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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(16,24,39,0.68)] px-4 py-8 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[1.8rem] border border-black/[0.08] bg-[#f7f1e8] text-[#1f1b18] shadow-[0_24px_90px_rgba(16,33,52,0.32)]">
            <div className="max-h-[90vh] overflow-auto p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#6d6459]">Mileage entry</p>
                <h2 className="mt-2 text-3xl font-semibold">Log a drive</h2>
                <p className="mt-2 text-sm leading-6 text-[#52483d]">
                  Add the route details, calculate the mileage, and save the trip directly into the ledger sheet.
                </p>
              </div>
              <button
                aria-label="Close mileage entry"
                className="rounded-full border border-black/[0.08] bg-white px-3 py-2 text-sm font-semibold text-[#52483d] transition hover:bg-black/[0.03] hover:text-[#1f1b18]"
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
        </div>
      ) : null}
    </>
  );
}
