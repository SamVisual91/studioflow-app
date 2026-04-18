"use client";

import { useMemo, useState } from "react";
import { createMileageLogAction } from "@/app/actions";

type ProjectOption = {
  id: string;
  name: string;
  client: string;
};

type MileageLogFormProps = {
  projects: ProjectOption[];
};

type EstimateState = {
  originLabel: string;
  destinationLabel: string;
  oneWayMiles: number;
  totalMiles: number;
  calculationSource: string;
};

const defaultEstimate: EstimateState = {
  originLabel: "",
  destinationLabel: "",
  oneWayMiles: 0,
  totalMiles: 0,
  calculationSource: "Map estimate",
};

export function MileageLogForm({ projects }: MileageLogFormProps) {
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [tripType, setTripType] = useState<"ONE_WAY" | "ROUND_TRIP">("ROUND_TRIP");
  const [estimate, setEstimate] = useState<EstimateState>(defaultEstimate);
  const [status, setStatus] = useState<"idle" | "calculating" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");

  const displayedTotalMiles = useMemo(() => {
    if (!estimate.oneWayMiles) {
      return 0;
    }

    return tripType === "ROUND_TRIP" ? Number((estimate.oneWayMiles * 2).toFixed(1)) : estimate.oneWayMiles;
  }, [estimate.oneWayMiles, tripType]);

  async function calculateMileage() {
    if (!originAddress.trim() || !destinationAddress.trim()) {
      setStatus("error");
      setMessage("Add both addresses before calculating mileage.");
      return;
    }

    setStatus("calculating");
    setMessage("Calculating route...");

    try {
      const response = await fetch("/api/ledger/mileage/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originAddress,
          destinationAddress,
          tripType,
        }),
      });

      const payload = (await response.json()) as
        | {
            error?: string;
            originLabel?: string;
            destinationLabel?: string;
            oneWayMiles?: number;
            totalMiles?: number;
            calculationSource?: string;
          }
        | undefined;

      if (!response.ok || !payload?.oneWayMiles || !payload.totalMiles) {
        throw new Error(payload?.error || "Unable to calculate mileage right now.");
      }

      setEstimate({
        originLabel: payload.originLabel || "",
        destinationLabel: payload.destinationLabel || "",
        oneWayMiles: payload.oneWayMiles,
        totalMiles: payload.totalMiles,
        calculationSource: payload.calculationSource || "Map estimate",
      });
      setStatus("ready");
      setMessage("Mileage estimate is ready to save.");
    } catch (error) {
      setEstimate(defaultEstimate);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to calculate mileage right now.");
    }
  }

  function resetEstimate() {
    if (status === "idle") {
      return;
    }

    setEstimate(defaultEstimate);
    setStatus("idle");
    setMessage("");
  }

  return (
    <form action={createMileageLogAction} className="grid gap-3.5">
      <div className="rounded-[1.15rem] border border-black/[0.06] bg-[rgba(247,241,232,0.42)] p-3.5">
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">Trip details</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Add the addresses, trip type, and reason for the drive.</p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">Log</span>
        </div>

        <div className="mt-3.5 grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            <span>Date</span>
            <input
              className="h-11 rounded-[1rem] border border-black/[0.08] bg-white px-3.5 text-sm outline-none transition focus:border-[var(--forest)]"
              defaultValue={new Date().toISOString().slice(0, 10)}
              name="tripDate"
              required
              type="date"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            <span>Trip type</span>
            <select
              className="h-11 rounded-[1rem] border border-black/[0.08] bg-white px-3.5 text-sm outline-none transition focus:border-[var(--forest)]"
              name="tripType"
              value={tripType}
              onChange={(event) => {
                setTripType(event.target.value === "ONE_WAY" ? "ONE_WAY" : "ROUND_TRIP");
                setStatus((current) => (current === "ready" ? "ready" : current));
              }}
            >
              <option value="ROUND_TRIP">Round trip</option>
              <option value="ONE_WAY">One way</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">
            <span>Starting address</span>
            <input
              className="h-11 rounded-[1rem] border border-black/[0.08] bg-white px-3.5 text-sm outline-none transition focus:border-[var(--forest)]"
              name="originAddress"
              placeholder="123 Main St, Minneapolis, MN"
              required
              value={originAddress}
              onChange={(event) => {
                setOriginAddress(event.target.value);
                resetEstimate();
              }}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">
            <span>Destination address</span>
            <input
              className="h-11 rounded-[1rem] border border-black/[0.08] bg-white px-3.5 text-sm outline-none transition focus:border-[var(--forest)]"
              name="destinationAddress"
              placeholder="Venue or travel destination"
              required
              value={destinationAddress}
              onChange={(event) => {
                setDestinationAddress(event.target.value);
                resetEstimate();
              }}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            <span>Purpose</span>
            <input
              className="h-11 rounded-[1rem] border border-black/[0.08] bg-white px-3.5 text-sm outline-none transition focus:border-[var(--forest)]"
              name="purpose"
              placeholder="Wedding day coverage"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            <span>Linked project</span>
            <select className="h-11 rounded-[1rem] border border-black/[0.08] bg-white px-3.5 text-sm outline-none transition focus:border-[var(--forest)]" name="projectId">
              <option value="">No linked project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.client} | {project.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">
            <span>Notes</span>
            <textarea
              className="min-h-[88px] rounded-[1rem] border border-black/[0.08] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[var(--forest)]"
              name="notes"
              placeholder="Optional notes about parking, tolls, or the reason for the drive."
            />
          </label>
        </div>
      </div>

      <div className="rounded-[1.15rem] border border-black/[0.06] bg-white p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">Mileage estimate</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Calculate the route before saving the trip.</p>
          </div>
          <button
            className="rounded-full bg-[var(--sidebar)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={status === "calculating"}
            type="button"
            onClick={calculateMileage}
          >
            {status === "calculating" ? "Calculating..." : "Calculate mileage"}
          </button>
        </div>

        <div className="mt-3.5 grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            <span>One-way miles</span>
            <input
              className="h-11 rounded-[1rem] border border-black/[0.08] bg-[rgba(16,33,52,0.04)] px-3.5 text-sm outline-none"
              name="oneWayMiles"
              readOnly
              value={estimate.oneWayMiles ? estimate.oneWayMiles.toFixed(1) : ""}
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            <span>Total miles</span>
            <input
              className="h-11 rounded-[1rem] border border-black/[0.08] bg-[rgba(16,33,52,0.04)] px-3.5 text-sm outline-none"
              name="totalMiles"
              readOnly
              value={displayedTotalMiles ? displayedTotalMiles.toFixed(1) : ""}
            />
          </label>
        </div>

        <input name="originLabel" type="hidden" value={estimate.originLabel} />
        <input name="destinationLabel" type="hidden" value={estimate.destinationLabel} />
        <input name="calculationSource" type="hidden" value={estimate.calculationSource} />

        <div className="mt-3.5 rounded-[1rem] bg-[rgba(16,33,52,0.04)] px-3.5 py-3">
          <p className="text-sm leading-6 text-[var(--muted)]">
            {message || "We will save the map estimate with the trip so your ledger stays easy to audit later."}
          </p>
          {estimate.originLabel || estimate.destinationLabel ? (
            <div className="mt-2 grid gap-1 text-xs text-[var(--muted)]">
              {estimate.originLabel ? <p>From: {estimate.originLabel}</p> : null}
              {estimate.destinationLabel ? <p>To: {estimate.destinationLabel}</p> : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.15rem] bg-[rgba(16,33,52,0.04)] px-3.5 py-3">
        <p className="text-sm leading-6 text-[var(--muted)]">Trip entries save into the ledger mileage tracker without creating a manual expense transaction.</p>
        <button className="rounded-full bg-[var(--forest)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
          Save mileage trip
        </button>
      </div>
    </form>
  );
}
