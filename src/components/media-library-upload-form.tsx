"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function MediaLibraryUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [statusLabel, setStatusLabel] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = inputRef.current;
    const files = input?.files;

    if (!files || files.length === 0) {
      setError("Choose at least one video file before uploading.");
      return;
    }

    const filesList = Array.from(files);
    const totalBytes = filesList.reduce((sum, file) => sum + file.size, 0);
    let uploadedBytes = 0;

    setIsUploading(true);
    setProgress(0);
    setError("");

    try {
      for (let index = 0; index < filesList.length; index += 1) {
        const file = filesList[index];
        setStatusLabel(`Uploading ${index + 1} of ${filesList.length}: ${file.name}`);

        await new Promise<void>((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open("POST", "/api/work-videos/upload");
          request.withCredentials = true;
          request.setRequestHeader("x-file-name", encodeURIComponent(file.name));
          request.setRequestHeader("content-type", file.type || "application/octet-stream");

          request.upload.onprogress = (uploadEvent) => {
            const currentFileBytes = uploadEvent.lengthComputable ? uploadEvent.loaded : 0;
            const completedBytes = uploadedBytes + currentFileBytes;
            const nextProgress =
              totalBytes > 0 ? Math.min(Math.round((completedBytes / totalBytes) * 100), 99) : 0;
            setProgress(nextProgress);
          };

          request.onerror = () => {
            reject(new Error("network"));
          };

          request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
              uploadedBytes += file.size;
              setProgress(totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 100);
              resolve();
              return;
            }

            reject(new Error("upload"));
          };

          request.send(file);
        });
      }

      setStatusLabel("Finishing up...");
      setProgress(100);
      setIsUploading(false);
      setStatusLabel("");
      if (input) {
        input.value = "";
      }
      router.push("/media-library?uploaded=1");
      router.refresh();
    } catch {
      setIsUploading(false);
      setStatusLabel("");
      setError("We couldn't upload those videos right now.");
    }
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
        Select one or more video files
        <input
          accept=".mp4,.mov,.m4v,.webm,video/*"
          className="rounded-2xl border border-black/10 bg-white px-4 py-3"
          multiple
          name="videos"
          ref={inputRef}
          type="file"
        />
      </label>
      {isUploading ? (
        <div className="grid gap-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            <span>{statusLabel || "Uploading videos..."}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full bg-[var(--ink)] transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-[rgba(207,114,79,0.16)] bg-[rgba(207,114,79,0.08)] px-4 py-3 text-sm text-[var(--accent)]">
          {error}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-2xl bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isUploading}
          type="submit"
        >
          {isUploading ? "Uploading videos..." : "Upload videos"}
        </button>
      </div>
    </form>
  );
}
