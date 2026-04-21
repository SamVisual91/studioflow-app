import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { canAccessBackOffice } from "@/lib/roles";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const includeInternalFields = canAccessBackOffice(user.role);
  const projects = db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all() as Array<Record<string, unknown>>;

  return NextResponse.json(
    projects.map((project) => ({
      id: String(project.id ?? ""),
      name: String(project.name ?? ""),
      client: String(project.client ?? ""),
      progress: Number(project.progress ?? 0),
      phase: String(project.phase ?? ""),
      archivedAt: project.archived_at ? String(project.archived_at) : "",
      type: String(project.project_type ?? ""),
      projectDate: String(project.project_date ?? ""),
      location: String(project.location ?? ""),
      description: String(project.description ?? ""),
      projectCover: String(project.project_cover ?? ""),
      projectCoverPosition: String(project.project_cover_position ?? "50% 50%"),
      recentActivity: String(project.recent_activity ?? ""),
      nextMilestone: String(project.next_milestone ?? ""),
      ...(includeInternalFields
        ? {
            publicPortalToken: String(project.public_portal_token ?? ""),
            fileNotes: String(project.file_notes ?? ""),
            leadSource: String(project.lead_source ?? ""),
            stageMovedAt: String(project.stage_moved_at ?? ""),
          }
        : {}),
    }))
  );
}
