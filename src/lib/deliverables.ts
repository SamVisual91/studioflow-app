import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { createLedgerTransaction } from "@/lib/ledger";

export type ProjectDeliverable = {
  id: string;
  project_id: string;
  media_type: "VIDEO" | "PHOTO";
  title: string;
  caption: string | null;
  file_path: string;
  source_type: "UPLOAD" | "SYNOLOGY" | null;
  thumbnail_path: string | null;
  album_cover_image: string | null;
  album_title: string | null;
  album_section: string | null;
  album_download_url: string | null;
  access_type: "FREE" | "PAID" | null;
  price: number | null;
  public_token: string | null;
  stripe_checkout_session_id: string | null;
  purchased_at: string | null;
  buyer_email: string | null;
  created_at: string;
  updated_at: string;
};

export function ensureProjectDeliverablesTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_deliverables (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      media_type TEXT NOT NULL,
      title TEXT NOT NULL,
      caption TEXT,
      file_path TEXT NOT NULL,
      source_type TEXT,
      thumbnail_path TEXT,
      album_cover_image TEXT,
      album_title TEXT,
      album_section TEXT,
      album_download_url TEXT,
      access_type TEXT,
      price REAL,
      public_token TEXT,
      stripe_checkout_session_id TEXT,
      purchased_at TEXT,
      buyer_email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  try {
    db.exec("ALTER TABLE project_deliverables ADD COLUMN source_type TEXT;");
  } catch {
    // Column already exists.
  }

  try {
    db.exec("ALTER TABLE project_deliverables ADD COLUMN thumbnail_path TEXT;");
  } catch {
    // Column already exists.
  }

  for (const column of [
    "album_title",
    "album_section",
    "album_download_url",
    "album_cover_image",
    "access_type",
    "price",
    "public_token",
    "stripe_checkout_session_id",
    "purchased_at",
    "buyer_email",
  ]) {
    try {
      db.exec(
        `ALTER TABLE project_deliverables ADD COLUMN ${column} ${
          column === "price" ? "REAL" : "TEXT"
        };`
      );
    } catch {
      // Column already exists.
    }
  }

  for (const column of [
    "deliverables_gallery_title",
    "deliverables_gallery_intro",
    "deliverables_gallery_cover",
    "client_portal_title",
    "client_portal_intro",
    "client_portal_cover",
  ]) {
    try {
      db.exec(`ALTER TABLE projects ADD COLUMN ${column} TEXT;`);
    } catch {
      // Column already exists.
    }
  }
}

export function markPhotoDeliverablePaid(input: {
  projectId: string;
  photoToken: string;
  sessionId?: string;
  buyerEmail?: string;
  paidAt?: string;
}) {
  ensureProjectDeliverablesTable();
  const db = getDb();
  const deliverable = db
    .prepare(
      "SELECT * FROM project_deliverables WHERE project_id = ? AND public_token = ? AND media_type = 'PHOTO' LIMIT 1"
    )
    .get(input.projectId, input.photoToken) as ProjectDeliverable | undefined;

  if (!deliverable) {
    return null;
  }

  const project = db
    .prepare("SELECT id, client FROM projects WHERE id = ? LIMIT 1")
    .get(deliverable.project_id) as { id: string; client: string } | undefined;
  const timestamp = input.paidAt || new Date().toISOString();
  const sessionId = input.sessionId || deliverable.stripe_checkout_session_id || "";
  const buyerEmail = input.buyerEmail || deliverable.buyer_email || "";
  const alreadyPaid = Boolean(String(deliverable.purchased_at || "").trim());

  if (alreadyPaid) {
    const nextSessionId = String(deliverable.stripe_checkout_session_id || "").trim() || sessionId;
    const nextBuyerEmail = String(deliverable.buyer_email || "").trim() || buyerEmail;

    if (
      nextSessionId !== String(deliverable.stripe_checkout_session_id || "") ||
      nextBuyerEmail !== String(deliverable.buyer_email || "")
    ) {
      db.prepare(
        "UPDATE project_deliverables SET stripe_checkout_session_id = ?, buyer_email = ?, updated_at = ? WHERE id = ?"
      ).run(nextSessionId, nextBuyerEmail, timestamp, deliverable.id);
    }

    return {
      ...deliverable,
      stripe_checkout_session_id: nextSessionId || null,
      buyer_email: nextBuyerEmail || null,
    };
  }

  db.prepare(
    "UPDATE project_deliverables SET purchased_at = ?, buyer_email = ?, stripe_checkout_session_id = ?, updated_at = ? WHERE id = ?"
  ).run(timestamp, buyerEmail, sessionId, timestamp, deliverable.id);

  if (project?.id) {
    db.prepare("UPDATE projects SET recent_activity = ?, updated_at = ? WHERE id = ?").run(
      `Photo purchase received on ${new Date(timestamp).toLocaleString("en-US", {
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
      "Photo purchase",
      timestamp,
      deliverable.title,
      `Client purchased ${deliverable.title} for $${Number(deliverable.price || 0).toFixed(2)}.`,
      1,
      timestamp,
      timestamp
    );
  }

  createLedgerTransaction({
    transactionDate: timestamp,
    direction: "INCOME",
    category: "OTHER_INCOME",
    amount: Number(deliverable.price || 0),
    description: `Photo deliverable purchase: ${deliverable.title}`,
    paymentMethod: "Stripe",
    counterparty: buyerEmail || project?.client || "",
    projectId: deliverable.project_id,
    sourceType: "PHOTO_DELIVERABLE_PAYMENT",
    sourceId: sessionId || deliverable.id,
    taxCategory: "Gross receipts",
  });

  return {
    ...deliverable,
    purchased_at: timestamp,
    buyer_email: buyerEmail || null,
    stripe_checkout_session_id: sessionId || null,
  };
}
