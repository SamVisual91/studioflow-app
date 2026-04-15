import { notFound } from "next/navigation";
import { saveProjectFileAction } from "@/app/actions";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getProjectFileTemplate } from "@/lib/project-files";

export default async function NewProjectFilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; title?: string; summary?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { data } = await getDashboardPageData();
  const project = data.projects.find((item) => item.id === id);

  if (!project) {
    notFound();
  }

  const fileType = String(query.type || "CONTRACT").toUpperCase();
  const template = getProjectFileTemplate(fileType);

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
