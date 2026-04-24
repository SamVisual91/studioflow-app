import { MileageEntryDialog } from "@/components/mileage-entry-dialog";
import { MileageHistoryRow } from "@/components/mileage-history-row";
import { LedgerWorkspace } from "@/components/ledger-workspace";
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
  const mileageProjects = data.projects.map((project) => ({
    id: project.id,
    name: project.name,
    client: project.client,
  }));

  return (
    <LedgerWorkspace
      copy="Track every client drive, calculate one-way or round-trip mileage from addresses, and keep a clean trip history inside the ledger."
      currentPath="/ledger/mileage"
      summary={shellSummary}
      title="Mileage Tracker"
      user={user}
      actions={<MileageEntryDialog projects={mileageProjects} />}
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
              <div className="rounded-[1.15rem] border border-black/[0.08]">
                  <table className="w-full table-fixed border-collapse text-left text-sm">
                  <thead>
                    <tr className="sticky top-0 z-10 bg-[rgba(16,33,52,0.06)] text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                      <th className="sticky left-0 z-20 w-[8%] border-b border-r border-black/[0.08] bg-[rgba(16,33,52,0.06)] px-3 py-3 font-medium">Date</th>
                      <th className="w-[12%] border-b border-r border-black/[0.08] px-3 py-3 font-medium">Purpose</th>
                      <th className="w-[17%] border-b border-r border-black/[0.08] px-3 py-3 font-medium">From</th>
                      <th className="w-[17%] border-b border-r border-black/[0.08] px-3 py-3 font-medium">To</th>
                      <th className="w-[8%] border-b border-r border-black/[0.08] px-3 py-3 font-medium">Trip</th>
                      <th className="w-[7%] border-b border-r border-black/[0.08] px-3 py-3 font-medium text-right">One way</th>
                      <th className="w-[7%] border-b border-r border-black/[0.08] px-3 py-3 font-medium text-right">Total</th>
                      <th className="w-[12%] border-b border-r border-black/[0.08] px-3 py-3 font-medium">Notes</th>
                      <th className="w-[7%] border-b border-r border-black/[0.08] px-3 py-3 font-medium">Source</th>
                      <th className="w-[5%] border-b px-3 py-3 font-medium text-right">Row actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mileage.entries.map((entry, index) => (
                      <MileageHistoryRow key={entry.id} entry={entry} index={index} />
                    ))}
                  </tbody>
                  </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </LedgerWorkspace>
  );
}
