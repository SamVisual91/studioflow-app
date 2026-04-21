const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";
const GRAPH_SCOPE = "https://graph.microsoft.com/.default";
const GRAPH_TOKEN_URL = (tenantId: string) =>
  `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

function getEnv(name: string) {
  return process.env[name]?.trim() || "";
}

export function hasMicrosoftGraphReplySyncConfig() {
  return Boolean(
    getEnv("MICROSOFT_GRAPH_TENANT_ID") &&
      getEnv("MICROSOFT_GRAPH_CLIENT_ID") &&
      getEnv("MICROSOFT_GRAPH_CLIENT_SECRET") &&
      getEnv("MICROSOFT_GRAPH_MAILBOX_USER_ID") &&
      getEnv("MICROSOFT_GRAPH_WEBHOOK_CLIENT_STATE")
  );
}

export function getMicrosoftGraphWebhookClientState() {
  return getEnv("MICROSOFT_GRAPH_WEBHOOK_CLIENT_STATE");
}

export function getMicrosoftGraphMailboxUserId() {
  return getEnv("MICROSOFT_GRAPH_MAILBOX_USER_ID");
}

async function getMicrosoftGraphAccessToken() {
  const tenantId = getEnv("MICROSOFT_GRAPH_TENANT_ID");
  const clientId = getEnv("MICROSOFT_GRAPH_CLIENT_ID");
  const clientSecret = getEnv("MICROSOFT_GRAPH_CLIENT_SECRET");

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Microsoft Graph is not configured.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: GRAPH_SCOPE,
  });

  const response = await fetch(GRAPH_TOKEN_URL(tenantId), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Microsoft token request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as { access_token?: string };

  if (!payload.access_token) {
    throw new Error("Microsoft token response did not include an access token.");
  }

  return payload.access_token;
}

type GraphMessage = {
  id?: string;
  internetMessageId?: string;
  subject?: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  from?: {
    emailAddress?: {
      address?: string;
      name?: string;
    };
  };
  body?: {
    contentType?: string;
    content?: string;
  };
};

export async function fetchMicrosoftGraphMessage(messageId: string) {
  const mailboxUserId = getMicrosoftGraphMailboxUserId();

  if (!mailboxUserId || !messageId) {
    throw new Error("Microsoft mailbox user or message id is missing.");
  }

  const accessToken = await getMicrosoftGraphAccessToken();
  const searchParams = new URLSearchParams({
    $select: "id,internetMessageId,subject,bodyPreview,receivedDateTime,from,body",
  });

  const response = await fetch(
    `${GRAPH_BASE_URL}/users/${encodeURIComponent(mailboxUserId)}/messages/${encodeURIComponent(messageId)}?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Microsoft message lookup failed with ${response.status}.`);
  }

  const message = (await response.json()) as GraphMessage;

  return {
    externalMessageId: String(message.internetMessageId || message.id || "").trim(),
    fromAddress: String(message.from?.emailAddress?.address || "").trim().toLowerCase(),
    fromName: String(message.from?.emailAddress?.name || "").trim(),
    html:
      String(message.body?.contentType || "").toLowerCase() === "html"
        ? String(message.body?.content || "")
        : "",
    previewText: String(message.bodyPreview || "").trim(),
    subject: String(message.subject || "").trim(),
    timestamp: String(message.receivedDateTime || "").trim() || new Date().toISOString(),
  };
}
