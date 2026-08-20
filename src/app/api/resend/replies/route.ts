import { NextResponse } from "next/server";
import {
  extractProjectIdFromReplyAddress,
  extractThreadIdFromReplyAddress,
  getInboundWebhookToken,
  normalizeEmailAddresses,
} from "@/lib/reply-routing";
import { upsertInboundProjectReply } from "@/lib/project-inbox";

export const runtime = "nodejs";

function getRequired(name: string) {
  return process.env[name]?.trim() || "";
}

function getHeaderValue(headers: Headers, key: string) {
  return headers.get(key) || headers.get(key.toLowerCase()) || "";
}

function normalizeReferenceHeader(value: unknown) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .match(/<[^>]+>|[^\s,]+/g)
    ?.map((part) => part.trim())
    .filter(Boolean) || [];
}

async function fetchReceivedEmail(emailId: string) {
  if (!emailId || !getRequired("RESEND_API_KEY")) {
    return null;
  }

  const response = await fetch(`https://api.resend.com/emails/${emailId}`, {
    headers: {
      Authorization: `Bearer ${getRequired("RESEND_API_KEY")}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as Record<string, unknown>;
}

export async function POST(request: Request) {
  const expectedToken = getInboundWebhookToken();

  if (expectedToken) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || getHeaderValue(request.headers, "x-studioflow-webhook-token");

    if (token !== expectedToken) {
      return NextResponse.json({ error: "Invalid inbound webhook token." }, { status: 401 });
    }
  }

  const event = (await request.json()) as Record<string, unknown>;
  const type = String(event.type || "");

  if (type && type !== "email.received") {
    return NextResponse.json({ received: true, skipped: "IGNORED_EVENT" });
  }

  const payload = (event.data || event) as Record<string, unknown>;
  const emailId = String(payload.email_id || payload.id || "");
  const receivedEmail = await fetchReceivedEmail(emailId);
  const source = (receivedEmail?.email || receivedEmail || payload) as Record<string, unknown>;

  const toAddresses = normalizeEmailAddresses(source.to || payload.to);
  const ccAddresses = normalizeEmailAddresses(source.cc || payload.cc);
  const routingAddresses = [...toAddresses, ...ccAddresses];
  const projectId = extractProjectIdFromReplyAddress(toAddresses);
  const threadId = extractThreadIdFromReplyAddress(routingAddresses);

  if (!projectId) {
    return NextResponse.json({ received: true, skipped: "NO_PROJECT_REPLY_ADDRESS" });
  }

  const fromAddresses = normalizeEmailAddresses(source.from || payload.from);
  const fromAddress = fromAddresses[0] || "";
  const fromValue = source.from || payload.from;
  const fromName =
    typeof fromValue === "object" && fromValue !== null && "name" in fromValue
      ? String((fromValue as { name?: unknown }).name || "").trim()
      : "";
  const subject = String(source.subject || payload.subject || "").trim();
  const text =
    String(source.text || source.text_body || payload.text || payload.text_body || "").trim();
  const html =
    String(source.html || source.html_body || payload.html || payload.html_body || "").trim();
  const timestamp = String(source.created_at || payload.created_at || new Date().toISOString());
  const inReplyToMessageId = String(
    source.in_reply_to || payload.in_reply_to || source.inReplyTo || payload.inReplyTo || ""
  ).trim();
  const references = normalizeReferenceHeader(
    source.references || payload.references || source.headers || payload.headers
  );
  const externalMessageId =
    String(source.message_id || payload.message_id || source.id || payload.id || emailId || "").trim() ||
    `${projectId}:${timestamp}:${fromAddress}`;

  const result = upsertInboundProjectReply({
    bodyText: text,
    externalMessageId,
    fromAddress,
    fromName,
    html,
    inReplyToMessageId,
    internetMessageId: externalMessageId,
    projectId,
    references,
    subject,
    threadId,
    timestamp,
    toAddresses,
  });

  return NextResponse.json({ received: true, projectId, result });
}
