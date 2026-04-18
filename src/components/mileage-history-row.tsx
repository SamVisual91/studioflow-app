"use client";

import { useRef } from "react";
import { deleteMileageLogAction, updateMileageLogAction } from "@/app/actions";

type MileageHistoryRowProps = {
  entry: {
    id: string;
    tripDate: string;
    purpose: string;
    originAddress: string;
    destinationAddress: string;
    tripType: "ONE_WAY" | "ROUND_TRIP";
    oneWayMiles: number;
    totalMiles: number;
    notes: string;
    calculationSource: string;
  };
  index: number;
};

export function MileageHistoryRow({ entry, index }: MileageHistoryRowProps) {
  const formRef = useRef<HTMLFormElement>(null);

  function submitRow() {
    formRef.current?.requestSubmit();
  }

  return (
    <tr className={index % 2 === 0 ? "bg-white" : "bg-[rgba(16,33,52,0.018)]"}>
      <td className="p-0" colSpan={10}>
        <form ref={formRef} action={updateMileageLogAction}>
          <input name="mileageLogId" type="hidden" value={entry.id} />
          <div className="grid grid-cols-[8%_12%_17%_17%_8%_7%_7%_12%_7%_5%] border-t border-black/[0.06]">
            <div className="sticky left-0 z-10 border-r border-black/[0.08] bg-inherit px-2 py-2">
              <input
                className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2.5 text-sm outline-none transition focus:border-[var(--forest)] focus:bg-white"
                defaultValue={entry.tripDate.slice(0, 10)}
                name="tripDate"
                type="date"
                onBlur={submitRow}
              />
            </div>
            <div className="border-r border-black/[0.08] px-2 py-2">
              <input
                className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2.5 text-sm font-semibold outline-none transition focus:border-[var(--forest)] focus:bg-white"
                defaultValue={entry.purpose}
                name="purpose"
                onBlur={submitRow}
              />
            </div>
            <div className="border-r border-black/[0.08] px-2 py-2">
              <input
                className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2.5 text-sm text-[var(--muted)] outline-none transition focus:border-[var(--forest)] focus:bg-white focus:text-[var(--ink)]"
                defaultValue={entry.originAddress}
                name="originAddress"
                onBlur={submitRow}
              />
            </div>
            <div className="border-r border-black/[0.08] px-2 py-2">
              <input
                className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2.5 text-sm text-[var(--muted)] outline-none transition focus:border-[var(--forest)] focus:bg-white focus:text-[var(--ink)]"
                defaultValue={entry.destinationAddress}
                name="destinationAddress"
                onBlur={submitRow}
              />
            </div>
            <div className="border-r border-black/[0.08] px-2 py-2">
              <select
                className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2 text-sm outline-none transition focus:border-[var(--forest)] focus:bg-white"
                defaultValue={entry.tripType}
                name="tripType"
                onChange={submitRow}
              >
                <option value="ROUND_TRIP">Round trip</option>
                <option value="ONE_WAY">One way</option>
              </select>
            </div>
            <div className="border-r border-black/[0.08] px-2 py-2">
              <input
                className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2.5 text-right text-sm outline-none transition focus:border-[var(--forest)] focus:bg-white"
                defaultValue={entry.oneWayMiles.toFixed(1)}
                min="0.1"
                name="oneWayMiles"
                step="0.1"
                type="number"
                onBlur={submitRow}
              />
            </div>
            <div className="border-r border-black/[0.08] px-2 py-2">
              <input
                className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2.5 text-right text-sm font-semibold outline-none transition focus:border-[var(--forest)] focus:bg-white"
                defaultValue={entry.totalMiles.toFixed(1)}
                min="0.1"
                name="totalMiles"
                step="0.1"
                type="number"
                onBlur={submitRow}
              />
            </div>
            <div className="border-r border-black/[0.08] px-2 py-2">
              <input
                className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2.5 text-sm text-[var(--muted)] outline-none transition focus:border-[var(--forest)] focus:bg-white focus:text-[var(--ink)]"
                defaultValue={entry.notes}
                name="notes"
                placeholder="-"
                onBlur={submitRow}
              />
            </div>
            <div className="border-r border-black/[0.08] px-3 py-3 text-sm text-[var(--muted)]">
              <span className="line-clamp-2">{entry.calculationSource || "Map estimate"}</span>
            </div>
            <div className="flex items-center justify-end px-2 py-2">
              <button
                aria-label={`Delete mileage entry ${entry.purpose}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.12)]"
                formAction={deleteMileageLogAction}
                type="submit"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" viewBox="0 0 24 24">
                  <path d="M3 6h18" />
                  <path d="M8 6V4.75A1.75 1.75 0 0 1 9.75 3h4.5A1.75 1.75 0 0 1 16 4.75V6" />
                  <path d="M19 6l-1 13.25A1.75 1.75 0 0 1 16.26 21H7.74A1.75 1.75 0 0 1 6 19.25L5 6" />
                  <path d="M10 10.25v6.5" />
                  <path d="M14 10.25v6.5" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </td>
    </tr>
  );
}
