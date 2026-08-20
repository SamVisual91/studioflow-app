import { NextResponse, type NextRequest } from "next/server";
import {
  fetchMicrosoftGraphMessage,
  getMicrosoftGraphMailboxUserId,
  getMicrosoftGraphWebhookClientState,
} from "@/lib/microsoft-graph-mail";
import { upsertInboundProjectReply } from "@/lib/project-inbox";
import {
  extractProjectIdFromReplyAddress,
  extractThreadIdFromReplyAddress,
  stripProjectReplyToken,
} from "@/lib/reply-routing";

type GraphNotification = {
  changeType?: string;
  clientState?: string;
  resource?: string;
  resourceData?: {
    id?: string;
  };
};

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

  const routingAddresses = [...message.replyToAddresses, ...message.toAddresses, ...message.ccAddresses];
  const projectId = extractProjectIdFromReplyAddress(routingAddresses);
  const threadId = extractThreadIdFromReplyAddress(routingAddresses);

  if (!projectId) {
    return;
  }

  upsertInboundProjectReply({
    bodyText: message.previewText,
    externalMessageId: message.externalMessageId,
    fromAddress: message.fromAddress,
    fromName: message.fromName,
    html: message.html,
    internetMessageId: message.externalMessageId,
    projectId,
    subject: stripProjectReplyToken(message.subject),
    threadId,
    timestamp: message.timestamp,
    toAddresses: message.toAddresses,
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
