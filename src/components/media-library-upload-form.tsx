"use client";

import { useFormStatus } from "react-dom";
import { uploadWorkVideosAction } from "@/app/actions";

function UploadVideosButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-2xl bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Uploading videos..." : "Upload videos"}
    </button>
  );
}

export function MediaLibraryUploadForm() {
  return (
    <form action={uploadWorkVideosAction} className="mt-8 grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
        Select one or more video files
        <input
          accept=".mp4,.mov,.m4v,.webm,video/*"
          className="rounded-2xl border border-black/10 bg-white px-4 py-3"
          multiple
          name="videos"
          type="file"
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <UploadVideosButton />
      </div>
    </form>
  );
}

