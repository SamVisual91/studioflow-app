import { notFound } from "next/navigation";
import { saveProjectFileAction } from "@/app/actions";
import { ContractWorkspace } from "@/components/contract-workspace";
import { parseContractDocument } from "@/lib/contracts";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getDb } from "@/lib/db";

export default async function ProjectFileEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; fileId: string }>;
  searchParams: Promise<{ created?: string; saved?: string }>;
}) {
  const [{ id, fileId }, query] = await Promise.all([params, searchParams]);
  const { data } = await getDashboardPageData();
  const project = data.projects.find((item) => item.id === id);

  if (!project) {
    notFound();
  }

  const db = getDb();
  const file = db
    .prepare("SELECT * FROM project_files WHERE id = ? AND project_id = ? LIMIT 1")
    .get(fileId, id) as Record<string, unknown> | undefined;

  if (!file) {
    notFound();
  }

  if (String(file.type) === "CONTRACT") {
    return (
      <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 text-[var(--ink)]">
        <div className="mx-auto max-w-7xl">
          {query.created === "1" ? (
            <div className="mb-6 rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
              Contract created. Keep editing here and your updates will stay linked to this project.
            </div>
          ) : null}
          {query.saved === "1" ? (
            <div className="mb-6 rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
              Contract saved successfully.
            </div>
          ) : null}

          <ContractWorkspace
            action={saveProjectFileAction}
            formId="project-contract-edit-form"
            helperText={`Editing the shared contract for ${project.name}. Click into any section, line item, or signature block to update it.`}
            hiddenFields={{
              projectId: project.id,
              fileId: String(file.id),
              fileType: String(file.type),
            }}
            initialDocument={parseContractDocument(String(file.body || ""))}
            saveLabel="Save contract changes"
            titleLabel="Project contract"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 text-[var(--ink)]">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-black/[0.08] bg-white p-8 shadow-[0_24px_80px_rgba(58,34,17,0.12)]">
        {query.created === "1" ? (
          <div className="mb-6 rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Smart file created. Keep editing here and your updates will stay linked to the project library.
          </div>
        ) : null}
        {query.saved === "1" ? (
          <div className="mb-6 rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Smart file saved successfully.
          </div>
        ) : null}

        <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
          {String(file.type).replaceAll("_", " ")}
        </p>
        <h1 className="mt-4 font-display text-5xl leading-none">{String(file.title)}</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          Editing {project.name}. This window is dedicated to building the contents of this smart file.
        </p>

        <form action={saveProjectFileAction} className="mt-8 grid gap-5">
          <input name="projectId" type="hidden" value={project.id} />
          <input name="fileId" type="hidden" value={String(file.id)} />
          <input name="fileType" type="hidden" value={String(file.type)} />
          <label className="grid gap-2 text-sm font-medium">
            Title
            <input
              className="rounded-2xl border border-black/[0.08] px-4 py-3"
              defaultValue={String(file.title)}
              name="title"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Summary
            <textarea
              className="min-h-24 rounded-2xl border border-black/[0.08] px-4 py-3"
              defaultValue={String(file.summary)}
              name="summary"
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Status
              <input
                className="rounded-2xl border border-black/[0.08] px-4 py-3"
                defaultValue={String(file.status)}
                name="status"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Visibility
              <select
                className="rounded-2xl border border-black/[0.08] px-4 py-3"
                defaultValue={String(file.visibility)}
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
              defaultValue={String(file.body || "")}
              name="body"
              required
            />
          </label>
          <button className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
            Save changes
          </button>
        </form>
      </div>
    </main>
  );
}
