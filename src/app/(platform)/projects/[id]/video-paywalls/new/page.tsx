import Link from "next/link";
import { notFound } from "next/navigation";
import { saveVideoPaywallAction } from "@/app/actions";
import { getDashboardPageData } from "@/lib/dashboard-page";

export default async function NewVideoPaywallPage({
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

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 text-[var(--ink)]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Video paywall</p>
            <h1 className="mt-3 font-display text-5xl leading-none">Sell a client video</h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Create a private checkout page for {project.client}. The Synology link stays hidden until payment clears.
            </p>
          </div>
          <Link
            className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
            href={`/projects/${project.id}?tab=files`}
          >
            Back to files
          </Link>
        </div>

        {query.error === "paywall-invalid" ? (
          <div className="mb-6 rounded-[1.5rem] border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
            Add a title, description, price, and Synology download link before saving.
          </div>
        ) : null}

        <form
          action={saveVideoPaywallAction}
          className="grid gap-6 rounded-[2rem] border border-black/[0.08] bg-white p-7 shadow-[0_24px_80px_rgba(58,34,17,0.12)]"
        >
          <input name="projectId" type="hidden" value={project.id} />
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Video title
              <input
                className="rounded-2xl border border-black/[0.08] px-4 py-3"
                defaultValue={`${project.client} Highlight Film`}
                name="title"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Price
              <input
                className="rounded-2xl border border-black/[0.08] px-4 py-3"
                defaultValue="250"
                min="1"
                name="price"
                step="0.01"
                type="number"
                required
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-semibold">
            Description
            <textarea
              className="min-h-28 rounded-2xl border border-black/[0.08] px-4 py-3"
              defaultValue={`A private download of ${project.client}'s finished video.`}
              name="description"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Cover image URL
            <input
              className="rounded-2xl border border-black/[0.08] px-4 py-3"
              name="coverImage"
              placeholder="Optional image URL for the sales page"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold">
            Synology NAS download link
            <input
              className="rounded-2xl border border-black/[0.08] px-4 py-3"
              name="synologyDownloadUrl"
              placeholder="Paste your private Synology share/download link"
              required
              type="url"
            />
            <span className="text-xs font-normal leading-5 text-[var(--muted)]">
              This link will not be shown until Stripe confirms payment.
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.06] pt-5">
            <p className="text-sm text-[var(--muted)]">
              After saving, you can send the private purchase page to the client.
            </p>
            <button className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
              Save video paywall
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
