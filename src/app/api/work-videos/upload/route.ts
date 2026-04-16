import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
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

  const formData = await request.formData();
  const videos = formData
    .getAll("videos")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (videos.length === 0) {
    return NextResponse.json({ error: "videos-missing" }, { status: 400 });
  }

  const workVideosRoot = getWorkVideosRoot();
  await mkdir(workVideosRoot, { recursive: true });

  for (const video of videos) {
    const normalizedFileName = normalizeVideoFileName(video.name);
    const outputPath = join(workVideosRoot, normalizedFileName);
    const bytes = Buffer.from(await video.arrayBuffer());
    await writeFile(outputPath, bytes);
  }

  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/video-production");
  revalidatePath("/wedding");
  revalidatePath("/portfolio");
  revalidatePath("/media-library");

  return NextResponse.json({ ok: true });
}

