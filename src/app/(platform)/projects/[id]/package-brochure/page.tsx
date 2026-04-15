import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDefaultPackageBrochureContent,
} from "@/components/package-brochure-preview";
import { PackageBrochureBuilder } from "@/components/package-brochure-builder";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getDb } from "@/lib/db";

function parseSections(input: string) {
  try {
    return JSON.parse(input) as string[];
  } catch {
    return [];
  }
}

function parseLineItems(input: string) {
  try {
    return JSON.parse(input) as Array<{ title?: string; description?: string; amount?: number }>;
  } catch {
    return [];
  }
}

export default async function ProjectPackageBrochureBuilderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    category?: string;
    saved?: string;
    brochureSent?: string;
    error?: string;
  }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const rawCategory = String(query.category || "").trim().toLowerCase();
  const category =
    rawCategory === "wedding" || rawCategory === "weddings"
      ? "Wedding"
      : rawCategory === "business" || rawCategory === "businesses"
        ? "Business"
        : rawCategory === "others" || rawCategory === "other"
          ? "Others"
          : ""

  if (!category) {
    notFound();
  }

  const { user, data } = await getDashboardPageData();
  const project = data.projects.find((item) => item.id === id);

  if (!project) {
    notFound();
  }

  const db = getDb();
  const brochure = db
    .prepare(
      "SELECT * FROM package_brochures WHERE project_id = ? AND category = ? LIMIT 1"
    )
    .get(id, category) as
    | {
        public_token?: string | null;
        selected_package_ids?: string | null;
        package_overrides?: string | null;
        title?: string | null;
        intro?: string | null;
        closing_note?: string | null;
        cover_image?: string | null;
      }
    | undefined;
  const clientRecord = db
    .prepare("SELECT contact_email FROM clients WHERE name = ? LIMIT 1")
    .get(project.client) as { contact_email?: string | null } | undefined;
  const projectContact = db
    .prepare("SELECT email FROM project_contacts WHERE project_id = ? ORDER BY created_at ASC LIMIT 1")
    .get(id) as { email?: string | null } | undefined;
  const recipientEmail = String(clientRecord?.contact_email || projectContact?.email || "").trim();

  const packageCategoryAliases =
    category === "Wedding"
      ? ["Wedding", "Weddings"]
      : category === "Business"
        ? ["Business", "Businesses"]
        : ["Others", "Other"];
  const packages = db
    .prepare(
      "SELECT id, name, description, amount, sections, line_items FROM package_presets WHERE category IN (?, ?) ORDER BY amount ASC, created_at ASC"
    )
    .all(packageCategoryAliases[0], packageCategoryAliases[1])
    .map((preset) => {
      const row = preset as {
        id: string;
        name: string;
        description: string;
        amount: number;
        sections: string;
        line_items: string;
      };

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        amount: Number(row.amount || 0),
        sections: parseSections(row.sections),
        lineItems: parseLineItems(row.line_items),
      };
    });
  const selectedPackageIds = (() => {
    try {
      const parsed = JSON.parse(String(brochure?.selected_package_ids || "[]")) as string[];
      return parsed.filter(Boolean);
    } catch {
      return [];
    }
  })();
  const packageOverrides = (() => {
    try {
      return JSON.parse(String(brochure?.package_overrides || "{}")) as Record<
        string,
        { name: string; description: string; amount: number }
      >;
    } catch {
      return {};
    }
  })();

  const defaults = getDefaultPackageBrochureContent({
    category,
    projectName: project.name,
    clientName: project.client,
  });
  const returnPath = `/projects/${project.id}/package-brochure?category=${encodeURIComponent(category)}`;
  const publicBrochurePath = brochure?.public_token ? `/package-brochure/${brochure.public_token}` : "";
  const successMessage = query.saved
    ? "Brochure changes saved."
    : query.brochureSent
      ? "Brochure emailed successfully."
      : "";
  const errorMessage =
    query.error === "package-brochure-send-failed"
      ? "The brochure email could not be sent right now."
      : query.error === "package-brochure-email-missing"
        ? "Add a client email before sending the brochure."
        : query.error === "package-brochure-invalid"
          ? "The brochure details were incomplete. Refresh and try again."
        : query.error === "package-brochure-selection-missing"
          ? "Choose at least one package for the brochure."
        : query.error === "package-brochure-empty"
          ? "There are no packages in this category yet."
          : query.error === "smtp-missing"
            ? "SMTP is not configured yet, so the brochure email could not be sent."
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
      <section className="grid gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Package brochure builder</p>
            <h1 className="mt-2 text-3xl font-semibold">{project.client} {category} brochure</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Customize the brochure copy and cover, preview exactly what the client will see, and send it when it feels right.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
              href={`/projects/${project.id}`}
            >
              Back to project
            </Link>
            {publicBrochurePath ? (
              <Link
                className="border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                href={publicBrochurePath}
                target="_blank"
              >
                Open live brochure
              </Link>
            ) : null}
          </div>
        </div>

        {successMessage ? (
          <div className="border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <PackageBrochureBuilder
          category={category}
          clientName={project.client}
          initialClosingNote={String(brochure?.closing_note || defaults.closingNote)}
          initialCoverImage={String(brochure?.cover_image || defaults.coverImage)}
          initialIntro={String(brochure?.intro || defaults.intro)}
          initialPackageOverrides={packageOverrides}
          initialRecipientEmail={recipientEmail}
          initiallySelectedPackageIds={
            selectedPackageIds.length > 0 ? selectedPackageIds : packages.map((item) => item.id)
          }
          initialTitle={String(brochure?.title || defaults.title)}
          packages={packages}
          projectId={project.id}
          projectName={project.name}
          returnPath={returnPath}
        />
      </section>
    </DashboardShell>
  );
}
