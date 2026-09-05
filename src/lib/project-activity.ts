import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { revalidatePath } from "next/cache";
import { stripProjectReplyToken } from "@/lib/reply-routing";

export type EmailRecipient = {
  email: string;
  name?: string;
  type: "TO" | "CC" | "BCC";
};

export type EmailAttachment = {
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  storagePath?: string;
};

type ProjectActivityEvent = {
  actorName: string;
  actorType: "CLIENT" | "SYSTEM" | "USER";
  description: string;
  eventType: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
  projectId: string;
  title: string;
};

type OutboundEmailInput = {
  attachments?: EmailAttachment[];
  bodyHtml?: string;
  bodyText: string;
  messageId?: string;
  openTrackingToken?: string;
  projectId: string;
  providerMessageId?: string;
  recipients: EmailRecipient[];
  senderEmail?: string;
  senderName: string;
  sentAt: string;
  status: string;
  subject: string;
  threadId?: string;
};

type InboundEmailInput = {
  bodyHtml?: string;
  bodyText?: string;
  externalMessageId: string;
  fromAddress: string;
  fromName?: string;
  inReplyToMessageId?: string;
  internetMessageId?: string;
  projectId: string;
  references?: string[];
  subject?: string;
  threadId?: string;
  timestamp?: string;
  toAddresses?: string[];
};

export type ProjectCommunicationMessage = {
  attachments: EmailAttachment[];
  bodyHtml: string;
  bodyText: string;
  createdAt: string;
  direction: string;
  id: string;
  isRead: boolean;
  openedAt: string;
  recipients: EmailRecipient[];
  senderEmail: string;
  senderName: string;
  status: string;
  subject: string;
  threadId: string;
};

export type ProjectCommunicationThread = {
  id: string;
  lastMessageAt: string;
  messages: ProjectCommunicationMessage[];
  normalizedSubject: string;
  status: string;
  subject: string;
  unreadCount: number;
};

export type ProjectTimelineEvent = {
  actorName: string;
  actorType: string;
  description: string;
  eventType: string;
  id: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
  projectId: string;
  title: string;
};

