import { getDb } from "@/lib/db";

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";
const GRAPH_SCOPE = "https://graph.microsoft.com/.default";
const GRAPH_TOKEN_URL = (tenantId: string) =>
  `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
const SUBSCRIPTION_RESOURCE = (mailboxUserId: string) =>
  `/users/${mailboxUserId}/mailFolders('Inbox')/messages`;
const SUBSCRIPTION_CHECK_INTERVAL_MS = 1000 * 60 * 60;
const SUBSCRIPTION_RENEW_WINDOW_MS = 1000 * 60 * 60 * 24 * 2;

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

function getMicrosoftGraphNotificationUrl() {
  const appUrl = getEnv("NEXT_PUBLIC_APP_URL");

  if (!appUrl) {
    return "";
  }

  return `${appUrl.replace(/\/+$/, "")}/api/microsoft/project-replies`;
}

function ensureIntegrationStateTable() {
  const db = getDb();
  db.prepare(
    `CREATE TABLE IF NOT EXISTS integration_state (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT NOT NULL
    )`
  ).run();

  return db;
}

function getIntegrationState(key: string) {
  const db = ensureIntegrationStateTable();
  const row = db
    .prepare("SELECT value FROM integration_state WHERE key = ? LIMIT 1")
    .get(key) as { value?: string | null } | undefined;

  return String(row?.value || "");
}

function setIntegrationState(key: string, value: string) {
  const db = ensureIntegrationStateTable();
  const timestamp = new Date().toISOString();

  db.prepare(
    `INSERT INTO integration_state (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(key, value, timestamp);
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

type GraphSubscription = {
  id?: string;
  applicationId?: string;
  notificationUrl?: string;
  resource?: string;
  expirationDateTime?: string;
  clientState?: string;
};

async function listMicrosoftGraphSubscriptions() {
  const accessToken = await getMicrosoftGraphAccessToken();
  const response = await fetch(`${GRAPH_BASE_URL}/subscriptions`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Microsoft subscription list failed with ${response.status}.`);
  }

  const payload = (await response.json()) as { value?: GraphSubscription[] };
  return {
    accessToken,
    subscriptions: Array.isArray(payload.value) ? payload.value : [],
  };
}

async function createMicrosoftGraphSubscription(accessToken: string) {
  const mailboxUserId = getMicrosoftGraphMailboxUserId();
  const notificationUrl = getMicrosoftGraphNotificationUrl();
  const clientState = getMicrosoftGraphWebhookClientState();
  const expirationDateTime = new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString();

  const response = await fetch(`${GRAPH_BASE_URL}/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      changeType: "created",
      notificationUrl,
      resource: SUBSCRIPTION_RESOURCE(mailboxUserId),
      expirationDateTime,
      clientState,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Microsoft subscription create failed with ${response.status}.`);
  }

  return (await response.json()) as GraphSubscription;
}

async function renewMicrosoftGraphSubscription(accessToken: string, subscriptionId: string) {
  const expirationDateTime = new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString();
  const response = await fetch(`${GRAPH_BASE_URL}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expirationDateTime,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Microsoft subscription renew failed with ${response.status}.`);
  }

  return expirationDateTime;
}

export async function ensureMicrosoftGraphMessageSubscription() {
  if (!hasMicrosoftGraphReplySyncConfig()) {
    return { status: "disabled" as const };
  }

  const now = Date.now();
  const lastCheckedAt = Number(getIntegrationState("microsoft_graph_subscription_checked_at") || "0");

  if (lastCheckedAt && now - lastCheckedAt < SUBSCRIPTION_CHECK_INTERVAL_MS) {
    return { status: "skipped" as const };
  }

  setIntegrationState("microsoft_graph_subscription_checked_at", String(now));

  const mailboxUserId = getMicrosoftGraphMailboxUserId();
  const notificationUrl = getMicrosoftGraphNotificationUrl();
  const desiredResource = SUBSCRIPTION_RESOURCE(mailboxUserId);
  const { accessToken, subscriptions } = await listMicrosoftGraphSubscriptions();
  const existing = subscriptions.find(
    (subscription) =>
      subscription.notificationUrl === notificationUrl &&
      subscription.resource === desiredResource
  );

  if (!existing?.id) {
    const created = await createMicrosoftGraphSubscription(accessToken);
    setIntegrationState("microsoft_graph_subscription_id", String(created.id || ""));
    setIntegrationState(
      "microsoft_graph_subscription_expires_at",
      String(created.expirationDateTime || "")
    );
    return { status: "created" as const };
  }

  const expiresAt = new Date(String(existing.expirationDateTime || ""));
  if (
    !existing.expirationDateTime ||
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt.getTime() - now <= SUBSCRIPTION_RENEW_WINDOW_MS
  ) {
    const renewedExpiration = await renewMicrosoftGraphSubscription(accessToken, existing.id);
    setIntegrationState("microsoft_graph_subscription_id", existing.id);
    setIntegrationState("microsoft_graph_subscription_expires_at", renewedExpiration);
    return { status: "renewed" as const };
  }

  setIntegrationState("microsoft_graph_subscription_id", existing.id);
  setIntegrationState(
    "microsoft_graph_subscription_expires_at",
    String(existing.expirationDateTime || "")
  );
  return { status: "ok" as const };
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
