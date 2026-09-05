"use client";

import { useEffect } from "react";

export function PackageBrochureViewTracker({ token }: { token: string }) {
  useEffect(() => {
    void fetch(`/api/package-brochures/view?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
      method: "POST",
    }).catch(() => undefined);
  }, [token]);

  return null;
}
