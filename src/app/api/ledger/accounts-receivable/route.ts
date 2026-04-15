import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAccountsReceivableCsv } from "@/lib/accounts-receivable";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return new NextResponse(createAccountsReceivableCsv(), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="studioflow-accounts-receivable.csv"',
    },
  });
}
