import Link from "next/link";
import {
  checkInGearAction,
  checkoutGearAction,
  createGearItemAction,
  deleteGearItemAction,
} from "@/app/actions";
import { BarcodeLabel } from "@/components/barcode-label";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";
import { DoubleChevronDownIcon } from "@/components/double-chevron-down-icon";
import { PrintBarcodesButton } from "@/components/print-barcodes-button";
import { getDb } from "@/lib/db";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { currencyFormatter, shortDate } from "@/lib/formatters";

type GearItem = {
  id: string;
  name: string;
  category: string;
  barcode: string | null;
  serial_number: string | null;
  status: string;
  condition: string;
  daily_rate: number;
  replacement_value: number;
  current_holder: string | null;
  checked_out_at: string | null;
  due_back_at: string | null;
  notes: string | null;
};

type ActiveCheckoutRow = {
  id: string;
  gear_id: string;
  checkout_type: string;
  project_id: string | null;
  renter_name: string | null;
  renter_email: string | null;
  starts_at: string;
  due_at: string;
  notes: string | null;
  gear_name: string;
  gear_category: string;
  project_name: string | null;
  project_client: string | null;
};

function statusTone(status: string) {
  if (status === "AVAILABLE") {
    return "border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] text-[var(--forest)]";
  }

  if (status === "OUT_ON_RENTAL") {
    return "border-[rgba(207,114,79,0.24)] bg-[rgba(207,114,79,0.08)] text-[var(--accent)]";
  }

  if (status === "ON_PROJECT") {
    return "border-black/[0.08] bg-[rgba(29,27,31,0.06)] text-[var(--ink)]";
  }

  return "border-black/[0.08] bg-white text-[var(--muted)]";
}

