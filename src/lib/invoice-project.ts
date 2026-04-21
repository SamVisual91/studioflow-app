import { getDb } from "@/lib/db";

type InvoiceProjectRecord = {
  id: string;
  client: string;
  name?: string | null;
  public_portal_token?: string | null;
};

export function resolveProjectForInvoice(
  invoice: Record<string, unknown>,
  db = getDb()
): InvoiceProjectRecord | undefined {
  const projectId = String(invoice.project_id || "").trim();
  if (projectId) {
    const project = db
      .prepare("SELECT id, client, name, public_portal_token FROM projects WHERE id = ? LIMIT 1")
      .get(projectId) as InvoiceProjectRecord | undefined;

    if (project) {
      return project;
    }
  }

  const clientName = String(invoice.client || "").trim();
  if (!clientName) {
    return undefined;
  }

  const siblingProjectCount = Number(
    (
      (db.prepare("SELECT COUNT(*) AS count FROM projects WHERE client = ?").get(clientName) as
        | { count?: number }
        | undefined) ?? { count: 0 }
    ).count ?? 0
  );

  if (siblingProjectCount !== 1) {
    return undefined;
  }

  return db
    .prepare(
      "SELECT id, client, name, public_portal_token FROM projects WHERE client = ? ORDER BY updated_at DESC LIMIT 1"
    )
    .get(clientName) as InvoiceProjectRecord | undefined;
}
