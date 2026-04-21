import Link from "next/link";
import { notFound } from "next/navigation";
import { sendProjectInvoiceWithCurrentDataAction, updateProjectInvoiceAction } from "@/app/actions";
import { InvoiceWorkspace } from "@/components/invoice-workspace";
import { processInvoiceAutopay } from "@/lib/autopay";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getDb } from "@/lib/db";

const statusTone: Record<string, string> = {
  PAID: "border-[rgba(47,125,92,0.34)] bg-[rgba(47,125,92,0.12)] text-[var(--forest)]",
  DUE_SOON: "border-[rgba(207,114,79,0.18)] bg-[rgba(207,114,79,0.12)] text-[var(--accent)]",
  OVERDUE: "border-[rgba(122,27,27,0.18)] bg-[rgba(122,27,27,0.12)] text-[rgb(122,27,27)]",
};

export default async function ProjectInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; invoiceId: string }>;
  searchParams: Promise<{ updated?: string; emailed?: string; error?: string }>;
}) {
  const [{ id, invoiceId }, query] = await Promise.all([params, searchParams]);
  await processInvoiceAutopay(invoiceId);
  const { data } = await getDashboardPageData();
  const project = data.projects.find((item) => item.id === id);

  if (!project) {
    notFound();
  }

  const db = getDb();
  const siblingProjectCount =
    Number(
      (
        db
          .prepare("SELECT COUNT(*) AS count FROM projects WHERE client = ?")
          .get(project.client) as { count?: number | null } | undefined
      )?.count ?? 0
    ) || 0;
  const canUseLegacyClientScope = siblingProjectCount <= 1;
  const invoice = data.invoices.find(
    (item) =>
      item.id === invoiceId &&
      (item.projectId === project.id ||
        (canUseLegacyClientScope && !item.projectId && item.client === project.client))
  );

  if (!invoice) {
    notFound();
  }

  const client = data.clients.find((item) => item.name === project.client);
  const packagePreset = client?.packageName
    ? ((db
        .prepare("SELECT * FROM package_presets WHERE name = ? LIMIT 1")
        .get(client.packageName) as Record<string, unknown> | undefined) ??
      undefined)
    : undefined;
  const currentLineItems =
    invoice.lineItems.length > 0
      ? invoice.lineItems
      : packagePreset && packagePreset.line_items
      ? (JSON.parse(String(packagePreset.line_items)) as Array<{
          title: string;
          description: string;
          amount: number;
        }>)
      : [
          {
            title: invoice.label,
            description: client?.packageName || project.name,
            amount: invoice.amount,
          },
        ];
  const taxRate = Number(invoice.taxRate ?? 3);
  const heroImage =
    String(packagePreset?.cover_image || "") ||
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80";
  const successMessage = query.emailed
    ? "Invoice emailed successfully."
    : query.updated
      ? "Invoice updated successfully."
      : "";
  const errorMessage =
    query.error === "invoice-invalid"
      ? "Fill out the invoice details and keep at least one line item before saving."
      : query.error === "invoice-send-invalid"
        ? "Add the client email before sending this invoice."
        : query.error === "smtp-missing"
          ? "SMTP is not configured yet, so the invoice email could not be sent."
          : query.error === "invoice-send-failed"
            ? "The invoice email could not be sent. Double-check the client email and SMTP settings."
            : "";

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 text-[var(--ink)]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{project.client} Invoice</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              <Link className="hover:text-[var(--ink)]" href="/projects">
                Projects
              </Link>{" "}
              &gt;{" "}
              <Link className="hover:text-[var(--ink)]" href={`/projects/${project.id}`}>
                {project.name}
              </Link>{" "}
              &gt; Invoice
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                statusTone[invoice.status] || "border-black/[0.08] bg-black/[0.06] text-[var(--muted)]"
              }`}
            >
              {invoice.statusLabel}
            </span>
            <Link
              className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
              href={`/projects/${project.id}?tab=financials`}
            >
              Edit
            </Link>
            {invoice.publicToken ? (
              <Link
                className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                href={`/invoice/${invoice.publicToken}`}
                target="_blank"
              >
                Open client invoice
              </Link>
            ) : null}
          </div>
        </div>

        {successMessage ? (
          <div className="mb-6 rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-6 rounded-[1.5rem] border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[9rem_1fr]">
          <aside className="grid content-start gap-4">
            <a
              className="rounded-[1.3rem] border-2 border-[rgb(88,112,255)] bg-white px-4 py-6 text-[rgb(88,112,255)] shadow-[0_12px_30px_rgba(88,112,255,0.12)] transition hover:-translate-y-0.5"
              href="#invoice-section"
            >
              <p className="text-sm font-semibold">01</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em]">Invoice</p>
            </a>
            <a
              className="rounded-[1.3rem] border border-black/[0.08] bg-white px-4 py-6 text-[var(--muted)] transition hover:-translate-y-0.5 hover:text-[var(--ink)]"
              href="#payment-schedule-section"
            >
              <p className="text-sm font-semibold">02</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em]">Payment plan</p>
            </a>
          </aside>

          <section className="grid gap-6">
            <InvoiceWorkspace
              action={updateProjectInvoiceAction}
              clientName={project.client}
              initialDueDate={invoice.dueDate}
              initialLabel={invoice.label}
              initialLineItems={currentLineItems}
              initialMethod={invoice.method}
              initialPaymentSchedule={
                invoice.paymentSchedule.length > 0
                  ? invoice.paymentSchedule
                  : [
                      {
                        id: `payment-${invoice.id}`,
                        amount: invoice.amount,
                        dueDate: invoice.dueDate,
                        status: invoice.status,
                        invoiceNumber: `#${invoice.id.slice(0, 6).toUpperCase()}-01`,
                      },
                    ]
              }
              initialStatus={invoice.status}
              initialTaxRate={taxRate}
              heroImage={heroImage}
              invoiceId={invoice.id}
              previousLabel={invoice.label}
              projectName={project.name}
              projectId={project.id}
              secondaryAction={sendProjectInvoiceWithCurrentDataAction}
              secondarySubmitLabel="Send invoice"
              submitLabel="Save invoice changes"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
