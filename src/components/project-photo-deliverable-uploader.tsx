"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const PHOTO_BATCH_SIZE = 3;

export function ProjectPhotoDeliverableUploader({
  projectId,
  clientName,
  returnPath,
}: {
  projectId: string;
  clientName: string;
  returnPath: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = formRef.current;

    if (!form) {
      return;
    }

    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    const files = Array.from(fileInput?.files || []);

    if (files.length === 0) {
      setError("Choose at least one photo.");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const chunks: File[][] = [];

      for (let index = 0; index < files.length; index += PHOTO_BATCH_SIZE) {
        chunks.push(files.slice(index, index + PHOTO_BATCH_SIZE));
      }

      for (const [batchIndex, chunk] of chunks.entries()) {
        setUploadProgress(
          chunks.length === 1
            ? `Uploading ${chunk.length} photo${chunk.length === 1 ? "" : "s"}...`
            : `Uploading batch ${batchIndex + 1} of ${chunks.length}...`
        );

        const batchFormData = new FormData();
        batchFormData.set("projectId", projectId);
        batchFormData.set("title", String((form.elements.namedItem("title") as HTMLInputElement | null)?.value || ""));
        batchFormData.set("caption", String((form.elements.namedItem("caption") as HTMLInputElement | null)?.value || ""));
        batchFormData.set(
          "albumTitle",
          String((form.elements.namedItem("albumTitle") as HTMLInputElement | null)?.value || "")
        );
        batchFormData.set(
          "albumSection",
          String((form.elements.namedItem("albumSection") as HTMLInputElement | null)?.value || "")
        );
        batchFormData.set(
          "albumDownloadUrl",
          String((form.elements.namedItem("albumDownloadUrl") as HTMLInputElement | null)?.value || "")
        );
        batchFormData.set(
          "accessType",
          String((form.elements.namedItem("accessType") as HTMLSelectElement | null)?.value || "FREE")
        );
        batchFormData.set("price", String((form.elements.namedItem("price") as HTMLInputElement | null)?.value || ""));

        for (const file of chunk) {
          batchFormData.append("file", file);
        }

        const response = await fetch(`/api/projects/${projectId}/deliverables/photos`, {
          method: "POST",
          body: batchFormData,
        });

        const payload = (await response.json().catch(() => ({}))) as { error?: string };

        if (!response.ok) {
          if (response.status === 413) {
            throw new Error("These photos are still too large for one upload batch. Try smaller image files or upload fewer high-resolution photos at a time.");
          }

          throw new Error(payload.error || "Photo upload failed.");
        }
      }

      router.replace(`${returnPath}?deliverableUploaded=1`);
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Photo upload failed.");
      setIsUploading(false);
      setUploadProgress("");
      return;
    }
  }

  return (
    <form
      className="grid self-start gap-4 rounded-[1.5rem] border border-black/[0.08] bg-[rgba(247,241,232,0.62)] p-5"
      encType="multipart/form-data"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <input name="projectId" type="hidden" value={projectId} />
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.08] bg-white/85 text-[var(--forest)]">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect width="18" height="14" x="3" y="5" rx="2.5" />
                <circle cx="8.5" cy="10" r="1.75" />
                <path d="m21 15-4.5-4.5L9 18" />
              </svg>
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Upload photo</p>
              <h3 className="mt-2 text-xl font-semibold">Client photo</h3>
            </div>
          </div>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-white/80 text-[var(--muted)] transition group-open:rotate-180">
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </summary>
        <div className="mt-4 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Title
            <input
              className="rounded-xl border border-black/[0.08] bg-white px-4 py-3"
              defaultValue={`${clientName} Photo`}
              name="title"
            />
          </label>
          <div className="grid gap-3 rounded-[1.2rem] border border-black/[0.08] bg-white/70 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Album delivery</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Use albums for larger galleries so clients can open one collection, select photos, or download the full Synology folder.
              </p>
            </div>
            <label className="grid gap-2 text-sm font-semibold">
              Album name
              <input
                className="rounded-xl border border-black/[0.08] bg-white px-4 py-3"
                defaultValue="Final Gallery"
                name="albumTitle"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Section
              <input
                className="rounded-xl border border-black/[0.08] bg-white px-4 py-3"
                name="albumSection"
                placeholder="Example: Ceremony, Reception, Portraits"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Synology download-all link
              <input
                className="rounded-xl border border-black/[0.08] bg-white px-4 py-3"
                name="albumDownloadUrl"
                placeholder="https://your-synology-folder-share-link"
                type="url"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Caption
            <input
              className="rounded-xl border border-black/[0.08] bg-white px-4 py-3"
              name="caption"
              placeholder="Example: Preview image, final portrait, gallery cover"
            />
          </label>
          <div className="grid gap-4 rounded-[1.2rem] border border-black/[0.08] bg-white/70 p-4">
            <label className="grid gap-2 text-sm font-semibold">
              Photo access
              <select
                className="rounded-xl border border-black/[0.08] bg-white px-4 py-3"
                defaultValue="FREE"
                name="accessType"
              >
                <option value="FREE">Free / already paid</option>
                <option value="PAID">Client must purchase</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Price per photo
              <input
                className="rounded-xl border border-black/[0.08] bg-white px-4 py-3"
                defaultValue="0"
                min="0"
                name="price"
                placeholder="0.00"
                step="0.01"
                type="number"
              />
            </label>
            <p className="text-xs leading-5 text-[var(--muted)]">
              Keep the photo free if it is already included in the package. Switch it to paid when clients should purchase each image individually.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Photo files
            <input
              accept="image/*"
              className="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm"
              name="file"
              multiple
              type="file"
            />
            <span className="text-xs font-normal leading-5 text-[var(--muted)]">
              Larger uploads are sent in smaller batches automatically so the page stays stable.
            </span>
          </label>
          {error ? (
            <div className="rounded-xl border border-[rgba(207,114,79,0.24)] bg-[rgba(207,114,79,0.08)] px-4 py-3 text-sm text-[var(--accent)]">
              {error}
            </div>
          ) : null}
          {uploadProgress ? (
            <div className="rounded-xl border border-[rgba(47,125,92,0.18)] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm text-[var(--forest)]">
              {uploadProgress}
            </div>
          ) : null}
          <button
            className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isUploading}
          >
            {isUploading ? "Uploading photos..." : "Upload photos"}
          </button>
        </div>
      </details>
    </form>
  );
}
