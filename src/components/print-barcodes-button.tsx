"use client";

export function PrintBarcodesButton() {
  return (
    <button
      className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
      onClick={() => window.print()}
      type="button"
    >
      Print labels
    </button>
  );
}
