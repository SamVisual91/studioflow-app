import { deleteMileageLogAction } from "@/app/actions";
import { LedgerWorkspace } from "@/components/ledger-workspace";
import { MileageLogForm } from "@/components/mileage-log-form";
import { shortDate } from "@/lib/formatters";
import { getLedgerPageData } from "@/lib/ledger-page";
import { getMileageData } from "@/lib/mileage";

export default async function LedgerMileagePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
}) {
  const [{ saved, deleted, error }, { user, data, shellSummary }] = await Promise.all([
    searchParams,
    getLedgerPageData(),
  ]);
  const mileage = getMileageData();

  return (
    <LedgerWorkspace
      copy="Track every client drive, calculate one-way or round-trip mileage from addresses, and keep a clean trip history inside the ledger."
      currentPath="/ledger/mileage"
      summary={shellSummary}
      title="Mileage Tracker"
      user={user}
    >
      {saved ? (
        <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
          Mileage trip saved to the ledger.
        </div>
      ) : null}

      {deleted ? (
        <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
          Mileage trip removed.
        </div>
      ) : null}

      {error === "mileage-invalid" ? (
        <div className="rounded-[1.5rem] border border-[rgba(207,114,79,0.24)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
          Add both addresses, calculate the route, and make sure the trip has a purpose before saving.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Miles this month", value: mileage.summary.monthMiles.toFixed(1), note: "Current month" },
          { label: "Miles this year", value: mileage.summary.yearMiles.toFixed(1), note: "Year to date" },
          { label: "Round trips", value: String(mileage.summary.roundTrips), note: "Saved as return drives" },
          { label: "Total logged trips", value: String(mileage.summary.totalTrips), note: "Mileage entries on file" },
        ].map((card) => (
          <article
            key={card.label}
            className="rounded-[1.35rem] border border-black/[0.08] bg-white/94 p-4 shadow-[0_14px_28px_rgba(59,36,17,0.07)]"
          >
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">{card.label}</p>
            <p className="mt-3 text-[1.75rem] font-semibold">{card.value}</p>
            <p className="mt-1.5 text-sm text-[var(--muted)]">{card.note}</p>
          </article>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">New mileage trip</p>
            <h2 className="mt-2 text-2xl font-semibold">Log a drive</h2>
          </div>
          <div className="mt-5">
            <MileageLogForm
              projects={data.projects.map((project) => ({
                id: project.id,
                name: project.name,
                client: project.client,
              }))}
            />
          </div>
        </div>

        <div className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Trip history</p>
              <h2 className="mt-2 text-2xl font-semibold">Saved mileage entries</h2>
            </div>
            <span className="rounded-full bg-[rgba(16,33,52,0.05)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
              {mileage.entries.length} trips
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {mileage.entries.length === 0 ? (
              <div className="rounded-[1rem] border border-dashed border-black/[0.12] bg-[rgba(247,241,232,0.45)] px-4 py-6 text-sm leading-6 text-[var(--muted)]">
                No mileage trips saved yet. Add the first route on the left and the tracker will start building your travel history.
              </div>
            ) : (
              mileage.entries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[1rem] border border-black/[0.06] bg-[rgba(247,241,232,0.58)] px-4 py-3.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{entry.purpose}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {shortDate.format(new Date(entry.tripDate))} | {entry.tripType === "ROUND_TRIP" ? "Round trip" : "One way"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{entry.totalMiles.toFixed(1)} mi</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                        {entry.oneWayMiles.toFixed(1)} one way
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-[var(--muted)]">
                    <p>
                      <span className="font-semibold text-[var(--ink)]">From:</span> {entry.originLabel || entry.originAddress}
                    </p>
                    <p>
                      <span className="font-semibold text-[var(--ink)]">To:</span> {entry.destinationLabel || entry.destinationAddress}
                    </p>
                    {entry.notes ? <p>{entry.notes}</p> : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                      {entry.calculationSource || "Map estimate"}
                    </p>
                    <form action={deleteMileageLogAction}>
                      <input name="mileageLogId" type="hidden" value={entry.id} />
                      <button className="rounded-full border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-3 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.12)]">
                        Delete
                      </button>
                    </form>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </LedgerWorkspace>
  );
}
