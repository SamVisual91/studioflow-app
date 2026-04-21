import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { canViewProjectFinancials } from "@/lib/roles";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canViewProjectFinancials(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getDb();
  return NextResponse.json(db.prepare("SELECT * FROM proposals ORDER BY sent_date DESC").all());
}
