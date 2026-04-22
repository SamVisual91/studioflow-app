import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  deleteProjectDeliverableAction,
  deleteProjectPhotoAlbumAction,
  deleteVideoPaywallAction,
  saveVideoPaywallAction,
  sendProjectMediaGalleryAction,
  sendVideoPaywallToClientAction,
  updateProjectPhotoAlbumAction,
  updateProjectDeliverableAction,
  uploadProjectDeliverableAction,
} from "@/app/actions";
import { ClientPortalHeroEditor } from "@/components/client-portal-hero-editor";
import { MediaCarousel } from "@/components/media-carousel";
import { ClientPhotoAlbum } from "@/components/client-photo-album";
import { DashboardShell } from "@/components/dashboard-shell";
import { MediaGalleryBannerEditor } from "@/components/media-gallery-banner-editor";
import { ProjectPhotoDeliverableUploader } from "@/components/project-photo-deliverable-uploader";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getDb } from "@/lib/db";
import { ensureProjectDeliverablesTable, type ProjectDeliverable } from "@/lib/deliverables";
import { currencyFormatter, dateTime, shortDate } from "@/lib/formatters";
import { ensureVideoPaywallsTable } from "@/lib/video-paywalls";

function EditActionPopover({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <button
        aria-label={label}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/14 bg-white/[0.06] text-white transition hover:bg-white/[0.14]"
        popoverTarget={id}
        title={label}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        <span className="sr-only">{label}</span>
      </button>

      <div
        className="fixed left-1/2 top-1/2 z-[90] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[1.25rem] border border-white/12 bg-[#171411] p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.42)] backdrop:bg-black/55"
        id={id}
        popover="auto"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/64">{label}</h3>
          <button
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/12 text-white/72 transition hover:bg-white/10 hover:text-white"
            popoverTarget={id}
            popoverTargetAction="hide"
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

export default async function ProjectDeliverablesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    deliverableUploaded?: string;
    deliverableDeleted?: string;
    deliverableUpdated?: string;
    gallerySent?: string;
    paywallCreated?: string;
    paywallSaved?: string;
    paywallDeleted?: string;
    paywallSent?: string;
    gallerySaved?: string;
    portalSaved?: string;
    categorySaved?: string;
    openAlbum?: string;
    error?: string;
  }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { user, data } = await getDashboardPageData();
  const project = data.projects.find((item) => item.id === id);

  if (!project) {
    notFound();
  }

  const db = getDb();
  ensureProjectDeliverablesTable();
  ensureVideoPaywallsTable();
  const projectSettings = db
    .prepare(
      "SELECT deliverables_gallery_title, deliverables_gallery_intro, deliverables_gallery_cover, client_portal_title, client_portal_intro, client_portal_cover FROM projects WHERE id = ? LIMIT 1"
    )
    .get(project.id) as
    | {
        deliverables_gallery_title: string | null;
        deliverables_gallery_intro: string | null;
        deliverables_gallery_cover: string | null;
        client_portal_title: string | null;
        client_portal_intro: string | null;
        client_portal_cover: string | null;
      }
    | undefined;
  const deliverables = db
    .prepare("SELECT * FROM project_deliverables WHERE project_id = ? ORDER BY created_at DESC")
    .all(project.id) as ProjectDeliverable[];
  const videoPaywalls = db
    .prepare("SELECT * FROM video_paywalls WHERE project_id = ? ORDER BY created_at DESC")
    .all(project.id) as Array<Record<string, unknown>>;
  const videoDeliverables = deliverables.filter((item) => item.media_type === "VIDEO");
  const photoDeliverables = deliverables.filter((item) => item.media_type === "PHOTO");
  const returnPath = `/projects/${project.id}/deliverables`;
  const galleryTitle = projectSettings?.deliverables_gallery_title || `${project.client} Video Library`;
  const galleryIntro =
    projectSettings?.deliverables_gallery_intro ||
    "Your private streaming gallery with purchased films, delivered videos, and locked add-ons.";
  const galleryCover =
    projectSettings?.deliverables_gallery_cover ||
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80";
  const portalTitle = projectSettings?.client_portal_title || project.client;
  const portalIntro =
    projectSettings?.client_portal_intro ||
    "Welcome to your private project portal. This page only shows your project, documents, invoices, and messages with the StudioFlow team.";
  const portalCover =
    projectSettings?.client_portal_cover ||
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=80";
  const clientPortalPath = project.publicPortalToken
    ? `/client-portal/${project.publicPortalToken}?tab=buy-videos`
    : "";
  const paidVideoPaywalls = videoPaywalls.filter((paywall) => String(paywall.status) === "PAID");
  const lockedVideoPaywalls = videoPaywalls.filter((paywall) => String(paywall.status) !== "PAID");
  const unlockedVideoCount = videoDeliverables.length + paidVideoPaywalls.length;
  const photoAlbums = Array.from(
    photoDeliverables.reduce((albums, photo) => {
      const albumTitle = String(photo.album_title || "Final Gallery");
      albums.set(albumTitle, [...(albums.get(albumTitle) || []), photo]);
      return albums;
    }, new Map<string, ProjectDeliverable[]>())
  ).map(([title, photos]) => ({
    title,
    photos,
    downloadAllUrl: String(photos.find((photo) => photo.album_download_url)?.album_download_url || ""),
    cover: String(photos.find((photo) => photo.album_cover_image)?.album_cover_image || photos[0]?.file_path || ""),
  }));
  const photoAlbumCount = photoAlbums.length;
  const successMessage = query.deliverableUploaded
    ? "Deliverable uploaded successfully."
    : query.deliverableDeleted
      ? "Deliverable deleted successfully."
    : query.deliverableUpdated
      ? "Deliverable updated successfully."
      : query.gallerySent
        ? "Media gallery emailed to the client."
        : query.paywallCreated
          ? "Locked video created successfully."
          : query.paywallSaved
            ? "Locked video updated successfully."
            : query.paywallDeleted
              ? "Locked video deleted successfully."
              : query.paywallSent
                ? "Locked video purchase page emailed to the client."
        : query.gallerySaved
          ? "Media gallery changes saved."
          : query.portalSaved
            ? "Client portal header saved."
            : query.categorySaved
              ? "Photo category changes saved."
              : "";
  const errorMessage =
    query.error === "deliverable-invalid"
      ? "Choose a file or add a valid Synology link before saving."
      : query.error === "deliverable-missing"
        ? "That deliverable could not be found."
      : query.error === "deliverable-video-type"
        ? "Choose a video file for the video deliverable upload."
        : query.error === "deliverable-photo-type"
          ? "Choose an image file for the photo deliverable upload."
        : query.error === "deliverable-price-invalid"
          ? "Add a price greater than 0 for paid photos."
        : query.error === "deliverable-link-invalid"
            ? "Add a valid Synology share link that starts with http or https."
            : query.error === "deliverable-thumbnail-type"
              ? "Choose an image file for the video thumbnail."
              : query.error === "gallery-cover-type"
                ? "Choose an image file for the gallery banner."
                : query.error === "paywall-invalid"
                  ? "Add a price greater than 0 and a valid Synology link for the locked video."
                : query.error === "paywall-email-missing"
                  ? "Add a client email before sending the locked video."
                  : query.error === "paywall-send-invalid"
                    ? "That locked video purchase page could not be sent."
                    : query.error === "paywall-send-failed"
                      ? "The locked video email could not be sent."
                : query.error === "portal-cover-type"
                  ? "Choose an image file for the top portal banner."
                  : query.error === "portal-invalid"
                    ? "Add a title before saving the top portal banner."
                    : query.error === "album-category-invalid"
                      ? "Select photos and enter a category before saving."
                      : query.error === "gallery-email-missing"
                        ? "Add a client email before sending the media gallery."
                        : query.error === "smtp-missing"
                          ? "SMTP email is not configured yet."
                          : query.error === "gallery-send-failed"
                            ? "The media gallery email could not be sent."
                            : query.error === "gallery-send-invalid"
                              ? "The media gallery could not be sent for this project."
          : "";

  return (
    <DashboardShell
      currentPath="/projects"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="grid gap-7">
        <div>
          <div>
            <Link
              className="text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
              href={`/projects/${project.id}?tab=deliverables`}
            >
              Back to project
            </Link>
            <p className="mt-5 text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Deliverables</p>
            <h1 className="mt-3 font-display text-5xl leading-none text-[var(--ink)] sm:text-6xl">
              Client gallery builder
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Upload and manage delivered videos or photos here. Use the client preview to adjust the client-facing gallery banner and text.
            </p>
          </div>
        </div>

        {successMessage ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[1.5rem] border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(59,36,17,0.10)]">
          <div
            className="bg-cover bg-center px-6 py-12 text-white sm:px-8"
            style={{
              backgroundImage: `linear-gradient(135deg,rgba(20,18,16,0.88),rgba(207,114,79,0.28)),url('${galleryCover}')`,
            }}
          >
            <p className="text-xs uppercase tracking-[0.28em] text-white/70">Final delivery</p>
            <h2 className="mt-3 font-display text-5xl leading-none">Upload new files</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78">
              Add client-ready films, Synology-hosted videos, and final photo files. Then use the preview below to adjust what clients see.
            </p>
          </div>

          <div className="grid items-start gap-5 p-6 lg:grid-cols-3">
            <form
              action={uploadProjectDeliverableAction}
              className="grid self-start gap-4 rounded-[1.5rem] border border-black/[0.08] bg-[rgba(247,241,232,0.62)] p-5"
              encType="multipart/form-data"
            >
              <input name="projectId" type="hidden" value={project.id} />
              <input name="mediaType" type="hidden" value="VIDEO" />
              <input name="returnPath" type="hidden" value={returnPath} />
              <details className="group" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.08] bg-white/85 text-[var(--sidebar)]">
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h8A2.5 2.5 0 0 1 16 7.5v9A2.5 2.5 0 0 1 13.5 19h-8A2.5 2.5 0 0 1 3 16.5z" />
                        <path d="m16 9 4.5-2.5v11L16 15z" />
                      </svg>
                    </span>
                    <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Upload video</p>
                    <h3 className="mt-2 text-xl font-semibold">Client video</h3>
                    </div>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-white/80 text-[var(--muted)] transition group-open:rotate-180">
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <div className="mt-4 grid gap-4">
                  <label className="grid gap-2 text-sm font-semibold">
                    Title
                    <input
                      className="rounded-xl border border-black/[0.08] bg-white px-4 py-3"
                      defaultValue={`${project.client} Final Film`}
                      name="title"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Caption
                    <input
                      className="rounded-xl border border-black/[0.08] bg-white px-4 py-3"
                      name="caption"
                      placeholder="Example: Full ceremony film, final highlight edit"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Video file
                    <input
                      accept="video/*"
                      className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm"
                      name="file"
                      type="file"
                    />
                  </label>
                  <div className="grid gap-2">
                    <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">or</p>
                    <label className="grid gap-2 text-sm font-semibold">
                      Synology video link
                      <input
                        className="rounded-xl border border-black/[0.08] bg-white px-4 py-3"
                        name="synologyUrl"
                        placeholder="https://your-synology-share-link"
                        type="url"
                      />
                    </label>
                    <p className="text-xs leading-5 text-[var(--muted)]">
                      Best for large films. Paste the Synology share/download link instead of uploading the video into StudioFlow.
                    </p>
                  </div>
                  <label className="grid gap-2 text-sm font-semibold">
                    Custom thumbnail
                    <input
                      accept="image/*"
                      className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm"
                      name="thumbnail"
                      type="file"
                    />
                  </label>
                  <button className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                    Save video deliverable
                  </button>
                </div>
              </details>
            </form>

            <ProjectPhotoDeliverableUploader
              clientName={project.client}
              projectId={project.id}
              returnPath={returnPath}
            />

            <form
              action={saveVideoPaywallAction}
              className="grid self-start gap-4 rounded-[1.5rem] border border-black/[0.08] bg-[rgba(247,241,232,0.62)] p-5"
              encType="multipart/form-data"
            >
              <input name="projectId" type="hidden" value={project.id} />
              <input name="returnPath" type="hidden" value={returnPath} />
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.08] bg-white/85 text-[var(--accent)]">
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" />
                        <path d="M9.5 10.5v3" />
                        <path d="M14.5 10.5v3" />
                        <path d="M7.5 12h9" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Create locked video</p>
                      <h3 className="mt-2 text-xl font-semibold">Paid add-on</h3>
                    </div>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-white/80 text-[var(--muted)] transition group-open:rotate-180">
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <div className="mt-4 grid gap-4">
                  <label className="grid gap-2 text-sm font-semibold">
                    Title
                    <input
                      className="rounded-xl border border-black/[0.08] bg-white px-4 py-3"
                      defaultValue={`${project.client} Bonus Film`}
                      name="title"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Description
                    <textarea
                      className="min-h-24 rounded-xl border border-black/[0.08] bg-white px-4 py-3"
                      defaultValue="A premium add-on film available for purchase."
                      name="description"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <label className="grid min-w-0 gap-2 text-sm font-semibold">
                      Price
                      <input
                        className="w-full min-w-0 rounded-xl border border-black/[0.08] bg-white px-4 py-3"
                        min="1"
                        name="price"
                        placeholder="450.00"
                        step="0.01"
                        type="number"
                      />
                    </label>
                    <label className="grid min-w-0 gap-2 text-sm font-semibold">
                      Cover image
                      <input
                        accept="image/*"
                        className="w-full min-w-0 rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm"
                        name="coverImageFile"
                        type="file"
                      />
                    </label>
                  </div>
                  <label className="grid gap-2 text-sm font-semibold">
                    Synology video link
                    <input
                      className="rounded-xl border border-black/[0.08] bg-white px-4 py-3"
                      name="synologyDownloadUrl"
                      placeholder="https://your-synology-share-link"
                      type="url"
                    />
                  </label>
                  <p className="text-xs leading-5 text-[var(--muted)]">
                    This creates a locked video card the client can purchase from the gallery. You can still re-edit it later from the preview section below.
                  </p>
                  <button className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                    Save locked video
                  </button>
                </div>
              </details>
            </form>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-black/[0.08] bg-[#11100f] text-white shadow-[0_26px_90px_rgba(20,16,12,0.22)]">
          <div className="border-b border-white/10 px-6 py-6 sm:px-8">
            <p className="text-xs uppercase tracking-[0.3em] text-white/48">Client portal preview</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-4xl leading-none sm:text-5xl">Edit the client gallery here</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">
                  This preview mirrors the client portal. Update the banner text and photo categories here, then use View client gallery only to inspect the final client-facing result.
                </p>
              </div>
              {clientPortalPath ? (
                <Link
                  className="text-xs font-black uppercase tracking-[0.16em] text-white underline-offset-4 transition hover:text-white/78 hover:underline"
                  href={clientPortalPath}
                  target="_blank"
                >
                  View final gallery
                </Link>
              ) : null}
            </div>
          </div>

          <ClientPortalHeroEditor
            location={project.location}
            portalCover={portalCover}
            portalIntro={portalIntro}
            portalTitle={portalTitle}
            projectDateLabel={project.projectDate ? shortDate.format(new Date(project.projectDate)) : ""}
            projectId={project.id}
            projectType={String(project.type || "Project")}
            returnPath={returnPath}
          />

          <MediaGalleryBannerEditor
            galleryCover={galleryCover}
            galleryIntro={galleryIntro}
            galleryTitle={galleryTitle}
            lockedCount={lockedVideoPaywalls.length}
            photoCount={photoAlbumCount}
            projectId={project.id}
            returnPath={returnPath}
            unlockedCount={unlockedVideoCount}
          />

          <div className="grid gap-8 p-6 sm:p-8">
            <section>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/48">Unlocked</p>
                  <h3 className="mt-2 text-2xl font-semibold">Ready to view</h3>
                </div>
                <p className="text-sm text-white/52">{unlockedVideoCount} video{unlockedVideoCount === 1 ? "" : "s"}</p>
              </div>

              {unlockedVideoCount === 0 ? (
                <div className="mt-5 rounded-[1.4rem] border border-dashed border-white/14 bg-white/[0.04] px-5 py-8 text-sm leading-7 text-white/58">
                  No unlocked videos yet. Uploaded media and purchased videos will preview here.
                </div>
              ) : (
                <div className="mt-5 grid gap-7">
                  {videoDeliverables.length > 0 || paidVideoPaywalls.length > 0 ? (
                    <MediaCarousel itemCount={videoDeliverables.length + paidVideoPaywalls.length}>
                      {videoDeliverables.map((video) => (
                        <article
                          key={video.id}
                          className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.06] transition hover:-translate-y-1 hover:bg-white/[0.09]"
                        >
                          {video.thumbnail_path ? (
                            <div
                              className="aspect-video overflow-hidden rounded-t-[1.35rem] bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                              style={{ backgroundImage: `url(${video.thumbnail_path})` }}
                            />
                          ) : video.source_type === "SYNOLOGY" ? (
                            <div className="grid aspect-video place-items-center overflow-hidden rounded-t-[1.35rem] bg-[linear-gradient(135deg,#15100d,#3f2b23)] px-5 text-center">
                              <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-white/48">Synology hosted</p>
                                <p className="mt-3 text-xl font-semibold">Open your delivered film</p>
                              </div>
                            </div>
                          ) : (
                            <video
                              className="aspect-video w-full rounded-t-[1.35rem] bg-black object-cover"
                              controls
                              preload="metadata"
                              src={video.file_path}
                            />
                          )}
                          <div className="flex flex-1 flex-col p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-[rgba(134,239,172,0.8)]">
                                  Ready to watch / download
                                </p>
                                <h4 className="mt-2 text-lg font-semibold">{video.title}</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <EditActionPopover id={`edit-video-${video.id}`} label={`Edit ${video.title}`}>
                                  <form
                                    action={updateProjectDeliverableAction}
                                    className="grid gap-3"
                                    encType="multipart/form-data"
                                  >
                                    <input name="projectId" type="hidden" value={project.id} />
                                    <input name="deliverableId" type="hidden" value={video.id} />
                                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                      Title
                                      <input
                                        className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                        defaultValue={video.title}
                                        name="title"
                                      />
                                    </label>
                                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                      Caption
                                      <input
                                        className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                        defaultValue={video.caption || ""}
                                        name="caption"
                                      />
                                    </label>
                                    {String(video.source_type || "") === "SYNOLOGY" ? (
                                      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                        Synology link
                                        <input
                                          className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                          defaultValue={video.file_path}
                                          name="synologyUrl"
                                          type="url"
                                        />
                                      </label>
                                    ) : null}
                                    <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                      Replace thumbnail
                                      <input
                                        accept="image/*"
                                        className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                        name="thumbnail"
                                        type="file"
                                      />
                                    </label>
                                    <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#11100f] transition hover:bg-white/86">
                                      Save changes
                                    </button>
                                  </form>
                                </EditActionPopover>
                                <form action={deleteProjectDeliverableAction}>
                                  <input name="projectId" type="hidden" value={project.id} />
                                  <input name="deliverableId" type="hidden" value={video.id} />
                                  <input name="returnPath" type="hidden" value={returnPath} />
                                  <button
                                    aria-label={`Delete ${video.title}`}
                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(207,114,79,0.3)] bg-[rgba(207,114,79,0.1)] text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.18)]"
                                    title="Delete video"
                                  >
                                    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M3 6h18" />
                                      <path d="M8 6V4h8v2" />
                                      <path d="M19 6l-1 14H6L5 6" />
                                      <path d="M10 11v6" />
                                      <path d="M14 11v6" />
                                    </svg>
                                  </button>
                                </form>
                              </div>
                            </div>
                            {video.caption ? (
                              <p className="mt-3 min-h-[3rem] text-sm leading-6 text-white/58">{video.caption}</p>
                            ) : null}
                            <Link
                              className="mt-auto inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#11100f] transition hover:bg-white/86"
                              href={video.file_path}
                              target="_blank"
                            >
                              Open video
                            </Link>
                          </div>
                        </article>
                      ))}

                      {paidVideoPaywalls.map((paywall) => {
                        const coverImage =
                          String(paywall.cover_image || "") ||
                          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80";

                        return (
                        <article
                          key={String(paywall.id)}
                          className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.06] transition hover:-translate-y-1 hover:bg-white/[0.09]"
                        >
                            <div
                              className="aspect-video overflow-hidden rounded-t-[1.35rem] bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                              style={{ backgroundImage: `url(${coverImage})` }}
                            />
                            <div className="flex flex-1 flex-col p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.22em] text-[rgba(134,239,172,0.8)]">Purchased</p>
                                  <h4 className="mt-2 text-lg font-semibold">{String(paywall.title)}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <EditActionPopover id={`edit-paid-video-${String(paywall.id)}`} label={`Edit ${String(paywall.title)}`}>
                                    <form action={saveVideoPaywallAction} className="grid gap-3" encType="multipart/form-data">
                                      <input name="projectId" type="hidden" value={project.id} />
                                      <input name="paywallId" type="hidden" value={String(paywall.id)} />
                                      <input name="returnPath" type="hidden" value={returnPath} />
                                      <input name="coverImage" type="hidden" value={String(paywall.cover_image || "")} />
                                      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                        Title
                                        <input
                                          className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                          defaultValue={String(paywall.title)}
                                          name="title"
                                        />
                                      </label>
                                      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                        Description
                                        <textarea
                                          className="min-h-24 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                          defaultValue={String(paywall.description)}
                                          name="description"
                                        />
                                      </label>
                                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                        <label className="grid min-w-0 gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                          Price
                                          <input
                                            className="w-full min-w-0 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                            defaultValue={Number(paywall.price || 0)}
                                            min="1"
                                            name="price"
                                            step="0.01"
                                            type="number"
                                          />
                                        </label>
                                        <label className="grid min-w-0 gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                          Cover image
                                          <input
                                            accept="image/*"
                                            className="w-full min-w-0 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                            name="coverImageFile"
                                            type="file"
                                          />
                                        </label>
                                      </div>
                                      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                        Synology link
                                        <input
                                          className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                          defaultValue={String(paywall.synology_download_url || "")}
                                          name="synologyDownloadUrl"
                                          type="url"
                                        />
                                      </label>
                                      <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#11100f] transition hover:bg-white/86">
                                        Save changes
                                      </button>
                                    </form>
                                  </EditActionPopover>
                                  <form action={deleteVideoPaywallAction}>
                                    <input name="projectId" type="hidden" value={project.id} />
                                    <input name="paywallId" type="hidden" value={String(paywall.id)} />
                                    <input name="returnPath" type="hidden" value={returnPath} />
                                    <button
                                      aria-label={`Delete ${String(paywall.title)}`}
                                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(207,114,79,0.3)] bg-[rgba(207,114,79,0.1)] text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.18)]"
                                      title="Delete purchased video"
                                    >
                                      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M3 6h18" />
                                        <path d="M8 6V4h8v2" />
                                        <path d="M19 6l-1 14H6L5 6" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                      </svg>
                                    </button>
                                  </form>
                                </div>
                              </div>
                              <p className="mt-3 min-h-[3rem] text-sm leading-6 text-white/58">{String(paywall.description)}</p>
                              <Link
                                className="mt-auto inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#11100f] transition hover:bg-white/86"
                                href={`/video-paywall/${String(paywall.public_token)}`}
                                target="_blank"
                              >
                                Open download
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                    </MediaCarousel>
                  ) : null}

                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/48">Locked</p>
                  <h3 className="mt-2 text-2xl font-semibold">Available to purchase</h3>
                </div>
                <p className="text-sm text-white/52">{lockedVideoPaywalls.length} locked</p>
              </div>

              {lockedVideoPaywalls.length === 0 ? (
                <div className="mt-5 rounded-[1.4rem] border border-dashed border-white/14 bg-white/[0.04] px-5 py-8 text-sm leading-7 text-white/58">
                  No locked add-on videos are available right now.
                </div>
              ) : (
                <MediaCarousel className="mt-5" itemCount={lockedVideoPaywalls.length}>
                  {lockedVideoPaywalls.map((paywall) => {
                    const coverImage =
                      String(paywall.cover_image || "") ||
                      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80";

                    return (
                      <article
                        key={String(paywall.id)}
                        className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.06] transition hover:-translate-y-1 hover:bg-white/[0.09]"
                      >
                        <div
                          className="relative aspect-video overflow-hidden rounded-t-[1.35rem] bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                          style={{ backgroundImage: `url(${coverImage})` }}
                        >
                          <div className="absolute inset-0 bg-black/38 backdrop-blur-[1.5px]" />
                          <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                            Locked
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.22em] text-white/48">Add-on video</p>
                              <h4 className="mt-2 text-lg font-semibold">{String(paywall.title)}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-base font-semibold">{currencyFormatter.format(Number(paywall.price || 0))}</p>
                              <EditActionPopover id={`edit-locked-video-${String(paywall.id)}`} label={`Edit ${String(paywall.title)}`}>
                                <form action={saveVideoPaywallAction} className="grid gap-3" encType="multipart/form-data">
                                  <input name="projectId" type="hidden" value={project.id} />
                                  <input name="paywallId" type="hidden" value={String(paywall.id)} />
                                  <input name="returnPath" type="hidden" value={returnPath} />
                                  <input name="coverImage" type="hidden" value={String(paywall.cover_image || "")} />
                                  <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                    Title
                                    <input
                                      className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                      defaultValue={String(paywall.title)}
                                      name="title"
                                    />
                                  </label>
                                  <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                    Description
                                    <textarea
                                      className="min-h-24 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                      defaultValue={String(paywall.description)}
                                      name="description"
                                    />
                                  </label>
                                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                    <label className="grid min-w-0 gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                      Price
                                      <input
                                        className="w-full min-w-0 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                        defaultValue={Number(paywall.price || 0)}
                                        min="1"
                                        name="price"
                                        step="0.01"
                                        type="number"
                                      />
                                    </label>
                                    <label className="grid min-w-0 gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                      Cover image
                                      <input
                                        accept="image/*"
                                        className="w-full min-w-0 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                        name="coverImageFile"
                                        type="file"
                                      />
                                    </label>
                                  </div>
                                  <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                    Synology link
                                    <input
                                      className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                      defaultValue={String(paywall.synology_download_url || "")}
                                      name="synologyDownloadUrl"
                                      type="url"
                                    />
                                  </label>
                                  <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#11100f] transition hover:bg-white/86">
                                    Save changes
                                  </button>
                                </form>
                              </EditActionPopover>
                              <form action={deleteVideoPaywallAction}>
                                <input name="projectId" type="hidden" value={project.id} />
                                <input name="paywallId" type="hidden" value={String(paywall.id)} />
                                <input name="returnPath" type="hidden" value={returnPath} />
                                <button
                                  aria-label={`Delete ${String(paywall.title)}`}
                                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(207,114,79,0.3)] bg-[rgba(207,114,79,0.1)] text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.18)]"
                                  title="Delete locked video"
                                >
                                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M3 6h18" />
                                    <path d="M8 6V4h8v2" />
                                    <path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v6" />
                                    <path d="M14 11v6" />
                                  </svg>
                                </button>
                              </form>
                            </div>
                          </div>
                          <p className="mt-3 min-h-[3rem] text-sm leading-6 text-white/58">{String(paywall.description)}</p>
                          <Link
                            className="mt-auto inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                            href={`/video-paywall/${String(paywall.public_token)}`}
                            target="_blank"
                          >
                            Preview purchase page
                          </Link>
                          <form action={sendVideoPaywallToClientAction} className="mt-3">
                            <input name="projectId" type="hidden" value={project.id} />
                            <input name="paywallId" type="hidden" value={String(paywall.id)} />
                            <input name="returnPath" type="hidden" value={returnPath} />
                            <button className="inline-flex rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                              Send to client
                            </button>
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </MediaCarousel>
              )}
            </section>

            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/48">Photos</p>
                  <h3 className="mt-2 text-2xl font-semibold">Delivered galleries</h3>
                </div>
                <p className="text-sm text-white/52">
                  {photoAlbums.length} album{photoAlbums.length === 1 ? "" : "s"}
                </p>
              </div>

              {photoAlbums.length === 0 ? (
                <div className="mt-5 rounded-[1.4rem] border border-dashed border-white/14 bg-white/[0.04] px-5 py-8 text-sm leading-7 text-white/58">
                  No photo galleries are available right now.
                </div>
              ) : (
                <MediaCarousel className="mt-5" itemCount={photoAlbums.length}>
                  {photoAlbums.map((album) => (
                    <div key={album.title} className="h-full">
                      <ClientPhotoAlbum
                        albumCover={album.cover}
                        albumTitle={album.title}
                        canEdit
                        downloadAllUrl={album.downloadAllUrl}
                        photos={album.photos.map((photo) => ({
                          id: String(photo.id),
                          title: String(photo.title),
                          caption: String(photo.caption || ""),
                          filePath: String(photo.file_path),
                          section: String(photo.album_section || "All"),
                          accessType:
                            String(photo.access_type || "FREE").toUpperCase() === "PAID" ? "PAID" : "FREE",
                          price: Number(photo.price || 0),
                          purchasedAt: String(photo.purchased_at || ""),
                          purchaseToken: String(photo.public_token || ""),
                        }))}
                        previewActions={
                          <>
                            <EditActionPopover id={`edit-album-${album.title.replace(/[^a-zA-Z0-9_-]/g, "-")}`} label={`Edit ${album.title} gallery`}>
                              <form action={updateProjectPhotoAlbumAction} className="grid gap-3" encType="multipart/form-data">
                                <input name="projectId" type="hidden" value={project.id} />
                                <input name="albumTitle" type="hidden" value={album.title} />
                                <input name="returnPath" type="hidden" value={returnPath} />
                                <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                  Gallery title
                                  <input
                                    className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                    defaultValue={album.title}
                                    name="nextAlbumTitle"
                                  />
                                </label>
                                <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                  Download-all link
                                  <input
                                    className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                    defaultValue={album.downloadAllUrl}
                                    name="albumDownloadUrl"
                                    placeholder="https://..."
                                    type="url"
                                  />
                                </label>
                                <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/52">
                                  Replace cover image
                                  <input
                                    accept="image/*"
                                    className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm normal-case tracking-normal text-[#11100f]"
                                    name="albumCoverFile"
                                    type="file"
                                  />
                                </label>
                                <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#11100f] transition hover:bg-white/86">
                                  Save changes
                                </button>
                              </form>
                            </EditActionPopover>
                            <form action={deleteProjectPhotoAlbumAction}>
                              <input name="projectId" type="hidden" value={project.id} />
                              <input name="albumTitle" type="hidden" value={album.title} />
                              <input name="returnPath" type="hidden" value={returnPath} />
                              <button
                                aria-label={`Delete ${album.title}`}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(207,114,79,0.3)] bg-[rgba(207,114,79,0.1)] text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.18)]"
                                title="Delete photo gallery"
                              >
                                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4h8v2" />
                                  <path d="M19 6l-1 14H6L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                </svg>
                              </button>
                            </form>
                          </>
                        }
                        projectId={project.id}
                        returnPath={returnPath}
                        initialOpen={query.openAlbum?.toLowerCase() === album.title.toLowerCase()}
                        showPurchaseActions={false}
                      />
                    </div>
                  ))}
                </MediaCarousel>
              )}
            </section>
          </div>
        </section>

        <section className="hidden rounded-[1.9rem] border border-black/[0.08] bg-white/88 p-6 shadow-[0_20px_54px_rgba(59,36,17,0.08)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Gallery</p>
              <h2 className="mt-3 text-3xl font-semibold">
                {deliverables.length} deliverable{deliverables.length === 1 ? "" : "s"}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              <span className="rounded-full bg-[rgba(247,241,232,0.8)] px-3 py-2">{videoDeliverables.length} videos</span>
              <span className="rounded-full bg-[rgba(247,241,232,0.8)] px-3 py-2">{photoDeliverables.length} photos</span>
            </div>
          </div>

          {deliverables.length === 0 ? (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-black/[0.12] px-5 py-12 text-sm leading-7 text-[var(--muted)]">
              No deliverables uploaded yet. Add final client videos or photos above and they will appear in this gallery.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {deliverables.map((deliverable) => (
                <article
                  key={deliverable.id}
                  className="group overflow-hidden rounded-[1.5rem] border border-black/[0.08] bg-white shadow-[0_14px_36px_rgba(59,36,17,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(59,36,17,0.14)]"
                >
                  {deliverable.media_type === "VIDEO" ? (
                    deliverable.thumbnail_path ? (
                      <div
                        className="aspect-video bg-cover bg-center"
                        style={{ backgroundImage: `url(${deliverable.thumbnail_path})` }}
                      />
                    ) : deliverable.source_type === "SYNOLOGY" ? (
                      <div className="grid aspect-video place-items-center bg-[linear-gradient(135deg,#15100d,#34231c)] px-5 text-center text-white">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-white/52">Synology hosted</p>
                          <p className="mt-3 text-lg font-semibold">Large video ready off-app</p>
                        </div>
                      </div>
                    ) : (
                      <video
                        className="aspect-video w-full bg-black object-cover"
                        controls
                        preload="metadata"
                        src={deliverable.file_path}
                      />
                    )
                  ) : (
                    <div
                      className="aspect-[4/3] bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                      style={{ backgroundImage: `url(${deliverable.file_path})` }}
                    />
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                          {deliverable.source_type === "SYNOLOGY" ? "Synology video" : deliverable.media_type === "VIDEO" ? "Video" : "Photo"}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold leading-6">{deliverable.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          className="rounded-full border border-black/[0.08] bg-[rgba(247,241,232,0.72)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                          href={deliverable.file_path}
                          target="_blank"
                        >
                          Open
                        </Link>
                        <form action={deleteProjectDeliverableAction}>
                          <input name="projectId" type="hidden" value={project.id} />
                          <input name="deliverableId" type="hidden" value={deliverable.id} />
                          <button
                            aria-label={`Delete ${deliverable.title}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.14)]"
                            title="Delete deliverable"
                          >
                            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          </button>
                        </form>
                      </div>
                    </div>
                    {deliverable.caption ? (
                      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{deliverable.caption}</p>
                    ) : null}
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Uploaded {dateTime.format(new Date(deliverable.created_at))}
                    </p>
                    <details className="mt-5 rounded-[1.2rem] border border-black/[0.08] bg-[rgba(247,241,232,0.58)] p-4">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--ink)]">
                        Edit details
                      </summary>
                      <form
                        action={updateProjectDeliverableAction}
                        className="mt-4 grid gap-3"
                        encType="multipart/form-data"
                      >
                        <input name="projectId" type="hidden" value={project.id} />
                        <input name="deliverableId" type="hidden" value={deliverable.id} />
                        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                          Title
                          <input
                            className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm normal-case tracking-normal text-[var(--ink)]"
                            defaultValue={deliverable.title}
                            name="title"
                            required
                          />
                        </label>
                        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                          Caption
                          <input
                            className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm normal-case tracking-normal text-[var(--ink)]"
                            defaultValue={deliverable.caption || ""}
                            name="caption"
                          />
                        </label>
                        {deliverable.source_type === "SYNOLOGY" ? (
                          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                            Synology link
                            <input
                              className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm normal-case tracking-normal text-[var(--ink)]"
                              defaultValue={deliverable.file_path}
                              name="synologyUrl"
                              type="url"
                            />
                          </label>
                        ) : null}
                        {deliverable.media_type === "PHOTO" ? (
                          <>
                            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                              Album name
                              <input
                                className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm normal-case tracking-normal text-[var(--ink)]"
                                defaultValue={deliverable.album_title || "Final Gallery"}
                                name="albumTitle"
                              />
                            </label>
                            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                              Section
                              <input
                                className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm normal-case tracking-normal text-[var(--ink)]"
                                defaultValue={deliverable.album_section || ""}
                                name="albumSection"
                              />
                            </label>
                            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                              Download-all link
                              <input
                                className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm normal-case tracking-normal text-[var(--ink)]"
                                defaultValue={deliverable.album_download_url || ""}
                                name="albumDownloadUrl"
                                type="url"
                              />
                            </label>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                                Photo access
                                <select
                                  className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm normal-case tracking-normal text-[var(--ink)]"
                                  defaultValue={
                                    String(deliverable.access_type || "FREE").toUpperCase() === "PAID" ? "PAID" : "FREE"
                                  }
                                  name="accessType"
                                >
                                  <option value="FREE">Free / already paid</option>
                                  <option value="PAID">Client must purchase</option>
                                </select>
                              </label>
                              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                                Price per photo
                                <input
                                  className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm normal-case tracking-normal text-[var(--ink)]"
                                  defaultValue={Number(deliverable.price || 0)}
                                  min="0"
                                  name="price"
                                  step="0.01"
                                  type="number"
                                />
                              </label>
                            </div>
                          </>
                        ) : null}
                        <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                          Replace thumbnail
                          <input
                            accept="image/*"
                            className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm normal-case tracking-normal text-[var(--ink)]"
                            name="thumbnail"
                            type="file"
                          />
                        </label>
                        <button className="rounded-full bg-[var(--sidebar)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
                          Save changes
                        </button>
                      </form>
                    </details>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {clientPortalPath ? (
          <form action={sendProjectMediaGalleryAction} className="fixed bottom-6 right-6 z-40">
            <input name="projectId" type="hidden" value={project.id} />
            <input name="returnPath" type="hidden" value={returnPath} />
            <button className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_45px_rgba(207,114,79,0.36)] transition hover:-translate-y-0.5 hover:brightness-110">
              Send
            </button>
          </form>
        ) : null}
      </section>
    </DashboardShell>
  );
}
