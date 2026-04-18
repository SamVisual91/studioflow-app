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

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,0.68fr)_minmax(0,1.32fr)]">
        <div className="rounded-[1.35rem] border border-black/[0.08] bg-white/94 p-4 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">New mileage trip</p>
            <h2 className="mt-2 text-[1.7rem] font-semibold">Log a drive</h2>
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
              <div className="overflow-hidden rounded-[1.1rem] border border-black/[0.06] bg-white">
                <div className="max-h-[860px] overflow-auto">
                  <table className="min-w-[1220px] w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="sticky top-0 z-10 bg-[#f5efe6] text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] shadow-[inset_0_-1px_0_rgba(16,33,52,0.08)]">
                      <th className="px-3 py-3 font-medium">Date</th>
                      <th className="px-3 py-3 font-medium">Purpose</th>
                      <th className="px-3 py-3 font-medium">From</th>
                      <th className="px-3 py-3 font-medium">To</th>
                      <th className="px-3 py-3 font-medium">Trip</th>
                      <th className="px-3 py-3 font-medium text-right">One way</th>
                      <th className="px-3 py-3 font-medium text-right">Total</th>
                      <th className="px-3 py-3 font-medium">Notes</th>
                      <th className="px-3 py-3 font-medium">Source</th>
                      <th className="px-3 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mileage.entries.map((entry, index) => (
                      <tr
                        key={entry.id}
                        className={`border-t border-black/[0.06] align-top ${index % 2 === 0 ? "bg-white" : "bg-[rgba(16,33,52,0.018)]"}`}
                      >
                        <td className="px-3 py-3 whitespace-nowrap">
                          {shortDate.format(new Date(entry.tripDate))}
                        </td>
                        <td className="px-3 py-3 font-semibold">{entry.purpose}</td>
                        <td className="min-w-[220px] px-3 py-3 text-[var(--muted)]">
                          {entry.originLabel || entry.originAddress}
                        </td>
                        <td className="min-w-[220px] px-3 py-3 text-[var(--muted)]">
                          {entry.destinationLabel || entry.destinationAddress}
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-[rgba(16,33,52,0.05)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                            {entry.tripType === "ROUND_TRIP" ? "Round trip" : "One way"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-medium">{entry.oneWayMiles.toFixed(1)} mi</td>
                        <td className="px-3 py-3 text-right font-semibold">{entry.totalMiles.toFixed(1)} mi</td>
                        <td className="min-w-[180px] px-3 py-3 text-[var(--muted)]">
                          {entry.notes || <span className="text-black/35">-</span>}
                        </td>
                        <td className="min-w-[170px] px-3 py-3 text-[var(--muted)]">
                          {entry.calculationSource || "Map estimate"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <form action={deleteMileageLogAction}>
                            <input name="mileageLogId" type="hidden" value={entry.id} />
                            <button className="rounded-full border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-3 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.12)]">
                              Delete
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LedgerWorkspace>
  );
}
