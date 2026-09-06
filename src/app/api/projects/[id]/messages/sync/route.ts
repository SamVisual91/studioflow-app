import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { syncInboxRepliesForProject } from "@/lib/inbox-sync";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: "Project is required" }, { status: 400 });
  }

  const result = await syncInboxRepliesForProject(projectId);

  return NextResponse.json({
    imported: result.imported,
    skipped: result.skipped,
    synced: !result.error,
  });
}
