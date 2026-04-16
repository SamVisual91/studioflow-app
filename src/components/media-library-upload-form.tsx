"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function MediaLibraryUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input = inputRef.current;
    const files = input?.files;

    if (!files || files.length === 0) {
      setError("Choose at least one video file before uploading.");
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("videos", file);
    });

    const request = new XMLHttpRequest();
    request.open("POST", "/api/work-videos/upload");
    request.withCredentials = true;

    request.upload.onprogress = (uploadEvent) => {
      if (!uploadEvent.lengthComputable) {
        return;
      }

      setProgress(Math.round((uploadEvent.loaded / uploadEvent.total) * 100));
    };

    request.onloadstart = () => {
      setIsUploading(true);
      setProgress(0);
      setError("");
    };

    request.onerror = () => {
      setIsUploading(false);
      setError("The upload ran into a network problem. Please try again.");
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        setProgress(100);
        setIsUploading(false);
        if (input) {
          input.value = "";
        }
        router.push("/media-library?uploaded=1");
        router.refresh();
        return;
      }

      setIsUploading(false);
      setError("We couldn't upload those videos right now.");
    };

    request.send(formData);
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
            <span>Uploading videos...</span>
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
