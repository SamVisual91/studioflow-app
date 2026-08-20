import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

type LegacyPackageLineItem = {
  amount?: number | string;
  description?: string;
  title?: string;
};

type LegacyPackagePresetRow = {
  amount: number;
  category?: string | null;
  cover_image?: string | null;
  cover_position?: string | null;
  description?: string | null;
  email_body?: string | null;
  email_subject?: string | null;
  id: string;
  line_items?: string | null;
  name: string;
  proposal_title?: string | null;
  sections?: string | null;
  subtitle?: string | null;
};

type ProjectPackageItemRow = {
  description?: string | null;
  id: string;
  included?: number | null;
  optional?: number | null;
  project_package_id: string;
  quantity?: number | null;
  sort_order?: number | null;
  title: string;
  unit_amount?: number | null;
};

type ProjectPackageRow = {
  amount: number;
  archived_at?: string | null;
  category?: string | null;
  cover_image?: string | null;
  cover_position?: string | null;
  created_at?: string | null;
  description?: string | null;
  email_body?: string | null;
  email_subject?: string | null;
  id: string;
  name: string;
  project_id: string;
  proposal_title?: string | null;
  sections?: string | null;
  selected_at?: string | null;
  selected_by?: string | null;
  source_template_id?: string | null;
  status?: string | null;
  subtitle?: string | null;
  updated_at?: string | null;
};

export type ProjectPackageItem = {
  amount: number;
  description: string;
  id: string;
  included: boolean;
  optional: boolean;
  projectPackageId: string;
  quantity: number;
  sortOrder: number;
  title: string;
  unitAmount: number;
};

export type ProjectPackage = {
  amount: number;
  archivedAt: string;
  category: string;
  coverImage: string;
  coverPosition: string;
  createdAt: string;
  description: string;
  emailBody: string;
  emailSubject: string;
  id: string;
  items: ProjectPackageItem[];
  lineItems: Array<{
    amount: number;
    description: string;
    id: string;
    quantity: number;
    title: string;
    unitAmount: number;
  }>;
  name: string;
  projectId: string;
  proposalTitle: string;
  sections: string[];
  selectedAt: string;
  selectedBy: string;
  sourceTemplateId: string;
  status: string;
  subtitle: string;
  updatedAt: string;
};

export type ProjectPackageDraft = {
  amount: number;
  coverImage?: string;
  coverPosition?: string;
  description: string;
  emailBody?: string;
  emailSubject?: string;
  id: string;
  lineItems: Array<{
    amount: number;
    description: string;
    id?: string;
    quantity?: number;
    title: string;
    unitAmount?: number;
  }>;
  name: string;
  projectId?: string;
  proposalTitle?: string;
  sections: string[];
  sourceTemplateId?: string;
  status?: string;
  subtitle?: string;
};

