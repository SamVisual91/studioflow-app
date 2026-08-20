import { getDb } from "@/lib/db";
import { upsertInboundProjectReply as upsertInboundProjectActivityReply } from "@/lib/project-activity";

export function upsertInboundProjectReply(input: {
  bodyText?: string;
  externalMessageId: string;
  fromAddress: string;
  fromName?: string;
  html?: string;
  inReplyToMessageId?: string;
  internetMessageId?: string;
  previewText?: string;
  projectId: string;
  references?: string[];
  subject?: string;
  threadId?: string;
  timestamp?: string;
  toAddresses?: string[];
}) {
  return upsertInboundProjectActivityReply(getDb(), {
    bodyHtml: input.html,
    bodyText: input.bodyText || input.previewText || "",
    externalMessageId: input.externalMessageId,
    fromAddress: input.fromAddress,
    fromName: input.fromName,
    inReplyToMessageId: input.inReplyToMessageId,
    internetMessageId: input.internetMessageId,
    projectId: input.projectId,
    references: input.references,
    subject: input.subject,
    threadId: input.threadId,
    timestamp: input.timestamp,
    toAddresses: input.toAddresses,
  });
}
