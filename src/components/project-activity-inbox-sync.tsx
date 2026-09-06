"use client";

import { startTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const RESYNC_INTERVAL_MS = 60_000;

export function ProjectActivityInboxSync({ projectId }: { projectId: string }) {
  const router = useRouter();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current || !projectId) {
      return;
    }

    hasStarted.current = true;
    const storageKey = `studioflow:project-inbox-sync:${projectId}`;
    const lastSyncedAt = Number(window.sessionStorage.getItem(storageKey) || "0");

    if (lastSyncedAt && Date.now() - lastSyncedAt < RESYNC_INTERVAL_MS) {
      return;
    }

    window.sessionStorage.setItem(storageKey, String(Date.now()));

    // Inbox access can be slow. Keep it outside the server-rendered page so opening Activity stays immediate.
    void fetch(`/api/projects/${encodeURIComponent(projectId)}/messages/sync`, {
      method: "POST",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return (await response.json()) as { imported?: number };
      })
      .then((result) => {
        if (Number(result?.imported || 0) > 0) {
          startTransition(() => router.refresh());
        }
      })
      .catch(() => {
        // The Activity tab remains usable if inbox sync is temporarily unavailable.
      });
  }, [projectId, router]);

  return null;
}
