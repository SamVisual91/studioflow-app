import Link from "next/link";
import { notFound } from "next/navigation";
import { saveVideoPaywallAction } from "@/app/actions";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getDb } from "@/lib/db";
import { currencyFormatter, dateTime } from "@/lib/formatters";
import { ensureVideoPaywallsTable } from "@/lib/video-paywalls";

export default async function VideoPaywallEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; paywallId: string }>;
  searchParams: Promise<{ created?: string; saved?: string; error?: string }>;
}) {
  const [{ id, paywallId }, query, { data }] = await Promise.all([params, searchParams, getDashboardPageData()]);
  const project = data.projects.find((item) => item.id === id);

  if (!project) {
    notFound();
  }

  const db = getDb();
  ensureVideoPaywallsTable();
  const paywall = db
    .prepare("SELECT * FROM video_paywalls WHERE id = ? AND project_id = ? LIMIT 1")
    .get(paywallId, id) as
    | {
        id: string;
        title: string;
        description: string;
        price: number;
        cover_image?: string | null;
        synology_download_url: string;
        public_token: string;
        status: string;
        purchased_at?: string | null;
        buyer_email?: string | null;
      }
    | undefined;

  if (!paywall) {
    notFound();
  }

  const publicPath = `/video-paywall/${paywall.public_token}`;
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${publicPath}`;
  const isPaid = paywall.status === "PAID";

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 text-[var(--ink)]">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="grid gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Video paywall</p>
              <h1 className="mt-3 font-display text-5xl leading-none">{paywall.title}</h1>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Edit the paid video offer for {project.client}.
              </p>
            </div>
            <Link
              className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
              href={`/projects/${project.id}?tab=files`}
            >
              Back to files
            </Link>
          </div>

          {query.created === "1" ? (
            <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
              Video paywall created. Share the client purchase link when you are ready.
            </div>
          ) : null}
          {query.saved === "1" ? (
            <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
              Video paywall saved.
            </div>
          ) : null}
          {query.error === "paywall-invalid" ? (
            <div className="rounded-[1.5rem] border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
              Add a price greater than 0 and a Synology download link before saving.
            </div>
          ) : null}

          <form
            action={saveVideoPaywallAction}
            className="grid gap-6 rounded-[2rem] border border-black/[0.08] bg-white p-7 shadow-[0_24px_80px_rgba(58,34,17,0.12)]"
          >
            <input name="projectId" type="hidden" value={project.id} />
            <input name="paywallId" type="hidden" value={paywall.id} />
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Video title
                <input
                  className="rounded-2xl border border-black/[0.08] px-4 py-3"
                  defaultValue={paywall.title}
                  name="title"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Price
                <input
                  className="rounded-2xl border border-black/[0.08] px-4 py-3"
                  defaultValue={String(paywall.price)}
                  min="1"
                  name="price"
                  step="0.01"
                  type="number"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold">
              Description
              <textarea
                className="min-h-28 rounded-2xl border border-black/[0.08] px-4 py-3"
                defaultValue={paywall.description}
                name="description"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Cover image URL
              <input
                className="rounded-2xl border border-black/[0.08] px-4 py-3"
                defaultValue={paywall.cover_image || ""}
                name="coverImage"
                placeholder="Optional image URL for the sales page"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Synology NAS download link
              <input
                className="rounded-2xl border border-black/[0.08] px-4 py-3"
                defaultValue={paywall.synology_download_url}
                name="synologyDownloadUrl"
                type="url"
              />
              <span className="text-xs font-normal leading-5 text-[var(--muted)]">
                Kept private until the client pays on the public paywall.
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-black/[0.06] pt-5">
              <p className="text-sm text-[var(--muted)]">
                {isPaid ? "This video has been purchased." : "Changes update the client purchase page immediately."}
              </p>
              <button className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                Save changes
              </button>
            </div>
          </form>
        </section>

        <aside className="grid content-start gap-4">
          <div className="rounded-[1.5rem] border border-black/[0.08] bg-white p-5 shadow-[0_18px_40px_rgba(58,34,17,0.08)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Status</p>
            <div
              className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                isPaid
                  ? "border-[rgba(47,125,92,0.3)] bg-[rgba(47,125,92,0.08)] text-[var(--forest)]"
                  : "border-[rgba(207,114,79,0.18)] bg-[rgba(207,114,79,0.08)] text-[var(--accent)]"
              }`}
            >
              {isPaid ? "Paid and unlocked" : "Ready to sell"}
            </div>
            <p className="mt-4 text-3xl font-semibold">{currencyFormatter.format(Number(paywall.price || 0))}</p>
            {paywall.purchased_at ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Purchased {dateTime.format(new Date(paywall.purchased_at))}
                {paywall.buyer_email ? ` by ${paywall.buyer_email}` : ""}
              </p>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-black/[0.08] bg-white p-5 shadow-[0_18px_40px_rgba(58,34,17,0.08)]">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Client purchase link</p>
            <p className="mt-3 break-all rounded-[1rem] bg-[rgba(247,241,232,0.72)] px-3 py-3 text-sm text-[var(--muted)]">
              {publicUrl}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                className="rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                href={publicPath}
                target="_blank"
              >
                Open paywall
              </Link>
              {isPaid ? (
                <Link
                  className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                  href={`${publicPath}/download`}
                  target="_blank"
                >
                  Test download
                </Link>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
