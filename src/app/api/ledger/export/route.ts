import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createLedgerCsv } from "@/lib/ledger";
import { canAccessBackOffice } from "@/lib/roles";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessBackOffice(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "schedule-c" ? "schedule-c" : "standard";
  const csv = createLedgerCsv(format);
  const fileName = format === "schedule-c" ? "studioflow-schedule-c-export.csv" : "studioflow-ledger-export.csv";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
