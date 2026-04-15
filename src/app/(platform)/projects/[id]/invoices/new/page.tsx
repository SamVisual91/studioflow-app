import Link from "next/link";
import { notFound } from "next/navigation";
import { createProjectInvoiceAction } from "@/app/actions";
import { InvoiceWorkspace } from "@/components/invoice-workspace";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getDb } from "@/lib/db";

function getHeroImage(projectType: string, coverImage: string) {
  if (coverImage) {
    return coverImage;
  }

  const imageMap: Record<string, string> = {
    Wedding: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80",
    Event: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80",
    Commercial: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=80",
  };

  return (
    imageMap[projectType] ||
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80"
  );
}

export default async function NewProjectInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, query, { data }] = await Promise.all([params, searchParams, getDashboardPageData()]);
  const project = data.projects.find((item) => item.id === id);

  if (!project) {
    notFound();
  }

  const client = data.clients.find((item) => item.name === project.client);
  const db = getDb();
  const packagePreset = client?.packageName
    ? ((db
        .prepare("SELECT * FROM package_presets WHERE name = ? LIMIT 1")
        .get(client.packageName) as Record<string, unknown> | undefined) ??
      undefined)
    : undefined;
  const lineItems =
    packagePreset && packagePreset.line_items
      ? (JSON.parse(String(packagePreset.line_items)) as Array<{
          title: string;
          description: string;
          amount: number;
        }>)
      : [
          {
            title: client?.packageName || project.name,
            description: project.description || "Creative services for this project",
            amount: 0,
          },
        ];

  const heroImage = getHeroImage(project.type, String(packagePreset?.cover_image || ""));
  const errorMessage = query.error === "invoice-invalid" ? "Fill out the invoice details and keep at least one line item before saving." : "";

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
              &gt; New invoice
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[rgba(207,114,79,0.12)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
              Draft invoice
            </span>
            <Link
              className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
              href={`/projects/${project.id}?tab=files`}
            >
              Back to files
            </Link>
          </div>
        </div>

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
              action={createProjectInvoiceAction}
              clientName={project.client}
              initialDueDate={project.projectDate || ""}
              initialLabel={`${project.client} Invoice`}
              initialLineItems={lineItems}
              initialMethod="Stripe"
              initialPaymentSchedule={[
                {
                  id: "payment-1",
                  amount: lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
                  dueDate: project.projectDate || "",
                  status: "UPCOMING",
                  invoiceNumber: "#DRAFT-01",
                },
              ]}
              initialStatus="DUE_SOON"
              initialTaxRate={3}
              heroImage={heroImage}
              projectName={project.name}
              projectId={project.id}
              submitLabel="Save invoice"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
