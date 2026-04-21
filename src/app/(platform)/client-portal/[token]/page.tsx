import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  updateClientPortalHeroAction,
  updateProjectDeliverablesGalleryAction,
  uploadClientPortalImageAction,
} from "@/app/actions";
import { ClientPhotoAlbum } from "@/components/client-photo-album";
import { MediaCarousel } from "@/components/media-carousel";
import { getDb, parseJsonList } from "@/lib/db";
import { ensureProjectDeliverablesTable, markPhotoDeliverablePaid } from "@/lib/deliverables";
import { currencyFormatter, dateTime, shortDate } from "@/lib/formatters";
import { getStripe } from "@/lib/stripe";
import { ensureVideoPaywallsTable } from "@/lib/video-paywalls";

const portalTabs = ["overview", "financials", "messages", "details", "buy-videos"] as const;

type PortalTab = (typeof portalTabs)[number];

type Search = {
  tab?: string;
  uploaded?: string;
  gallerySaved?: string;
  portalSaved?: string;
  categorySaved?: string;
  editGallery?: string;
  openAlbum?: string;
  photo_session_id?: string;
  photo_token?: string;
  photo_canceled?: string;
  error?: string;
};

type LineItem = {
  title: string;
  description: string;
  amount: number;
};

function parseLineItems(value: unknown) {
  try {
    return JSON.parse(String(value ?? "[]")) as LineItem[];
  } catch {
    return [];
  }
}

function getPortalTabLabel(tab: PortalTab) {
  if (tab === "buy-videos") {
    return "Media Gallery";
  }

  return tab;
}

