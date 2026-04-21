import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { canAccessBackOffice } from "@/lib/roles";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessBackOffice(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const leads = db.prepare("SELECT * FROM leads ORDER BY event_date ASC").all();

  return NextResponse.json(leads);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccessBackOffice(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const name = String(body.name || "").trim();
  const service = String(body.service || "").trim();
  const source = String(body.source || "").trim();
  const notes = String(body.notes || "").trim();
  const eventDate = String(body.eventDate || "").trim();
  const value = Number(body.value || 0);

  if (!name || !service || !source || !notes || !eventDate || Number.isNaN(value)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const db = getDb();
  const timestamp = new Date().toISOString();
  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO leads (id, name, service, stage, value, event_date, source, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, name, service, "INQUIRY", value, eventDate, source, notes, timestamp, timestamp);

  return NextResponse.json(
    { id, name, service, stage: "INQUIRY", value, eventDate, source, notes },
    { status: 201 }
  );
}
