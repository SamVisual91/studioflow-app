import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getContractDocumentSummary, parseContractDocument } from "@/lib/contracts";
import { getDb } from "@/lib/db";

function ensureDocumentTemplatesTable() {
  const db = getDb();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS document_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_type TEXT NOT NULL,
      template_type TEXT NOT NULL,
      summary TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const templateId = String(body.templateId || "").trim();
  const clientType = String(body.clientType || "").trim();
  const title = String(body.title || "").trim();
  const rawBody = String(body.body || "");

  if (!clientType || !title || !rawBody) {
    return NextResponse.json({ error: "Invalid template payload" }, { status: 400 });
  }

  ensureDocumentTemplatesTable();
  const db = getDb();
  const timestamp = new Date().toISOString();
  const nextTemplateId = templateId || randomUUID();
  const summary = getContractDocumentSummary(parseContractDocument(rawBody));

  if (templateId) {
    db.prepare(
      "UPDATE document_templates SET name = ?, client_type = ?, template_type = 'Contract', summary = ?, body = ?, updated_at = ? WHERE id = ?"
    ).run(title, clientType, summary, rawBody, timestamp, templateId);
  } else {
    db.prepare(
      "INSERT INTO document_templates (id, name, client_type, template_type, summary, body, created_at, updated_at) VALUES (?, ?, ?, 'Contract', ?, ?, ?, ?)"
    ).run(nextTemplateId, title, clientType, summary, rawBody, timestamp, timestamp);
  }

  revalidatePath("/templates");
  revalidatePath("/templates/contract");

  return NextResponse.json({ ok: true, templateId: nextTemplateId, summary });
}
