import { deleteMileageLogAction, updateMileageLogAction } from "@/app/actions";
import { LedgerWorkspace } from "@/components/ledger-workspace";
import { MileageLogForm } from "@/components/mileage-log-form";
import { shortDate } from "@/lib/formatters";
import { getLedgerPageData } from "@/lib/ledger-page";
import { getMileageData } from "@/lib/mileage";

export default async function LedgerMileagePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; updated?: string; error?: string }>;
}) {
  const [{ saved, deleted, updated, error }, { user, data, shellSummary }] = await Promise.all([
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

      {updated ? (
        <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
          Mileage trip updated.
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

      <div className="grid gap-6">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,520px)_minmax(0,1fr)]">
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

        <article className="rounded-[1.35rem] border border-black/[0.08] bg-[rgba(16,33,52,0.04)] p-4 shadow-[0_14px_28px_rgba(59,36,17,0.05)]">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">Spreadsheet workflow</p>
          <h3 className="mt-2 text-xl font-semibold">Edit directly in the mileage sheet</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Use the form to calculate a new route, then adjust dates, addresses, notes, or mileage totals directly inside the trip history sheet below. Each row saves independently.
          </p>
        </article>
        </div>

        <div className="rounded-[1.45rem] border border-black/[0.08] bg-white/94 p-5 shadow-[0_14px_28px_rgba(59,36,17,0.07)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Live spreadsheet</p>
              <h2 className="mt-2 text-2xl font-semibold">Mileage history sheet</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                Every saved drive lands here as a working row. Update the fields inline, save the row you changed, or remove an entry if it does not belong in the log.
              </p>
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
              <div className="overflow-hidden rounded-[1.15rem] border border-black/[0.08]">
                <div className="max-h-[1120px] overflow-auto">
                  <table className="min-w-[1480px] w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="sticky top-0 z-10 bg-[rgba(16,33,52,0.06)] text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                      <th className="sticky left-0 z-20 min-w-[120px] border-b border-r border-black/[0.08] bg-[rgba(16,33,52,0.06)] px-3 py-3 font-medium">Date</th>
                      <th className="min-w-[180px] border-b border-r border-black/[0.08] px-3 py-3 font-medium">Purpose</th>
                      <th className="min-w-[260px] border-b border-r border-black/[0.08] px-3 py-3 font-medium">From</th>
                      <th className="min-w-[260px] border-b border-r border-black/[0.08] px-3 py-3 font-medium">To</th>
                      <th className="min-w-[120px] border-b border-r border-black/[0.08] px-3 py-3 font-medium">Trip</th>
                      <th className="min-w-[120px] border-b border-r border-black/[0.08] px-3 py-3 font-medium text-right">One way</th>
                      <th className="min-w-[120px] border-b border-r border-black/[0.08] px-3 py-3 font-medium text-right">Total</th>
                      <th className="min-w-[220px] border-b border-r border-black/[0.08] px-3 py-3 font-medium">Notes</th>
                      <th className="min-w-[190px] border-b border-r border-black/[0.08] px-3 py-3 font-medium">Source</th>
                      <th className="min-w-[170px] border-b px-3 py-3 font-medium text-right">Row actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mileage.entries.map((entry, index) => (
                      <tr key={entry.id} className={index % 2 === 0 ? "bg-white" : "bg-[rgba(16,33,52,0.018)]"}>
                        <td className="p-0" colSpan={10}>
                          <form action={updateMileageLogAction}>
                            <input name="mileageLogId" type="hidden" value={entry.id} />
                            <div className="grid min-w-[1480px] grid-cols-[120px_180px_260px_260px_120px_120px_120px_220px_190px_170px] border-t border-black/[0.06]">
                              <div className="sticky left-0 z-10 border-r border-black/[0.08] bg-inherit px-2 py-2">
                                <input
                                  className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2.5 text-sm outline-none transition focus:border-[var(--forest)] focus:bg-white"
                                  defaultValue={entry.tripDate.slice(0, 10)}
                                  name="tripDate"
                                  type="date"
                                />
                              </div>
                              <div className="border-r border-black/[0.08] px-2 py-2">
                                <input
                                  className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2.5 text-sm font-semibold outline-none transition focus:border-[var(--forest)] focus:bg-white"
                                  defaultValue={entry.purpose}
                                  name="purpose"
                                />
                              </div>
                              <div className="border-r border-black/[0.08] px-2 py-2">
                                <input
                                  className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2.5 text-sm text-[var(--muted)] outline-none transition focus:border-[var(--forest)] focus:bg-white focus:text-[var(--ink)]"
                                  defaultValue={entry.originAddress}
                                  name="originAddress"
                                />
                              </div>
                              <div className="border-r border-black/[0.08] px-2 py-2">
                                <input
                                  className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2.5 text-sm text-[var(--muted)] outline-none transition focus:border-[var(--forest)] focus:bg-white focus:text-[var(--ink)]"
                                  defaultValue={entry.destinationAddress}
                                  name="destinationAddress"
                                />
                              </div>
                              <div className="border-r border-black/[0.08] px-2 py-2">
                                <select
                                  className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2.5 text-sm outline-none transition focus:border-[var(--forest)] focus:bg-white"
                                  defaultValue={entry.tripType}
                                  name="tripType"
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
                                />
                              </div>
                              <div className="border-r border-black/[0.08] px-2 py-2">
                                <input
                                  className="h-10 w-full rounded-[0.9rem] border border-transparent bg-transparent px-2.5 text-sm text-[var(--muted)] outline-none transition focus:border-[var(--forest)] focus:bg-white focus:text-[var(--ink)]"
                                  defaultValue={entry.notes}
                                  name="notes"
                                  placeholder="-"
                                />
                              </div>
                              <div className="border-r border-black/[0.08] px-3 py-3 text-sm text-[var(--muted)]">
                                {entry.calculationSource || "Map estimate"}
                              </div>
                              <div className="flex items-center justify-end gap-2 px-2 py-2">
                                <button className="rounded-full bg-[var(--sidebar)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110">
                                  Save row
                                </button>
                                <button
                                  className="rounded-full border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-3 py-2 text-xs font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.12)]"
                                  formAction={deleteMileageLogAction}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
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
