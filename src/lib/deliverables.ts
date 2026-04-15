import { getDb } from "@/lib/db";

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
