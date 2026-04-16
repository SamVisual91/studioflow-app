import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { NextResponse } from "next/server";
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;

  try {
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
