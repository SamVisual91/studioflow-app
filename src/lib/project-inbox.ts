import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function createRecentActivity(timestamp: string) {
  return `Client emailed you on ${new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function upsertInboundProjectReply(input: {
  externalMessageId: string;
  fromAddress: string;
  fromName?: string;
  html?: string;
  previewText?: string;
  projectId: string;
  subject?: string;
  timestamp?: string;
}) {
  const db = getDb();
  const project = db
    .prepare("SELECT id, client FROM projects WHERE id = ? LIMIT 1")
    .get(input.projectId) as { id?: string; client?: string | null } | undefined;

  if (!project?.id || !project.client) {
    return { created: false, reason: "PROJECT_NOT_FOUND" };
  }

  const existing = db
    .prepare("SELECT 1 FROM messages WHERE external_message_id = ? LIMIT 1")
    .get(input.externalMessageId) as { 1?: number } | undefined;

  if (existing) {
    return { created: false, reason: "DUPLICATE" };
  }

  const timestamp = input.timestamp || new Date().toISOString();
  const preview = String(input.previewText || "").trim() || stripHtml(String(input.html || "")).slice(0, 5000);
  const subject = String(input.subject || "").trim() || "Email reply";
  const sender = String(input.fromName || input.fromAddress || "").trim() || String(project.client);

  db.prepare(
    "INSERT INTO messages (id, sender, client_name, project_id, external_message_id, direction, channel, time, subject, preview, unread, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    randomUUID(),
    sender,
    String(project.client),
    project.id,
    input.externalMessageId,
    "INBOUND",
    "Email",
    timestamp,
    subject,
    preview,
    1,
    timestamp,
    timestamp
  );

  db.prepare("UPDATE projects SET recent_activity = ?, updated_at = ? WHERE id = ?").run(
    createRecentActivity(timestamp),
    timestamp,
    project.id
  );

  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/overview");
  revalidatePath("/messages");

  return { created: true, reason: "" };
}

