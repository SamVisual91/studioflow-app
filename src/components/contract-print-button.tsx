"use client";

export function ContractPrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="contract-print-hide rounded-full border border-black/20 bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-black/5">
      Print contract
    </button>
  );
}
