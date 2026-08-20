import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { getDb } from "@/lib/db";
import { upsertInboundProjectReply } from "@/lib/project-inbox";
import { extractProjectIdFromReplyAddress, extractThreadIdFromReplyAddress } from "@/lib/reply-routing";

function getEnv(name: string) {
  return process.env[name]?.trim() || "";
}

function normalizeParsedAddresses(value: unknown): string[] {
  if (!value) {
    return [] as string[];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeParsedAddresses(item));
  }

  if (typeof value === "object" && value !== null) {
    const candidate = value as
      | { address?: unknown; value?: Array<{ address?: unknown }> }
      | { value?: Array<{ address?: unknown }> };

    if (Array.isArray(candidate.value)) {
      return candidate.value
        .map((entry) => String(entry.address || "").trim().toLowerCase())
        .filter(Boolean);
    }

    const address = "address" in candidate ? candidate.address : "";
    return [String(address || "").trim().toLowerCase()].filter(Boolean);
  }

  return [];
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

      const timestamp = parsed.date?.toISOString() || new Date().toISOString();
      const subject = parsed.subject?.trim() || "Email reply";
      const toAddresses = [
        ...normalizeParsedAddresses(parsed.to),
        ...normalizeParsedAddresses(parsed.cc),
      ].filter(Boolean);
      const routedProjectId = extractProjectIdFromReplyAddress(toAddresses);
      const threadId = extractThreadIdFromReplyAddress(toAddresses);

      if (routedProjectId && routedProjectId !== project.id) {
        skipped += 1;
        continue;
      }

      if (!routedProjectId && !parsed.inReplyTo && (!parsed.references || parsed.references.length === 0)) {
        skipped += 1;
        continue;
      }

      const result = upsertInboundProjectReply({
        bodyText: String(parsed.text || "").trim(),
        externalMessageId,
        fromAddress,
        fromName: String(parsed.from?.value?.[0]?.name || "").trim(),
        html: typeof parsed.html === "string" ? parsed.html : "",
        inReplyToMessageId: String(parsed.inReplyTo || "").trim(),
        internetMessageId: parsed.messageId || externalMessageId,
        projectId: project.id,
        references: Array.isArray(parsed.references) ? parsed.references : [],
        subject,
        threadId,
        timestamp,
        toAddresses,
      });

      if (result.created) {
        imported += 1;
      } else {
        skipped += 1;
      }
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
