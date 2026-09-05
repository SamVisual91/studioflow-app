import { notFound } from "next/navigation";
import {
  getDefaultPackageBrochureContent,
} from "@/components/package-brochure-preview";
import { PackageBrochureSelection } from "@/components/package-brochure-selection";
import { PackageBrochureViewTracker } from "@/components/package-brochure-view-tracker";
import { getDb } from "@/lib/db";
import { getProjectPackagesByIds, getProjectPackagesForProject } from "@/lib/project-packages";

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

export default async function PackageBrochurePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ selected?: string; error?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const db = getDb();
  const brochure = db
    .prepare(
      `SELECT
        package_brochures.*,
        projects.name AS project_name,
        projects.client AS client_name
      FROM package_brochures
      JOIN projects ON projects.id = package_brochures.project_id
      WHERE package_brochures.public_token = ?
      LIMIT 1`
    )
    .get(token) as
    | {
        category: string;
        project_id: string;
        selected_package_ids?: string | null;
        package_overrides?: string | null;
        title?: string | null;
        intro?: string | null;
        closing_note?: string | null;
        cover_image?: string | null;
        project_name: string;
        client_name: string;
      }
    | undefined;

  if (!brochure) {
    notFound();
  }

  const selectedPackageIds = (() => {
    try {
      const parsed = JSON.parse(String(brochure.selected_package_ids || "[]")) as string[];
      return parsed.filter(Boolean);
    } catch {
      return [];
    }
  })();
  const projectPackages =
    selectedPackageIds.length > 0
      ? getProjectPackagesByIds(db, brochure.project_id, selectedPackageIds)
      : getProjectPackagesForProject(db, brochure.project_id, brochure.category);
  const previewPackages =
    projectPackages.length > 0
      ? projectPackages
      : db
          .prepare(
            `SELECT id, name, description, amount, sections, line_items, cover_image, cover_position
             FROM package_presets
             WHERE id IN (${(selectedPackageIds.length > 0 ? selectedPackageIds : [""]).map(() => "?").join(", ")})`
          )
          .all(...(selectedPackageIds.length > 0 ? selectedPackageIds : [""]))
          .map((preset) => {
            const row = preset as {
              id: string;
              name: string;
              description: string;
              amount: number;
              sections: string;
              line_items: string;
              cover_image?: string | null;
              cover_position?: string | null;
            };

            return {
              coverImage: String(row.cover_image || ""),
              coverPosition: String(row.cover_position || "50% 50%"),
              id: row.id,
              name: row.name,
              description: row.description,
              amount: Number(row.amount || 0),
              sections: parseSections(row.sections),
              lineItems: parseLineItems(row.line_items),
              sourceTemplateId: row.id,
              status: "DRAFT",
            };
          });
  const templateHeroImage = previewPackages.find((preset) => preset.coverImage)?.coverImage || "";
  const templateHeroPosition = previewPackages.find((preset) => preset.coverPosition)?.coverPosition || "50% 50%";

  if (previewPackages.length === 0) {
    notFound();
  }

  const defaults = getDefaultPackageBrochureContent({
    category: brochure.category,
    projectName: brochure.project_name,
    clientName: brochure.client_name,
  });
  const client = db
    .prepare("SELECT contact_email FROM clients WHERE name = ? LIMIT 1")
    .get(brochure.client_name) as { contact_email?: string | null } | undefined;
  const successMessage =
    query.selected === "1" ? "Your package selection has been sent to Sam Visual." : "";
  const errorMessage =
    query.error === "package-selection-invalid"
      ? "Please choose a package and make sure your name and email are filled in."
      : query.error === "package-selection-send-failed"
        ? "That selection could not be sent right now. Please try again in a moment."
        : "";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f3ed_0%,#f3ece3_42%,#ffffff_100%)] px-6 py-10 text-[var(--ink)] sm:px-8 lg:px-10">
      <section className="mx-auto max-w-6xl">
        <PackageBrochureViewTracker token={token} />
        {successMessage ? (
          <div className="mb-6 border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-6 border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <PackageBrochureSelection
          brochureToken={token}
          category={brochure.category}
          clientName={brochure.client_name}
          closingNote={String(brochure.closing_note || defaults.closingNote)}
          coverImage={String(templateHeroImage || brochure.cover_image || defaults.coverImage)}
          coverPosition={String(templateHeroPosition || "50% 50%")}
          initialEmail={String(client?.contact_email || "")}
          intro={String(brochure.intro || defaults.intro)}
          packages={previewPackages}
          projectName={brochure.project_name}
          title={String(brochure.title || defaults.title)}
        />
      </section>
    </main>
  );
}
