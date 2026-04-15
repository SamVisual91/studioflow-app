"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type GalleryEditPopoverProps = {
  label: string;
  children: ReactNode;
};

export function GalleryEditPopover({ label, children }: GalleryEditPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        aria-label={label}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/14 bg-white/[0.06] text-white transition hover:bg-white/[0.14]"
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen(true);
        }}
        title={label}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        <span className="sr-only">{label}</span>
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/55 px-4 py-6 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[1.25rem] border border-white/12 bg-[#171411] p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.42)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/64">{label}</h3>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/12 text-white/72 transition hover:bg-white/10 hover:text-white"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </div>
            {children}
          </div>
        </div>
      ) : null}
    </>
  );
}
