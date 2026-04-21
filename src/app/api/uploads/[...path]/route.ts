import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessBackOffice } from "@/lib/roles";
import { getUploadsRoot } from "@/lib/storage";

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
};

function resolveRouteFilePath(pathSegments: string[]) {
  if (pathSegments.some((segment) => segment === "." || segment === "..")) {
    throw new Error("INVALID_UPLOAD_PATH");
  }

  return join(getUploadsRoot(), ...pathSegments);
}

function isPublicUploadBucket(pathSegments: string[]) {
  const bucket = String(pathSegments[0] || "").trim().toLowerCase();
  return bucket === "client-uploads" || bucket === "project-deliverables";
}

function requiresBackOfficeAccess(pathSegments: string[]) {
  const bucket = String(pathSegments[0] || "").trim().toLowerCase();
  return bucket === "ledger-receipts";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;

  try {
    if (!isPublicUploadBucket(path)) {
      const user = await getCurrentUser();

      if (!user) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      if (requiresBackOfficeAccess(path) && !canAccessBackOffice(user.role)) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    const filePath = resolveRouteFilePath(path);
    const file = await readFile(filePath);
    const extension = extname(filePath).toLowerCase();

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentTypes[extension] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