function parseSections(input: string | null | undefined) {
  if (!input) {
    return [];
  }

  try {
    const parsed = JSON.parse(input) as string[];
    return parsed.map((item) => String(item || "").trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function parseLegacyLineItems(input: string | null | undefined) {
  if (!input) {
    return [];
  }

  try {
    const parsed = JSON.parse(input) as LegacyPackageLineItem[];
    return parsed
      .map((item, index) => ({
        amount: Number(item?.amount || 0),
        description: String(item?.description || "").trim(),
        included: true,
        optional: false,
        quantity: 1,
        sortOrder: index,
        title: String(item?.title || "").trim(),
        unitAmount: Number(item?.amount || 0),
      }))
      .filter((item) => item.title && !Number.isNaN(item.amount));
  } catch {
    return [];
  }
}

function hydrateProjectPackages(
  db: DatabaseSync,
  rows: ProjectPackageRow[],
  preferredOrder?: string[]
) {
  if (rows.length === 0) {
    return [] as ProjectPackage[];
  }

  const items = db
    .prepare(
      `SELECT
        id,
        project_package_id,
        title,
        description,
        quantity,
        unit_amount,
        sort_order,
        optional,
        included
      FROM project_package_items
      WHERE project_package_id IN (${rows.map(() => "?").join(", ")})
      ORDER BY sort_order ASC, created_at ASC`
    )
    .all(...rows.map((row) => row.id)) as ProjectPackageItemRow[];

  const itemMap = items.reduce(
    (map, item) => {
      const current = map.get(item.project_package_id) || [];
      current.push({
        amount: Number(item.unit_amount || 0) * Math.max(1, Number(item.quantity || 1)),
        description: String(item.description || ""),
        id: item.id,
        included: Number(item.included ?? 1) === 1,
        optional: Number(item.optional ?? 0) === 1,
        projectPackageId: item.project_package_id,
        quantity: Math.max(1, Number(item.quantity || 1)),
        sortOrder: Number(item.sort_order || 0),
        title: String(item.title || ""),
        unitAmount: Number(item.unit_amount || 0),
      });
      map.set(item.project_package_id, current);
      return map;
    },
    new Map<string, ProjectPackageItem[]>()
  );

  const hydrated = rows.map((row) => {
    const packageItems = itemMap.get(row.id) || [];
    return {
      amount: Number(row.amount || 0),
      archivedAt: String(row.archived_at || ""),
      category: String(row.category || "Others") || "Others",
      coverImage: String(row.cover_image || ""),
      coverPosition: String(row.cover_position || "50% 50%"),
      createdAt: String(row.created_at || ""),
      description: String(row.description || ""),
      emailBody: String(row.email_body || ""),
      emailSubject: String(row.email_subject || ""),
      id: row.id,
      items: packageItems,
      lineItems: packageItems.map((item) => ({
        amount: item.amount,
        description: item.description,
        id: item.id,
        quantity: item.quantity,
        title: item.title,
        unitAmount: item.unitAmount,
      })),
      name: String(row.name || ""),
      projectId: String(row.project_id || ""),
      proposalTitle: String(row.proposal_title || ""),
      sections: parseSections(row.sections),
      selectedAt: String(row.selected_at || ""),
      selectedBy: String(row.selected_by || ""),
      sourceTemplateId: String(row.source_template_id || ""),
      status: String(row.status || "DRAFT") || "DRAFT",
      subtitle: String(row.subtitle || ""),
      updatedAt: String(row.updated_at || ""),
    } satisfies ProjectPackage;
  });

  if (!preferredOrder || preferredOrder.length === 0) {
    return hydrated;
  }

  const byId = new Map(hydrated.map((item) => [item.id, item]));
  return preferredOrder.map((id) => byId.get(id)).filter((item): item is ProjectPackage => Boolean(item));
}

export function normalizePackageCategoryValue(category: string) {
  const value = String(category || "").trim().toLowerCase();

  if (value === "wedding" || value === "weddings") {
    return "Wedding";
  }

  if (value === "business" || value === "businesses" || value === "brand" || value === "commercial") {
    return "Business";
  }

  return "Others";
}

export function getPackageCategoryAliases(category: string) {
  const normalized = normalizePackageCategoryValue(category);

  if (normalized === "Wedding") {
    return ["Wedding", "Weddings"] as const;
  }

  if (normalized === "Business") {
    return ["Business", "Businesses"] as const;
  }

  return ["Others", "Other"] as const;
}

export function parseProjectPackageDraftsInput(input: string) {
  if (!input) {
    return [] as ProjectPackageDraft[];
  }

  try {
    const parsed = JSON.parse(input) as ProjectPackageDraft[];
    return parsed
      .map((item) => ({
        amount: Number(item?.amount || 0),
        coverImage: String(item?.coverImage || "").trim(),
        coverPosition: String(item?.coverPosition || "50% 50%").trim() || "50% 50%",
        description: String(item?.description || "").trim(),
        emailBody: String(item?.emailBody || "").trim(),
        emailSubject: String(item?.emailSubject || "").trim(),
        id: String(item?.id || "").trim(),
        lineItems: Array.isArray(item?.lineItems)
          ? item.lineItems
              .map((lineItem) => ({
                amount: Number(lineItem?.amount || 0),
                description: String(lineItem?.description || "").trim(),
                id: String(lineItem?.id || "").trim(),
                quantity: Math.max(1, Number(lineItem?.quantity || 1)),
                title: String(lineItem?.title || "").trim(),
                unitAmount: Number(lineItem?.unitAmount || lineItem?.amount || 0),
              }))
              .filter((lineItem) => lineItem.title && !Number.isNaN(lineItem.amount))
          : [],
        name: String(item?.name || "").trim(),
        projectId: String(item?.projectId || "").trim(),
        proposalTitle: String(item?.proposalTitle || "").trim(),
        sections: Array.isArray(item?.sections)
          ? item.sections.map((section) => String(section || "").trim()).filter(Boolean)
          : [],
        sourceTemplateId: String(item?.sourceTemplateId || "").trim(),
        status: String(item?.status || "").trim(),
        subtitle: String(item?.subtitle || "").trim(),
      }))
      .filter((item) => item.id && item.name && !Number.isNaN(item.amount));
  } catch {
    return [] as ProjectPackageDraft[];
  }
}

export function getProjectPackagesForProject(db: DatabaseSync, projectId: string, category?: string) {
  const rows = (
    category
      ? db
          .prepare(
            `SELECT *
             FROM project_packages
             WHERE project_id = ?
               AND category = ?
               AND archived_at IS NULL
             ORDER BY created_at ASC, amount ASC`
          )
          .all(projectId, normalizePackageCategoryValue(category))
      : db
          .prepare(
            `SELECT *
             FROM project_packages
             WHERE project_id = ?
               AND archived_at IS NULL
             ORDER BY created_at ASC, amount ASC`
          )
          .all(projectId)
  ) as ProjectPackageRow[];

  return hydrateProjectPackages(db, rows);
}

export function getProjectPackagesByIds(db: DatabaseSync, projectId: string, packageIds: string[]) {
  const normalizedIds = Array.from(new Set(packageIds.map((id) => String(id || "").trim()).filter(Boolean)));
  if (normalizedIds.length === 0) {
    return [] as ProjectPackage[];
  }

  const rows = db
    .prepare(
      `SELECT *
       FROM project_packages
       WHERE project_id = ?
         AND id IN (${normalizedIds.map(() => "?").join(", ")})
         AND archived_at IS NULL`
    )
    .all(projectId, ...normalizedIds) as ProjectPackageRow[];

  return hydrateProjectPackages(db, rows, normalizedIds);
}

export function getLatestProjectPackageForProject(db: DatabaseSync, projectId: string) {
  const row = db
    .prepare(
      `SELECT *
       FROM project_packages
       WHERE project_id = ?
         AND archived_at IS NULL
       ORDER BY
         CASE
           WHEN upper(coalesce(status, '')) IN ('ACCEPTED', 'SELECTED') THEN 0
           WHEN upper(coalesce(status, '')) = 'PRESENTED' THEN 1
           ELSE 2
         END,
         updated_at DESC,
         created_at DESC
       LIMIT 1`
    )
    .get(projectId) as ProjectPackageRow | undefined;

  if (!row) {
    return null;
  }

  return hydrateProjectPackages(db, [row])[0] || null;
}

export function createProjectPackagesFromTemplateIds(
  db: DatabaseSync,
  input: {
    category?: string;
    projectId: string;
    templateIds: string[];
  }
) {
  const normalizedTemplateIds = Array.from(
    new Set(input.templateIds.map((id) => String(id || "").trim()).filter(Boolean))
  );

  if (normalizedTemplateIds.length === 0) {
    return [] as ProjectPackage[];
  }

  const selectPreset = db.prepare(
    `SELECT
      id,
      category,
      name,
      subtitle,
      description,
      proposal_title,
      amount,
      sections,
      line_items,
      cover_image,
      cover_position,
      email_subject,
      email_body
     FROM package_presets
     WHERE id = ?
     LIMIT 1`
  );
  const insertPackage = db.prepare(
    `INSERT INTO project_packages (
      id,
      project_id,
      source_template_id,
      category,
      name,
      subtitle,
      description,
      proposal_title,
      amount,
      sections,
      cover_image,
      cover_position,
      email_subject,
      email_body,
      status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    `INSERT INTO project_package_items (
      id,
      project_package_id,
      project_id,
      source_template_item_id,
      title,
      description,
      quantity,
      unit_amount,
      sort_order,
      optional,
      included,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const createdIds: string[] = [];
  db.exec("BEGIN");
  try {
    normalizedTemplateIds.forEach((templateId) => {
      const preset = selectPreset.get(templateId) as LegacyPackagePresetRow | undefined;
      if (!preset?.id) {
        return;
      }

      const timestamp = new Date().toISOString();
      const projectPackageId = randomUUID();
      const normalizedCategory = normalizePackageCategoryValue(input.category || String(preset.category || ""));
      const sections = parseSections(preset.sections);
      const lineItems = parseLegacyLineItems(preset.line_items);

      insertPackage.run(
        projectPackageId,
        input.projectId,
        preset.id,
        normalizedCategory,
        preset.name,
        String(preset.subtitle || ""),
        String(preset.description || ""),
        String(preset.proposal_title || preset.name),
        Number(preset.amount || 0),
        JSON.stringify(sections),
        String(preset.cover_image || ""),
        String(preset.cover_position || "50% 50%"),
        String(preset.email_subject || ""),
        String(preset.email_body || ""),
        "DRAFT",
        timestamp,
        timestamp
      );

      lineItems.forEach((item, index) => {
        insertItem.run(
          randomUUID(),
          projectPackageId,
          input.projectId,
          `${preset.id}:line-item:${index}`,
          item.title,
          item.description,
          item.quantity,
          item.unitAmount,
          item.sortOrder,
          item.optional ? 1 : 0,
          item.included ? 1 : 0,
          timestamp,
          timestamp
        );
      });

      createdIds.push(projectPackageId);
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return getProjectPackagesByIds(db, input.projectId, createdIds);
}

export function saveProjectPackageDrafts(
  db: DatabaseSync,
  input: {
    drafts: ProjectPackageDraft[];
    projectId: string;
  }
) {
  const normalizedDrafts = input.drafts
    .map((draft) => ({
      ...draft,
      coverImage: String(draft.coverImage || "").trim(),
      coverPosition: String(draft.coverPosition || "50% 50%").trim() || "50% 50%",
      emailBody: String(draft.emailBody || "").trim(),
      emailSubject: String(draft.emailSubject || "").trim(),
      proposalTitle: String(draft.proposalTitle || draft.name).trim() || draft.name,
      sections: draft.sections.map((section) => String(section || "").trim()).filter(Boolean),
      status: String(draft.status || "DRAFT").trim() || "DRAFT",
      subtitle: String(draft.subtitle || "").trim(),
    }))
    .filter((draft) => draft.id && draft.name);

  if (normalizedDrafts.length === 0) {
    return [] as ProjectPackage[];
  }

  const updatePackage = db.prepare(
    `UPDATE project_packages
     SET name = ?,
         subtitle = ?,
         description = ?,
         proposal_title = ?,
         amount = ?,
         sections = ?,
         cover_image = ?,
         cover_position = ?,
         email_subject = ?,
         email_body = ?,
         status = ?,
         updated_at = ?
     WHERE id = ?
       AND project_id = ?`
  );
  const deleteItems = db.prepare("DELETE FROM project_package_items WHERE project_package_id = ? AND project_id = ?");
  const insertItem = db.prepare(
    `INSERT INTO project_package_items (
      id,
      project_package_id,
      project_id,
      source_template_item_id,
      title,
      description,
      quantity,
      unit_amount,
      sort_order,
      optional,
      included,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const updatedIds: string[] = [];
  db.exec("BEGIN");
  try {
    normalizedDrafts.forEach((draft) => {
      const timestamp = new Date().toISOString();
      updatePackage.run(
        draft.name,
        draft.subtitle,
        draft.description,
        draft.proposalTitle,
        Number(draft.amount || 0),
        JSON.stringify(draft.sections),
        draft.coverImage,
        draft.coverPosition,
        draft.emailSubject,
        draft.emailBody,
        draft.status,
        timestamp,
        draft.id,
        input.projectId
      );
      deleteItems.run(draft.id, input.projectId);
      draft.lineItems.forEach((item, index) => {
        const quantity = Math.max(1, Number(item.quantity || 1));
        const unitAmount = Number(item.unitAmount || item.amount || 0);
        insertItem.run(
          item.id || randomUUID(),
          draft.id,
          input.projectId,
          draft.sourceTemplateId ? `${draft.sourceTemplateId}:line-item:${index}` : "",
          item.title,
          item.description,
          quantity,
          unitAmount,
          index,
          0,
          1,
          timestamp,
          timestamp
        );
      });
      updatedIds.push(draft.id);
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return getProjectPackagesByIds(db, input.projectId, updatedIds);
}
