import { join } from "node:path";

const storageRoot = join(/* turbopackIgnore: true */ process.cwd(), "data");
const uploadsRoot = join(storageRoot, "uploads");
const workVideosRoot = join(storageRoot, "work-videos");

function normalizeUploadSegments(segments: string[]) {
  const cleaned = segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .flatMap((segment) => segment.split("/"))
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (cleaned.some((segment) => segment === "." || segment === "..")) {
    throw new Error("INVALID_UPLOAD_PATH");
  }

  return cleaned;
}

export function getStorageRoot() {
  return storageRoot;
}

export function getUploadsRoot() {
  return uploadsRoot;
}

export function getWorkVideosRoot() {
  return workVideosRoot;
}

export function getUploadStorageDir(...segments: string[]) {
  return join(uploadsRoot, ...normalizeUploadSegments(segments));
}

export function getUploadPublicPath(...segments: string[]) {
  return `/${["api", "uploads", ...normalizeUploadSegments(segments)].join("/")}`;
}

export function resolveUploadStoragePath(publicPath: string) {
  const normalizedPath = publicPath.startsWith("/api/uploads/")
    ? publicPath.replace(/^\/api/, "")
    : publicPath;

  if (!normalizedPath.startsWith("/uploads/")) {
    throw new Error("INVALID_UPLOAD_PUBLIC_PATH");
  }

  const segments = normalizedPath.replace(/^\/uploads\//, "").split("/");
  return join(uploadsRoot, ...normalizeUploadSegments(segments));
}
