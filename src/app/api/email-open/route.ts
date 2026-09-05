import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { createProjectActivityEvent } from "@/lib/project-activity";

export const dynamic = "force-dynamic";

const transparentPixel = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64"
);

function pixelResponse() {
  return new Response(transparentPixel, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Content-Type": "image/gif",
      Pragma: "no-cache",
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const messageId = String(url.searchParams.get("message") || "").trim();
  const token = String(url.searchParams.get("token") || "").trim();

  if (!messageId || !token) {
    return pixelResponse();
  }

  const db = getDb();
  const message = db
    .prepare(
      `SELECT id, project_id, opened_at
       FROM email_messages
       WHERE id = ?
         AND direction = 'OUTBOUND'
         AND open_tracking_token = ?
       LIMIT 1`
    )
    .get(messageId, token) as { id?: string; opened_at?: string | null; project_id?: string } | undefined;

  if (!message?.id || !message.project_id || message.opened_at) {
    return pixelResponse();
  }

  const openedAt = new Date().toISOString();
  db.prepare("UPDATE email_messages SET opened_at = ?, status = 'OPENED', updated_at = ? WHERE id = ?").run(
    openedAt,
    openedAt,
    message.id
  );
  createProjectActivityEvent(db, {
    actorName: "Client",
    actorType: "CLIENT",
    description: "Opened an email from StudioFlow.",
    eventType: "EMAIL_OPENED",
    occurredAt: openedAt,
    projectId: message.project_id,
    title: "Email opened",
  });

  revalidatePath(`/projects/${message.project_id}`);
  revalidatePath("/messages");

  return pixelResponse();
}
