import { join } from "node:path";

const storageRoot = join(process.cwd(), "data");
const uploadsRoot = join(storageRoot, "uploads");

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

export function getUploadStorageDir(...segments: string[]) {
  return join(uploadsRoot, ...normalizeUploadSegments(segments));
}

export function getUploadPublicPath(...segments: string[]) {
  return `/${["uploads", ...normalizeUploadSegments(segments)].join("/")}`;
}

export function resolveUploadStoragePath(publicPath: string) {
  if (!publicPath.startsWith("/uploads/")) {
    throw new Error("INVALID_UPLOAD_PUBLIC_PATH");
  }

  const segments = publicPath.replace(/^\/uploads\//, "").split("/");
  return join(uploadsRoot, ...normalizeUploadSegments(segments));
}
