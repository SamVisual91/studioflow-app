import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { hashPassword } from "@/lib/crypto";
import { getStorageRoot } from "@/lib/storage";

type DbSingleton = {
  db?: DatabaseSync;
  initialized?: boolean;
};

const globalForDb = globalThis as unknown as DbSingleton;
const dbPath = join(getStorageRoot(), "studioflow.db");

function nowIso() {
  return new Date().toISOString();
}

function defaultTaxCategory(category: string, direction: string) {
  if (direction === "INCOME") {
    return "Gross receipts";
  }

  const taxCategoryMap: Record<string, string> = {
    EQUIPMENT: "Supplies",
    TRAVEL: "Travel",
    MEALS: "Meals",
    SOFTWARE: "Office expenses",
    MARKETING: "Advertising",
    CONTRACTORS: "Contract labor",
    INSURANCE: "Insurance",
    STUDIO_RENT: "Rent or lease",
    BANK_FEES: "Commissions and fees",
    TAXES_FEES: "Taxes and licenses",
    EDUCATION: "Other expenses",
    OTHER_EXPENSE: "Other expenses",
  };

  return taxCategoryMap[category] || "Other expenses";
}

function normalizeLedgerDate(input: string) {
  if (!input) {
    return nowIso();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return `${input}T12:00:00.000Z`;
  }

  return input;
}

