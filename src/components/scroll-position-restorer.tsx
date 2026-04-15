"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const SCROLL_KEY_PREFIX = "studioflow-scroll";

function getScrollKey(pathname: string) {
  return `${SCROLL_KEY_PREFIX}:${pathname}`;
}

function saveScrollPosition(pathname: string) {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(getScrollKey(pathname), String(window.scrollY));
}

export function ScrollPositionRestorer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const savedPosition = sessionStorage.getItem(getScrollKey(pathname));

    if (!savedPosition || window.location.hash) {
      return;
    }

    const scrollToSavedPosition = () => {
      window.scrollTo({ top: Number(savedPosition), behavior: "instant" });
    };

    const frame = window.requestAnimationFrame(() => {
      scrollToSavedPosition();
      window.setTimeout(scrollToSavedPosition, 120);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, searchParams]);

  useEffect(() => {
    let frame = 0;

    const saveCurrentPosition = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        saveScrollPosition(pathname);
        frame = 0;
      });
    };

    const saveBeforePageWork = () => saveScrollPosition(pathname);

    window.addEventListener("scroll", saveCurrentPosition, { passive: true });
    window.addEventListener("beforeunload", saveBeforePageWork);
    document.addEventListener("submit", saveBeforePageWork, true);
    document.addEventListener("click", saveBeforePageWork, true);
    document.addEventListener("change", saveBeforePageWork, true);

    return () => {
      window.removeEventListener("scroll", saveCurrentPosition);
      window.removeEventListener("beforeunload", saveBeforePageWork);
      document.removeEventListener("submit", saveBeforePageWork, true);
      document.removeEventListener("click", saveBeforePageWork, true);
      document.removeEventListener("change", saveBeforePageWork, true);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [pathname]);

  return null;
}
