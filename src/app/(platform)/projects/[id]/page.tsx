import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addProjectContactAction,
  deleteProjectFileAction,
  sendProjectMessageAction,
  updateAdditionalProjectContactAction,
  updateProjectContactAction,
  updateProjectDetailsAction,
  updateProjectFilesAction,
  updateProjectMetaAction,
  updateProjectTasksAction,
  updateUserAvatarAction,
} from "@/app/actions";
import { MessageAiAssistant } from "@/components/message-ai-assistant";
import { ProjectContactControls } from "@/components/project-contact-controls";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProjectFileLauncher } from "@/components/project-file-launcher";
import { ProjectHeroBannerEditor } from "@/components/project-hero-banner-editor";
import { ProjectThreadMessage } from "@/components/project-thread-message";
import { UserAvatarUploader } from "@/components/user-avatar-uploader";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getDb } from "@/lib/db";
import { ensureProjectDeliverablesTable, type ProjectDeliverable } from "@/lib/deliverables";
import { currencyFormatter, dateTime, shortDate } from "@/lib/formatters";
import { syncInboxRepliesForProject } from "@/lib/inbox-sync";
import { canManageProjectFiles, canViewProjectFinancials } from "@/lib/roles";

const coverImages: Record<string, string> = {
  Wedding: "https://source.unsplash.com/1800x900/?wedding,couple,golden-hour",
  "Music video": "https://source.unsplash.com/1800x900/?music-video,cinematic,artist",
  Commercial: "https://source.unsplash.com/1800x900/?brand,campaign,editorial",
  Event: "https://source.unsplash.com/1800x900/?event,conference,stage",
};

const stageOptions = [
  "Inquiry",
  "Follow-up",
  "Meeting",
  "Proposal Sent",
  "Proposal Signed",
  "Planning",
  "Completed",
];

const taskTemplates = {
  wedding: {
    label: "Wedding workflow",
    nextMilestone: "Send planning questionnaire",
    tasks: [
      "Send proposal and contract",
      "Collect retainer",
      "Send wedding questionnaire",
      "Schedule planning call",
      "Confirm venue and timeline",
      "Request family shot list",
      "Confirm vendor team",
      "Prepare gear and backups",
      "Capture wedding day coverage",
      "Cull photos and footage",
      "Edit preview gallery or teaser",
      "Deliver final gallery or film",
      "Request testimonial",
    ],
  },
  business: {
    label: "Business workflow",
    nextMilestone: "Confirm campaign goals",
    tasks: [
      "Schedule discovery call",
      "Define scope and deliverables",
      "Send proposal and invoice",
      "Collect deposit",
      "Gather brand assets",
      "Confirm shoot goals",
      "Create shot list",
      "Schedule production day",
      "Film or photograph content",
      "Edit first draft",
      "Send review link",
      "Collect feedback",
      "Apply final revisions",
      "Deliver final assets",
    ],
  },
  photo: {
    label: "Photo session",
    nextMilestone: "Confirm session details",
    tasks: [
      "Confirm location and session time",
      "Send wardrobe guidance",
      "Collect inspiration images",
      "Finalize shot list",
      "Prepare gear and backup cards",
      "Photograph session",
      "Cull final selects",
      "Edit gallery",
      "Send preview images",
      "Deliver final gallery",
    ],
  },
  video: {
    label: "Video project",
    nextMilestone: "Finalize production plan",
    tasks: [
      "Confirm creative brief",
      "Approve script or outline",
      "Finalize shoot schedule",
      "Confirm locations and permits",
      "Prepare gear and audio setup",
      "Capture production day",
      "Ingest and back up footage",
      "Edit rough cut",
      "Send review version",
      "Apply revisions",
      "Export final deliverables",
      "Deliver final files",
    ],
  },
} as const;

const projectTabs = ["activity", "files", "tasks", "financials", "details", "deliverables"] as const;

type ProjectTab = (typeof projectTabs)[number];
type TaskTemplateKey = keyof typeof taskTemplates;

function getCoverImage(type: string) {
  return coverImages[type] || "https://source.unsplash.com/1800x900/?creative,project,editorial";
}

function getProjectTabLabel(tab: ProjectTab) {
  if (tab === "deliverables") {
    return "Deliverables";
  }

  return tab;
}

