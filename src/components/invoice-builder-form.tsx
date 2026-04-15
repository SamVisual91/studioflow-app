"use client";

import { useMemo, useState } from "react";

type InvoiceLineItem = {
  title: string;
  description: string;
  amount: number;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  projectId: string;
  clientName: string;
  initialLabel: string;
  initialDueDate: string;
  initialMethod: string;
  initialTaxRate: number;
  initialStatus?: string;
  initialLineItems: InvoiceLineItem[];
  invoiceId?: string;
  previousLabel?: string;
  submitLabel: string;
  helperText?: string;
};

function createBlankItem(): InvoiceLineItem {
  return {
    title: "",
    description: "",
    amount: 0,
  };
}

export function InvoiceBuilderForm({
  action,
  projectId,
  clientName,
  initialLabel,
  initialDueDate,
  initialMethod,
  initialTaxRate,
  initialStatus = "DUE_SOON",
  initialLineItems,
  invoiceId,
  previousLabel = "",
  submitLabel,
  helperText,
}: Props) {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    initialLineItems.length > 0 ? initialLineItems : [createBlankItem()]
  );
  const [taxRate, setTaxRate] = useState(String(initialTaxRate));

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [lineItems]
  );
  const taxAmount = useMemo(() => {
    const parsedTaxRate = Number(taxRate || "0");
    if (Number.isNaN(parsedTaxRate)) {
      return 0;
    }
    return Math.round(subtotal * parsedTaxRate) / 100;
  }, [subtotal, taxRate]);
  const grandTotal = subtotal + taxAmount;

  function updateLineItem(index: number, key: keyof InvoiceLineItem, value: string) {
    setLineItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: key === "amount" ? Number(value || 0) : value,
            }
          : item
      )
    );
  }

  function addLineItem() {
    setLineItems((current) => [...current, createBlankItem()]);
  }

  function removeLineItem(index: number) {
    setLineItems((current) => (current.length === 1 ? [createBlankItem()] : current.filter((_, itemIndex) => itemIndex !== index)));
  }

  return (
    <form
      action={action}
      className="rounded-[1.8rem] border border-black/[0.08] bg-white p-7 shadow-[0_18px_40px_rgba(58,34,17,0.08)]"
    >
      <input name="projectId" type="hidden" value={projectId} />
      <input name="clientName" type="hidden" value={clientName} />
      <input name="invoiceId" type="hidden" value={invoiceId || ""} />
      <input name="previousLabel" type="hidden" value={previousLabel} />
      <input name="status" type="hidden" value={initialStatus} />
      <input name="lineItems" type="hidden" value={JSON.stringify(lineItems)} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Invoice editor</p>
          <h2 className="mt-3 text-2xl font-semibold">Adjust pricing and payment details</h2>
        </div>
        <div className="text-right text-sm">
          <p className="text-[var(--muted)]">Live total</p>
          <p className="mt-1 text-2xl font-semibold">${grandTotal.toLocaleString()}</p>
        </div>
      </div>

      {helperText ? (
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{helperText}</p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm font-medium">
          Label
          <input
            className="rounded-2xl border border-black/[0.08] px-4 py-3"
            defaultValue={initialLabel}
            name="label"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Due date
          <input
            className="rounded-2xl border border-black/[0.08] px-4 py-3"
            defaultValue={initialDueDate}
            name="dueDate"
            required
            type="date"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Method
          <input
            className="rounded-2xl border border-black/[0.08] px-4 py-3"
            defaultValue={initialMethod}
            name="method"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Tax rate %
          <input
            className="rounded-2xl border border-black/[0.08] px-4 py-3"
            min="0"
            name="taxRate"
            onChange={(event) => setTaxRate(event.target.value)}
            required
            step="0.01"
            type="number"
            value={taxRate}
          />
        </label>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">Line items</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Add coverage, add-ons, travel, albums, or anything else the client wants.</p>
          </div>
          <button
            className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
            onClick={addLineItem}
            type="button"
          >
            Add item
          </button>
        </div>

        {lineItems.map((item, index) => (
          <div
            key={`line-item-${index}`}
            className="grid gap-3 rounded-[1.4rem] border border-black/[0.08] bg-[rgba(247,241,232,0.52)] p-4 md:grid-cols-[1fr_1.2fr_0.45fr_auto]"
          >
            <label className="grid gap-2 text-sm font-medium">
              Item
              <input
                className="rounded-2xl border border-black/[0.08] px-4 py-3"
                onChange={(event) => updateLineItem(index, "title", event.target.value)}
                required
                type="text"
                value={item.title}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Description
              <input
                className="rounded-2xl border border-black/[0.08] px-4 py-3"
                onChange={(event) => updateLineItem(index, "description", event.target.value)}
                type="text"
                value={item.description}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Price
              <input
                className="rounded-2xl border border-black/[0.08] px-4 py-3"
                min="0"
                onChange={(event) => updateLineItem(index, "amount", event.target.value)}
                required
                step="1"
                type="number"
                value={String(item.amount)}
              />
            </label>
            <div className="flex items-end">
              <button
                className="rounded-full border border-[rgba(207,114,79,0.24)] bg-[rgba(207,114,79,0.08)] px-4 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.14)]"
                onClick={() => removeLineItem(index)}
                type="button"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 ml-auto max-w-sm border-t border-black/[0.08] pt-6 text-sm">
        <div className="flex items-center justify-between py-3 text-[var(--muted)]">
          <span>Subtotal</span>
          <span>${subtotal.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between py-3 text-[var(--muted)]">
          <span>Tax</span>
          <span>${taxAmount.toLocaleString()}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t-2 border-[var(--ink)] pt-4 text-2xl font-semibold">
          <span>Grand Total</span>
          <span>${grandTotal.toLocaleString()}</span>
        </div>
      </div>

      <button className="mt-6 rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
        {submitLabel}
      </button>
    </form>
  );
}
