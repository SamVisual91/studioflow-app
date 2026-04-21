import { randomUUID } from "node:crypto";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { getDb } from "@/lib/db";

function getEnv(name: string) {
  return process.env[name]?.trim() || "";
}

export function hasInboxSyncConfig() {
  return Boolean(
    (getEnv("IMAP_HOST") || "imap.gmail.com") &&
      (getEnv("IMAP_PORT") || "993") &&
      (getEnv("IMAP_USER") || getEnv("SMTP_USER")) &&
      (getEnv("IMAP_PASS") || getEnv("SMTP_PASS"))
  );
}

export async function syncInboxRepliesForProject(projectId: string) {
  if (!hasInboxSyncConfig()) {
    return { imported: 0, skipped: 0, error: "" };
  }

  const db = getDb();
  const project = db
    .prepare(
      `SELECT p.id, p.client, c.contact_email
       FROM projects p
       LEFT JOIN clients c ON c.name = p.client
       WHERE p.id = ?`
    )
    .get(projectId) as
    | { id: string; client: string; contact_email?: string | null }
    | undefined;
  const projectContacts = db
    .prepare("SELECT email FROM project_contacts WHERE project_id = ?")
    .all(projectId) as Array<{ email?: string | null }>;
  const replyEmails = new Set(
    [project?.contact_email, ...projectContacts.map((contact) => contact.email)]
      .map((value) => String(value ?? "").trim().toLowerCase())
      .filter(Boolean)
  );

  if (!project?.id || replyEmails.size === 0) {
    return { imported: 0, skipped: 0, error: "" };
  }

  const client = new ImapFlow({
    host: getEnv("IMAP_HOST") || "imap.gmail.com",
    port: Number(getEnv("IMAP_PORT") || "993"),
    secure: (getEnv("IMAP_SECURE") || "true").toLowerCase() !== "false",
    auth: {
      user: getEnv("IMAP_USER") || getEnv("SMTP_USER"),
      pass: getEnv("IMAP_PASS") || getEnv("SMTP_PASS"),
    },
    tls: {
      rejectUnauthorized:
        (process.env.IMAP_ALLOW_SELF_SIGNED || process.env.SMTP_ALLOW_SELF_SIGNED || "").toLowerCase() ===
        "true"
          ? false
          : true,
    },
  });

  let imported = 0;
  let skipped = 0;

  try {
    await client.connect();
    await client.mailboxOpen("INBOX");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for await (const message of client.fetch(
      { since: startDate },
      { uid: true, envelope: true, source: true }
    )) {
      const fromAddress = message.envelope?.from?.[0]?.address?.toLowerCase() || "";
      if (!replyEmails.has(fromAddress)) {
        continue;
      }

      if (!message.source) {
        skipped += 1;
        continue;
      }

      const parsed = await simpleParser(message.source);
      const externalMessageId =
        parsed.messageId || `${projectId}:${message.uid}:${parsed.date?.toISOString() || ""}`;

      const existing = db
        .prepare("SELECT 1 FROM messages WHERE external_message_id = ? LIMIT 1")
        .get(externalMessageId) as { 1: number } | undefined;

      if (existing) {
        skipped += 1;
        continue;
      }

      const timestamp = parsed.date?.toISOString() || new Date().toISOString();
      const preview = String(parsed.text || parsed.html || "").trim().slice(0, 5000);
      const subject = parsed.subject?.trim() || "Email reply";

      db.prepare(
        "INSERT INTO messages (id, sender, client_name, project_id, external_message_id, direction, channel, time, subject, preview, unread, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(
        randomUUID(),
        project.client,
        project.client,
        project.id,
        externalMessageId,
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
        `Client emailed you on ${new Date(timestamp).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}`,
        timestamp,
        project.id
      );

      imported += 1;
    }
    return { imported, skipped, error: "" };
  } catch (error) {
    return {
      imported,
      skipped,
      error: error instanceof Error ? error.message : "INBOX_SYNC_FAILED",
    };
  } finally {
    await client.logout().catch(() => undefined);
  }
}