export default async function ClientPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Search>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const requestedTab = String(query.tab || "").toLowerCase() as PortalTab;
  const activeTab = portalTabs.includes(requestedTab) ? requestedTab : "overview";
  const canEditGallery = false;
  const isGalleryEditMode = false;
  const db = getDb();
  ensureVideoPaywallsTable();
  ensureProjectDeliverablesTable();

  const project = db
    .prepare("SELECT * FROM projects WHERE public_portal_token = ? LIMIT 1")
    .get(token) as Record<string, unknown> | undefined;

  if (!project) {
    notFound();
  }

  const client = db
    .prepare("SELECT * FROM clients WHERE name = ? LIMIT 1")
    .get(String(project.client)) as Record<string, unknown> | undefined;
  const siblingProjectCount =
    Number(
      (
        db
          .prepare("SELECT COUNT(*) AS count FROM projects WHERE client = ?")
          .get(String(project.client)) as { count?: number | null } | undefined
      )?.count ?? 0
    ) || 0;
  const canUseLegacyClientScope = siblingProjectCount <= 1;
  const proposals = db
    .prepare(
      `SELECT *
        FROM proposals
        WHERE project_id = ?
           OR (
             ? = 1
             AND COALESCE(NULLIF(project_id, ''), '') = ''
             AND client = ?
           )
        ORDER BY sent_date DESC`
    )
    .all(String(project.id), canUseLegacyClientScope ? 1 : 0, String(project.client)) as Array<Record<string, unknown>>;
  const invoices = db
    .prepare(
      `SELECT *
        FROM invoices
        WHERE project_id = ?
           OR (
             ? = 1
             AND COALESCE(NULLIF(project_id, ''), '') = ''
             AND client = ?
           )
        ORDER BY due_date ASC`
    )
    .all(String(project.id), canUseLegacyClientScope ? 1 : 0, String(project.client)) as Array<Record<string, unknown>>;
  const messages = (
    db
    .prepare("SELECT * FROM messages WHERE deleted_at IS NULL AND (project_id = ? OR client_name = ?) ORDER BY time DESC")
    .all(String(project.id), String(project.client)) as Array<Record<string, unknown>>
  ).filter((message) => {
    const isEmail = String(message.channel || "").toLowerCase() === "email";
    const isExactProjectMessage = String(message.project_id || "") === String(project.id);
    const isLegacyClientMessage =
      !String(message.project_id || "") &&
      String(message.client_name || "").trim().toLowerCase() === String(project.client).trim().toLowerCase();

    return isEmail && (isExactProjectMessage || isLegacyClientMessage);
  });
  const schedule = db
    .prepare(
      `SELECT *
        FROM schedule_items
        WHERE project_id = ?
           OR (
             ? = 1
             AND COALESCE(NULLIF(project_id, ''), '') = ''
             AND client = ?
           )
        ORDER BY starts_at ASC`
    )
    .all(String(project.id), canUseLegacyClientScope ? 1 : 0, String(project.client)) as Array<Record<string, unknown>>;
  const today = new Date();
  const upcomingSchedule = schedule.filter((item) => {
    const startsAt = new Date(String(item.starts_at || ""));
    return !Number.isNaN(startsAt.getTime()) && startsAt.getTime() >= today.getTime();
  });
  const uploads = db
    .prepare("SELECT * FROM client_uploads WHERE project_id = ? ORDER BY created_at DESC")
    .all(String(project.id)) as Array<Record<string, unknown>>;
  const videoPaywalls = db
    .prepare("SELECT * FROM video_paywalls WHERE project_id = ? ORDER BY created_at DESC")
    .all(String(project.id)) as Array<Record<string, unknown>>;
  const deliverableVideos = db
    .prepare("SELECT * FROM project_deliverables WHERE project_id = ? AND media_type = ? ORDER BY created_at DESC")
    .all(String(project.id), "VIDEO") as Array<Record<string, unknown>>;
  if (query.photo_session_id && query.photo_token) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(String(query.photo_session_id));
      const customerEmail = String(
        session.customer_details?.email || session.customer_email || session.metadata?.buyerEmail || ""
      ).trim();

      if (
        session.payment_status === "paid" &&
        String(session.metadata?.photoToken || "") === String(query.photo_token)
      ) {
        markPhotoDeliverablePaid({
          projectId: String(project.id),
          photoToken: String(query.photo_token),
          sessionId: session.id,
          buyerEmail: customerEmail,
          paidAt: new Date().toISOString(),
        });
      }
    } catch {
      // Keep the portal usable even if Stripe isn't configured or the session lookup fails.
    }
  }
  const deliverablePhotos = db
    .prepare("SELECT * FROM project_deliverables WHERE project_id = ? AND media_type = ? ORDER BY created_at DESC")
    .all(String(project.id), "PHOTO") as Array<Record<string, unknown>>;
  const galleryTitle = String(project.deliverables_gallery_title || `${String(project.client)} Video Library`);
  const galleryIntro = String(
    project.deliverables_gallery_intro ||
      "Your private streaming gallery with purchased films, delivered videos, and locked add-ons."
  );
  const galleryCover = String(
    project.deliverables_gallery_cover ||
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80"
  );
  const portalTitle = String(project.client_portal_title || String(project.client));
  const portalIntro = String(
    project.client_portal_intro ||
      "Welcome to your private project portal. This page only shows your project, documents, invoices, and messages with the StudioFlow team."
  );
  const portalCover = String(
    project.client_portal_cover ||
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=80"
  );
  const paidVideoPaywalls = videoPaywalls.filter((paywall) => String(paywall.status) === "PAID");
  const lockedVideoPaywalls = videoPaywalls.filter((paywall) => String(paywall.status) !== "PAID");
  const unlockedVideoCount = deliverableVideos.length + paidVideoPaywalls.length;
  const photoAlbums = Array.from(
    deliverablePhotos.reduce((albums, photo) => {
      const albumTitle = String(photo.album_title || "Final Gallery");
      albums.set(albumTitle, [...(albums.get(albumTitle) || []), photo]);
      return albums;
    }, new Map<string, Array<Record<string, unknown>>>())
  ).map(([title, photos]) => {
    const downloadAllUrl = String(photos.find((photo) => photo.album_download_url)?.album_download_url || "");
    const sections = new Set(photos.map((photo) => String(photo.album_section || "Gallery")));

    return {
      title,
      photos,
      downloadAllUrl,
      sections: Array.from(sections),
      cover: String(photos.find((photo) => photo.album_cover_image)?.album_cover_image || photos[0]?.file_path || ""),
    };
  });
  const photoAlbumCount = photoAlbums.length;
  const signedContract =
    proposals.find((item) => String(item.status) === "SIGNED") ||
    proposals.find((item) => String(item.title).toLowerCase().includes("contract")) ||
    null;
  const tasks = parseJsonList(String(project.tasks));
  const paidTotal = invoices
    .filter((item) => String(item.status) === "PAID")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const outstandingTotal = invoices
    .filter((item) => String(item.status) !== "PAID")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 text-[var(--ink)]">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[2rem] border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(58,34,17,0.12)]">
          {isGalleryEditMode ? (
            <form action={updateClientPortalHeroAction} encType="multipart/form-data">
              <input name="projectId" type="hidden" value={String(project.id)} />
              <input name="portalCover" type="hidden" value={portalCover} />
              <input
                name="returnPath"
                type="hidden"
                value={`/client-portal/${token}?tab=buy-videos&editGallery=1`}
              />
              <div
                className="bg-cover bg-center px-8 py-12 text-white sm:px-10 sm:py-14"
                style={{
                  backgroundImage: `linear-gradient(135deg,rgba(19,18,22,0.88),rgba(207,114,79,0.34)),url('${portalCover}')`,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/68">StudioFlow Client Portal</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/20">
                      Change top banner
                      <input accept="image/*" className="sr-only" name="portalCoverFile" type="file" />
                    </label>
                  </div>
                </div>
                <label className="mt-6 grid gap-2">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/58">
                    Header text
                  </span>
                  <input
                    aria-label="Portal header title"
                    className="w-full max-w-4xl border-0 bg-transparent p-0 font-display text-[50px] font-black leading-[0.92] tracking-[-0.05em] text-white outline-none placeholder:text-white/45"
                    defaultValue={portalTitle}
                    name="portalTitle"
                    required
                  />
                </label>
                <label className="mt-6 grid gap-2">
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/58">
                    Sub-text
                  </span>
                  <textarea
                    aria-label="Portal header intro"
                    className="min-h-20 w-full max-w-3xl resize-none border-0 bg-transparent p-0 text-base font-medium leading-7 text-white/72 outline-none placeholder:text-white/45"
                    defaultValue={portalIntro}
                    name="portalIntro"
                  />
                </label>
                <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-semibold text-white/85">
                  <span className="rounded-full border border-white/14 bg-white/10 px-4 py-2">
                    {String(project.project_type || "Project")}
                  </span>
                  {project.project_date ? (
                    <span className="rounded-full border border-white/14 bg-white/10 px-4 py-2">
                      {shortDate.format(new Date(String(project.project_date)))}
                    </span>
                  ) : null}
                  {project.location ? (
                    <span className="rounded-full border border-white/14 bg-white/10 px-4 py-2">
                      {String(project.location)}
                    </span>
                  ) : null}
                  <button className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#11100f] transition hover:bg-white/86">
                    Save top banner
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div
              className="bg-cover bg-center px-8 py-12 text-white sm:px-10 sm:py-14"
              style={{
                backgroundImage: `linear-gradient(135deg,rgba(19,18,22,0.88),rgba(207,114,79,0.34)),url('${portalCover}')`,
              }}
            >
              <p className="text-xs uppercase tracking-[0.3em] text-white/68">StudioFlow Client Portal</p>
              <h1 className="mt-5 font-display text-5xl leading-none sm:text-6xl">{portalTitle}</h1>
              <p className="mt-5 max-w-3xl text-base leading-7 text-white/80">{portalIntro}</p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-white/85">
                <span className="rounded-full border border-white/14 bg-white/10 px-4 py-2">
                  {String(project.project_type || "Project")}
                </span>
                {project.project_date ? (
                  <span className="rounded-full border border-white/14 bg-white/10 px-4 py-2">
                    {shortDate.format(new Date(String(project.project_date)))}
                  </span>
                ) : null}
                {project.location ? (
                  <span className="rounded-full border border-white/14 bg-white/10 px-4 py-2">
                    {String(project.location)}
                  </span>
                ) : null}
              </div>
            </div>
          )}

          <div className="border-b border-black/[0.08] px-8 pt-6 sm:px-10">
            <div className="flex flex-wrap gap-6 text-sm font-semibold text-[var(--muted)]">
              {portalTabs.map((tab) => (
                <Link
                  key={tab}
                  className={`border-b-2 pb-4 capitalize transition ${
                    activeTab === tab
                      ? "border-[var(--accent)] text-[var(--ink)]"
                      : "border-transparent hover:text-[var(--ink)]"
                  }`}
                  href={`/client-portal/${token}?tab=${tab}`}
                >
                  {getPortalTabLabel(tab)}
                </Link>
              ))}
            </div>
          </div>

          <div
            className={`grid gap-6 px-8 py-8 sm:px-10 ${
              activeTab === "buy-videos" ? "" : "lg:grid-cols-[1.45fr_0.78fr]"
            }`}
          >
            <section className={`grid gap-6 ${activeTab === "buy-videos" ? "w-full" : ""}`}>
              {query.uploaded === "1" ? (
                <Banner message="Your images were uploaded successfully." tone="success" />
              ) : null}
              {query.error === "upload-invalid" ? (
                <Banner message="Choose an image before uploading." tone="warning" />
              ) : null}
              {query.error === "upload-type" ? (
                <Banner message="Only image files can be uploaded here." tone="warning" />
              ) : null}
              {query.error === "gallery-cover-type" ? (
                <Banner message="Choose an image file for the gallery banner." tone="warning" />
              ) : null}
              {query.error === "portal-cover-type" ? (
                <Banner message="Choose an image file for the top portal banner." tone="warning" />
              ) : null}
              {query.error === "portal-invalid" ? (
                <Banner message="Add a title before saving the top portal banner." tone="warning" />
              ) : null}
              {query.gallerySaved === "1" ? (
                <Banner message="Client gallery changes saved." tone="success" />
              ) : null}
              {query.portalSaved === "1" ? (
                <Banner message="Top portal banner changes saved." tone="success" />
              ) : null}
              {query.categorySaved === "1" ? (
                <Banner message="Photo category changes saved." tone="success" />
              ) : null}
              {query.photo_session_id && query.photo_token ? (
                <Banner message="Photo purchase received. Your download is now unlocked." tone="success" />
              ) : null}
              {query.photo_canceled === "1" ? (
                <Banner message="Photo checkout was canceled." tone="warning" />
              ) : null}
              {query.error === "stripe-missing" ? (
                <Banner message="Photo checkout is not configured yet." tone="warning" />
              ) : null}
              {query.error === "payment-invalid" ? (
                <Banner message="That photo purchase link could not be completed." tone="warning" />
              ) : null}
              {query.error === "album-category-invalid" ? (
                <Banner message="Select photos and enter a category before saving." tone="warning" />
              ) : null}

              {activeTab === "overview" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <StatCard label="Proposals" value={String(proposals.length)} />
                    <StatCard label="Paid" value={currencyFormatter.format(paidTotal)} />
                    <StatCard label="Outstanding" value={currencyFormatter.format(outstandingTotal)} />
                  </div>

                  <article className="rounded-[1.6rem] border border-black/[0.08] bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Project summary</p>
                    <h2 className="mt-3 text-2xl font-semibold">{String(project.name)}</h2>
                    <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{String(project.description || "")}</p>
                    <div className="mt-6 grid gap-3 md:grid-cols-2">
                      <InfoRow label="Current stage" value={String(project.phase)} />
                      <InfoRow label="Next milestone" value={String(project.next_milestone)} />
                      <InfoRow label="Lead source" value={String(project.lead_source || "Private")} />
                      <InfoRow label="Package" value={String(client?.package_name || "Not set")} />
                    </div>
                  </article>

                  <article className="rounded-[1.6rem] border border-black/[0.08] bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Included items</p>
                    <div className="mt-5 grid gap-3">
                      {tasks.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">No milestones have been shared yet.</p>
                      ) : (
                        tasks.map((task) => (
                          <div
                            key={task}
                            className="rounded-[1.2rem] border border-black/[0.08] bg-[rgba(247,241,232,0.54)] px-4 py-3 text-sm text-[var(--ink)]"
                          >
                            {task}
                          </div>
                        ))
                      )}
                    </div>
                  </article>
                </>
              ) : null}

              {activeTab === "financials" ? (
                <>
                  <article className="rounded-[1.6rem] border border-black/[0.08] bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Proposals and contract</p>
                    <div className="mt-5 grid gap-4">
                      {proposals.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">No proposals have been shared yet.</p>
                      ) : (
                        proposals.map((proposal) => {
                          const lineItems = parseLineItems(proposal.line_items);
                          return (
                            <article
                              key={String(proposal.id)}
                              className="rounded-[1.35rem] border border-black/[0.08] bg-[rgba(247,241,232,0.54)] p-5"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <h2 className="text-lg font-semibold">{String(proposal.title)}</h2>
                                  <p className="mt-1 text-sm text-[var(--muted)]">
                                    {String(proposal.status)} | Sent{" "}
                                    {shortDate.format(new Date(String(proposal.sent_date)))}
                                  </p>
                                </div>
                                <p className="text-base font-semibold">
                                  {currencyFormatter.format(Number(proposal.amount))}
                                </p>
                              </div>
                              {lineItems.length > 0 ? (
                                <div className="mt-4 grid gap-2">
                                  {lineItems.map((item, index) => (
                                    <div key={`${String(proposal.id)}-${index}`} className="text-sm text-[var(--muted)]">
                                      {item.title}: {item.description}
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                              {proposal.public_token ? (
                                <Link
                                  className="mt-4 inline-flex text-sm font-semibold text-[var(--forest)] underline"
                                  href={`/p/${String(proposal.public_token)}`}
                                  target="_blank"
                                >
                                  Open full proposal
                                </Link>
                              ) : null}
                            </article>
                          );
                        })
                      )}
                    </div>
                  </article>

                  <article className="rounded-[1.6rem] border border-black/[0.08] bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Invoices</p>
                    <div className="mt-5 grid gap-4">
                      {invoices.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">No invoices have been created yet.</p>
                      ) : (
                        invoices.map((invoice) => (
                          <article
                            key={String(invoice.id)}
                            className="rounded-[1.35rem] border border-black/[0.08] bg-[rgba(247,241,232,0.54)] p-5"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h2 className="text-lg font-semibold">{String(invoice.label)}</h2>
                                <p className="mt-1 text-sm text-[var(--muted)]">
                                  {String(invoice.status)} | Due{" "}
                                  {shortDate.format(new Date(String(invoice.due_date)))}
                                </p>
                              </div>
                              <p className="text-base font-semibold">
                                {currencyFormatter.format(Number(invoice.amount))}
                              </p>
                            </div>
                            {invoice.public_token ? (
                              <Link
                                className="mt-4 inline-flex text-sm font-semibold text-[var(--forest)] underline"
                                href={`/invoice/${String(invoice.public_token)}`}
                                target="_blank"
                              >
                                Open invoice
                              </Link>
                            ) : null}
                          </article>
                        ))
                      )}
                    </div>
                  </article>
                </>
              ) : null}

              {activeTab === "messages" ? (
                <article className="rounded-[1.6rem] border border-black/[0.08] bg-white p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Messages</p>
                      <h2 className="mt-3 text-2xl font-semibold">Conversation history</h2>
                    </div>
                    <p className="text-sm text-[var(--muted)]">{messages.length} messages</p>
                  </div>
                  <div className="mt-5 grid gap-4">
                    {messages.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">No messages have been logged yet.</p>
                    ) : (
                      messages.map((message) => (
                        <article
                          key={String(message.id)}
                          className="rounded-[1.35rem] border border-black/[0.08] bg-[rgba(247,241,232,0.54)] p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                                {String(message.direction) === "OUTBOUND" ? "Sent by StudioFlow" : "Sent by client"} |{" "}
                                {String(message.channel)}
                              </p>
                              <h3 className="mt-2 text-lg font-semibold">{String(message.subject)}</h3>
                              <p className="mt-1 text-sm text-[var(--muted)]">{String(message.sender)}</p>
                            </div>
                            <p className="text-sm text-[var(--muted)]">
                              {dateTime.format(new Date(String(message.time)))}
                            </p>
                          </div>
                          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--ink)]">
                            {String(message.preview)}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </article>
              ) : null}

              {activeTab === "buy-videos" ? (
                <article className="overflow-hidden rounded-[1.8rem] border border-black/[0.08] bg-[#11100f] text-white shadow-[0_24px_80px_rgba(20,16,12,0.2)]">
                  {isGalleryEditMode ? (
                    <form action={updateProjectDeliverablesGalleryAction} encType="multipart/form-data">
                      <input name="projectId" type="hidden" value={String(project.id)} />
                      <input name="galleryCover" type="hidden" value={galleryCover} />
                      <input
                        name="returnPath"
                        type="hidden"
                        value={`/client-portal/${token}?tab=buy-videos&editGallery=1`}
                      />
                      <div
                        className="bg-cover bg-center"
                        style={{
                          backgroundImage: `linear-gradient(90deg,rgba(12,11,10,0.94),rgba(12,11,10,0.58),rgba(12,11,10,0.18)),url('${galleryCover}')`,
                        }}
                      >
                        <div className="px-6 py-12 sm:px-8">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                              Admin gallery edit mode
                            </p>
                            <label className="cursor-pointer rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/20">
                              Change banner
                              <input accept="image/*" className="sr-only" name="galleryCoverFile" type="file" />
                            </label>
                          </div>
                          <label className="mt-6 grid gap-2">
                            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/58">
                              Header text
                            </span>
                            <input
                              aria-label="Gallery title"
                              className="w-full max-w-3xl border-0 bg-transparent p-0 font-display text-[50px] font-black leading-[0.92] tracking-[-0.05em] text-white outline-none placeholder:text-white/45"
                              defaultValue={galleryTitle}
                              name="galleryTitle"
                              required
                            />
                          </label>
                          <label className="mt-6 grid gap-2">
                            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/58">
                              Sub-text
                            </span>
                            <textarea
                              aria-label="Gallery intro"
                              className="min-h-20 w-full max-w-2xl resize-none border-0 bg-transparent p-0 text-base font-medium leading-7 text-white/72 outline-none placeholder:text-white/45"
                              defaultValue={galleryIntro}
                              name="galleryIntro"
                            />
                          </label>
                          <div className="mt-7 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
                            <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
                              {unlockedVideoCount} unlocked
                            </span>
                            <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
                              {photoAlbumCount} galleries
                            </span>
                            <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
                              {lockedVideoPaywalls.length} locked
                            </span>
                            <button className="rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#11100f] transition hover:bg-white/86">
                              Save gallery changes
                            </button>
                            <Link
                              className="rounded-full border border-white/16 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                              href={`/client-portal/${token}?tab=buy-videos`}
                            >
                              Exit edit
                            </Link>
                          </div>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div
                      className="bg-cover bg-center"
                      style={{
                        backgroundImage: `linear-gradient(90deg,rgba(12,11,10,0.94),rgba(12,11,10,0.58),rgba(12,11,10,0.18)),url('${galleryCover}')`,
                      }}
                    >
                      <div className="px-6 py-12 sm:px-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Private video gallery</p>
                          {canEditGallery ? (
                            <Link
                              className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/18"
                              href={`/client-portal/${token}?tab=buy-videos&editGallery=1`}
                            >
                              Edit gallery
                            </Link>
                          ) : null}
                        </div>
                        <h2 className="mt-4 max-w-3xl font-display text-5xl leading-none sm:text-6xl">{galleryTitle}</h2>
                        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72">{galleryIntro}</p>
                        <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
                          <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
                            {unlockedVideoCount} unlocked
                          </span>
                          <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
                            {photoAlbumCount} galleries
                          </span>
                          <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2">
                            {lockedVideoPaywalls.length} locked
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

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
                          No unlocked videos yet. Purchased or delivered media will appear here automatically.
                        </div>
                      ) : (
                        <div className="mt-5 grid gap-7">
                          {deliverableVideos.length > 0 || paidVideoPaywalls.length > 0 ? (
                            <MediaCarousel itemCount={deliverableVideos.length + paidVideoPaywalls.length}>
                              {deliverableVideos.map((video) => (
                                <article
                                  key={String(video.id)}
                                  className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.06] transition hover:-translate-y-1 hover:bg-white/[0.09]"
                                >
                                  {video.thumbnail_path ? (
                                    <div
                                      className="aspect-video bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                                      style={{ backgroundImage: `url(${String(video.thumbnail_path)})` }}
                                    />
                                  ) : String(video.source_type || "UPLOAD") === "SYNOLOGY" ? (
                                    <div className="grid aspect-video place-items-center bg-[linear-gradient(135deg,#15100d,#3f2b23)] px-5 text-center">
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.24em] text-white/48">Synology hosted</p>
                                        <p className="mt-3 text-xl font-semibold">Open your delivered film</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <video
                                      className="aspect-video w-full bg-black object-cover"
                                      controls
                                      preload="metadata"
                                      src={String(video.file_path)}
                                    />
                                  )}
                                  <div className="flex flex-1 flex-col p-4">
                                    <p className="text-xs uppercase tracking-[0.22em] text-[rgba(134,239,172,0.8)]">
                                      Ready to watch / download
                                    </p>
                                    <h4 className="mt-2 text-lg font-semibold">{String(video.title)}</h4>
                                    {video.caption ? (
                                      <p className="mt-3 min-h-[3rem] text-sm leading-6 text-white/58">{String(video.caption)}</p>
                                    ) : null}
                                    <Link
                                      className="mt-auto inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#11100f] transition hover:bg-white/86"
                                      href={String(video.file_path)}
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
                                      className="aspect-video bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
                                      style={{ backgroundImage: `url(${coverImage})` }}
                                    />
                                    <div className="flex flex-1 flex-col p-4">
                                      <p className="text-xs uppercase tracking-[0.22em] text-[rgba(134,239,172,0.8)]">Purchased</p>
                                      <h4 className="mt-2 text-lg font-semibold">{String(paywall.title)}</h4>
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
                                  className="relative aspect-video bg-cover bg-center transition duration-500 group-hover:scale-[1.02]"
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
                                    <p className="text-base font-semibold">{currencyFormatter.format(Number(paywall.price || 0))}</p>
                                  </div>
                                  <p className="mt-3 min-h-[3rem] text-sm leading-6 text-white/58">{String(paywall.description)}</p>
                                  <Link
                                    className="mt-auto inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                                    href={`/video-paywall/${String(paywall.public_token)}`}
                                    target="_blank"
                                  >
                                    Unlock video
                                  </Link>
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
                                canEdit={canEditGallery}
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
                                projectId={String(project.id)}
                                returnPath={`/client-portal/${token}?tab=buy-videos${isGalleryEditMode ? "&editGallery=1" : ""}`}
                                initialOpen={query.openAlbum?.toLowerCase() === album.title.toLowerCase()}
                              />
                            </div>
                          ))}
                        </MediaCarousel>
                      )}
                    </section>
                  </div>
                </article>
              ) : null}

              {activeTab === "details" ? (
                <>
                  <article className="rounded-[1.6rem] border border-black/[0.08] bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Project details</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <InfoCard label="Client name" value={String(project.client)} />
                      <InfoCard label="Contact email" value={String(client?.contact_email || "")} />
                      <InfoCard label="Project name" value={String(project.name)} />
                      <InfoCard label="Type" value={String(project.project_type || "")} />
                      <InfoCard label="Location" value={String(project.location || "")} />
                      <InfoCard
                        label="Project date"
                        value={
                          project.project_date
                            ? shortDate.format(new Date(String(project.project_date)))
                            : ""
                        }
                      />
                    </div>
                  </article>

                  <form
                    action={uploadClientPortalImageAction}
                    className="rounded-[1.6rem] border border-black/[0.08] bg-white p-6"
                  >
                    <input name="token" type="hidden" value={token} />
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Share images</p>
                    <h2 className="mt-3 text-2xl font-semibold">Upload inspiration or reference photos</h2>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      Upload images here and they will appear inside the project on the StudioFlow side.
                    </p>
                    <div className="mt-5 grid gap-4">
                      <label className="grid gap-2 text-sm font-medium">
                        Image
                        <input
                          accept="image/*"
                          className="rounded-2xl border border-black/[0.08] px-4 py-3"
                          name="image"
                          required
                          type="file"
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-medium">
                        Caption
                        <input
                          className="rounded-2xl border border-black/[0.08] px-4 py-3"
                          name="caption"
                          placeholder="Tell us what this image is for."
                        />
                      </label>
                    </div>
                    <button className="mt-5 rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                      Upload image
                    </button>
                  </form>

                  <article className="rounded-[1.6rem] border border-black/[0.08] bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Uploaded images</p>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      {uploads.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">No client images have been uploaded yet.</p>
                      ) : (
                        uploads.map((upload) => (
                          <article
                            key={String(upload.id)}
                            className="overflow-hidden rounded-[1.35rem] border border-black/[0.08] bg-[rgba(247,241,232,0.54)]"
                          >
                            <div className="relative h-56 w-full">
                              <Image
                                alt={String(upload.caption || "Client upload")}
                                className="object-cover"
                                fill
                                src={String(upload.image_path)}
                                unoptimized
                              />
                            </div>
                            <div className="p-4">
                              <p className="text-sm font-semibold text-[var(--ink)]">
                                {String(upload.caption || "Client upload")}
                              </p>
                              <p className="mt-1 text-xs text-[var(--muted)]">
                                Uploaded {dateTime.format(new Date(String(upload.created_at)))}
                              </p>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </article>
                </>
              ) : null}
            </section>

            {activeTab !== "buy-videos" ? (
              <aside className="grid gap-6">
                <article className="rounded-[1.6rem] border border-black/[0.08] bg-white p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Portal access</p>
                  <h2 className="mt-3 text-2xl font-semibold">Private project view</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    This link only opens {String(project.client)}&apos;s project and does not expose any other clients or internal dashboard pages.
                  </p>
                </article>

                <article className="rounded-[1.6rem] border border-black/[0.08] bg-white p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Contract status</p>
                  <h2 className="mt-3 text-2xl font-semibold">
                    {signedContract ? String(signedContract.status) : "Pending"}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    {signedContract
                      ? `${String(signedContract.title)} is available in this portal.`
                      : "A signed contract will appear here once it has been completed."}
                  </p>
                </article>

                <article className="rounded-[1.6rem] border border-black/[0.08] bg-white p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Upcoming schedule</p>
                  <div className="mt-5 grid gap-3">
                    {upcomingSchedule.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">No upcoming events are scheduled yet.</p>
                    ) : (
                      upcomingSchedule.map((item) => (
                        <div
                          key={String(item.id)}
                          className="rounded-[1.2rem] bg-[rgba(247,241,232,0.54)] px-4 py-3"
                        >
                          <p className="font-semibold">{String(item.title)}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {dateTime.format(new Date(String(item.starts_at)))}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </aside>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[1.35rem] border border-black/[0.08] bg-white p-5">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function Banner({ message, tone }: { message: string; tone: "success" | "warning" }) {
  const classes =
    tone === "success"
      ? "border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] text-[var(--forest)]"
      : "border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] text-[var(--accent)]";

  return <div className={`rounded-[1.5rem] border px-5 py-4 text-sm ${classes}`}>{message}</div>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] bg-[rgba(247,241,232,0.54)] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{value || "Not shared yet"}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-black/[0.08] bg-[rgba(247,241,232,0.54)] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{value || "Not shared yet"}</p>
    </div>
  );
}
