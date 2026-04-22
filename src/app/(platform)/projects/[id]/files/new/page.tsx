import { notFound } from "next/navigation";
import { saveProjectFileAction } from "@/app/actions";
import { ContractWorkspace } from "@/components/contract-workspace";
import {
  getContractTemplateClientType,
  parseContractDocument,
} from "@/lib/contracts";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getDb } from "@/lib/db";
import { getProjectFileTemplate } from "@/lib/project-files";

export default async function NewProjectFilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; title?: string; summary?: string; template?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { data } = await getDashboardPageData();
  const project = data.projects.find((item) => item.id === id);

  if (!project) {
    notFound();
  }

  const fileType = String(query.type || "CONTRACT").toUpperCase();
  const template = getProjectFileTemplate(fileType);
  const db = getDb();
  const client = db
    .prepare("SELECT contact_email FROM clients WHERE name = ? LIMIT 1")
    .get(project.client) as { contact_email?: string | null } | undefined;
  const templateClientType = getContractTemplateClientType(project.type || "");
  const contractTemplates = db
    .prepare(
      "SELECT id, name, client_type, body, updated_at FROM document_templates WHERE template_type = 'Contract' ORDER BY updated_at DESC"
    )
    .all() as Array<{
      id?: string | null;
      name?: string | null;
      client_type?: string | null;
      body?: string | null;
      updated_at?: string | null;
    }>;
  const selectedContractTemplate =
    contractTemplates.find((item) => String(item.id || "") === String(query.template || "")) ||
    contractTemplates.find((item) => String(item.client_type || "") === templateClientType) ||
    undefined;
  const contractDocument = parseContractDocument(String(selectedContractTemplate?.body || ""), {
    clientEmail: String(client?.contact_email || ""),
    clientName: project.client,
    contractTitle: `${project.type || "Project"} Contract`,
    enteredOn: new Date().toISOString().slice(0, 10),
    eventDate: project.projectDate || "",
    serviceType: project.type || "",
    venue: project.location || "",
  });

  if (fileType === "CONTRACT") {
    return (
      <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 text-[var(--ink)]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 rounded-[1.5rem] border border-black/[0.08] bg-white/80 p-5">
            <form action={`/projects/${project.id}/files/new`} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <input name="type" type="hidden" value="CONTRACT" />
              <label className="grid gap-2 text-sm font-semibold">
                Choose a saved contract template
                <select
                  className="rounded-[1rem] border border-black/[0.08] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--forest)]"
                  defaultValue={String(selectedContractTemplate?.id || "")}
                  name="template"
                >
                  <option value="">Default starter contract</option>
                  {contractTemplates.map((item) => (
                    <option key={String(item.id)} value={String(item.id)}>
                      {String(item.name || "Untitled contract")} · {String(item.client_type || "Others")}
                    </option>
                  ))}
                </select>
              </label>
              <button className="rounded-full border border-black/[0.08] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]">
                Load template
              </button>
            </form>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {selectedContractTemplate
                ? `Starting from ${String(selectedContractTemplate.name || "your selected contract template")}.`
                : `Starting from the default contract starter for ${templateClientType}.`}
            </p>
          </div>

          <ContractWorkspace
            action={saveProjectFileAction}
            formId="project-contract-form"
            helperText={`This contract is linked directly to ${project.name}. It starts from your saved contract template, but you can click any section to personalize it before saving.`}
            hiddenFields={{
              projectId: project.id,
              fileType,
            }}
            initialDocument={contractDocument}
            saveLabel="Save contract"
            titleLabel="Project contract"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 text-[var(--ink)]">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-black/[0.08] bg-white p-8 shadow-[0_24px_80px_rgba(58,34,17,0.12)]">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">New smart file</p>
        <h1 className="mt-4 font-display text-5xl leading-none">Create {template.title}</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          This builder opens in its own window so you can draft the file for {project.name} and save it straight into the smart file library.
        </p>

        <form action={saveProjectFileAction} className="mt-8 grid gap-5">
          <input name="projectId" type="hidden" value={project.id} />
          <input name="fileType" type="hidden" value={fileType} />
          <label className="grid gap-2 text-sm font-medium">
            Title
            <input
              className="rounded-2xl border border-black/[0.08] px-4 py-3"
              defaultValue={String(query.title || template.title)}
              name="title"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Summary
            <textarea
              className="min-h-24 rounded-2xl border border-black/[0.08] px-4 py-3"
              defaultValue={String(query.summary || template.summary)}
              name="summary"
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Status
              <input
                className="rounded-2xl border border-black/[0.08] px-4 py-3"
                defaultValue={template.status}
                name="status"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Visibility
              <select
                className="rounded-2xl border border-black/[0.08] px-4 py-3"
                defaultValue={template.visibility}
                name="visibility"
              >
                <option value="Shared">Shared</option>
                <option value="Internal">Internal</option>
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium">
            File content
            <textarea
              className="min-h-[24rem] rounded-2xl border border-black/[0.08] px-4 py-3"
              defaultValue={template.body}
              name="body"
              required
            />
          </label>
          <button className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
            Save smart file
          </button>
        </form>
      </div>
    </main>
  );
}