export default async function ProductionPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, data } = await getDashboardPageData();
  const params = searchParams ? await searchParams : {};
  const db = getDb();
  const gearItems = db
    .prepare("SELECT * FROM gear_inventory ORDER BY category ASC, name ASC")
    .all() as GearItem[];
  const activeCheckouts = db
    .prepare(
      `SELECT
        gear_checkouts.*,
        gear_inventory.name AS gear_name,
        gear_inventory.category AS gear_category,
        projects.name AS project_name,
        projects.client AS project_client
      FROM gear_checkouts
      JOIN gear_inventory ON gear_inventory.id = gear_checkouts.gear_id
      LEFT JOIN projects ON projects.id = gear_checkouts.project_id
      WHERE gear_checkouts.status = 'ACTIVE'
      ORDER BY gear_checkouts.due_at ASC`
    )
    .all() as ActiveCheckoutRow[];

  const availableGear = gearItems.filter((item) => item.status === "AVAILABLE");
  const rentalGear = activeCheckouts.filter((item) => item.checkout_type === "RENTAL");
  const projectGear = activeCheckouts.filter((item) => item.checkout_type === "PROJECT");
  const availableCount = gearItems.filter((item) => item.status === "AVAILABLE").length;
  const barcodeQuery = String(params?.barcode ?? "").trim();
  const scannedGear = barcodeQuery
    ? ((db.prepare("SELECT * FROM gear_inventory WHERE barcode = ? LIMIT 1").get(barcodeQuery) as GearItem | undefined) ??
      null)
    : null;
  const scannedCheckoutQuery = db.prepare(
    `SELECT
      gear_checkouts.*,
      gear_inventory.name AS gear_name,
      gear_inventory.category AS gear_category,
      projects.name AS project_name,
      projects.client AS project_client
    FROM gear_checkouts
    JOIN gear_inventory ON gear_inventory.id = gear_checkouts.gear_id
    LEFT JOIN projects ON projects.id = gear_checkouts.project_id
    WHERE gear_checkouts.gear_id = ? AND gear_checkouts.status = 'ACTIVE'
    ORDER BY gear_checkouts.created_at DESC
    LIMIT 1`
  );
  const scannedCheckout = scannedGear
    ? ((scannedCheckoutQuery.get(scannedGear.id) as ActiveCheckoutRow | undefined) ?? null)
    : null;
  const gearCreated = params?.gearCreated === "1";
  const gearCheckedOut = params?.gearCheckedOut === "1";
  const gearCheckedIn = params?.gearCheckedIn === "1";
  const gearDeleted = params?.gearDeleted === "1";
  const errorMessage =
    params?.error === "gear-invalid"
      ? "Fill out the required gear details before saving."
      : params?.error === "gear-checkout-invalid"
        ? "Choose the gear, dates, and a project or renter before checking it out."
        : params?.error === "gear-unavailable"
          ? "That gear is not currently available."
          : params?.error === "gear-checkin-invalid"
            ? "That gear check-in could not be completed."
            : params?.error === "gear-scan-invalid"
              ? "No gear matched that barcode."
              : params?.error === "gear-delete-invalid"
                ? "That gear item could not be deleted."
                : params?.error === "gear-delete-active"
                  ? "Check the gear back in before deleting it."
              : "";

  return (
    <DashboardShell
      currentPath="/crm"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="grid gap-7">
        <SectionHeader
          eyebrow="Production"
          title="Camera gear"
          copy="Manage your camera rental inventory, check gear out to outside renters, and assign the same gear to active client projects without leaving the app."
        />

        {gearCreated ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Gear added to inventory.
          </div>
        ) : null}
        {gearCheckedOut ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Gear checked out successfully.
          </div>
        ) : null}
        {gearCheckedIn ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Gear checked back in.
          </div>
        ) : null}
        {gearDeleted ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Gear deleted from inventory.
          </div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-[1.5rem] border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="border border-black/[0.06] bg-white/92 p-5 shadow-[0_14px_36px_rgba(31,27,24,0.05)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Total gear</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">{gearItems.length}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Every rentable or production-ready item.</p>
          </article>
          <article className="border border-black/[0.06] bg-white/92 p-5 shadow-[0_14px_36px_rgba(31,27,24,0.05)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Available now</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">{availableCount}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Ready for rentals or project use.</p>
          </article>
          <article className="border border-[rgba(207,114,79,0.18)] bg-[rgba(207,114,79,0.07)] p-5 shadow-[0_14px_36px_rgba(31,27,24,0.04)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">Out on rental</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--accent)]">{rentalGear.length}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Currently with paying renters.</p>
          </article>
          <article className="border border-black/[0.06] bg-white/92 p-5 shadow-[0_14px_36px_rgba(31,27,24,0.05)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">On projects</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--ink)]">{projectGear.length}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Assigned to client productions.</p>
          </article>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <form className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]" method="get">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Barcode scan</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Scan gear</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Use a USB barcode scanner here, or type the code and press enter.
            </p>
            <div className="mt-6 flex gap-3">
              <input
                autoFocus
                className="w-full rounded-2xl border border-black/[0.08] bg-white px-4 py-3"
                name="barcode"
                placeholder="Scan barcode"
                defaultValue={barcodeQuery}
              />
              <button className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                Scan
              </button>
            </div>
          </form>

          <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Scanned gear</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Quick action</h2>
            {!barcodeQuery ? (
              <p className="mt-4 text-sm text-[var(--muted)]">Scan a gear label to load a quick check-in or check-out action here.</p>
            ) : !scannedGear ? (
              <p className="mt-4 text-sm text-[var(--accent)]">No gear matched barcode <span className="font-semibold">{barcodeQuery}</span>.</p>
            ) : (
              <div className="mt-5 grid gap-4">
                <article className="border border-black/[0.06] bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{scannedGear.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {scannedGear.category}
                        {scannedGear.barcode ? ` • ${scannedGear.barcode}` : ""}
                      </p>
                    </div>
                    <span className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${statusTone(scannedGear.status)}`}>
                      {scannedGear.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-4 max-w-xs">
                    <BarcodeLabel value={scannedGear.barcode || ""} compact />
                  </div>
                  {scannedGear.current_holder ? (
                    <p className="mt-3 text-sm text-[var(--muted)]">Currently with {scannedGear.current_holder}</p>
                  ) : null}
                </article>

                {scannedGear.status === "AVAILABLE" ? (
                  <form action={checkoutGearAction} className="grid gap-4 border border-black/[0.06] bg-white p-4 sm:grid-cols-2">
                    <input name="gearId" type="hidden" value={scannedGear.id} />
                    <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                      Use type
                      <select className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" defaultValue="PROJECT" name="checkoutType">
                        <option value="PROJECT">Project use</option>
                        <option value="RENTAL">Rental customer</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                      Project
                      <select className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="projectId">
                        <option value="">Choose project</option>
                        {data.projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.client} • {project.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                      Rental client name
                      <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="renterName" placeholder="Only for rentals" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                      Rental client email
                      <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="renterEmail" type="email" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                      Check-out date
                      <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="startsAt" required type="date" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                      Due back
                      <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="dueAt" required type="date" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-[var(--ink)] sm:col-span-2">
                      Notes
                      <textarea className="min-h-20 rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="notes" />
                    </label>
                    <div className="sm:col-span-2">
                      <button className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                        Check out scanned gear
                      </button>
                    </div>
                  </form>
                ) : scannedCheckout ? (
                  <form action={checkInGearAction} className="grid gap-4 border border-black/[0.06] bg-white p-4">
                    <input name="gearId" type="hidden" value={scannedGear.id} />
                    <input name="checkoutId" type="hidden" value={scannedCheckout.id} />
                    <p className="text-sm text-[var(--muted)]">
                      {scannedCheckout.checkout_type === "PROJECT"
                        ? `Assigned to ${scannedCheckout.project_client || "project"}`
                        : `Out with ${scannedCheckout.renter_name || "rental client"}`} • due{" "}
                      {shortDate.format(new Date(scannedCheckout.due_at))}
                    </p>
                    <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                      Return condition
                      <select className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" defaultValue="Ready" name="condition">
                        <option value="Ready">Ready</option>
                        <option value="Needs cleaning">Needs cleaning</option>
                        <option value="Needs service">Needs service</option>
                      </select>
                    </label>
                    <div>
                      <button className="rounded-full border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-3 text-sm font-semibold text-[var(--forest)] transition hover:bg-[rgba(47,125,92,0.14)]">
                        Check in scanned gear
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-sm text-[var(--muted)]">This gear is unavailable, but there is no active checkout record attached to it.</p>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <details className="group border border-black/[0.06] bg-white/92 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">New gear</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Add inventory</h2>
              </div>
              <DoubleChevronDownIcon className="h-4 w-4 shrink-0 text-[var(--muted)] transition group-open:rotate-180" />
            </summary>
            <form action={createGearItemAction} className="border-t border-black/[0.06] p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Gear name
                  <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="name" required />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Category
                  <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="category" placeholder="Camera body" required />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Barcode
                  <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="barcode" placeholder="Auto-generated if blank" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Serial #
                  <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="serialNumber" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Condition
                  <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" defaultValue="Ready" name="condition" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Daily rental rate
                  <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" min="0" name="dailyRate" step="0.01" type="number" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Replacement value
                  <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" min="0" name="replacementValue" step="0.01" type="number" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)] sm:col-span-2">
                  Notes
                  <textarea className="min-h-24 rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="notes" placeholder="Accessories, battery count, wear notes..." />
                </label>
              </div>
              <button className="mt-6 rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(47,125,92,0.22)] transition hover:brightness-110">
                Add gear
              </button>
            </form>
          </details>

          <details className="group border border-black/[0.06] bg-white/92 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Check out</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Assign gear</h2>
              </div>
              <DoubleChevronDownIcon className="h-4 w-4 shrink-0 text-[var(--muted)] transition group-open:rotate-180" />
            </summary>
            <form action={checkoutGearAction} className="border-t border-black/[0.06] p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Gear item
                  <select className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="gearId" required>
                    <option value="">Choose gear</option>
                    {availableGear.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} • {item.category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Use type
                  <select className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" defaultValue="PROJECT" name="checkoutType">
                    <option value="PROJECT">Project use</option>
                    <option value="RENTAL">Rental customer</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Project
                  <select className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="projectId">
                    <option value="">Choose project</option>
                    {data.projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.client} • {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Rental client name
                  <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="renterName" placeholder="Only for rentals" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Rental client email
                  <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="renterEmail" placeholder="Only for rentals" type="email" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Check-out date
                  <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="startsAt" required type="date" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                  Due back
                  <input className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="dueAt" required type="date" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--ink)] sm:col-span-2">
                  Notes
                  <textarea className="min-h-24 rounded-2xl border border-black/[0.08] bg-white px-4 py-3" name="notes" placeholder="Tripod included, dual battery kit, signed rental agreement..." />
                </label>
              </div>
              <button className="mt-6 rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                Check out gear
              </button>
            </form>
          </details>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Active checkouts</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Rental + project gear</h2>
              </div>
              <p className="text-sm text-[var(--muted)]">{activeCheckouts.length} active</p>
            </div>

            <div className="mt-6 grid gap-3">
              {activeCheckouts.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No gear is checked out right now.</p>
              ) : (
                activeCheckouts.map((checkout) => (
                  <article className="border border-black/[0.06] bg-white p-4" key={checkout.id}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{checkout.gear_name}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {checkout.checkout_type === "PROJECT"
                            ? `${checkout.project_client || "Project"} • ${checkout.project_name || "Project use"}`
                            : `${checkout.renter_name || "Rental client"}${checkout.renter_email ? ` • ${checkout.renter_email}` : ""}`}
                        </p>
                        <p className="mt-3 text-sm text-[var(--muted)]">
                          Out {shortDate.format(new Date(checkout.starts_at))} • Due {shortDate.format(new Date(checkout.due_at))}
                        </p>
                        {checkout.project_id ? (
                          <Link className="mt-2 inline-block text-xs font-semibold text-[var(--accent)] hover:underline" href={`/projects/${checkout.project_id}`}>
                            Open linked project
                          </Link>
                        ) : null}
                      </div>
                      <form action={checkInGearAction} className="grid gap-2 sm:w-44">
                        <input name="gearId" type="hidden" value={checkout.gear_id} />
                        <input name="checkoutId" type="hidden" value={checkout.id} />
                        <select className="rounded-2xl border border-black/[0.08] bg-white px-3 py-2 text-sm" defaultValue="Ready" name="condition">
                          <option value="Ready">Ready</option>
                          <option value="Needs cleaning">Needs cleaning</option>
                          <option value="Needs service">Needs service</option>
                        </select>
                        <button className="rounded-full border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-4 py-2 text-sm font-semibold text-[var(--forest)] transition hover:bg-[rgba(47,125,92,0.14)]">
                          Check in
                        </button>
                      </form>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Inventory status</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">What’s available</h2>
            <div className="mt-6 grid gap-3">
              {gearItems.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No gear added yet. Start by adding your first item above.</p>
              ) : (
                gearItems.slice(0, 8).map((item) => (
                  <article className="border border-black/[0.06] bg-white p-4" key={item.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-[var(--ink)]">{item.name}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {item.category}
                          {item.serial_number ? ` • ${item.serial_number}` : ""}
                        </p>
                        <p className="mt-3 text-sm text-[var(--muted)]">
                          {item.daily_rate > 0 ? `${currencyFormatter.format(item.daily_rate)}/day` : "No rental rate set"}
                        </p>
                      </div>
                    <span className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${statusTone(item.status)}`}>
                      {item.status.replaceAll("_", " ")}
                    </span>
                  </div>
                    {item.current_holder ? (
                      <p className="mt-3 text-sm text-[var(--muted)]">Currently with {item.current_holder}</p>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Full inventory</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Gear list</h2>
            </div>
            <p className="text-sm text-[var(--muted)]">Track status, rates, and current holder at a glance.</p>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="border-b border-black/[0.06] bg-[#fbf8f3] text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-4 font-semibold">Gear</th>
                  <th className="px-4 py-4 font-semibold">Category</th>
                  <th className="px-4 py-4 font-semibold">Barcode</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Condition</th>
                  <th className="px-4 py-4 font-semibold">Daily rate</th>
                  <th className="px-4 py-4 font-semibold">Current holder</th>
                  <th className="px-4 py-4 font-semibold">Due back</th>
                  <th className="px-4 py-4 text-right font-semibold">Delete</th>
                </tr>
              </thead>
              <tbody>
                {gearItems.map((item) => (
                  <tr className="border-t border-black/[0.05] transition hover:bg-[#fbf8f3]" key={item.id}>
                    <td className="px-4 py-4 font-semibold text-[var(--ink)]">{item.name}</td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)]">{item.category}</td>
                    <td className="px-4 py-4">
                      <div className="max-w-[9rem]">
                        <BarcodeLabel small value={item.barcode || ""} />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${statusTone(item.status)}`}>
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--ink)]">{item.condition}</td>
                    <td className="px-4 py-4 text-sm text-[var(--ink)]">
                      {item.daily_rate > 0 ? currencyFormatter.format(item.daily_rate) : "—"}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)]">{item.current_holder || "Available"}</td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)]">
                      {item.due_back_at ? shortDate.format(new Date(item.due_back_at)) : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <form action={deleteGearItemAction}>
                          <input name="gearId" type="hidden" value={item.id} />
                          <button
                            aria-label={`Delete ${item.name}`}
                            className="flex h-9 w-9 items-center justify-center border border-[rgba(207,114,79,0.2)] bg-[rgba(207,114,79,0.08)] text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.14)]"
                            title={`Delete ${item.name}`}
                            type="submit"
                          >
                            🗑
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]" id="gear-labels">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Print-ready labels</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Barcode labels</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Print these labels and place them directly on your gear for USB scanner check-in and check-out.
              </p>
            </div>
            <PrintBarcodesButton />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {gearItems.map((item) => (
              <article className="border border-black/[0.06] bg-white p-4" key={`${item.id}-label`}>
                <p className="font-semibold text-[var(--ink)]">{item.name}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {item.category}
                  {item.serial_number ? ` • ${item.serial_number}` : ""}
                </p>
                <div className="mt-4">
                  <BarcodeLabel value={item.barcode || ""} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </DashboardShell>
  );
}
