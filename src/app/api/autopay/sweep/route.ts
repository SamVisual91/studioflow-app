import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { processAllAutopayInvoices } from "@/lib/autopay";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const expected = process.env.AUTOPAY_SWEEP_TOKEN?.trim();
  if (!expected) {
    return false;
  }

  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  return token === expected;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed = await processAllAutopayInvoices();
  revalidatePath("/ledger");
  return NextResponse.json({ ok: true, processed });
}
