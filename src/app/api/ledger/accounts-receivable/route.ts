import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAccountsReceivableCsv } from "@/lib/accounts-receivable";
import { canAccessBackOffice } from "@/lib/roles";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessBackOffice(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return new NextResponse(createAccountsReceivableCsv(), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="studioflow-accounts-receivable.csv"',
    },
  });
}
