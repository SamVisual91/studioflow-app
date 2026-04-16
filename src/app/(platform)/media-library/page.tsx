import { access, mkdir, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";
import { deleteWorkVideoAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { MediaLibraryUploadForm } from "@/components/media-library-upload-form";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getWorkVideosRoot } from "@/lib/storage";

const expectedVideoFiles = [
  "k-pop-eras.mov",
  "lake-hickory-haunts-2026-promo.mov",
  "horsepower-park.mov",
  "jonas-ridge-snow-tubing.mp4",
  "nightmare-factory-unleashed.mov",
  "truly-ad.mp4",
  "bulova-octava.mp4",
  "edm-nights.mov",
  "dreams-become-reality.mov",
  "renowned-deck-building-game.mp4",
  "wedding-film-1.mov",
  "wedding-film-2.mov",
  "wedding-film-3.mov",
  "wedding-film-4.mov",
  "wedding-film-5.mp4",
  "wedding-film-6.mov",
  "wedding-film-7.mp4",
  "eloise-ken-wedding.mov",
  "tricia-evan-wedding.mov",
  "karina-justin-wedding.mov",
  "lauren-aaron-wedding.mov",
  "lindsey-matthew-wedding.mp4",
  "catherine-zach-wedding.mov",
  "emily-alex-wedding.mp4",
];

async function getVideoLibrary() {
  const root = getWorkVideosRoot();
  await mkdir(root, { recursive: true });
  const entries = await readdir(root);
  const files = await Promise.all(
    entries.map(async (name) => {
      const fileStats = await stat(join(root, name));
      return {
        name,
        sizeMb: (fileStats.size / (1024 * 1024)).toFixed(1),
      };
    })
  );

  const availableNames = new Set(files.map((file) => file.name));
  const expected = await Promise.all(
    expectedVideoFiles.map(async (name) => {
      try {
        await access(join(root, name));
        return { name, status: "uploaded" as const };
      } catch {
        return { name, status: "missing" as const };
      }
    })
  );

  return {
    files: files.sort((left, right) => left.name.localeCompare(right.name)),
    expected,
    extraFiles: files.filter((file) => !expectedVideoFiles.includes(file.name)),
    uploadedCount: Array.from(availableNames).filter((name) => expectedVideoFiles.includes(name)).length,
  };
}

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ uploaded?: string; deleted?: string; error?: string }>;
}) {
  const [{ user, data }, query, library] = await Promise.all([
    getDashboardPageData(),
    searchParams,
    getVideoLibrary(),
  ]);

  const successMessage = query.uploaded ? "Video files were uploaded to Railway storage." : "";
  const deletedMessage = query.deleted ? "Stored video was removed from Railway storage." : "";
  const errorMessage =
    query.error === "videos-missing"
      ? "Choose at least one video file before uploading."
      : query.error === "video-delete-failed"
        ? "We couldn't remove that stored video right now."
        : "";

  return (
    <DashboardShell
      currentPath="/media-library"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="grid gap-8">
        <div className="rounded-[2rem] border border-black/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(255,248,240,0.78))] p-6 shadow-[0_24px_80px_rgba(58,34,17,0.12)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
            Media Library
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            Upload public website videos to Railway storage.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            Upload the original files here and the site will serve them from the Railway volume at
            <span className="font-semibold text-[var(--ink)]"> /work-videos/&lt;filename&gt;</span>. To
            keep the existing site working, use the exact filenames listed below.
          </p>

          {successMessage ? (
            <div className="mt-6 rounded-2xl border border-[rgba(47,125,92,0.16)] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm text-[var(--forest)]">
              {successMessage}
            </div>
          ) : null}

          {deletedMessage ? (
            <div className="mt-6 rounded-2xl border border-[rgba(47,125,92,0.16)] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm text-[var(--forest)]">
              {deletedMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-[rgba(207,114,79,0.16)] bg-[rgba(207,114,79,0.08)] px-4 py-3 text-sm text-[var(--accent)]">
              {errorMessage}
            </div>
          ) : null}

          <MediaLibraryUploadForm />
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/5"
              href="/video-production"
            >
              View public site
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-black/[0.08] bg-white/90 p-6 shadow-[0_18px_60px_rgba(58,34,17,0.08)] sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                  Expected files
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--ink)]">
                  {library.uploadedCount} of {expectedVideoFiles.length} filenames matched
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {library.expected.map((item) => (
                <div
                  className="flex items-center justify-between rounded-2xl border border-black/8 bg-[rgba(245,241,236,0.72)] px-4 py-3 text-sm"
                  key={item.name}
                >
                  <span className="font-medium text-[var(--ink)]">{item.name}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                      item.status === "uploaded"
                        ? "bg-[rgba(47,125,92,0.12)] text-[var(--forest)]"
                        : "bg-[rgba(207,114,79,0.12)] text-[var(--accent)]"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/[0.08] bg-white/90 p-6 shadow-[0_18px_60px_rgba(58,34,17,0.08)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
              Stored on Railway
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--ink)]">Current volume files</h2>

            <div className="mt-6 grid gap-3">
              {library.files.length > 0 ? (
                library.files.map((file) => (
                  <div
                    className="rounded-2xl border border-black/8 bg-[rgba(245,241,236,0.72)] px-4 py-3"
                    key={file.name}
                  >
                    <p className="text-sm font-medium text-[var(--ink)]">{file.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{file.sizeMb} MB</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <Link
                        className="inline-flex text-xs font-semibold text-[var(--forest)] underline-offset-4 hover:underline"
                        href={`/work-videos/${file.name}`}
                        target="_blank"
                      >
                        Open public URL
                      </Link>
                      <form action={deleteWorkVideoAction}>
                        <input name="fileName" type="hidden" value={file.name} />
                        <button
                          className="inline-flex text-xs font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                          type="submit"
                        >
                          Remove video
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-7 text-[var(--muted)]">
                  No public work videos are stored yet.
                </p>
              )}
            </div>

            {library.extraFiles.length > 0 ? (
              <div className="mt-8 rounded-2xl border border-black/8 bg-[rgba(245,241,236,0.72)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Extra files
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  These files exist in storage but are not currently referenced by the public site.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
