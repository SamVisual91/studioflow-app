import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createDocumentTemplateAction,
  createInvoiceTemplateAction,
  deleteDocumentTemplateAction,
} from "@/app/actions";
import { ContractWorkspace } from "@/components/contract-workspace";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";
import { InvoiceWorkspace } from "@/components/invoice-workspace";
import { createDefaultContractDocument, parseContractDocument } from "@/lib/contracts";
import { getDashboardPageData } from "@/lib/dashboard-page";
import {
  getTemplateLibraryData,
  getTemplatePresetBody,
  getTemplateTypeFromSlug,
  templateClientTypes,
} from "@/lib/templates";

export default async function TemplateTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string; template?: string }>;
}) {
  const [{ type }, query, { user, data }] = await Promise.all([
    params,
    searchParams,
    getDashboardPageData(),
  ]);
  const templateType = getTemplateTypeFromSlug(type);

  if (!templateType) {
    notFound();
  }

  const templates = getTemplateLibraryData().filter((template) => template.templateType === templateType);
  const starterBody = getTemplatePresetBody(templateType);
  const starterSummary = `Starter ${templateType.toLowerCase()} template for your client workflow.`;
  const pagePath = `/templates/${type}`;
  const selectedTemplate = templates.find((template) => template.id === query.template);
  const errorMessage =
    query.error === "template-invalid"
      ? "Fill out every template field before saving."
      : "";

  if (templateType === "Invoice") {
    const today = new Date().toISOString().slice(0, 10);
    const heroImage =
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80";
    const selectedInvoice = (() => {
      if (!selectedTemplate) {
        return null;
      }

      try {
        return JSON.parse(selectedTemplate.body) as {
          label?: string;
          dueDate?: string;
          method?: string;
          taxRate?: number;
          lineItems?: Array<{ title: string; description: string; image?: string; amount: number }>;
          paymentSchedule?: Array<{
            id: string;
            amount: number;
            dueDate: string;
            status: string;
            invoiceNumber: string;
          }>;
        };
      } catch {
        return null;
      }
    })();

    return (
      <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 text-[var(--ink)]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">Invoice Template</h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                <Link className="hover:text-[var(--ink)]" href="/templates">
                  Templates
                </Link>{" "}
                &gt; Invoice
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[rgba(207,114,79,0.12)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
                Template draft
              </span>
              <Link
                className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                href="/templates"
              >
                Back to templates
              </Link>
            </div>
          </div>

          {query.saved === "1" ? (
            <div className="mb-6 rounded-[1.5rem] border border-[rgba(47,125,92,0.22)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm font-semibold text-[var(--forest)]">
              Invoice template saved.
            </div>
          ) : null}

          {query.deleted === "1" ? (
            <div className="mb-6 rounded-[1.5rem] border border-[rgba(47,125,92,0.22)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm font-semibold text-[var(--forest)]">
              Invoice template deleted.
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
              <div className="rounded-[1.5rem] border border-black/[0.08] bg-white/80 p-5">
                <label className="grid max-w-sm gap-2 text-sm font-semibold">
                  Save this invoice template for
                  <select
                    className="rounded-[1rem] border border-black/[0.08] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forest)]"
                    defaultValue={selectedTemplate?.clientType || "Wedding"}
                    form="invoice-template-form"
                    name="clientType"
                  >
                    {templateClientTypes.map((clientType) => (
                      <option key={clientType}>{clientType}</option>
                    ))}
                  </select>
                </label>
              </div>

              <InvoiceWorkspace
                action={createInvoiceTemplateAction}
                clientName="Template Client"
                formId="invoice-template-form"
                hiddenFields={selectedTemplate ? { templateId: selectedTemplate.id } : {}}
                heroImage={heroImage}
                initialDueDate={selectedInvoice?.dueDate || today}
                initialLabel={selectedInvoice?.label || "Invoice Template"}
                initialLineItems={[
                  ...(selectedInvoice?.lineItems?.length
                    ? selectedInvoice.lineItems
                    : [
                        {
                          title: "Collection I",
                          description: "A wedding film package",
                          amount: 2500,
                        },
                      ]),
                ]}
                initialMethod={selectedInvoice?.method || "Stripe"}
                initialPaymentSchedule={
                  selectedInvoice?.paymentSchedule?.length
                    ? selectedInvoice.paymentSchedule
                    : [
                        {
                          id: "template-payment-1",
                          amount: 2500,
                          dueDate: today,
                          status: "UPCOMING",
                          invoiceNumber: "#TEMPLATE-01",
                        },
                      ]
                }
                initialStatus="DUE_SOON"
                initialTaxRate={selectedInvoice?.taxRate ?? 3}
                projectId="invoice-template"
                projectName="Invoice Template"
                submitLabel={selectedTemplate ? "Save changes" : "Save invoice template"}
              />
            </section>
          </div>

          <section className="mt-8 rounded-[1.7rem] border border-black/[0.08] bg-white/88 p-5 shadow-[0_18px_45px_rgba(59,36,17,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted)]">Saved versions</p>
                <h2 className="mt-2 text-2xl font-semibold">Your saved invoice templates</h2>
              </div>
              <span className="rounded-full bg-[rgba(47,125,92,0.08)] px-4 py-2 text-sm font-semibold text-[var(--forest)]">
                {templates.length} saved
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {templates.length === 0 ? (
                <div className="rounded-[1.2rem] border border-dashed border-black/15 bg-[rgba(247,241,232,0.45)] p-5 text-sm text-[var(--muted)] md:col-span-2 xl:col-span-3">
                  No saved invoice templates yet. Save the invoice builder above to create one.
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    className="rounded-[1.2rem] border border-black/[0.08] bg-[rgba(247,241,232,0.48)] p-4"
                    key={template.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                          {template.clientType}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold">{template.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--forest)] hover:text-[var(--forest)]"
                          href={`${pagePath}?template=${template.id}`}
                        >
                          Edit
                        </Link>
                        <form action={deleteDocumentTemplateAction}>
                          <input name="id" type="hidden" value={template.id} />
                          <input name="returnTo" type="hidden" value={pagePath} />
                          <button className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{template.summary}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (templateType === "Contract") {
    const initialDocument = selectedTemplate
      ? parseContractDocument(selectedTemplate.body, {
          contractTitle: selectedTemplate.name || "Wedding Contract",
        })
      : createDefaultContractDocument({
          contractTitle: "Wedding Contract",
        });

    return (
      <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 text-[var(--ink)]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold">Contract Template</h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                <Link className="hover:text-[var(--ink)]" href="/templates">
                  Templates
                </Link>{" "}
                &gt; Contract
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[rgba(207,114,79,0.12)] px-4 py-2 text-sm font-semibold text-[var(--accent)]">
                Interactive contract
              </span>
              <Link
                className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                href="/templates"
              >
                Back to templates
              </Link>
            </div>
          </div>

          {query.saved === "1" ? (
            <div className="mb-6 rounded-[1.5rem] border border-[rgba(47,125,92,0.22)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm font-semibold text-[var(--forest)]">
              Contract template saved.
            </div>
          ) : null}

          {query.deleted === "1" ? (
            <div className="mb-6 rounded-[1.5rem] border border-[rgba(47,125,92,0.22)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm font-semibold text-[var(--forest)]">
              Contract template deleted.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-6 rounded-[1.5rem] border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
              {errorMessage}
            </div>
          ) : null}

          <div className="mb-6 rounded-[1.5rem] border border-black/[0.08] bg-white/80 p-5">
            <label className="grid max-w-sm gap-2 text-sm font-semibold">
              Save this contract template for
              <select
                className="rounded-[1rem] border border-black/[0.08] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forest)]"
                defaultValue={selectedTemplate?.clientType || "Wedding"}
                form="contract-template-form"
                name="clientType"
              >
                {templateClientTypes.map((clientType) => (
                  <option key={clientType}>{clientType}</option>
                ))}
              </select>
            </label>
          </div>

          <ContractWorkspace
            action={createDocumentTemplateAction}
            formId="contract-template-form"
            helperText="This template feeds your project contracts. Update the agreement once here, then use it as the starting point whenever you create a contract from a project."
            hiddenFields={{
              templateType: "Contract",
              returnTo: pagePath,
              ...(selectedTemplate ? { templateId: selectedTemplate.id } : {}),
            }}
            initialDocument={initialDocument}
            saveLabel={selectedTemplate ? "Save changes" : "Save contract template"}
            titleLabel="Contract template"
          />

          <section className="mt-8 rounded-[1.7rem] border border-black/[0.08] bg-white/88 p-5 shadow-[0_18px_45px_rgba(59,36,17,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted)]">Saved versions</p>
                <h2 className="mt-2 text-2xl font-semibold">Your saved contract templates</h2>
              </div>
              <span className="rounded-full bg-[rgba(47,125,92,0.08)] px-4 py-2 text-sm font-semibold text-[var(--forest)]">
                {templates.length} saved
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {templates.length === 0 ? (
                <div className="rounded-[1.2rem] border border-dashed border-black/15 bg-[rgba(247,241,232,0.45)] p-5 text-sm text-[var(--muted)] md:col-span-2 xl:col-span-3">
                  No saved contract templates yet. Save the contract builder above to create one.
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    className="rounded-[1.2rem] border border-black/[0.08] bg-[rgba(247,241,232,0.48)] p-4"
                    key={template.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                          {template.clientType}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold">{template.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--forest)] hover:text-[var(--forest)]"
                          href={`${pagePath}?template=${template.id}`}
                        >
                          Edit
                        </Link>
                        <form action={deleteDocumentTemplateAction}>
                          <input name="id" type="hidden" value={template.id} />
                          <input name="returnTo" type="hidden" value={pagePath} />
                          <button className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{template.summary}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <DashboardShell
      currentPath="/templates"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="grid gap-6 rounded-[2rem] border border-black/[0.08] bg-white/88 p-6 shadow-[0_22px_60px_rgba(59,36,17,0.09)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow="Template builder"
            title={`${templateType} template`}
            copy="Start from this preset, adjust it for the client type, then save it as one of your reusable custom templates."
          />
          <Link
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--forest)] hover:text-[var(--forest)]"
            href="/templates"
          >
            Back to Templates
          </Link>
        </div>

        {query.saved === "1" ? (
          <div className="rounded-[1.1rem] border border-[rgba(47,125,92,0.22)] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm font-semibold text-[var(--forest)]">
            Template saved.
          </div>
        ) : null}

        {query.deleted === "1" ? (
          <div className="rounded-[1.1rem] border border-[rgba(47,125,92,0.22)] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm font-semibold text-[var(--forest)]">
            Template deleted.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[1.1rem] border border-[rgba(207,114,79,0.28)] bg-[rgba(207,114,79,0.08)] px-4 py-3 text-sm font-semibold text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <form action={createDocumentTemplateAction} className="grid gap-4">
          <input name="templateType" type="hidden" value={templateType} />
          <input name="returnTo" type="hidden" value={pagePath} />
          {selectedTemplate ? <input name="templateId" type="hidden" value={selectedTemplate.id} /> : null}

          <div className="grid gap-4 lg:grid-cols-[1fr_0.45fr]">
            <label className="grid gap-2 text-sm font-semibold">
              Template name
                <input
                  className="rounded-[1rem] border border-black/[0.08] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forest)]"
                  defaultValue={selectedTemplate?.name || `${templateType} template`}
                  name="name"
                  required
                />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Client type
                <select
                  className="rounded-[1rem] border border-black/[0.08] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forest)]"
                  defaultValue={selectedTemplate?.clientType || "Wedding"}
                  name="clientType"
                  required
                >
                {templateClientTypes.map((clientType) => (
                  <option key={clientType}>{clientType}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm font-semibold">
            Short summary
              <input
                className="rounded-[1rem] border border-black/[0.08] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forest)]"
                defaultValue={selectedTemplate?.summary || starterSummary}
                name="summary"
                required
              />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Template body
              <textarea
                className="min-h-[32rem] rounded-[1rem] border border-black/[0.08] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-[var(--forest)]"
                defaultValue={selectedTemplate?.body || starterBody}
                name="body"
                required
              />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-6 text-[var(--muted)]">
              Save one version for Business, Wedding, or Others, then create more variations as needed.
            </p>
            <button className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(47,125,92,0.22)] transition hover:brightness-110">
              Save custom template
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-[1.7rem] border border-black/[0.08] bg-white/88 p-5 shadow-[0_18px_45px_rgba(59,36,17,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted)]">Saved versions</p>
            <h2 className="mt-2 text-2xl font-semibold">Your saved {templateType.toLowerCase()} templates</h2>
          </div>
          <span className="rounded-full bg-[rgba(47,125,92,0.08)] px-4 py-2 text-sm font-semibold text-[var(--forest)]">
            {templates.length} saved
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {templates.length === 0 ? (
            <div className="rounded-[1.2rem] border border-dashed border-black/15 bg-[rgba(247,241,232,0.45)] p-5 text-sm text-[var(--muted)] md:col-span-2 xl:col-span-3">
              No saved {templateType.toLowerCase()} templates yet. Save the preset above to create your first one.
            </div>
          ) : (
            templates.map((template) => (
              <div
                className="rounded-[1.2rem] border border-black/[0.08] bg-[rgba(247,241,232,0.48)] p-4"
                key={template.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                      {template.clientType}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{template.name}</h3>
                  </div>
                  <form action={deleteDocumentTemplateAction}>
                    <input name="id" type="hidden" value={template.id} />
                    <input name="returnTo" type="hidden" value={pagePath} />
                    <button className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                      Delete
                    </button>
                  </form>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{template.summary}</p>
                <details className="mt-4 rounded-[1rem] border border-black/[0.08] bg-white/72 p-3">
                  <summary className="cursor-pointer text-sm font-semibold">Preview template</summary>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
                    {template.body}
                  </p>
                </details>
              </div>
            ))
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
