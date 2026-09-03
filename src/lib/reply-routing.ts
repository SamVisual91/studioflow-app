function getRequiredEnv(name: string) {
  return process.env[name]?.trim() || "";
}

const PROJECT_REPLY_TOKEN_PATTERN = /\[sf:([a-z0-9-]+)\]/i;
const PROJECT_REPLY_ALIAS_PATTERNS = [
  /^project-([a-z0-9-]+)(?:-thread-([a-z0-9-]+))?@/i,
  /^[^@]+\+sf-([a-z0-9-]+)(?:-thread-([a-z0-9-]+))?@/i,
];

export function hasProjectReplyRoutingConfig() {
  return Boolean(getRequiredEnv("CLIENT_REPLY_TO") || getRequiredEnv("REPLY_INBOX_DOMAIN"));
}

export function getProjectReplyAddress(projectId: string, threadId = "") {
  const directReplyAddress = (getRequiredEnv("CLIENT_REPLY_TO") || getRequiredEnv("SMTP_USER")).toLowerCase();

  // Gmail replies are threaded by the standard email headers, so clients can reply to one clear inbox address.
  if (directReplyAddress) {
    return directReplyAddress;
  }

  const domain = getRequiredEnv("REPLY_INBOX_DOMAIN");

  if (!projectId || !domain) {
    return undefined;
  }

  const threadSegment = threadId ? `-thread-${threadId}` : "";
  return `project-${projectId}${threadSegment}@${domain}`;
}

export function getInboundWebhookToken() {
  return getRequiredEnv("RESEND_INBOUND_WEBHOOK_TOKEN");
}

export function withProjectReplyToken(subject: string, projectId: string) {
  const normalizedSubject = String(subject || "").trim();

  if (!normalizedSubject || !projectId || PROJECT_REPLY_TOKEN_PATTERN.test(normalizedSubject)) {
    return normalizedSubject;
  }

  return normalizedSubject;
}

export function stripProjectReplyToken(subject: string) {
  return String(subject || "")
    .replace(/\s*\[sf:[a-z0-9-]+\]\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractProjectIdFromSubject(subject: string) {
  const match = String(subject || "").trim().match(PROJECT_REPLY_TOKEN_PATTERN);
  return String(match?.[1] || "").trim();
}

export function extractProjectIdFromReplyAddress(addresses: string[]) {
  for (const address of addresses) {
    const normalized = String(address || "").trim().toLowerCase();

    for (const pattern of PROJECT_REPLY_ALIAS_PATTERNS) {
      const match = normalized.match(pattern);

      if (match?.[1]) {
        return match[1];
      }
    }
  }

  return "";
}

export function extractThreadIdFromReplyAddress(addresses: string[]) {
  for (const address of addresses) {
    const normalized = String(address || "").trim().toLowerCase();

    for (const pattern of PROJECT_REPLY_ALIAS_PATTERNS) {
      const match = normalized.match(pattern);

      if (match?.[2]) {
        return match[2];
      }
    }
  }

  return "";
}

export function normalizeEmailAddresses(values: unknown): string[] {
  if (!values) {
    return [];
  }

  if (typeof values === "string") {
    return values
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const addressMatch = part.match(/<([^>]+)>/);
        return (addressMatch?.[1] || part).trim().toLowerCase();
      });
  }

  if (Array.isArray(values)) {
    return values.flatMap((value) => normalizeEmailAddresses(value));
  }

  if (typeof values === "object") {
    const candidate = values as { email?: unknown; address?: unknown };
    return normalizeEmailAddresses(candidate.email || candidate.address || "");
  }

  return [];
}
