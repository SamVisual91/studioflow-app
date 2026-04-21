import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import {
  fetchMicrosoftGraphMessage,
  getMicrosoftGraphMailboxUserId,
  getMicrosoftGraphWebhookClientState,
} from "@/lib/microsoft-graph-mail";
import { upsertInboundProjectReply } from "@/lib/project-inbox";

type GraphNotification = {
  changeType?: string;
  clientState?: string;
  resource?: string;
  resourceData?: {
    id?: string;
  };
};

function findProjectIdByReplyAddress(fromAddress: string) {
  const db = getDb();
  const normalized = String(fromAddress || "").trim().toLowerCase();

  if (!normalized) {
    return "";
  }

  const primaryClientMatch = db
    .prepare(
      `SELECT p.id
       FROM projects p
       INNER JOIN clients c ON c.name = p.client
       WHERE lower(trim(c.contact_email)) = ?
       ORDER BY p.updated_at DESC
       LIMIT 1`
    )
    .get(normalized) as { id?: string } | undefined;

  if (primaryClientMatch?.id) {
    return primaryClientMatch.id;
  }

  const projectContactMatch = db
    .prepare(
      `SELECT p.id
       FROM project_contacts pc
       INNER JOIN projects p ON p.id = pc.project_id
       WHERE lower(trim(pc.email)) = ?
       ORDER BY p.updated_at DESC
       LIMIT 1`
    )
    .get(normalized) as { id?: string } | undefined;

  return String(projectContactMatch?.id || "");
}

async function processNotification(notification: GraphNotification) {
  const expectedClientState = getMicrosoftGraphWebhookClientState();
  const mailboxUserId = getMicrosoftGraphMailboxUserId().toLowerCase();

  if (
    !notification?.resourceData?.id ||
    notification.changeType !== "created" ||
    !notification.clientState ||
    notification.clientState !== expectedClientState
  ) {
    return;
  }

  const message = await fetchMicrosoftGraphMessage(notification.resourceData.id);

  if (!message.externalMessageId || !message.fromAddress || message.fromAddress === mailboxUserId) {
    return;
  }

  const projectId = findProjectIdByReplyAddress(message.fromAddress);

  if (!projectId) {
    return;
  }

  upsertInboundProjectReply({
    externalMessageId: message.externalMessageId,
    fromAddress: message.fromAddress,
    fromName: message.fromName,
    html: message.html,
    previewText: message.previewText,
    projectId,
    subject: message.subject,
    timestamp: message.timestamp,
  });
}

export async function GET(request: NextRequest) {
  const validationToken = request.nextUrl.searchParams.get("validationToken");

  if (validationToken) {
    return new NextResponse(validationToken, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const validationToken = request.nextUrl.searchParams.get("validationToken");

  if (validationToken) {
    return new NextResponse(validationToken, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  const payload = (await request.json().catch(() => ({}))) as { value?: GraphNotification[] };

  if (!Array.isArray(payload.value) || payload.value.length === 0) {
    return NextResponse.json({ ok: true });
  }

  await Promise.allSettled(payload.value.map((notification) => processNotification(notification)));

  return NextResponse.json({ ok: true });
}