function backfillLedgerInvoiceTransactions(db: DatabaseSync) {
  const invoices = db
    .prepare("SELECT id, client, label, method, status, amount, due_date, payment_schedule FROM invoices")
    .all() as Array<Record<string, unknown>>;

  const insertLedgerTransaction = db.prepare(
    `INSERT INTO ledger_transactions (
      id,
      transaction_date,
      direction,
      category,
      amount,
      description,
      payment_method,
      counterparty,
      project_id,
      invoice_id,
      source_type,
      source_id,
      tax_category,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const existingLedgerTransaction = db.prepare(
    "SELECT id FROM ledger_transactions WHERE source_type = ? AND source_id = ? LIMIT 1"
  );
  const projectLookup = db.prepare("SELECT id FROM projects WHERE client = ? ORDER BY updated_at DESC LIMIT 1");

  for (const invoice of invoices) {
    const paymentSchedule = (() => {
      try {
        return JSON.parse(String(invoice.payment_schedule ?? "[]")) as Array<{
          id: string;
          amount: number;
          dueDate: string;
          status: string;
          invoiceNumber: string;
        }>;
      } catch {
        return [];
      }
    })();

    const insertPayment = (payment: {
      id: string;
      amount: number;
      dueDate: string;
      invoiceNumber: string;
    }) => {
      const sourceType = "INVOICE_BACKFILL";
      const sourceId = `${String(invoice.id)}:${payment.id}`;
      const existing = existingLedgerTransaction.get(sourceType, sourceId) as { id?: string } | undefined;

      if (existing?.id) {
        return;
      }

      const project = projectLookup.get(String(invoice.client)) as { id?: string } | undefined;
      const timestamp = nowIso();
      insertLedgerTransaction.run(
        randomUUID(),
        normalizeLedgerDate(payment.dueDate || String(invoice.due_date || timestamp)),
        "INCOME",
        "CLIENT_PAYMENTS",
        Number(payment.amount || 0),
        `${String(invoice.label || "Invoice")} (${payment.invoiceNumber})`,
        String(invoice.method || ""),
        String(invoice.client || ""),
        project?.id || "",
        String(invoice.id || ""),
        sourceType,
        sourceId,
        defaultTaxCategory("CLIENT_PAYMENTS", "INCOME"),
        timestamp,
        timestamp
      );
    };

    if (paymentSchedule.length > 0) {
      paymentSchedule
        .filter((payment) => payment.status === "PAID")
        .forEach((payment) => insertPayment(payment));
    } else if (String(invoice.status) === "PAID") {
      insertPayment({
        id: "paid-in-full",
        amount: Number(invoice.amount || 0),
        dueDate: String(invoice.due_date || nowIso()),
        invoiceNumber: "Paid in full",
      });
    }
  }
}

function columnExists(db: DatabaseSync, table: string, column: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name?: string }>;
  return columns.some((item) => item.name === column);
}

function ensureColumn(
  db: DatabaseSync,
  table: string,
  column: string,
  definition: string
) {
  if (!columnExists(db, table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function createSchema(db: DatabaseSync) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'SUPER_ADMIN',
      avatar_image TEXT,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      service TEXT NOT NULL,
      stage TEXT NOT NULL,
      value INTEGER NOT NULL,
      event_date TEXT NOT NULL,
      source TEXT NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      project TEXT NOT NULL,
      package_name TEXT NOT NULL,
      contact_email TEXT,
      total_value INTEGER NOT NULL,
      balance INTEGER NOT NULL,
      next_touchpoint TEXT NOT NULL,
      health TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      title TEXT NOT NULL,
      client TEXT NOT NULL,
      status TEXT NOT NULL,
      amount INTEGER NOT NULL,
      sent_date TEXT NOT NULL,
      expires_date TEXT NOT NULL,
      sections TEXT NOT NULL,
      line_items TEXT,
      recipient_email TEXT,
      email_subject TEXT,
      email_body TEXT,
      public_token TEXT,
      client_comment TEXT,
      signature_name TEXT,
      signed_at TEXT,
      rejected_at TEXT,
      sent_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      client TEXT NOT NULL,
      label TEXT NOT NULL,
      status TEXT NOT NULL,
      due_date TEXT NOT NULL,
      amount INTEGER NOT NULL,
      method TEXT NOT NULL,
      public_token TEXT,
      tax_rate REAL,
      line_items TEXT,
      payment_schedule TEXT,
      stripe_customer_id TEXT,
      stripe_payment_method_id TEXT,
      auto_pay_enabled INTEGER DEFAULT 0,
      auto_pay_last4 TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedule_items (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      title TEXT NOT NULL,
      client TEXT NOT NULL,
      starts_at TEXT NOT NULL,
      type TEXT NOT NULL,
      sync TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender TEXT NOT NULL,
      client_name TEXT,
      project_id TEXT,
      external_message_id TEXT,
      direction TEXT,
      channel TEXT NOT NULL,
      time TEXT NOT NULL,
      subject TEXT NOT NULL,
      preview TEXT NOT NULL,
      unread INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client TEXT NOT NULL,
      progress INTEGER NOT NULL,
      phase TEXT NOT NULL,
      archived_at TEXT,
      public_portal_token TEXT,
      project_type TEXT,
      project_date TEXT,
      location TEXT,
      description TEXT,
      file_notes TEXT,
      lead_source TEXT,
      stage_moved_at TEXT,
      recent_activity TEXT,
      next_milestone TEXT NOT NULL,
      tasks TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_contacts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS client_uploads (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      client_name TEXT NOT NULL,
      image_path TEXT NOT NULL,
      caption TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_deliverables (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      media_type TEXT NOT NULL,
      title TEXT NOT NULL,
      caption TEXT,
      file_path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      status TEXT NOT NULL,
      visibility TEXT NOT NULL,
      linked_path TEXT,
      body TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      trigger TEXT NOT NULL,
      actions TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS package_presets (
      id TEXT PRIMARY KEY,
      template_set_id TEXT,
      template_set_name TEXT,
      template_set_cover_image TEXT,
      template_set_cover_position TEXT,
      template_set_order INTEGER,
      template_library_order INTEGER,
      category TEXT,
      name TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      proposal_title TEXT NOT NULL,
      amount INTEGER NOT NULL,
      sections TEXT NOT NULL,
      line_items TEXT NOT NULL,
      cover_image TEXT,
      cover_position TEXT,
      email_subject TEXT NOT NULL,
      email_body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS package_brochures (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      category TEXT NOT NULL,
      public_token TEXT NOT NULL UNIQUE,
      selected_package_ids TEXT,
      package_overrides TEXT,
      title TEXT,
      intro TEXT,
      closing_note TEXT,
      cover_image TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS package_brochure_responses (
      id TEXT PRIMARY KEY,
      brochure_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      client_name TEXT,
      client_email TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS document_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_type TEXT NOT NULL,
      template_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ledger_transactions (
      id TEXT PRIMARY KEY,
      transaction_date TEXT NOT NULL,
      direction TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      payment_method TEXT,
      counterparty TEXT,
      project_id TEXT,
      invoice_id TEXT,
      source_type TEXT,
      source_id TEXT,
      tax_category TEXT,
      receipt_path TEXT,
      reconciled_at TEXT,
      reconciliation_note TEXT,
      match_reference TEXT,
      match_confidence REAL,
      import_hash TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recurring_ledger_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      direction TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      counterparty TEXT,
      description TEXT NOT NULL,
      day_of_month INTEGER NOT NULL,
      project_id TEXT,
      tax_category TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      next_run_date TEXT NOT NULL,
      last_run_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ledger_mileage_logs (
      id TEXT PRIMARY KEY,
      trip_date TEXT NOT NULL,
      origin_label TEXT,
      origin_address TEXT NOT NULL,
      destination_label TEXT,
      destination_address TEXT NOT NULL,
      trip_type TEXT NOT NULL,
      one_way_miles REAL NOT NULL,
      total_miles REAL NOT NULL,
      project_id TEXT,
      purpose TEXT NOT NULL,
      notes TEXT,
      calculation_source TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gear_inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      barcode TEXT,
      serial_number TEXT,
      status TEXT NOT NULL,
      condition TEXT NOT NULL,
      daily_rate REAL DEFAULT 0,
      replacement_value REAL DEFAULT 0,
      current_holder TEXT,
      checked_out_at TEXT,
      due_back_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gear_checkouts (
      id TEXT PRIMARY KEY,
      gear_id TEXT NOT NULL,
      checkout_type TEXT NOT NULL,
      project_id TEXT,
      renter_name TEXT,
      renter_email TEXT,
      starts_at TEXT NOT NULL,
      due_at TEXT NOT NULL,
      returned_at TEXT,
      status TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  ensureColumn(db, "proposals", "recipient_email", "TEXT");
  ensureColumn(db, "proposals", "email_subject", "TEXT");
  ensureColumn(db, "proposals", "email_body", "TEXT");
  ensureColumn(db, "proposals", "public_token", "TEXT");
  ensureColumn(db, "proposals", "line_items", "TEXT");
  ensureColumn(db, "proposals", "project_id", "TEXT");
  ensureColumn(db, "proposals", "client_comment", "TEXT");
  ensureColumn(db, "proposals", "signature_name", "TEXT");
  ensureColumn(db, "proposals", "signed_at", "TEXT");
  ensureColumn(db, "proposals", "rejected_at", "TEXT");
  ensureColumn(db, "proposals", "sent_at", "TEXT");
  ensureColumn(db, "clients", "contact_email", "TEXT");
  ensureColumn(db, "schedule_items", "recipient_email", "TEXT");
  ensureColumn(db, "schedule_items", "meeting_url", "TEXT");
  ensureColumn(db, "schedule_items", "project_id", "TEXT");
  ensureColumn(db, "messages", "client_name", "TEXT");
  ensureColumn(db, "messages", "project_id", "TEXT");
  ensureColumn(db, "messages", "external_message_id", "TEXT");
  ensureColumn(db, "messages", "direction", "TEXT");
  ensureColumn(db, "messages", "deleted_at", "TEXT");
  ensureColumn(db, "project_deliverables", "caption", "TEXT");
  ensureColumn(db, "project_deliverables", "source_type", "TEXT");
  ensureColumn(db, "project_deliverables", "thumbnail_path", "TEXT");
  ensureColumn(db, "project_deliverables", "album_title", "TEXT");
  ensureColumn(db, "project_deliverables", "album_section", "TEXT");
  ensureColumn(db, "project_deliverables", "album_download_url", "TEXT");
  ensureColumn(db, "projects", "public_portal_token", "TEXT");
  ensureColumn(db, "projects", "project_type", "TEXT");
  ensureColumn(db, "projects", "project_date", "TEXT");
  ensureColumn(db, "projects", "archived_at", "TEXT");
  ensureColumn(db, "projects", "location", "TEXT");
  ensureColumn(db, "projects", "description", "TEXT");
  ensureColumn(db, "projects", "file_notes", "TEXT");
  ensureColumn(db, "projects", "lead_source", "TEXT");
  ensureColumn(db, "projects", "project_cover", "TEXT");
  ensureColumn(db, "projects", "project_cover_position", "TEXT");
  ensureColumn(db, "projects", "deliverables_gallery_title", "TEXT");
  ensureColumn(db, "projects", "deliverables_gallery_intro", "TEXT");
  ensureColumn(db, "projects", "deliverables_gallery_cover", "TEXT");
  ensureColumn(db, "projects", "client_portal_title", "TEXT");
  ensureColumn(db, "projects", "client_portal_intro", "TEXT");
  ensureColumn(db, "projects", "client_portal_cover", "TEXT");
  ensureColumn(db, "projects", "stage_moved_at", "TEXT");
  ensureColumn(db, "projects", "recent_activity", "TEXT");
  ensureColumn(db, "package_presets", "category", "TEXT");
  ensureColumn(db, "package_presets", "subtitle", "TEXT");
  ensureColumn(db, "package_presets", "cover_image", "TEXT");
  ensureColumn(db, "package_presets", "cover_position", "TEXT");
  ensureColumn(db, "package_presets", "template_set_id", "TEXT");
  ensureColumn(db, "package_presets", "template_set_name", "TEXT");
  ensureColumn(db, "package_presets", "template_set_cover_image", "TEXT");
  ensureColumn(db, "package_presets", "template_set_cover_position", "TEXT");
  ensureColumn(db, "package_presets", "template_set_order", "INTEGER");
  ensureColumn(db, "package_presets", "template_library_order", "INTEGER");
  ensureColumn(db, "project_files", "linked_path", "TEXT");
  ensureColumn(db, "project_files", "body", "TEXT");
  ensureColumn(db, "video_paywalls", "cover_image", "TEXT");
  ensureColumn(db, "video_paywalls", "stripe_checkout_session_id", "TEXT");
  ensureColumn(db, "video_paywalls", "purchased_at", "TEXT");
  ensureColumn(db, "video_paywalls", "buyer_email", "TEXT");
  ensureColumn(db, "invoices", "public_token", "TEXT");
  ensureColumn(db, "invoices", "project_id", "TEXT");
  ensureColumn(db, "invoices", "tax_rate", "REAL");
  ensureColumn(db, "invoices", "line_items", "TEXT");
  ensureColumn(db, "invoices", "payment_schedule", "TEXT");
  ensureColumn(db, "invoices", "stripe_customer_id", "TEXT");
  ensureColumn(db, "invoices", "stripe_payment_method_id", "TEXT");
  ensureColumn(db, "invoices", "auto_pay_enabled", "INTEGER DEFAULT 0");
  ensureColumn(db, "invoices", "auto_pay_last4", "TEXT");
  ensureColumn(db, "ledger_transactions", "payment_method", "TEXT");
  ensureColumn(db, "ledger_transactions", "counterparty", "TEXT");
  ensureColumn(db, "ledger_transactions", "project_id", "TEXT");
  ensureColumn(db, "ledger_transactions", "invoice_id", "TEXT");
  ensureColumn(db, "ledger_transactions", "source_type", "TEXT");
  ensureColumn(db, "ledger_transactions", "source_id", "TEXT");
  ensureColumn(db, "ledger_transactions", "tax_category", "TEXT");
  ensureColumn(db, "ledger_transactions", "receipt_path", "TEXT");
  ensureColumn(db, "ledger_transactions", "reconciled_at", "TEXT");
  ensureColumn(db, "ledger_transactions", "reconciliation_note", "TEXT");
  ensureColumn(db, "ledger_transactions", "match_reference", "TEXT");
  ensureColumn(db, "ledger_transactions", "match_confidence", "REAL");
  ensureColumn(db, "ledger_transactions", "import_hash", "TEXT");
  ensureColumn(db, "recurring_ledger_rules", "payment_method", "TEXT");
  ensureColumn(db, "recurring_ledger_rules", "counterparty", "TEXT");
  ensureColumn(db, "recurring_ledger_rules", "project_id", "TEXT");
  ensureColumn(db, "recurring_ledger_rules", "tax_category", "TEXT");
  ensureColumn(db, "recurring_ledger_rules", "active", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn(db, "users", "role", "TEXT NOT NULL DEFAULT 'SUPER_ADMIN'");
  db.prepare("UPDATE users SET role = 'SUPER_ADMIN' WHERE role IS NULL OR TRIM(role) = ''").run();
  ensureColumn(db, "recurring_ledger_rules", "next_run_date", "TEXT");
  ensureColumn(db, "recurring_ledger_rules", "last_run_date", "TEXT");
  ensureColumn(db, "gear_inventory", "serial_number", "TEXT");
  ensureColumn(db, "gear_inventory", "barcode", "TEXT");
  ensureColumn(db, "gear_inventory", "status", "TEXT");
  ensureColumn(db, "gear_inventory", "condition", "TEXT");
  ensureColumn(db, "gear_inventory", "daily_rate", "REAL DEFAULT 0");
  ensureColumn(db, "gear_inventory", "replacement_value", "REAL DEFAULT 0");
  ensureColumn(db, "gear_inventory", "current_holder", "TEXT");
  ensureColumn(db, "gear_inventory", "checked_out_at", "TEXT");
  ensureColumn(db, "gear_inventory", "due_back_at", "TEXT");
  ensureColumn(db, "gear_inventory", "notes", "TEXT");
  ensureColumn(db, "gear_checkouts", "checkout_type", "TEXT");
  ensureColumn(db, "gear_checkouts", "project_id", "TEXT");
  ensureColumn(db, "gear_checkouts", "renter_name", "TEXT");
  ensureColumn(db, "gear_checkouts", "renter_email", "TEXT");
  ensureColumn(db, "gear_checkouts", "returned_at", "TEXT");
  ensureColumn(db, "gear_checkouts", "notes", "TEXT");
  ensureColumn(db, "package_brochures", "project_id", "TEXT");
  ensureColumn(db, "package_brochures", "category", "TEXT");
  ensureColumn(db, "package_brochures", "public_token", "TEXT");
  ensureColumn(db, "package_brochures", "selected_package_ids", "TEXT");
  ensureColumn(db, "package_brochures", "package_overrides", "TEXT");
  ensureColumn(db, "package_brochures", "title", "TEXT");
  ensureColumn(db, "package_brochures", "intro", "TEXT");
  ensureColumn(db, "package_brochures", "closing_note", "TEXT");
  ensureColumn(db, "package_brochures", "cover_image", "TEXT");
  ensureColumn(db, "package_brochure_responses", "brochure_id", "TEXT");
  ensureColumn(db, "package_brochure_responses", "project_id", "TEXT");
  ensureColumn(db, "package_brochure_responses", "package_id", "TEXT");
  ensureColumn(db, "package_brochure_responses", "client_name", "TEXT");
  ensureColumn(db, "package_brochure_responses", "client_email", "TEXT");
  ensureColumn(db, "package_brochure_responses", "note", "TEXT");
  ensureColumn(db, "package_brochure_responses", "created_at", "TEXT");
  ensureColumn(db, "package_brochure_responses", "updated_at", "TEXT");
  ensureColumn(db, "users", "avatar_image", "TEXT");
  db.prepare(
    `UPDATE proposals
      SET project_id = (
        SELECT project_files.project_id
        FROM project_files
        WHERE project_files.type = 'PROPOSAL'
          AND project_files.linked_path = '/p/' || proposals.public_token
        LIMIT 1
      )
      WHERE COALESCE(NULLIF(project_id, ''), '') = ''
        AND COALESCE(NULLIF(public_token, ''), '') != ''`
  ).run();
  db.prepare(
    `UPDATE invoices
      SET project_id = (
        SELECT project_files.project_id
        FROM project_files
        WHERE project_files.type = 'INVOICE'
          AND project_files.linked_path LIKE '%/' || invoices.id
        LIMIT 1
      )
      WHERE COALESCE(NULLIF(project_id, ''), '') = ''`
  ).run();
}

function seedIfNeeded(db: DatabaseSync) {
  const userCountRow = db.prepare("SELECT COUNT(*) AS count FROM users").get() as
    | { count: number }
    | undefined;
  const userCount = Number(userCountRow?.count ?? 0);

  if (userCount > 0) {
    backfillSeedProjectData(db);
    backfillInvoiceTokens(db);
    backfillLedgerInvoiceTransactions(db);
    backfillPackageTemplateSets(db);
    backfillPackageTemplateLibraryOrder(db);
    return;
  }

  const timestamp = nowIso();
  const insertUser = db.prepare(
    "INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  insertUser.run(
    "user-sam",
    process.env.SEED_ADMIN_EMAIL || "sam@studioflow.local",
    "Sam Visual",
    hashPassword(process.env.SEED_ADMIN_PASSWORD || "studioflow123"),
    timestamp,
    timestamp
  );

  const insertLead = db.prepare(
    "INSERT INTO leads (id, name, service, stage, value, event_date, source, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  [
    ["lead-001", "Maya + Jordan", "Wedding film", "INQUIRY", 6200, "2026-09-19", "Instagram", "Requested Super 8 add-on and teaser delivery within 72 hours."],
    ["lead-002", "Oak & Ivory", "Brand launch", "PROPOSAL_SENT", 4500, "2026-05-28", "Referral", "Interested in a retainer after launch campaign if performance is strong."],
    ["lead-003", "Elena Torres", "Portrait session", "FOLLOW_UP", 850, "2026-04-18", "Website", "Waiting on preferred studio location and wardrobe board."],
  ].forEach((lead) => insertLead.run(...lead, timestamp, timestamp));

  const insertClient = db.prepare(
    "INSERT INTO clients (id, name, category, project, package_name, contact_email, total_value, balance, next_touchpoint, health, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  [
    ["client-001", "Kia + Collin", "Wedding", "Lake Hickory wedding story", "Signature Film Collection", "kia@example.com", 7800, 2600, "2026-04-09", "ON_TRACK"],
    ["client-002", "Vandee Lee", "Music video", "Single release visuals", "Full production day", "vandee@example.com", 5400, 1400, "2026-04-06", "NEEDS_REVIEW"],
    ["client-003", "Lauren Church", "Commercial", "Doc-style campaign", "Campaign edit suite", "lauren@example.com", 3000, 0, "2026-04-12", "ON_TRACK"],
  ].forEach((client) => insertClient.run(...client, timestamp, timestamp));

  const insertProposal = db.prepare(
    "INSERT INTO proposals (id, title, client, status, amount, sent_date, expires_date, sections, line_items, recipient_email, email_subject, email_body, public_token, client_comment, signature_name, signed_at, rejected_at, sent_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  [
    [
      "proposal-001",
      "Maya + Jordan Signature Wedding Proposal",
      "Maya + Jordan",
      "DRAFT",
      6200,
      "2026-04-05",
      "2026-04-12",
      JSON.stringify(["Coverage", "Super 8 add-on", "Payment schedule", "Contract terms"]),
      JSON.stringify([
        { title: "Wedding day coverage", description: "10 hours of filming", amount: 5200 },
        { title: "Super 8 add-on", description: "Vintage motion coverage", amount: 1000 },
      ]),
      "maya@example.com",
      "Your StudioFlow proposal",
      "Hi Maya + Jordan,\n\nHere is your proposal from StudioFlow.",
      "proposal-token-001",
      null,
      null,
      null,
      null,
      null,
    ],
    [
      "proposal-002",
      "Oak & Ivory Launch Campaign Proposal",
      "Oak & Ivory",
      "SENT",
      4500,
      "2026-04-03",
      "2026-04-10",
      JSON.stringify(["Launch film", "Photo library", "Usage rights", "Optional retainer"]),
      JSON.stringify([
        { title: "Launch film", description: "Flagship campaign edit", amount: 3000 },
        { title: "Photo library", description: "Brand image set", amount: 1500 },
      ]),
      "hello@oakandivory.co",
      "Your launch campaign proposal",
      "Hi Oak & Ivory,\n\nYour proposal is ready to review.",
      "proposal-token-002",
      "Can we split social cutdowns into an optional add-on?",
      null,
      null,
      null,
      "2026-04-03T14:15:00",
    ],
    [
      "proposal-003",
      "Kia + Collin Contract Packet",
      "Kia + Collin",
      "SIGNED",
      7800,
      "2026-03-12",
      "2026-03-19",
      JSON.stringify(["Scope", "Travel policy", "Timeline", "Reschedule clause"]),
      JSON.stringify([
        { title: "Signature film collection", description: "Wedding day + teaser", amount: 6800 },
        { title: "Travel", description: "Regional travel coverage", amount: 1000 },
      ]),
      "kia@example.com",
      "Your contract packet",
      "Hi Kia + Collin,\n\nYour contract packet is attached in the portal.",
      "proposal-token-003",
      "We are excited to move forward.",
      "Kia Hamilton",
      "2026-03-13T09:30:00",
      null,
      "2026-03-12T09:00:00",
    ],
  ].forEach((proposal) => insertProposal.run(...proposal, timestamp, timestamp));

  const insertInvoice = db.prepare(
    "INSERT INTO invoices (id, client, label, status, due_date, amount, method, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  [
    ["invoice-001", "Kia + Collin", "Second installment", "DUE_SOON", "2026-04-11", 2600, "ACH / Stripe"],
    ["invoice-002", "Vandee Lee", "Final delivery payment", "OVERDUE", "2026-04-01", 1400, "Card on file"],
    ["invoice-003", "Lauren Church", "Campaign deposit", "PAID", "2026-03-22", 1500, "Bank transfer"],
  ].forEach((invoice) => insertInvoice.run(...invoice, timestamp, timestamp));

  const insertSchedule = db.prepare(
    "INSERT INTO schedule_items (id, title, client, starts_at, type, sync, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  [
    ["event-001", "Discovery call", "Maya + Jordan", "2026-04-06T14:00:00", "Call", "Google Calendar synced"],
    ["event-002", "Storyboard review", "Oak & Ivory", "2026-04-07T11:30:00", "Meeting", "Calendly intake captured"],
    ["event-003", "Wedding timeline final pass", "Kia + Collin", "2026-04-08T16:00:00", "Prep", "Google Calendar synced"],
  ].forEach((item) => insertSchedule.run(...item, timestamp, timestamp));

  const insertMessage = db.prepare(
    "INSERT INTO messages (id, sender, client_name, project_id, direction, channel, time, subject, preview, unread, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  [
    ["message-001", "Kia + Collin", "Kia + Collin", "project-001", "INBOUND", "Email", "2026-04-05T09:12:00", "Can we add rehearsal dinner coverage?", "We'd love to know what the upgrade would look like if we include Friday evening.", 1],
    ["message-002", "Sam Visual", "Kia + Collin", "project-001", "OUTBOUND", "Email", "2026-04-04T17:42:00", "Updated coverage options", "I mapped out two rehearsal dinner add-ons and attached the timing updates for review.", 0],
    ["message-003", "Vandee Lee", "Vandee Lee", "project-002", "INBOUND", "Text", "2026-04-04T13:05:00", "Delivery ETA", "Checking whether the vertical teaser can land before Friday afternoon.", 1],
    ["message-004", "Sam Visual", "Lauren Church", "project-003", "OUTBOUND", "Email", "2026-04-03T08:20:00", "Campaign outline recap", "Shared the revised interview structure and asked for final approval on the founder talking points.", 0],
  ].forEach((message) => insertMessage.run(...message, timestamp, timestamp));

  const insertProject = db.prepare(
    "INSERT INTO projects (id, name, client, progress, phase, project_type, project_date, location, description, file_notes, lead_source, stage_moved_at, recent_activity, next_milestone, tasks, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  [
    [
      "project-001",
      "Lake Hickory wedding story",
      "Kia + Collin",
      72,
      "Planning",
      "Wedding",
      "2026-06-14",
      "Lake Hickory, NC",
      "Signature wedding film coverage with portrait storytelling and ceremony edit.",
      "Contract packet prepared, questionnaire delivered, and client portal shared for timeline planning.",
      "Instagram",
      "2026-04-03T10:00:00",
      "Shot list shared and sunset portrait window confirmed.",
      "Finalize family formal list",
      JSON.stringify(["Share shot list", "Confirm sunset portrait window", "Collect music preference form"]),
    ],
    [
      "project-002",
      "Single release visuals",
      "Vandee Lee",
      88,
      "Proposal Signed",
      "Music video",
      "2026-04-22",
      "Minneapolis, MN",
      "Performance-driven single release visuals with teaser cutdowns for socials.",
      "Treatment PDF uploaded, music release schedule confirmed, and delivery folder shared.",
      "Referral",
      "2026-04-01T14:30:00",
      "Waiting on final payment before delivery export.",
      "Approve color pass",
      JSON.stringify(["Deliver teaser", "Collect final payment", "Schedule release assets"]),
    ],
    [
      "project-003",
      "Doc-style campaign",
      "Lauren Church",
      46,
      "Planning",
      "Commercial",
      "2026-05-07",
      "St. Paul, MN",
      "Doc-style campaign centered on founder interviews and brand atmosphere.",
      "Brand brief linked, interview notes organized, and review assets staged for client feedback.",
      "Website",
      "2026-04-04T09:15:00",
      "Interview outline drafted and B-roll list under review.",
      "Select interview pull quotes",
      JSON.stringify(["Review audio", "Confirm B-roll list", "Draft edit structure"]),
    ],
  ].forEach((project) => insertProject.run(...project, timestamp, timestamp));

  const insertAutomation = db.prepare(
    "INSERT INTO automations (id, name, trigger, actions, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  [
    ["automation-001", "Inquiry nurture", "New lead added", JSON.stringify(["Send welcome email", "Create follow-up task", "Assign proposal deadline"]), "ACTIVE"],
    ["automation-002", "Payment reminder sequence", "Invoice due in 3 days", JSON.stringify(["Send reminder email", "Text client", "Flag dashboard alert"]), "ACTIVE"],
    ["automation-003", "Post-booking kickoff", "Contract signed", JSON.stringify(["Send portal invite", "Schedule planning call", "Generate questionnaire"]), "DRAFT"],
  ].forEach((automation) => insertAutomation.run(...automation, timestamp, timestamp));

  ensureDefaultPackagePresets(db);
  backfillSeedProjectData(db);
  backfillInvoiceTokens(db);
  backfillLedgerInvoiceTransactions(db);
  backfillPackageTemplateSets(db);
  backfillPackageTemplateLibraryOrder(db);
}

function backfillSeedProjectData(db: DatabaseSync) {
  const projectsMissingPortal = db
    .prepare("SELECT id FROM projects WHERE public_portal_token IS NULL OR TRIM(public_portal_token) = ''")
    .all() as Array<{ id: string }>;

  const updatePortalToken = db.prepare(
    "UPDATE projects SET public_portal_token = ?, updated_at = ? WHERE id = ?"
  );

  projectsMissingPortal.forEach((project) => {
    updatePortalToken.run(randomUUID(), nowIso(), project.id);
  });

  db.prepare(
    "UPDATE clients SET contact_email = COALESCE(NULLIF(contact_email, ''), ?) WHERE id = ?"
  ).run("kia@example.com", "client-001");
  db.prepare(
    "UPDATE clients SET contact_email = COALESCE(NULLIF(contact_email, ''), ?) WHERE id = ?"
  ).run("vandee@example.com", "client-002");
  db.prepare(
    "UPDATE clients SET contact_email = COALESCE(NULLIF(contact_email, ''), ?) WHERE id = ?"
  ).run("lauren@example.com", "client-003");

  db.prepare(
    "UPDATE projects SET project_type = COALESCE(NULLIF(project_type, ''), ?), project_date = COALESCE(NULLIF(project_date, ''), ?), location = COALESCE(NULLIF(location, ''), ?), description = COALESCE(NULLIF(description, ''), ?), file_notes = COALESCE(NULLIF(file_notes, ''), ?), lead_source = COALESCE(NULLIF(lead_source, ''), ?), recent_activity = COALESCE(NULLIF(recent_activity, ''), ?), stage_moved_at = COALESCE(NULLIF(stage_moved_at, ''), ?) WHERE id = ?"
  ).run(
    "Wedding",
    "2026-06-14",
    "Lake Hickory, NC",
    "Signature wedding film coverage with portrait storytelling and ceremony edit.",
    "Contract packet prepared, questionnaire delivered, and client portal shared for timeline planning.",
    "Instagram",
    "Shot list shared and sunset portrait window confirmed.",
    "2026-04-03T10:00:00",
    "project-001"
  );
  db.prepare(
    "UPDATE projects SET project_type = COALESCE(NULLIF(project_type, ''), ?), project_date = COALESCE(NULLIF(project_date, ''), ?), location = COALESCE(NULLIF(location, ''), ?), description = COALESCE(NULLIF(description, ''), ?), file_notes = COALESCE(NULLIF(file_notes, ''), ?), lead_source = COALESCE(NULLIF(lead_source, ''), ?), recent_activity = COALESCE(NULLIF(recent_activity, ''), ?), stage_moved_at = COALESCE(NULLIF(stage_moved_at, ''), ?) WHERE id = ?"
  ).run(
    "Music video",
    "2026-04-22",
    "Minneapolis, MN",
    "Performance-driven single release visuals with teaser cutdowns for socials.",
    "Treatment PDF uploaded, music release schedule confirmed, and delivery folder shared.",
    "Referral",
    "Waiting on final payment before delivery export.",
    "2026-04-01T14:30:00",
    "project-002"
  );
  db.prepare(
    "UPDATE projects SET project_type = COALESCE(NULLIF(project_type, ''), ?), project_date = COALESCE(NULLIF(project_date, ''), ?), location = COALESCE(NULLIF(location, ''), ?), description = COALESCE(NULLIF(description, ''), ?), file_notes = COALESCE(NULLIF(file_notes, ''), ?), lead_source = COALESCE(NULLIF(lead_source, ''), ?), recent_activity = COALESCE(NULLIF(recent_activity, ''), ?), stage_moved_at = COALESCE(NULLIF(stage_moved_at, ''), ?) WHERE id = ?"
  ).run(
    "Commercial",
    "2026-05-07",
    "St. Paul, MN",
    "Doc-style campaign centered on founder interviews and brand atmosphere.",
    "Brand brief linked, interview notes organized, and review assets staged for client feedback.",
    "Website",
    "Interview outline drafted and B-roll list under review.",
    "2026-04-04T09:15:00",
    "project-003"
  );

  db.prepare(
    "UPDATE messages SET sender = ?, client_name = ?, project_id = ?, direction = ?, channel = ?, subject = ?, preview = ? WHERE id = ? AND COALESCE(NULLIF(project_id, ''), '') = ''"
  ).run(
    "Kia + Collin",
    "Kia + Collin",
    "project-001",
    "INBOUND",
    "Email",
    "Can we add rehearsal dinner coverage?",
    "We'd love to know what the upgrade would look like if we include Friday evening.",
    "message-001"
  );
  db.prepare(
    "UPDATE messages SET sender = ?, client_name = ?, project_id = ?, direction = ?, channel = ?, subject = ?, preview = ?, unread = ? WHERE id = ? AND COALESCE(NULLIF(project_id, ''), '') = ''"
  ).run(
    "Sam Visual",
    "Kia + Collin",
    "project-001",
    "OUTBOUND",
    "Email",
    "Updated coverage options",
    "I mapped out two rehearsal dinner add-ons and attached the timing updates for review.",
    0,
    "message-002"
  );
  db.prepare(
    "UPDATE messages SET client_name = ?, project_id = ?, direction = ? WHERE id = ? AND COALESCE(NULLIF(project_id, ''), '') = ''"
  ).run("Vandee Lee", "project-002", "INBOUND", "message-003");

  const hasFourthMessage = db
    .prepare("SELECT 1 FROM messages WHERE id = ? LIMIT 1")
    .get("message-004") as { 1: number } | undefined;

  if (!hasFourthMessage) {
    const timestamp = nowIso();
    db.prepare(
      "INSERT INTO messages (id, sender, client_name, project_id, direction, channel, time, subject, preview, unread, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(
      "message-004",
      "Sam Visual",
      "Lauren Church",
      "project-003",
      "OUTBOUND",
      "Email",
      "2026-04-03T08:20:00",
      "Campaign outline recap",
      "Shared the revised interview structure and asked for final approval on the founder talking points.",
      0,
      timestamp,
      timestamp
    );
  }
}

function backfillInvoiceTokens(db: DatabaseSync) {
  const invoicesMissingToken = db
    .prepare("SELECT id FROM invoices WHERE public_token IS NULL OR TRIM(public_token) = ''")
    .all() as Array<{ id: string }>;

  const updateInvoiceToken = db.prepare(
    "UPDATE invoices SET public_token = ?, updated_at = ? WHERE id = ?"
  );

  invoicesMissingToken.forEach((invoice) => {
    updateInvoiceToken.run(randomUUID(), nowIso(), invoice.id);
  });
}

function backfillPackageTemplateSets(db: DatabaseSync) {
  const rows = db.prepare(
    "SELECT id, category, name, created_at, amount FROM package_presets WHERE (template_set_id IS NULL OR TRIM(template_set_id) = '') AND id NOT LIKE 'preset-%' ORDER BY created_at ASC, amount ASC"
  ).all() as Array<{
    id: string;
    category: string;
    name: string;
    created_at: string;
    amount: number;
  }>;

  const groupedRows = rows.reduce((groups, row) => {
    const key = `${row.category}::${row.created_at}`;
    const current = groups.get(key) || [];
    current.push(row);
    groups.set(key, current);
    return groups;
  }, new Map<string, typeof rows>());

  const updatePreset = db.prepare(
    "UPDATE package_presets SET template_set_id = ?, template_set_name = ?, template_set_order = ? WHERE id = ?"
  );

  groupedRows.forEach((groupRows) => {
    if (groupRows.length === 0) {
      return;
    }

    const templateSetId = randomUUID();
    const templateSetName =
      groupRows.length > 1 ? `${groupRows[0].category} package template` : groupRows[0].name;

    groupRows.forEach((row, index) => {
      updatePreset.run(templateSetId, templateSetName, index, row.id);
    });
  });
}

function backfillPackageTemplateLibraryOrder(db: DatabaseSync) {
  const rows = db.prepare(
    "SELECT id, template_set_id, created_at FROM package_presets WHERE template_library_order IS NULL ORDER BY created_at ASC, amount ASC"
  ).all() as Array<{
    id: string;
    template_set_id?: string | null;
    created_at: string;
  }>;

  const groupedRows = rows.reduce((groups, row) => {
    const key = String(row.template_set_id || row.id);
    if (!groups.has(key)) {
      groups.set(key, row);
    }
    return groups;
  }, new Map<string, (typeof rows)[number]>());

  const updateByTemplateSet = db.prepare(
    "UPDATE package_presets SET template_library_order = ? WHERE template_set_id = ?"
  );
  const updateById = db.prepare("UPDATE package_presets SET template_library_order = ? WHERE id = ?");

  Array.from(groupedRows.entries()).forEach(([key, row], index) => {
    if (row.template_set_id) {
      updateByTemplateSet.run(index, key);
      return;
    }
    updateById.run(index, row.id);
  });
}

export function ensureDefaultPackagePresets(db: DatabaseSync) {
  const hasPreset = db.prepare("SELECT 1 FROM package_presets WHERE id = ? LIMIT 1");
  const insertPreset = db.prepare(
    "INSERT INTO package_presets (id, category, name, description, proposal_title, amount, sections, line_items, cover_image, email_subject, email_body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const timestamp = nowIso();

  [
    [
      "preset-collection-1",
      "Wedding",
      "Collection I",
      "Silver Edition for intimate wedding coverage with a simple highlight-focused deliverable.",
      "Collection I Wedding Proposal",
      2500,
      JSON.stringify(["6 hours of coverage", "35-minute film", "60 second trailer", "1 filmmaker", "Digital download link"]),
      JSON.stringify([
        { title: "Wedding coverage", description: "6 hours of coverage", amount: 1500 },
        { title: "Edited wedding film", description: "35-minute film", amount: 500 },
        { title: "Trailer delivery", description: "60 second wedding trailer", amount: 250 },
        { title: "Digital delivery", description: "1 filmmaker and digital download link", amount: 250 },
      ]),
      "",
      "Your Collection I proposal",
      "Hi,\n\nI put together Collection I for you. It includes 6 hours of coverage, a 35-minute film, a 60 second trailer, 1 filmmaker, and a digital download link.\n\nLet me know if you'd like any customizations.\n\nThanks,",
    ],
    [
      "preset-collection-2",
      "Wedding",
      "Collection II",
      "Gold Edition for a mid-to-large wedding day with extra ceremony and reception coverage.",
      "Collection II Wedding Proposal",
      3500,
      JSON.stringify(["8 hours of coverage", "7 minute highlight film", "60 second trailer", "1 filmmaker", "Raw speeches and first dances", "Drone coverage", "Online gallery", "Delivered within 30-90 days"]),
      JSON.stringify([
        { title: "Wedding coverage", description: "8 hours of coverage", amount: 1700 },
        { title: "Highlight film", description: "7 minute wedding highlight film", amount: 650 },
        { title: "Trailer delivery", description: "60 second wedding trailer", amount: 250 },
        { title: "Bonus coverage", description: "Raw speeches, first dances, and drone coverage", amount: 550 },
        { title: "Gallery and delivery", description: "Online gallery delivered within 30-90 days", amount: 350 },
      ]),
      "",
      "Your Collection II proposal",
      "Hi,\n\nI put together Collection II for you. It includes 8 hours of coverage, a 7 minute highlight film, a 60 second trailer, raw speeches and first dances, drone coverage, an online gallery, and delivery within 30-90 days.\n\nLet me know if you'd like to adjust anything.\n\nThanks,",
    ],
    [
      "preset-collection-3",
      "Wedding",
      "Collection III",
      "Platinum Edition built for larger weddings that need more complete storytelling and a second filmmaker.",
      "Collection III Wedding Proposal",
      4500,
      JSON.stringify(["10 hours of coverage", "2 filmmakers", "10-12 minute wedding film", "Ceremony film (25 min+)", "Drone coverage", "Full toast edits / speeches / first dances", "Delivered within 30-90 days"]),
      JSON.stringify([
        { title: "Wedding coverage", description: "10 hours of coverage", amount: 2000 },
        { title: "Team coverage", description: "2 filmmakers", amount: 700 },
        { title: "Main film", description: "10-12 minute wedding film", amount: 900 },
        { title: "Ceremony film", description: "Ceremony film (25 min+)", amount: 450 },
        { title: "Reception and aerial coverage", description: "Drone coverage plus full toast edits, speeches, and first dances", amount: 450 },
      ]),
      "",
      "Your Collection III proposal",
      "Hi,\n\nI put together Collection III for you. It includes 10 hours of coverage, 2 filmmakers, a 10-12 minute wedding film, a full ceremony film, drone coverage, and full edits for speeches and first dances.\n\nIf you want, I can also tailor it further to your day.\n\nThanks,",
    ],
    [
      "preset-collection-4",
      "Wedding",
      "Collection IIII",
      "Diamond Edition with full-day premium coverage, three filmmakers, and raw footage included.",
      "Collection IIII Wedding Proposal",
      6500,
      JSON.stringify(["10 hours of coverage", "3 filmmakers", "20 minute wedding film", "6 minute wedding highlight film", "Ceremony film (25 min+)", "Drone coverage", "All raw footage", "Delivered within 30-90 days", "Extra content"]),
      JSON.stringify([
        { title: "Wedding coverage", description: "10 hours of coverage", amount: 2400 },
        { title: "Premium team coverage", description: "3 filmmakers", amount: 1100 },
        { title: "Feature film", description: "20 minute wedding film", amount: 1300 },
        { title: "Highlight film", description: "6 minute wedding highlight film", amount: 500 },
        { title: "Ceremony and aerial coverage", description: "Ceremony film (25 min+) and drone coverage", amount: 650 },
        { title: "Raw footage and extras", description: "All raw footage, extra content, and delivery within 30-90 days", amount: 550 },
      ]),
      "",
      "Your Collection IIII proposal",
      "Hi,\n\nI put together Collection IIII for you. It includes 10 hours of coverage, 3 filmmakers, a 20 minute wedding film, a 6 minute highlight film, a full ceremony film, drone coverage, all raw footage, and extra content.\n\nLet me know if you'd like to reserve this package or tweak it first.\n\nThanks,",
    ],
    [
      "preset-business-1",
      "Business",
      "Brand Story Film",
      "A polished brand film package for founders, service businesses, and studio teams who need a flagship piece of video content plus stills for launch.",
      "Brand Story Film Proposal",
      3800,
      JSON.stringify(["Discovery call", "Half-day production", "1 hero brand film", "Short social cutdown", "Select brand photos", "Commercial usage included"]),
      JSON.stringify([
        { title: "Pre-production planning", description: "Discovery call, story outline, and production prep", amount: 600 },
        { title: "Half-day filming", description: "On-location brand production with directed coverage", amount: 1800 },
        { title: "Hero brand film", description: "1 primary brand film edit for web and launch use", amount: 900 },
        { title: "Social cutdown + stills", description: "1 short cutdown and select brand photo library", amount: 500 },
      ]),
      "",
      "Your Brand Story Film proposal",
      "Hi,\n\nI put together the Brand Story Film package for your business. It includes strategy and pre-production, a half-day shoot, a polished hero brand film, a short social cutdown, and a select set of brand photos for launch use.\n\nIf you'd like, I can also tailor this around your launch timeline or team size.\n\nThanks,",
    ],
    [
      "preset-business-2",
      "Business",
      "Monthly Content Retainer",
      "A recurring content package for businesses that need consistent monthly video and photo assets for reels, campaigns, launches, and ongoing marketing.",
      "Monthly Content Retainer Proposal",
      5200,
      JSON.stringify(["Monthly planning call", "1 content day per month", "4 edited short-form videos", "Photo library refresh", "Usage for web + socials", "Priority editing turnaround"]),
      JSON.stringify([
        { title: "Monthly planning", description: "Strategy call, shot planning, and content calendar alignment", amount: 700 },
        { title: "Content production day", description: "1 full content capture day each month", amount: 2200 },
        { title: "Short-form edits", description: "4 edited videos for reels, ads, or campaign content", amount: 1500 },
        { title: "Brand photo refresh", description: "Monthly stills library for ongoing posting and launches", amount: 800 },
      ]),
      "",
      "Your Monthly Content Retainer proposal",
      "Hi,\n\nI put together a Monthly Content Retainer for your business. This package is built for brands that need a reliable rhythm of new videos and photos each month without rebuilding the plan every time.\n\nI can also adjust the number of edits or shooting days if you need a heavier monthly schedule.\n\nThanks,",
    ],
    [
      "preset-business-3",
      "Business",
      "Headshots + Brand Library",
      "A photo-first business package for teams, entrepreneurs, and creatives who need updated headshots and a strong library of on-brand marketing imagery.",
      "Headshots + Brand Library Proposal",
      2400,
      JSON.stringify(["Creative planning", "Guided portrait session", "Team or founder headshots", "Workspace/lifestyle images", "Retouched final gallery"]),
      JSON.stringify([
        { title: "Creative prep", description: "Location planning, shot direction, and wardrobe guidance", amount: 300 },
        { title: "Portrait session", description: "Guided headshots and branded portrait coverage", amount: 1100 },
        { title: "Brand image library", description: "Workspace, lifestyle, and detail imagery for marketing use", amount: 700 },
        { title: "Retouching + delivery", description: "Final edited gallery with commercial-use delivery", amount: 300 },
      ]),
      "",
      "Your Headshots + Brand Library proposal",
      "Hi,\n\nI put together the Headshots + Brand Library package for your business. It focuses on updated portraits along with a clean set of branded images you can use across your website, press features, and social content.\n\nIf you want, I can also expand this into a larger team-day option.\n\nThanks,",
    ],
    [
      "preset-business-4",
      "Business",
      "Product Launch Campaign",
      "A campaign-focused package for product-based brands that need launch visuals, short video assets, detail photography, and e-commerce-ready content.",
      "Product Launch Campaign Proposal",
      4600,
      JSON.stringify(["Launch concept planning", "Styled product production", "Campaign film", "Launch cutdowns", "Product photo set", "Web + ad usage"]),
      JSON.stringify([
        { title: "Campaign planning", description: "Launch concept, shot list, and production prep", amount: 650 },
        { title: "Styled product shoot", description: "Production day for product video and detail photography", amount: 1900 },
        { title: "Campaign film", description: "1 flagship launch film for site and ad use", amount: 1100 },
        { title: "Cutdowns + product stills", description: "Short edits plus e-commerce and social-ready product photos", amount: 950 },
      ]),
      "",
      "Your Product Launch Campaign proposal",
      "Hi,\n\nI put together the Product Launch Campaign package for your launch. It is built for brands that need one polished campaign piece along with shorter edits and product images that can actually support the rollout across web, ads, and social.\n\nI can also tailor this around a heavier e-commerce photo need if that's the bigger priority.\n\nThanks,",
    ],
    [
      "preset-other-1",
      "Others",
      "Event Highlight Coverage",
      "A flexible event package for launches, private events, community gatherings, and live experiences that need fast recap coverage in both video and photo.",
      "Event Highlight Coverage Proposal",
      2800,
      JSON.stringify(["Pre-event planning", "4 hours of coverage", "Event highlight film", "Social teaser", "Select event photos", "Fast delivery turnaround"]),
      JSON.stringify([
        { title: "Event planning", description: "Run-of-show review and capture planning", amount: 300 },
        { title: "Event coverage", description: "4 hours of on-site video and photo coverage", amount: 1500 },
        { title: "Highlight edit", description: "1 polished recap film for web and social", amount: 650 },
        { title: "Photo selects + teaser", description: "Select event images plus 1 short teaser cut", amount: 350 },
      ]),
      "",
      "Your Event Highlight Coverage proposal",
      "Hi,\n\nI put together the Event Highlight Coverage package for your event. It is built for launches, gatherings, and live experiences that need a polished recap film, quick social-ready content, and a set of strong event images.\n\nIf you need longer coverage or same-day delivery support, I can tailor that too.\n\nThanks,",
    ],
    [
      "preset-other-2",
      "Others",
      "Music Video Production",
      "A creative music video package for artists who want concept support, production-day coverage, and a polished final video with optional teaser assets.",
      "Music Video Production Proposal",
      4200,
      JSON.stringify(["Concept call", "Treatment planning", "Full production day", "Primary music video edit", "Performance teaser", "1 revision round"]),
      JSON.stringify([
        { title: "Concept + treatment", description: "Creative planning, references, and production prep", amount: 600 },
        { title: "Production day", description: "Full-day music video filming", amount: 1900 },
        { title: "Primary edit", description: "1 finished music video edit", amount: 1300 },
        { title: "Teaser + revisions", description: "Performance teaser and 1 revision round", amount: 400 },
      ]),
      "",
      "Your Music Video Production proposal",
      "Hi,\n\nI put together the Music Video Production package for this release. It includes concept planning, a full production day, the main music video edit, and a teaser asset to support promotion around the drop.\n\nIf you want, I can also expand this into a larger narrative or multi-location version.\n\nThanks,",
    ],
    [
      "preset-other-3",
      "Others",
      "Portrait Session Experience",
      "A portrait-focused package for couples, seniors, creatives, and personal branding clients who want a guided shoot and a polished final gallery.",
      "Portrait Session Experience Proposal",
      950,
      JSON.stringify(["Creative prep", "Guided portrait session", "Location support", "Edited final gallery", "Print/share-ready delivery"]),
      JSON.stringify([
        { title: "Session planning", description: "Location guidance, wardrobe notes, and creative direction", amount: 150 },
        { title: "Portrait session", description: "Guided on-location portrait coverage", amount: 500 },
        { title: "Edited gallery", description: "Final edited gallery of portrait selects", amount: 250 },
        { title: "Delivery", description: "Download-ready gallery for print and sharing", amount: 50 },
      ]),
      "",
      "Your Portrait Session Experience proposal",
      "Hi,\n\nI put together the Portrait Session Experience package for you. It includes planning support, a guided portrait session, and a polished final gallery that is ready for printing and sharing.\n\nIf you need a larger branding-focused version or multiple locations, I can adjust it.\n\nThanks,",
    ],
    [
      "preset-other-4",
      "Others",
      "Creative Editorial Session",
      "A stylized package for editorials, fashion-inspired shoots, and passion projects that need stronger visual direction and a more cinematic final set.",
      "Creative Editorial Session Proposal",
      1800,
      JSON.stringify(["Mood board planning", "Creative direction", "Half-day editorial session", "Edited hero images", "Short motion clip", "Online delivery gallery"]),
      JSON.stringify([
        { title: "Creative development", description: "Mood board, styling direction, and concept planning", amount: 300 },
        { title: "Editorial session", description: "Half-day photo/video editorial capture", amount: 900 },
        { title: "Hero edits", description: "Edited final image set with signature retouching", amount: 400 },
        { title: "Motion clip + delivery", description: "1 short motion piece and final gallery delivery", amount: 200 },
      ]),
      "",
      "Your Creative Editorial Session proposal",
      "Hi,\n\nI put together the Creative Editorial Session package for this concept. It is built for more stylized portrait or editorial work, with stronger creative direction, a polished final image set, and a short motion asset.\n\nIf you want to make it bigger with styling, studio rental, or multiple looks, I can tailor that as well.\n\nThanks,",
    ],
  ].forEach((preset) => {
    const existing = hasPreset.get(preset[0]) as { 1: number } | undefined;

    if (!existing) {
      insertPreset.run(...preset, timestamp, timestamp);
    }
  });
}

export function getDb() {
  if (!globalForDb.db) {
    mkdirSync(getStorageRoot(), { recursive: true });
    globalForDb.db = new DatabaseSync(dbPath);
  }

  createSchema(globalForDb.db);

  if (!globalForDb.initialized) {
    seedIfNeeded(globalForDb.db);
    globalForDb.initialized = true;
  }

  return globalForDb.db;
}

export function parseJsonList(value: string) {
  try {
    return JSON.parse(value) as string[];
  } catch {
    return [];
  }
}
