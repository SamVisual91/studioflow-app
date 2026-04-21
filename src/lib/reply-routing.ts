function getRequiredEnv(name: string) {
  return process.env[name]?.trim() || "";
}

const PROJECT_REPLY_TOKEN_PATTERN = /\[sf:([a-z0-9-]+)\]/i;

export function hasProjectReplyRoutingConfig() {
  return Boolean(getRequiredEnv("REPLY_INBOX_DOMAIN"));
}

export function getProjectReplyAddress(projectId: string) {
  const directReplyAddress = (getRequiredEnv("CLIENT_REPLY_TO") || "contactme@samthao.com").toLowerCase();

  if (directReplyAddress) {
    return directReplyAddress;
  }

  const domain = getRequiredEnv("REPLY_INBOX_DOMAIN");

  if (!projectId || !domain) {
    return undefined;
  }

  return `project-${projectId}@${domain}`;
}

export function getInboundWebhookToken() {
  return getRequiredEnv("RESEND_INBOUND_WEBHOOK_TOKEN");
}

export function withProjectReplyToken(subject: string, projectId: string) {
  const normalizedSubject = String(subject || "").trim();

  if (!normalizedSubject || !projectId || PROJECT_REPLY_TOKEN_PATTERN.test(normalizedSubject)) {
    return normalizedSubject;
  }

  return `${normalizedSubject} [SF:${projectId}]`;
}

export function extractProjectIdFromSubject(subject: string) {
  const match = String(subject || "").trim().match(PROJECT_REPLY_TOKEN_PATTERN);
  return String(match?.[1] || "").trim();
}

export function extractProjectIdFromReplyAddress(addresses: string[]) {
  for (const address of addresses) {
    const normalized = String(address || "").trim().toLowerCase();
    const match = normalized.match(/^project-([a-z0-9-]+)@/i);

    if (match?.[1]) {
      return match[1];
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
