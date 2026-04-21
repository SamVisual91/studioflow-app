import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { createLedgerTransaction } from "@/lib/ledger";

export type VideoPaywallRow = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  price: number;
  cover_image: string | null;
  synology_download_url: string;
  public_token: string;
  status: string;
  stripe_checkout_session_id: string | null;
  purchased_at: string | null;
  buyer_email: string | null;
  created_at: string;
  updated_at: string;
};

export function ensureVideoPaywallsTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS video_paywalls (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      cover_image TEXT,
      synology_download_url TEXT NOT NULL,
      public_token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      stripe_checkout_session_id TEXT,
      purchased_at TEXT,
      buyer_email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export function getVideoPaywallByToken(token: string) {
  ensureVideoPaywallsTable();
  const db = getDb();
  return db
    .prepare("SELECT * FROM video_paywalls WHERE public_token = ? LIMIT 1")
    .get(token) as VideoPaywallRow | undefined;
}

export function markVideoPaywallPaid(input: {
  paywallId: string;
  sessionId?: string;
  buyerEmail?: string;
  paidAt?: string;
}) {
  ensureVideoPaywallsTable();
  const db = getDb();
  const paywall = db
    .prepare("SELECT * FROM video_paywalls WHERE id = ? LIMIT 1")
    .get(input.paywallId) as VideoPaywallRow | undefined;

  if (!paywall) {
    return null;
  }

  const project = db
    .prepare("SELECT id, client FROM projects WHERE id = ? LIMIT 1")
    .get(paywall.project_id) as { id: string; client: string } | undefined;
  const timestamp = input.paidAt || new Date().toISOString();
  const sessionId = input.sessionId || paywall.stripe_checkout_session_id || "";
  const buyerEmail = input.buyerEmail || paywall.buyer_email || "";
  const alreadyPaid = String(paywall.status || "").toUpperCase() === "PAID";

  if (alreadyPaid) {
    const nextSessionId = String(paywall.stripe_checkout_session_id || "").trim() || sessionId;
    const nextBuyerEmail = String(paywall.buyer_email || "").trim() || buyerEmail;

    if (
      nextSessionId !== String(paywall.stripe_checkout_session_id || "") ||
      nextBuyerEmail !== String(paywall.buyer_email || "")
    ) {
      db.prepare(
        "UPDATE video_paywalls SET stripe_checkout_session_id = ?, buyer_email = ?, updated_at = ? WHERE id = ?"
      ).run(nextSessionId, nextBuyerEmail, timestamp, paywall.id);
    }

    return {
      ...paywall,
      stripe_checkout_session_id: nextSessionId || null,
      buyer_email: nextBuyerEmail || null,
    };
  }

  db.prepare(
    "UPDATE video_paywalls SET status = ?, stripe_checkout_session_id = ?, purchased_at = ?, buyer_email = ?, updated_at = ? WHERE id = ?"
  ).run("PAID", sessionId, timestamp, buyerEmail, timestamp, paywall.id);

  if (project?.id) {
    db.prepare("UPDATE projects SET recent_activity = ?, updated_at = ? WHERE id = ?").run(
      `Video purchase received on ${new Date(timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`,
      timestamp,
      project.id
    );
    db.prepare(
      "INSERT INTO messages (id, sender, client_name, project_id, direction, channel, time, subject, preview, unread, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      randomUUID(),
      buyerEmail || project.client,
      project.client,
      project.id,
      "INBOUND",
      "Video paywall",
      timestamp,
      paywall.title,
      `Client purchased ${paywall.title} for $${Number(paywall.price || 0).toFixed(2)}.`,
      1,
      timestamp,
      timestamp
    );
  }

  createLedgerTransaction({
    transactionDate: timestamp,
    direction: "INCOME",
    category: "OTHER_INCOME",
    amount: Number(paywall.price || 0),
    description: `Video paywall purchase: ${paywall.title}`,
    paymentMethod: "Stripe",
    counterparty: buyerEmail || project?.client || "",
    projectId: paywall.project_id,
    sourceType: "VIDEO_PAYWALL_PAYMENT",
    sourceId: sessionId || paywall.id,
    taxCategory: "Gross receipts",
  });

  return { ...paywall, status: "PAID", purchased_at: timestamp, buyer_email: buyerEmail };
}

export function createVideoPaywallToken() {
  return randomUUID();
}
