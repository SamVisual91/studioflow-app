import { NextResponse, type NextRequest } from "next/server";
import {
  ensureMicrosoftGraphMessageSubscription,
  getMicrosoftGraphMaintenanceToken,
} from "@/lib/microsoft-graph-mail";

function isAuthorized(request: NextRequest) {
  const expectedToken = getMicrosoftGraphMaintenanceToken();

  if (!expectedToken) {
    return false;
  }

  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const queryToken = request.nextUrl.searchParams.get("token") || "";

  return bearerToken === expectedToken || queryToken === expectedToken;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const result = await ensureMicrosoftGraphMessageSubscription();
  return NextResponse.json({ ok: true, status: result.status });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
