import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getWorkVideosRoot } from "@/lib/storage";

const contentTypes: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".m4v": "video/x-m4v",
};

function resolveRouteFilePath(pathSegments: string[]) {
  if (pathSegments.some((segment) => segment === "." || segment === "..")) {
    throw new Error("INVALID_VIDEO_PATH");
  }

  return join(getWorkVideosRoot(), ...pathSegments);
}

function toContentType(filePath: string) {
  return contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;

  try {
    const filePath = resolveRouteFilePath(path);
    const fileStats = await stat(filePath);
    const fileSize = fileStats.size;
    const rangeHeader = request.headers.get("range");
    const contentType = toContentType(filePath);

    if (rangeHeader) {
      const bytesPrefix = "bytes=";
      const rawRange = rangeHeader.startsWith(bytesPrefix)
        ? rangeHeader.slice(bytesPrefix.length)
        : rangeHeader;
      const [startInput, endInput] = rawRange.split("-");
      const start = Number.parseInt(startInput || "0", 10);
      const end = endInput ? Number.parseInt(endInput, 10) : fileSize - 1;

      if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        start < 0 ||
        end >= fileSize ||
        start > end
      ) {
        return new NextResponse("Requested range not satisfiable", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const stream = createReadStream(filePath, { start, end });

      return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
        status: 206,
        headers: {
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Type": contentType,
        },
      });
    }

    const stream = createReadStream(filePath);

    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(fileSize),
        "Content-Type": contentType,
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

