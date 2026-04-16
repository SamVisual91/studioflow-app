import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWorkVideosRoot } from "@/lib/storage";

function normalizeVideoFileName(name: string) {
  const trimmed = name.trim().toLowerCase();

  if (!trimmed) {
    throw new Error("INVALID_VIDEO_FILE_NAME");
  }

  const normalized = trimmed.replace(/[^a-z0-9._-]+/g, "-");

  if (normalized === "." || normalized === "..") {
    throw new Error("INVALID_VIDEO_FILE_NAME");
  }

  return normalized;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rawFileName = request.headers.get("x-file-name") || "";
  const normalizedFileName = normalizeVideoFileName(decodeURIComponent(rawFileName));

  if (!request.body) {
    return NextResponse.json({ error: "videos-missing" }, { status: 400 });
  }

  const workVideosRoot = getWorkVideosRoot();
  await mkdir(workVideosRoot, { recursive: true });
  const outputPath = join(workVideosRoot, normalizedFileName);
  const fileStream = createWriteStream(outputPath);
  await pipeline(Readable.fromWeb(request.body as never), fileStream);

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/video-production");
  revalidatePath("/wedding");
  revalidatePath("/portfolio");
  revalidatePath("/media-library");

  return NextResponse.json({ ok: true });
}
