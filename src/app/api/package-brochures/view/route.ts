import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { createProjectActivityEvent } from "@/lib/project-activity";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = String(url.searchParams.get("token") || "").trim();

  if (!token) {
    return new Response(null, { status: 204 });
  }

  const db = getDb();
  const brochure = db
    .prepare("SELECT id, project_id, opened_at FROM package_brochures WHERE public_token = ? LIMIT 1")
    .get(token) as { id?: string; opened_at?: string | null; project_id?: string } | undefined;

  if (!brochure?.id || !brochure.project_id) {
    return new Response(null, { status: 204 });
  }

  const viewedAt = new Date().toISOString();
  db.prepare(
    `UPDATE package_brochures
     SET opened_at = COALESCE(opened_at, ?),
         view_count = COALESCE(view_count, 0) + 1,
         updated_at = ?
     WHERE id = ?`
  ).run(viewedAt, viewedAt, brochure.id);

  if (!brochure.opened_at) {
    createProjectActivityEvent(db, {
      actorName: "Client",
      actorType: "CLIENT",
      description: "Opened the shared package brochure.",
      eventType: "PACKAGE_BROCHURE_OPENED",
      occurredAt: viewedAt,
      projectId: brochure.project_id,
      title: "Package brochure opened",
    });
  }

  revalidatePath(`/projects/${brochure.project_id}`);
  revalidatePath(`/projects/${brochure.project_id}/package-brochure`);

  return new Response(null, { status: 204 });
}