function normalizeSubject(subject: string) {
  return stripProjectReplyToken(String(subject || ""))
    .replace(/^\s*((re|fw|fwd)\s*:\s*)+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

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

function getPreviewText(input: { bodyHtml?: string; bodyText?: string }) {
  return String(input.bodyText || "").trim() || stripHtml(String(input.bodyHtml || ""));
}

function createRecentActivity(label: string, timestamp: string) {
  return `${label} on ${new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function uniqueByEmail(recipients: EmailRecipient[]) {
  const seen = new Set<string>();
  return recipients.filter((recipient) => {
    const key = `${recipient.type}:${recipient.email.trim().toLowerCase()}`;
    if (!recipient.email || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function parseMetadata(value: unknown) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(String(value)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function createProjectActivityEvent(db: DatabaseSync, input: ProjectActivityEvent) {
  db.prepare(
    `INSERT INTO project_activity_events (
      id,
      project_id,
      event_type,
      title,
      description,
      actor_name,
      actor_type,
      metadata,
      occurred_at,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    input.projectId,
    input.eventType,
    input.title,
    input.description,
    input.actorName,
    input.actorType,
    JSON.stringify(input.metadata || {}),
    input.occurredAt,
    input.occurredAt
  );
}

function upsertLegacyMessage(
  db: DatabaseSync,
  input: {
    direction: "INBOUND" | "OUTBOUND";
    externalMessageId?: string;
    preview: string;
    projectId: string;
    sender: string;
    subject: string;
    time: string;
    unread: number;
  }
) {
  const existing = input.externalMessageId
    ? ((db
        .prepare("SELECT id FROM messages WHERE external_message_id = ? LIMIT 1")
        .get(input.externalMessageId) as { id?: string } | undefined) ?? undefined)
    : undefined;

  if (existing?.id) {
    db.prepare(
      "UPDATE messages SET sender = ?, project_id = ?, direction = ?, channel = ?, time = ?, subject = ?, preview = ?, unread = ?, updated_at = ? WHERE id = ?"
    ).run(
      input.sender,
      input.projectId,
      input.direction,
      "Email",
      input.time,
      stripProjectReplyToken(input.subject),
      input.preview,
      input.unread,
      input.time,
      existing.id
    );
    return existing.id;
  }

  const id = randomUUID();
  db.prepare(
    "INSERT INTO messages (id, sender, client_name, project_id, external_message_id, direction, channel, time, subject, preview, unread, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    id,
    input.sender,
    "",
    input.projectId,
    input.externalMessageId || "",
    input.direction,
    "Email",
    input.time,
    stripProjectReplyToken(input.subject),
    input.preview,
    input.unread,
    input.time,
    input.time
  );

  return id;
}

function findThreadByMessageIdentifiers(
  db: DatabaseSync,
  input: {
    inReplyToMessageId?: string;
    projectId: string;
    references?: string[];
  }
) {
  const identifiers = [
    String(input.inReplyToMessageId || "").trim(),
    ...(input.references || []).map((value) => String(value || "").trim()),
  ].filter(Boolean);

  if (identifiers.length === 0) {
    return "";
  }

  const row = db
    .prepare(
      `SELECT thread_id
       FROM email_messages
       WHERE project_id = ?
         AND (
           external_message_id IN (${identifiers.map(() => "?").join(", ")})
           OR internet_message_id IN (${identifiers.map(() => "?").join(", ")})
           OR provider_message_id IN (${identifiers.map(() => "?").join(", ")})
         )
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(input.projectId, ...identifiers, ...identifiers, ...identifiers) as { thread_id?: string } | undefined;

  return String(row?.thread_id || "");
}

export function getOrCreateProjectEmailThread(
  db: DatabaseSync,
  input: {
    createdBy?: string;
    projectId: string;
    reuseExistingBySubject?: boolean;
    subject: string;
    threadId?: string;
  }
) {
  const cleanedSubject = stripProjectReplyToken(String(input.subject || "").trim()) || "Project conversation";
  const normalizedSubject = normalizeSubject(cleanedSubject) || cleanedSubject.toLowerCase();
  const timestamp = new Date().toISOString();

  if (input.threadId) {
    const existing = db
      .prepare("SELECT id FROM email_threads WHERE id = ? AND project_id = ? LIMIT 1")
      .get(input.threadId, input.projectId) as { id?: string } | undefined;
    if (existing?.id) {
      db.prepare("UPDATE email_threads SET updated_at = ? WHERE id = ?").run(timestamp, existing.id);
      return existing.id;
    }
  }

  if (input.reuseExistingBySubject) {
    const existingBySubject = db
      .prepare(
        `SELECT id
         FROM email_threads
         WHERE project_id = ?
           AND normalized_subject = ?
           AND status != 'ARCHIVED'
         ORDER BY updated_at DESC
         LIMIT 1`
      )
      .get(input.projectId, normalizedSubject) as { id?: string } | undefined;

    if (existingBySubject?.id) {
      db.prepare("UPDATE email_threads SET updated_at = ? WHERE id = ?").run(timestamp, existingBySubject.id);
      return existingBySubject.id;
    }
  }

  const threadId = randomUUID();
  db.prepare(
    `INSERT INTO email_threads (
      id,
      project_id,
      subject,
      normalized_subject,
      status,
      unread_count,
      last_message_at,
      created_by,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    threadId,
    input.projectId,
    cleanedSubject,
    normalizedSubject,
    "OPEN",
    0,
    "",
    input.createdBy || "",
    timestamp,
    timestamp
  );

  return threadId;
}

function syncThreadState(db: DatabaseSync, threadId: string) {
  const stats = db
    .prepare(
      `SELECT
        MAX(COALESCE(received_at, sent_at, created_at)) AS last_message_at,
        SUM(CASE WHEN direction = 'INBOUND' AND is_read = 0 THEN 1 ELSE 0 END) AS unread_count
       FROM email_messages
       WHERE thread_id = ?`
    )
    .get(threadId) as { last_message_at?: string | null; unread_count?: number | null } | undefined;

  const timestamp = new Date().toISOString();
  db.prepare(
    "UPDATE email_threads SET last_message_at = ?, unread_count = ?, updated_at = ? WHERE id = ?"
  ).run(
    String(stats?.last_message_at || ""),
    Number(stats?.unread_count || 0),
    timestamp,
    threadId
  );
}

export function logOutboundProjectEmail(db: DatabaseSync, input: OutboundEmailInput) {
  const recipients = uniqueByEmail(input.recipients);
  const threadId = getOrCreateProjectEmailThread(db, {
    createdBy: input.senderName,
    projectId: input.projectId,
    reuseExistingBySubject: false,
    subject: input.subject,
    threadId: input.threadId,
  });
  const preview = getPreviewText({ bodyHtml: input.bodyHtml, bodyText: input.bodyText }).slice(0, 5000);
  const legacyMessageId = upsertLegacyMessage(db, {
    direction: "OUTBOUND",
    externalMessageId: input.providerMessageId,
    preview,
    projectId: input.projectId,
    sender: input.senderName,
    subject: input.subject,
    time: input.sentAt,
    unread: 0,
  });

  const emailMessageId = input.messageId || randomUUID();
  db.prepare(
    `INSERT INTO email_messages (
      id,
      project_id,
      thread_id,
      legacy_message_id,
      direction,
      sender_name,
      sender_email,
      subject,
      body_text,
      body_html,
      external_message_id,
      provider_message_id,
      internet_message_id,
      in_reply_to_message_id,
      references_header,
      status,
      is_read,
      open_tracking_token,
      opened_at,
      sent_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    emailMessageId,
    input.projectId,
    threadId,
    legacyMessageId,
    "OUTBOUND",
    input.senderName,
    String(input.senderEmail || ""),
    stripProjectReplyToken(input.subject),
    input.bodyText,
    String(input.bodyHtml || ""),
    input.providerMessageId || "",
    input.providerMessageId || "",
    "",
    "",
    "",
    input.status,
    1,
    input.openTrackingToken || "",
    "",
    input.sentAt,
    input.sentAt,
    input.sentAt
  );

  const insertRecipient = db.prepare(
    "INSERT INTO email_message_recipients (id, message_id, recipient_type, email, name, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  recipients.forEach((recipient) => {
    insertRecipient.run(
      randomUUID(),
      emailMessageId,
      recipient.type,
      recipient.email,
      String(recipient.name || ""),
      input.sentAt
    );
  });

  const insertAttachment = db.prepare(
    "INSERT INTO email_attachments (id, project_id, message_id, file_name, mime_type, file_size, storage_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  (input.attachments || []).forEach((attachment) => {
    insertAttachment.run(
      randomUUID(),
      input.projectId,
      emailMessageId,
      attachment.fileName,
      String(attachment.mimeType || ""),
      Number(attachment.fileSize || 0),
      String(attachment.storagePath || ""),
      input.sentAt
    );
  });

  createProjectActivityEvent(db, {
    actorName: input.senderName,
    actorType: "USER",
    description: `Sent "${stripProjectReplyToken(input.subject)}" to ${recipients
      .filter((recipient) => recipient.type === "TO")
      .map((recipient) => recipient.email)
      .join(", ") || "client"}.`,
    eventType: "EMAIL_SENT",
    metadata: {
      messageId: emailMessageId,
      recipientCount: recipients.length,
      threadId,
    },
    occurredAt: input.sentAt,
    projectId: input.projectId,
    title: "Email sent",
  });

  syncThreadState(db, threadId);

  return { emailMessageId, legacyMessageId, threadId };
}

export function upsertInboundProjectReply(db: DatabaseSync, input: InboundEmailInput) {
  const project = db
    .prepare("SELECT id, client FROM projects WHERE id = ? LIMIT 1")
    .get(input.projectId) as { id?: string; client?: string | null } | undefined;

  if (!project?.id || !project.client) {
    return { created: false, reason: "PROJECT_NOT_FOUND", threadId: "" };
  }

  const duplicate = db
    .prepare("SELECT id, thread_id FROM email_messages WHERE external_message_id = ? LIMIT 1")
    .get(input.externalMessageId) as { id?: string; thread_id?: string | null } | undefined;

  if (duplicate?.id) {
    return { created: false, reason: "DUPLICATE", threadId: String(duplicate.thread_id || "") };
  }

  const timestamp = input.timestamp || new Date().toISOString();
  const threadId =
    (input.threadId
      ? getOrCreateProjectEmailThread(db, {
          projectId: input.projectId,
          reuseExistingBySubject: false,
          subject: input.subject || "Email reply",
          threadId: input.threadId,
        })
      : "") ||
    findThreadByMessageIdentifiers(db, {
      inReplyToMessageId: input.inReplyToMessageId,
      projectId: input.projectId,
      references: input.references,
    }) ||
    getOrCreateProjectEmailThread(db, {
      projectId: input.projectId,
      reuseExistingBySubject: true,
      subject: input.subject || "Email reply",
    });

  const preview = getPreviewText({ bodyHtml: input.bodyHtml, bodyText: input.bodyText }).slice(0, 5000);
  const sender = String(input.fromName || input.fromAddress || "").trim() || String(project.client);
  const legacyMessageId = upsertLegacyMessage(db, {
    direction: "INBOUND",
    externalMessageId: input.externalMessageId,
    preview,
    projectId: input.projectId,
    sender,
    subject: input.subject || "Email reply",
    time: timestamp,
    unread: 1,
  });

  const emailMessageId = randomUUID();
  db.prepare(
    `INSERT INTO email_messages (
      id,
      project_id,
      thread_id,
      legacy_message_id,
      direction,
      sender_name,
      sender_email,
      subject,
      body_text,
      body_html,
      external_message_id,
      provider_message_id,
      internet_message_id,
      in_reply_to_message_id,
      references_header,
      status,
      is_read,
      received_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    emailMessageId,
    input.projectId,
    threadId,
    legacyMessageId,
    "INBOUND",
    sender,
    input.fromAddress,
    stripProjectReplyToken(String(input.subject || "Email reply")),
    String(input.bodyText || preview),
    String(input.bodyHtml || ""),
    input.externalMessageId,
    input.externalMessageId,
    String(input.internetMessageId || ""),
    String(input.inReplyToMessageId || ""),
    JSON.stringify((input.references || []).filter(Boolean)),
    "RECEIVED",
    0,
    timestamp,
    timestamp,
    timestamp
  );

  const insertRecipient = db.prepare(
    "INSERT INTO email_message_recipients (id, message_id, recipient_type, email, name, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  (input.toAddresses || []).forEach((address) => {
    insertRecipient.run(randomUUID(), emailMessageId, "TO", address.trim().toLowerCase(), "", timestamp);
  });

  createProjectActivityEvent(db, {
    actorName: sender,
    actorType: "CLIENT",
    description: preview || "Client replied by email.",
    eventType: "EMAIL_RECEIVED",
    metadata: {
      messageId: emailMessageId,
      threadId,
    },
    occurredAt: timestamp,
    projectId: input.projectId,
    title: "Client replied",
  });
  db.prepare("UPDATE projects SET recent_activity = ?, updated_at = ? WHERE id = ?").run(
    createRecentActivity("Client emailed you", timestamp),
    timestamp,
    input.projectId
  );

  syncThreadState(db, threadId);
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/overview");
  revalidatePath("/messages");

  return { created: true, reason: "", threadId };
}

export function getProjectCommunicationThreads(db: DatabaseSync, projectId: string) {
  const threads = db
    .prepare(
      `SELECT id, subject, normalized_subject, status, unread_count, last_message_at
       FROM email_threads
       WHERE project_id = ?
       ORDER BY COALESCE(last_message_at, updated_at, created_at) DESC`
    )
    .all(projectId) as Array<{
      id: string;
      last_message_at?: string | null;
      normalized_subject: string;
      status: string;
      subject: string;
      unread_count?: number | null;
    }>;

  if (threads.length === 0) {
    return [] as ProjectCommunicationThread[];
  }

  const messages = db
    .prepare(
      `SELECT
        id,
        project_id,
        thread_id,
        direction,
        sender_name,
        sender_email,
        subject,
        body_text,
        body_html,
        status,
        is_read,
        opened_at,
        sent_at,
        received_at,
        created_at
       FROM email_messages
       WHERE project_id = ?
       ORDER BY COALESCE(received_at, sent_at, created_at) DESC`
    )
    .all(projectId) as Array<{
      body_html?: string | null;
      body_text?: string | null;
      created_at: string;
      direction: string;
      id: string;
      is_read?: number | null;
      opened_at?: string | null;
      received_at?: string | null;
      sender_email?: string | null;
      sender_name?: string | null;
      sent_at?: string | null;
      status?: string | null;
      subject: string;
      thread_id: string;
    }>;

  const recipients = db
    .prepare(
      `SELECT
        id,
        message_id,
        recipient_type,
        email,
        name
       FROM email_message_recipients
       WHERE message_id IN (${messages.map(() => "?").join(", ")})`
    )
    .all(...messages.map((message) => message.id)) as Array<{
      email: string;
      message_id: string;
      name?: string | null;
      recipient_type: string;
    }>;

  const recipientMap = recipients.reduce(
    (map, recipient) => {
      const current = map.get(recipient.message_id) || [];
      current.push({
        email: recipient.email,
        name: String(recipient.name || ""),
        type: String(recipient.recipient_type || "TO").toUpperCase() as "TO" | "CC" | "BCC",
      });
      map.set(recipient.message_id, current);
      return map;
    },
    new Map<string, EmailRecipient[]>()
  );
  const attachments = db
    .prepare(
      `SELECT
        message_id,
        file_name,
        mime_type,
        file_size,
        storage_path
       FROM email_attachments
       WHERE message_id IN (${messages.map(() => "?").join(", ")})`
    )
    .all(...messages.map((message) => message.id)) as Array<{
      file_name: string;
      file_size?: number | null;
      message_id: string;
      mime_type?: string | null;
      storage_path?: string | null;
    }>;

  const attachmentMap = attachments.reduce(
    (map, attachment) => {
      const current = map.get(attachment.message_id) || [];
      current.push({
        fileName: attachment.file_name,
        fileSize: Number(attachment.file_size || 0),
        mimeType: String(attachment.mime_type || ""),
        storagePath: String(attachment.storage_path || ""),
      });
      map.set(attachment.message_id, current);
      return map;
    },
    new Map<string, EmailAttachment[]>()
  );

  const messageMap = messages.reduce(
    (map, message) => {
      const current = map.get(message.thread_id) || [];
      current.push({
        attachments: attachmentMap.get(message.id) || [],
        bodyHtml: String(message.body_html || ""),
        bodyText: String(message.body_text || ""),
        createdAt: String(message.received_at || message.sent_at || message.created_at),
        direction: message.direction,
        id: message.id,
        isRead: Number(message.is_read || 0) === 1,
        openedAt: String(message.opened_at || ""),
        recipients: recipientMap.get(message.id) || [],
        senderEmail: String(message.sender_email || ""),
        senderName: String(message.sender_name || ""),
        status: String(message.status || ""),
        subject: String(message.subject || ""),
        threadId: message.thread_id,
      } satisfies ProjectCommunicationMessage);
      map.set(message.thread_id, current);
      return map;
    },
    new Map<string, ProjectCommunicationMessage[]>()
  );

  return threads.map((thread) => ({
    id: thread.id,
    lastMessageAt: String(thread.last_message_at || ""),
    messages: (messageMap.get(thread.id) || []).sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    ),
    normalizedSubject: thread.normalized_subject,
    status: thread.status,
    subject: thread.subject,
    unreadCount: Number(thread.unread_count || 0),
  }));
}

export function getProjectTimelineEvents(db: DatabaseSync, projectId: string) {
  return db
    .prepare(
      `SELECT id, project_id, event_type, title, description, actor_name, actor_type, metadata, occurred_at
       FROM project_activity_events
       WHERE project_id = ?
       ORDER BY occurred_at DESC, created_at DESC`
    )
    .all(projectId)
    .map((row) => {
      const event = row as {
        actor_name?: string | null;
        actor_type?: string | null;
        description?: string | null;
        event_type: string;
        id: string;
        metadata?: string | null;
        occurred_at: string;
        project_id: string;
        title: string;
      };

      return {
        actorName: String(event.actor_name || ""),
        actorType: String(event.actor_type || "SYSTEM"),
        description: String(event.description || ""),
        eventType: event.event_type,
        id: event.id,
        metadata: parseMetadata(event.metadata),
        occurredAt: event.occurred_at,
        projectId: event.project_id,
        title: event.title,
      } satisfies ProjectTimelineEvent;
    });
}

export function markProjectCommunicationMessageRead(db: DatabaseSync, input: { messageId: string; projectId: string }) {
  const timestamp = new Date().toISOString();
  const message = db
    .prepare(
      `SELECT id, thread_id, direction, is_read
       FROM email_messages
       WHERE project_id = ?
         AND (id = ? OR legacy_message_id = ?)
       LIMIT 1`
    )
    .get(input.projectId, input.messageId, input.messageId) as
    | { direction?: string | null; id?: string; is_read?: number | null; thread_id?: string | null }
    | undefined;

  if (
    message?.id &&
    String(message.direction || "").toUpperCase() === "INBOUND" &&
    Number(message.is_read || 0) === 0
  ) {
    db.prepare("UPDATE email_messages SET is_read = 1, updated_at = ? WHERE id = ?").run(timestamp, message.id);
    syncThreadState(db, String(message.thread_id || ""));
  }
}
