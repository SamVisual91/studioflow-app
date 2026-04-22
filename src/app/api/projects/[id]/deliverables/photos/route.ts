import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ensureProjectDeliverablesTable } from "@/lib/deliverables";
import { getUploadPublicPath, getUploadStorageDir } from "@/lib/storage";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getUploadFiles(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is File => value instanceof File && value.size > 0);
}

function createRecentActivity(label: string, timestamp: string) {
  return `${label} on ${new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function updateProjectRecentActivity(
  db: ReturnType<typeof getDb>,
  projectId: string,
  recentActivity: string,
  timestamp: string
) {
  db.prepare("UPDATE projects SET recent_activity = ?, updated_at = ? WHERE id = ?").run(
    recentActivity,
    timestamp,
    projectId
  );
}

async function saveProjectDeliverableFile(file: File) {
  const safeBaseName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "deliverable";
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${safeBaseName}-${randomUUID()}.${extension}`;
  const publicDir = getUploadStorageDir("project-deliverables", "photo");
  const filePath = join(publicDir, fileName);

  await mkdir(publicDir, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return getUploadPublicPath("project-deliverables", "photo", fileName);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: routeProjectId } = await context.params;
    const formData = await request.formData();
    const projectId = getString(formData, "projectId");

    if (!routeProjectId || !projectId || routeProjectId !== projectId) {
      return NextResponse.json({ error: "Invalid project." }, { status: 400 });
    }

    const rawTitle = getString(formData, "title");
    const caption = getString(formData, "caption");
    const files = getUploadFiles(formData, "file");
    const albumTitle = getString(formData, "albumTitle");
    const albumSection = getString(formData, "albumSection");
    const albumDownloadUrl = getString(formData, "albumDownloadUrl");
    const accessType = getString(formData, "accessType").toUpperCase() === "PAID" ? "PAID" : "FREE";
    const rawPrice = getString(formData, "price");
    const photoPrice = rawPrice ? Number(rawPrice) : 0;

    if (files.length === 0) {
      return NextResponse.json({ error: "Choose at least one photo." }, { status: 400 });
    }

    if (albumDownloadUrl) {
      try {
        const parsedUrl = new URL(albumDownloadUrl);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          return NextResponse.json({ error: "Use a valid download link." }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Use a valid download link." }, { status: 400 });
      }
    }

    if (accessType === "PAID" && (!rawPrice || Number.isNaN(photoPrice) || photoPrice <= 0)) {
      return NextResponse.json({ error: "Enter a valid price per photo." }, { status: 400 });
    }

    const db = getDb();
    ensureProjectDeliverablesTable();
    const project = db
      .prepare("SELECT id, client FROM projects WHERE id = ? LIMIT 1")
      .get(projectId) as { id: string; client?: string } | undefined;

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Choose image files only." }, { status: 400 });
      }
    }

    const title = rawTitle || `${project.client || "Client"} Photo Deliverable`;
    const timestamp = new Date().toISOString();
    const insertDeliverable = db.prepare(
      "INSERT INTO project_deliverables (id, project_id, media_type, title, caption, file_path, source_type, thumbnail_path, album_title, album_section, album_download_url, access_type, price, public_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    for (const [index, photoFile] of files.entries()) {
      const filePath = await saveProjectDeliverableFile(photoFile);
      insertDeliverable.run(
        randomUUID(),
        projectId,
        "PHOTO",
        `${title} ${index + 1}`,
        caption,
        filePath,
        "UPLOAD",
        "",
        albumTitle || "Final Gallery",
        albumSection,
        albumDownloadUrl,
        accessType,
        accessType === "PAID" ? photoPrice : 0,
        randomUUID(),
        timestamp,
        timestamp
      );
    }

    updateProjectRecentActivity(
      db,
      projectId,
      createRecentActivity(`${files.length} photo deliverables uploaded`, timestamp),
      timestamp
    );

    return NextResponse.json({ ok: true, uploaded: files.length });
  } catch {
    return NextResponse.json(
      { error: "The photo batch was too large or the upload was interrupted. Try again with fewer large photos at once." },
      { status: 500 }
    );
  }
}
