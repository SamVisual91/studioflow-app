import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { canManageProjectFiles } from "@/lib/roles";
import { getContractDocumentSummary, parseContractDocument } from "@/lib/contracts";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageProjectFiles(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, fileId } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const title = String(body.title || "").trim();
  const status = String(body.status || "").trim();
  const visibility = String(body.visibility || "").trim();
  const fileType = String(body.fileType || "").trim().toUpperCase();
  const rawBody = String(body.body || "");

  if (!id || !fileId || !title || !status || !visibility || !rawBody) {
    return NextResponse.json({ error: "Invalid file payload" }, { status: 400 });
  }

  const db = getDb();
  const existingFile = db
    .prepare("SELECT linked_path FROM project_files WHERE id = ? AND project_id = ? LIMIT 1")
    .get(fileId, id) as { linked_path?: string | null } | undefined;

  if (!existingFile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const timestamp = new Date().toISOString();
  const summary =
    fileType === "CONTRACT"
      ? getContractDocumentSummary(parseContractDocument(rawBody))
      : String(body.summary || "").trim();

  db.prepare(
    "UPDATE project_files SET title = ?, summary = ?, status = ?, visibility = ?, body = ?, updated_at = ? WHERE id = ? AND project_id = ?"
  ).run(title, summary, status, visibility, rawBody, timestamp, fileId, id);

  revalidatePath(`/projects/${id}`);
  revalidatePath(`/projects/${id}/files/${fileId}`);
  if (existingFile.linked_path) {
    revalidatePath(String(existingFile.linked_path));
  }

  return NextResponse.json({ ok: true });
}
