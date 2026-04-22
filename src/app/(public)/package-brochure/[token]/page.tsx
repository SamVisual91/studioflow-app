import { notFound } from "next/navigation";
import {
  getDefaultPackageBrochureContent,
} from "@/components/package-brochure-preview";
import { PackageBrochureSelection } from "@/components/package-brochure-selection";
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

  const packageCategoryAliases =
    brochure.category === "Wedding"
      ? ["Wedding", "Weddings"]
      : brochure.category === "Business"
        ? ["Business", "Businesses"]
        : ["Others", "Other"];
  const packages = db
    .prepare(
      "SELECT id, name, description, amount, sections, line_items, cover_image, cover_position, template_set_cover_image, template_set_cover_position FROM package_presets WHERE category IN (?, ?) ORDER BY amount ASC, created_at ASC"
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
        cover_image?: string | null;
        cover_position?: string | null;
        template_set_cover_image?: string | null;
        template_set_cover_position?: string | null;
      };

      return {
        coverImage: String(row.cover_image || ""),
        coverPosition: String(row.cover_position || "50% 50%"),
        templateSetCoverImage: String(row.template_set_cover_image || ""),
        templateSetCoverPosition: String(row.template_set_cover_position || "50% 50%"),
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
      const parsed = JSON.parse(String(brochure.selected_package_ids || "[]")) as string[];
      return parsed.filter(Boolean);
    } catch {
      return [];
    }
  })();
  const packageOverrides = (() => {
    try {
      return JSON.parse(String(brochure.package_overrides || "{}")) as Record<
        string,
        { name?: string; description?: string; amount?: number }
      >;
    } catch {
      return {};
    }
  })();
  const visiblePackages =
    selectedPackageIds.length > 0
      ? packages.filter((preset) => selectedPackageIds.includes(preset.id))
      : packages;
  const previewPackages = visiblePackages.map((preset) => {
    const override = packageOverrides[preset.id];
    return {
      ...preset,
      coverImage: preset.coverImage,
      coverPosition: preset.coverPosition,
      name: override?.name || preset.name,
      description: override?.description || preset.description,
      amount: typeof override?.amount === "number" ? override.amount : preset.amount,
    };
  });
  const templateHeroImage =
    previewPackages.find((preset) => preset.templateSetCoverImage)?.templateSetCoverImage ||
    packages.find((preset) => preset.templateSetCoverImage)?.templateSetCoverImage ||
    "";
  const templateHeroPosition =
    previewPackages.find((preset) => preset.templateSetCoverPosition)?.templateSetCoverPosition ||
    packages.find((preset) => preset.templateSetCoverPosition)?.templateSetCoverPosition ||
    "50% 50%";

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