function normalizeProjectPackageCategory(projectType: string) {
  const value = projectType.trim().toLowerCase();

  if (value === "wedding" || value === "weddings") {
    return "Wedding";
  }

  if (
    value === "business" ||
    value === "businesses" ||
    value === "brand" ||
    value === "commercial" ||
    value === "campaign" ||
    value === "corporate"
  ) {
    return "Business";
  }

  return "Others";
}

function getProjectFileTypeLabel(type: string) {
  if (type === "PACKAGES") {
    return "Package Brochure";
  }

  return type.replaceAll("_", " ");
}

export default async function ProjectClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    email?: string;
    portal?: string;
    reply?: string;
    files?: string;
    fileCreated?: string;
    fileDeleted?: string;
    brochureSent?: string;
    messageDeleted?: string;
    paywallDeleted?: string;
    deliverableUploaded?: string;
    tasks?: string;
    template?: string;
    contact?: string;
    participant?: string;
    avatarUpdated?: string;
    invoice?: string;
    details?: string;
    updated?: string;
    error?: string;
    tab?: string;
  }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const requestedTab = (query.tab || "").toLowerCase();
  const requestedTemplate = (query.template || "").toLowerCase() as TaskTemplateKey;
  const selectedTaskTemplate = requestedTemplate in taskTemplates ? taskTemplates[requestedTemplate] : null;

  const { user, data } = await getDashboardPageData();
  const canSeeFinancials = canViewProjectFinancials(user.role);
  const canDeleteProjectFiles = canManageProjectFiles(user.role);
  const availableProjectTabs: ProjectTab[] = canSeeFinancials
    ? [...projectTabs]
    : projectTabs.filter((tab) => tab !== "financials");
  const activeTab: ProjectTab =
    requestedTab === "buy-videos"
      ? "deliverables"
      : availableProjectTabs.includes(requestedTab as ProjectTab)
        ? (requestedTab as ProjectTab)
        : "activity";

  let syncResult: { imported: number; skipped: number; error: string } | null = null;
  if (activeTab === "activity") {
    syncResult = await syncInboxRepliesForProject(id);
  }

  const project = data.projects.find((item) => item.id === id);

  if (!project) {
    notFound();
  }

  const client = data.clients.find((item) => item.name === project.client);
  const db = getDb();
  ensureProjectDeliverablesTable();
  const additionalContacts = db
    .prepare("SELECT * FROM project_contacts WHERE project_id = ? ORDER BY created_at ASC")
    .all(project.id) as Array<{ id: string; name: string; email: string }>;
  const projectFiles = db
    .prepare("SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC")
    .all(project.id) as unknown as Array<{
      id: string;
      type: string;
      title: string;
      summary: string;
      status: string;
      visibility: string;
      linked_path: string | null;
      created_at: string;
      synthetic?: boolean;
    }>;
  const deliverables = db
    .prepare("SELECT * FROM project_deliverables WHERE project_id = ? ORDER BY created_at DESC")
    .all(project.id) as ProjectDeliverable[];
  const videoDeliverables = deliverables.filter((item) => item.media_type === "VIDEO");
  const photoDeliverables = deliverables.filter((item) => item.media_type === "PHOTO");
  const projectProposals = data.proposals.filter((item) => item.client === project.client);
  const proposalHrefByTitle = new Map(
    projectProposals
      .filter((item) => item.publicToken)
      .map((item) => [item.title, `/p/${item.publicToken}`])
  );
  const contract =
    projectProposals.find((item) => item.status === "SIGNED") ||
    projectProposals.find((item) => item.title.toLowerCase().includes("contract")) ||
    null;
  const invoices = data.invoices.filter((item) => item.client === project.client);
  const paidInvoiceAmount = invoices.reduce((sum, invoice) => {
    if (invoice.paymentSchedule.length > 0) {
      return (
        sum +
        invoice.paymentSchedule
          .filter((payment) => payment.status === "PAID")
          .reduce((paymentSum, payment) => paymentSum + Number(payment.amount || 0), 0)
      );
    }

    return sum + (invoice.status === "PAID" ? invoice.amount : 0);
  }, 0);
  const totalInvoiceAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
  const financialProgress = totalInvoiceAmount > 0 ? Math.min(100, Math.round((paidInvoiceAmount / totalInvoiceAmount) * 100)) : 0;
  const outstandingInvoiceAmount = Math.max(0, totalInvoiceAmount - paidInvoiceAmount);
  const nextOutstandingInvoice = invoices
    .filter((invoice) => invoice.status !== "PAID")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  const invoiceHrefByTitle = new Map(
    invoices.map((item) => [item.label, `/projects/${project.id}/invoices/${item.id}`])
  );
  const invoiceFilePaths = new Set(
    projectFiles
      .filter((file) => file.type === "INVOICE")
      .map((file) => file.linked_path || "")
  );
  const invoiceFileTitles = new Set(
    projectFiles
      .filter((file) => file.type === "INVOICE")
      .map((file) => file.title)
  );
  const mergedProjectFiles = [
    ...projectFiles,
    ...invoices
      .filter(
        (invoice) =>
          !invoiceFilePaths.has(`/projects/${project.id}/invoices/${invoice.id}`) &&
          !invoiceFileTitles.has(invoice.label)
      )
      .map((invoice) => ({
        id: `invoice-file-${invoice.id}`,
        type: "INVOICE",
        title: invoice.label,
        summary: `Invoice due ${invoice.dueDate}`,
        status: invoice.statusLabel,
        visibility: "Shared",
        linked_path: `/projects/${project.id}/invoices/${invoice.id}`,
        created_at: invoice.dueDate,
        synthetic: true,
      })),
  ]
    .filter((file) => canSeeFinancials || file.type !== "INVOICE")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const normalizedProjectClient = project.client.trim().toLowerCase();
  const messages = data.messages.filter((item) => {
    const isEmail = item.channel.toLowerCase() === "email";
    const isExactProjectMessage = item.projectId === project.id;
    const isLegacyClientMessage =
      !item.projectId && item.clientName.trim().toLowerCase() === normalizedProjectClient;

    return isEmail && (isExactProjectMessage || isLegacyClientMessage);
  });
  const scheduleItems = data.schedule.filter((item) => item.client === project.client);
  const packageBrochureCategory = normalizeProjectPackageCategory(project.type || "");
  const packageBrochureHref = `/projects/${project.id}/package-brochure?category=${encodeURIComponent(packageBrochureCategory)}`;
  const projectPortalPath = project.publicPortalToken ? `/client-portal/${project.publicPortalToken}` : "#";
  const portalLink = project.publicPortalToken
    ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${projectPortalPath}`
    : "#";
  const successMessage = query.email
    ? "Email sent and added to the client activity feed."
    : query.portal
      ? "Client portal link emailed successfully."
    : query.reply
      ? "Client reply logged in the activity feed."
      : query.participant
        ? "Project contact saved successfully."
      : query.contact
        ? "Client contact details updated successfully."
      : query.avatarUpdated
        ? "Avatar updated successfully."
      : query.fileCreated
        ? "Project file created successfully."
      : query.fileDeleted
        ? "Project file deleted successfully."
        : query.brochureSent
          ? "Package brochure emailed successfully."
        : query.messageDeleted
          ? "Message deleted from this client thread."
            : query.deliverableUploaded
              ? "Deliverable uploaded successfully."
      : query.files
        ? "File notes updated successfully."
        : query.tasks
          ? "Tasks updated successfully."
          : query.invoice
            ? "Invoice created successfully."
            : query.details
              ? "Client details updated successfully."
      : query.updated
        ? "Project details updated successfully."
        : syncResult && syncResult.imported > 0
          ? `${syncResult.imported} new client email${syncResult.imported === 1 ? "" : "s"} synced into activity.`
        : "";

  const errorMessage =
    query.error === "smtp-missing"
      ? "SMTP is not configured yet, so the email could not be sent."
      : query.error === "message-send-failed"
        ? "The email could not be sent. Double-check the client email and SMTP settings."
        : query.error === "portal-send-failed"
          ? "The portal email could not be sent. Double-check the client email and SMTP settings."
        : query.error === "portal-invalid"
            ? "This project needs a client email and portal link before you can send the invite."
          : query.error === "participant-invalid"
            ? "Add both a name and email before saving the project contact."
        : query.error === "message-invalid"
          ? "Fill out the email subject and message before sending."
        : query.error === "contact-invalid"
          ? "Add both a client name and email before saving contact changes."
          : query.error === "avatar-missing"
            ? "Choose an image before saving your avatar."
            : query.error === "avatar-invalid"
              ? "Choose an image file for your avatar."
          : query.error === "reply-invalid"
            ? "Add both a subject and message when logging a client reply."
            : query.error === "project-meta-invalid"
              ? "Add a project name, description, stage, and lead source before saving project details."
              : query.error === "smart-file-invalid"
                ? "Choose a file type before creating a new project file."
              : query.error === "package-brochure-invalid"
                ? "Choose a valid package category before sending the brochure."
              : query.error === "package-brochure-empty"
                ? "That package category does not have any packages yet."
              : query.error === "package-brochure-email-missing"
                ? "Add a client email before sending the package brochure."
              : query.error === "package-brochure-send-failed"
                ? "The package brochure email could not be sent right now."
                : query.error === "files-invalid"
                  ? "Add file notes before saving the Files tab."
                : query.error === "tasks-invalid"
                  ? "Add a milestone, progress value, and at least one task."
                  : query.error === "invoice-invalid"
                    ? "Fill out every invoice field before creating it."
                    : query.error === "deliverable-invalid"
                      ? "Add a title and choose a deliverable file before uploading."
                      : query.error === "deliverable-video-type"
                        ? "Choose a video file for the video deliverable upload."
                        : query.error === "deliverable-photo-type"
                          ? "Choose an image file for the photo deliverable upload."
        : query.error === "details-invalid"
                      ? "Fill out every client detail before saving."
                      : syncResult?.error
                        ? "Inbox sync could not reach Gmail right now. The page still loaded, but new replies were not imported this time."
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
      <section className="grid gap-8">
        <ProjectHeroBannerEditor
          clientName={project.client}
          description={project.description}
          fallbackCover={getCoverImage(project.type)}
          initialCoverImage={project.projectCover}
          initialCoverPosition={project.projectCoverPosition}
          projectDateLabel={project.projectDate ? shortDate.format(new Date(project.projectDate)) : ""}
          projectId={project.id}
          projectType={project.type || "Project"}
        />

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

        <div className="flex flex-col gap-5 rounded-[1.8rem] border border-black/[0.08] bg-white/84 p-6 shadow-[0_24px_54px_rgba(59,36,17,0.08)] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <UserAvatarUploader
              action={updateUserAvatarAction}
              avatarImage={user.avatar_image || ""}
              returnPath={`/projects/${project.id}`}
            />
            <ProjectContactControls
              action={updateProjectContactAction}
              clientName={project.client}
              contactEmail={client?.contactEmail || ""}
              mode="primary"
              projectId={project.id}
              returnTab={activeTab}
            />
            {additionalContacts.map((contact) => (
              <ProjectContactControls
                key={contact.id}
                action={updateAdditionalProjectContactAction}
                contactId={contact.id}
                email={contact.email}
                mode="additional"
                name={contact.name}
                projectId={project.id}
                returnTab={activeTab}
              />
            ))}
            <ProjectContactControls
              action={addProjectContactAction}
              mode="add"
              projectId={project.id}
              returnTab={activeTab}
            />
            <div>
              <p className="font-semibold text-[var(--ink)]">{project.name}</p>
              <p className="text-sm text-[var(--muted)]">
                Visible to you and {project.client}
                {client?.contactEmail ? ` | ${client.contactEmail}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
              href={projectPortalPath}
              target="_blank"
            >
              Client portal
            </Link>
            {contract?.publicToken ? (
              <Link
                className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                href={`/p/${contract.publicToken}/print`}
                target="_blank"
              >
                Contract view
              </Link>
            ) : null}
            <ProjectFileLauncher
              clientName={project.client}
              packagePresets={data.packagePresets}
              projectId={project.id}
              projectName={project.name}
              projectType={project.type}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 border-b border-black/[0.08] pb-4 text-sm font-semibold text-[var(--muted)]">
          {availableProjectTabs.map((tab) => (
            <Link
              key={tab}
              className={`border-b-2 pb-3 capitalize transition ${
                activeTab === tab
                  ? "border-[var(--accent)] text-[var(--ink)]"
                  : "border-transparent hover:text-[var(--ink)]"
              }`}
              href={`/projects/${project.id}?tab=${tab}`}
            >
              {getProjectTabLabel(tab)}
            </Link>
          ))}
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,280px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
          <div className="grid gap-6">
            {activeTab === "activity" ? (
              <>
                <div className="grid gap-4">
                  <details className="rounded-[1.75rem] border border-black/[0.08] bg-white/84 shadow-[0_18px_40px_rgba(59,36,17,0.08)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Reply</p>
                        <h2 className="mt-2 text-xl font-semibold">Email {project.client}</h2>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Open to compose a live email from this project.
                        </p>
                      </div>
                      <span className="text-base font-semibold leading-none text-[var(--muted)]" aria-hidden="true">
                        v
                      </span>
                    </summary>

                    <form
                      action={sendProjectMessageAction}
                      className="border-t border-black/[0.08] px-6 pb-6 pt-5"
                    >
                      <input name="projectId" type="hidden" value={project.id} />
                      <input name="clientName" type="hidden" value={project.client} />
                      <input name="recipientEmail" type="hidden" value={client?.contactEmail || ""} />
                      <MessageAiAssistant clientName={project.client} />
                      <button className="mt-5 rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                        Send email
                      </button>
                    </form>
                  </details>
                </div>

                <div className="rounded-[1.75rem] border border-black/[0.08] bg-white/84 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Recent activity</p>
                      <h2 className="mt-3 text-2xl font-semibold">Client thread</h2>
                    </div>
                    <p className="text-sm text-[var(--muted)]">{messages.length} message(s)</p>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {messages.length === 0 ? (
                      <div className="rounded-[1.5rem] border border-dashed border-black/[0.12] px-5 py-8 text-sm text-[var(--muted)]">
                        No email activity is linked to this client yet.
                      </div>
                    ) : (
                      messages.map((message) => (
                        <ProjectThreadMessage
                          key={message.id}
                          dateLabel={dateTime.format(new Date(message.time))}
                          direction={message.direction}
                          from={message.from}
                          messageId={message.id}
                          preview={message.preview}
                          projectId={project.id}
                          subject={message.subject}
                          unread={message.unread}
                          userAvatar={user.avatar_image || ""}
                        />
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {activeTab === "files" ? (
              <div className="grid gap-4">
                <div className="rounded-[1.75rem] border border-black/[0.08] bg-white/84 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Smart file library</p>
                      <h2 className="mt-3 text-2xl font-semibold">{mergedProjectFiles.length} created file{mergedProjectFiles.length === 1 ? "" : "s"}</h2>
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                      Built for photo and video workflows
                    </p>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {mergedProjectFiles.length === 0 ? (
                      <div className="rounded-[1.5rem] border border-dashed border-black/[0.12] px-5 py-8 text-sm text-[var(--muted)] md:col-span-2">
                        No smart files created yet. Start with a contract, proposal, invoice, questionnaire, or services guide.
                      </div>
                    ) : (
                      mergedProjectFiles.map((file) => (
                        (() => {
                          const href =
                            file.linked_path ||
                            (file.type === "PACKAGES" ? packageBrochureHref : undefined) ||
                            (file.type === "PROPOSAL"
                              ? proposalHrefByTitle.get(file.title)
                              : file.type === "INVOICE"
                                ? invoiceHrefByTitle.get(file.title)
                                : undefined) ||
                            `/projects/${project.id}/files/${file.id}`;

                          return (
                        <article
                          key={file.id}
                          className="group rounded-[1.4rem] border border-black/[0.08] bg-[rgba(247,241,232,0.54)] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[rgba(207,114,79,0.08)]"
                        >
                          <Link
                            href={href}
                            target="_blank"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                                  {getProjectFileTypeLabel(file.type)}
                                </p>
                                <h3 className="mt-2 text-lg font-semibold transition group-hover:text-[var(--accent)]">
                                  {file.title}
                                </h3>
                              </div>
                              <div className="text-right text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                                <p>{file.status}</p>
                                <p className="mt-2">{file.visibility}</p>
                              </div>
                            </div>
                            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{file.summary}</p>
                            <p className="mt-4 text-xs text-[var(--muted)]">
                              Created {dateTime.format(new Date(file.created_at))}
                            </p>
                          </Link>
                          <div className="mt-4 flex justify-end">
                            {canDeleteProjectFiles ? (
                              <form action={deleteProjectFileAction}>
                                <input name="projectId" type="hidden" value={project.id} />
                                <input name="fileId" type="hidden" value={file.id} />
                                <button
                                  className="rounded-full border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-4 py-2 text-xs font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.12)]"
                                  type="submit"
                                >
                                  Delete file
                                </button>
                              </form>
                            ) : null}
                          </div>
                        </article>
                          );
                        })()
                      ))
                    )}
                  </div>
                </div>

                <form
                  action={updateProjectFilesAction}
                  className="rounded-[1.75rem] border border-black/[0.08] bg-white/84 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]"
                >
                  <input name="projectId" type="hidden" value={project.id} />
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Files note</p>
                  <h2 className="mt-3 text-2xl font-semibold">Update file notes</h2>
                  <label className="mt-5 grid gap-2 text-sm font-medium">
                    Internal file summary
                    <textarea
                      className="min-h-40 rounded-2xl border border-black/[0.08] px-4 py-3"
                      defaultValue={project.fileNotes}
                      name="fileNotes"
                      required
                    />
                  </label>
                  <button className="mt-5 rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                    Save file notes
                  </button>
                </form>
              </div>
            ) : null}

            {activeTab === "tasks" ? (
              <form action={updateProjectTasksAction} className="rounded-[1.75rem] border border-black/[0.08] bg-white/84 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]">
                <input name="projectId" type="hidden" value={project.id} />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Tasks</p>
                    <h2 className="mt-3 text-2xl font-semibold">Milestones and next steps</h2>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{project.progress}% complete</p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  {Object.entries(taskTemplates).map(([key, template]) => (
                    <Link
                      key={key}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        requestedTemplate === key
                          ? "border-[var(--accent)] bg-[rgba(207,114,79,0.10)] text-[var(--accent)]"
                          : "border-black/[0.08] bg-white text-[var(--ink)] hover:bg-black/[0.03]"
                      }`}
                      href={`/projects/${project.id}?tab=tasks&template=${key}`}
                    >
                      {template.label}
                    </Link>
                  ))}
                </div>
                {selectedTaskTemplate ? (
                  <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                    Template loaded: {selectedTaskTemplate.label}. You can edit anything before saving.
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                    Pick a workflow template or keep using your custom task list.
                  </p>
                )}
                <div className="mt-6 h-3 overflow-hidden rounded-full bg-black/[0.07]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#cf724f,#f2c27e)]"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <div className="mt-6 grid gap-4">
                  <label className="grid gap-2 text-sm font-medium">
                    Next milestone
                    <input
                      className="rounded-2xl border border-black/[0.08] px-4 py-3"
                      defaultValue={selectedTaskTemplate?.nextMilestone || project.nextMilestone}
                      name="nextMilestone"
                      required
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Progress
                    <input
                      className="rounded-2xl border border-black/[0.08] px-4 py-3"
                      defaultValue={project.progress}
                      max="100"
                      min="0"
                      name="progress"
                      required
                      type="number"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Tasks
                    <textarea
                      className="min-h-48 rounded-2xl border border-black/[0.08] px-4 py-3"
                      defaultValue={selectedTaskTemplate?.tasks.join("\n") || project.tasks.join("\n")}
                      name="tasks"
                      required
                    />
                  </label>
                </div>
                <button className="mt-5 rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                  Save tasks
                </button>
              </form>
            ) : null}

            {activeTab === "financials" && canSeeFinancials ? (
              <div className="rounded-[1.75rem] border border-black/[0.08] bg-white/84 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Invoice progress</p>
                <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-4xl font-semibold">{financialProgress}% paid</h2>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      This bar updates from the invoice payment activity automatically.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--muted)]">Paid</p>
                    <p className="mt-1 text-2xl font-semibold">{currencyFormatter.format(paidInvoiceAmount)}</p>
                  </div>
                </div>

                <div className="mt-6 h-5 overflow-hidden rounded-full bg-black/[0.08]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#cf724f,#f2c27e)] transition-all duration-500"
                    style={{ width: `${financialProgress}%` }}
                  />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.3rem] bg-[rgba(247,241,232,0.54)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Invoice total</p>
                    <p className="mt-2 text-2xl font-semibold">{currencyFormatter.format(totalInvoiceAmount)}</p>
                  </div>
                  <div className="rounded-[1.3rem] bg-[rgba(247,241,232,0.54)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Remaining</p>
                    <p className="mt-2 text-2xl font-semibold">{currencyFormatter.format(outstandingInvoiceAmount)}</p>
                  </div>
                  <div className="rounded-[1.3rem] bg-[rgba(247,241,232,0.54)] p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Next invoice</p>
                    <p className="mt-2 text-lg font-semibold">
                      {nextOutstandingInvoice ? nextOutstandingInvoice.label : "All paid"}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {nextOutstandingInvoice
                        ? `Due ${shortDate.format(new Date(nextOutstandingInvoice.dueDate))}`
                        : "No outstanding balance left."}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "deliverables" ? (
              <div className="grid gap-6">
                <section className="overflow-hidden rounded-[1.9rem] border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(59,36,17,0.10)]">
                  <div className="bg-[linear-gradient(135deg,rgba(20,18,16,0.88),rgba(207,114,79,0.28)),url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center px-6 py-10 text-white sm:px-8">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/70">Deliverables</p>
                    <h2 className="mt-3 font-display text-5xl leading-none">Delivery workspace</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78">
                      Keep this project page clean and open the full gallery workspace when you are ready to upload or review client files.
                    </p>
                    <Link
                      className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-white/88"
                      href={`/projects/${project.id}/deliverables`}
                    >
                      Open deliverables gallery
                    </Link>
                  </div>

                  <div className="grid gap-4 p-6 md:grid-cols-3">
                    <div className="rounded-[1.4rem] border border-black/[0.08] bg-[rgba(247,241,232,0.62)] p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Videos</p>
                      <p className="mt-3 text-3xl font-semibold">{videoDeliverables.length}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Client-ready paid films and video files.</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-black/[0.08] bg-[rgba(247,241,232,0.62)] p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Photos</p>
                      <p className="mt-3 text-3xl font-semibold">{photoDeliverables.length}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Final images and gallery assets for the client.</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-black/[0.08] bg-[rgba(247,241,232,0.62)] p-5">
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Total</p>
                      <p className="mt-3 text-3xl font-semibold">{deliverables.length}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Open the full page to upload or view the gallery.</p>
                    </div>
                  </div>
                </section>
              </div>
            ) : null}
            {activeTab === "details" ? (
              <form action={updateProjectDetailsAction} className="grid gap-4 lg:grid-cols-2">
                <input name="projectId" type="hidden" value={project.id} />
                <input name="clientName" type="hidden" value={project.client} />
                <div className="rounded-[1.75rem] border border-black/[0.08] bg-white/84 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]">
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Client details</p>
                  <div className="mt-5 grid gap-3">
                    <label className="grid gap-2 text-sm font-medium">
                      Contact email
                      <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={client?.contactEmail || ""} name="contactEmail" required type="email" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Project name
                      <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={project.name} name="projectName" required />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Project type
                      <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={project.type} name="projectType" required />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Package
                      <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={client?.packageName || ""} name="packageName" required />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Project date
                      <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={project.projectDate} name="projectDate" required type="date" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Location
                      <input className="rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={project.location} name="location" required />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Description
                      <textarea className="min-h-36 rounded-2xl border border-black/[0.08] px-4 py-3" defaultValue={project.description} name="description" required />
                    </label>
                  </div>
                  <button className="mt-5 rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                    Save client details
                  </button>
                </div>

                <div className="rounded-[1.75rem] border border-black/[0.08] bg-white/84 p-6 shadow-[0_18px_40px_rgba(59,36,17,0.08)]">
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">Schedule</p>
                  <div className="mt-5 grid gap-3">
                    {scheduleItems.length === 0 ? (
                      <p className="text-sm text-[var(--muted)]">No events scheduled yet.</p>
                    ) : (
                      scheduleItems.map((item) => (
                        <article key={item.id} className="rounded-2xl bg-[rgba(247,241,232,0.54)] p-4">
                          <p className="font-semibold">{item.title}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {dateTime.format(new Date(item.startsAt))} | {item.sync}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </form>
            ) : null}
          </div>

          <aside className="grid min-w-0 max-w-full content-start gap-4">
            <div className="max-w-full overflow-hidden rounded-[1.35rem] border border-black/[0.08] bg-white/88 p-4 shadow-[0_14px_34px_rgba(59,36,17,0.07)]">
              <div className="flex min-w-0 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Client portal</p>
                  <h2 className="mt-2 text-lg font-semibold leading-6 text-[var(--ink)]">Private client page</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Share files, invoices, messages, and video purchases.</p>
                </div>
                <Link
                  className="shrink-0 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--forest)] transition hover:bg-[rgba(47,125,92,0.06)]"
                  href={projectPortalPath}
                  target="_blank"
                >
                  Open
                </Link>
              </div>
              <div className="mt-4 rounded-[1rem] border border-black/[0.06] bg-[rgba(247,241,232,0.62)] px-3 py-2 text-sm leading-6 text-[var(--muted)]">
                <p className="truncate">{portalLink}</p>
              </div>
            </div>

            <details className="max-w-full overflow-hidden rounded-[1.35rem] border border-black/[0.08] bg-white/88 shadow-[0_14px_34px_rgba(59,36,17,0.07)]">
              <summary className="flex min-w-0 cursor-pointer list-none items-center justify-between gap-4 px-4 py-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">About this project</p>
                  <h2 className="mt-2 text-lg font-semibold leading-6 text-[var(--ink)]">{project.name}</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    {project.phase} {project.projectDate ? `| ${shortDate.format(new Date(project.projectDate))}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-black/[0.08] bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                  v
                </span>
              </summary>

              <form action={updateProjectMetaAction} className="border-t border-black/[0.08] px-4 pb-4 pt-4">
                <input name="projectId" type="hidden" value={project.id} />
                <input name="clientName" type="hidden" value={project.client} />
                <div className="grid gap-3">
                  <label className="grid gap-1.5 text-sm font-semibold text-[var(--ink)]">
                    Project name
                    <input
                      className="rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm font-medium"
                      defaultValue={project.name}
                      name="projectName"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold text-[var(--ink)]">
                    Description
                    <textarea
                      className="min-h-24 rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm leading-6"
                      defaultValue={project.description}
                      name="description"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold text-[var(--ink)]">
                    Stage
                    <select className="rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm font-medium" defaultValue={project.phase} name="phase">
                      {stageOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold text-[var(--ink)]">
                    Lead source
                    <input className="rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm font-medium" defaultValue={project.leadSource} name="leadSource" />
                  </label>
                  <div className="rounded-[1rem] bg-[rgba(247,241,232,0.62)] p-3 text-sm leading-6 text-[var(--muted)]">
                    <p>Location: {project.location || "TBD"}</p>
                    <p className="mt-1">
                      Date: {project.projectDate ? shortDate.format(new Date(project.projectDate)) : "TBD"}
                    </p>
                    <p className="mt-1">Package: {client?.packageName || "Not set"}</p>
                  </div>
                </div>
                <button className="mt-4 rounded-full bg-[var(--forest)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
                  Save details
                </button>
              </form>
            </details>

            <div className="max-w-full overflow-hidden rounded-[1.35rem] border border-black/[0.08] bg-white/88 p-4 shadow-[0_14px_34px_rgba(59,36,17,0.07)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Schedule</p>
              <h2 className="mt-2 text-lg font-semibold leading-6 text-[var(--ink)]">Upcoming timeline</h2>
              <div className="mt-4 grid gap-3">
                {scheduleItems.length === 0 ? (
                  <p className="rounded-[1rem] bg-[rgba(247,241,232,0.62)] px-3 py-3 text-sm leading-6 text-[var(--muted)]">No events scheduled yet.</p>
                ) : (
                  scheduleItems.slice(0, 2).map((item) => (
                    <article key={item.id} className="rounded-[1rem] bg-[rgba(247,241,232,0.62)] p-3">
                      <p className="text-sm font-semibold leading-5 text-[var(--ink)]">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {dateTime.format(new Date(item.startsAt))} | {item.sync}
                      </p>
                    </article>
                  ))
                )}
                {scheduleItems.length > 2 ? (
                  <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    + {scheduleItems.length - 2} more
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </DashboardShell>
  );
}

