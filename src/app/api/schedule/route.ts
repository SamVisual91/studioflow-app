import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { canAccessBackOffice } from "@/lib/roles";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const includeInternalFields = canAccessBackOffice(user.role);
  const scheduleItems = db.prepare("SELECT * FROM schedule_items ORDER BY starts_at ASC").all() as Array<Record<string, unknown>>;

  return NextResponse.json(
    scheduleItems.map((item) => ({
      id: String(item.id ?? ""),
      projectId: String(item.project_id ?? ""),
      title: String(item.title ?? ""),
      client: String(item.client ?? ""),
      startsAt: String(item.starts_at ?? ""),
      type: String(item.type ?? ""),
      meetingUrl: String(item.meeting_url ?? ""),
      ...(includeInternalFields
        ? {
            sync: String(item.sync ?? ""),
            recipientEmail: String(item.recipient_email ?? ""),
          }
        : {}),
    }))
  );
}
