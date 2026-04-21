"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type InvoiceLineItem = {
  title: string;
  description: string;
  image?: string;
  amount: number;
};

type PaymentScheduleItem = {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  invoiceNumber: string;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  secondaryAction?: (formData: FormData) => void | Promise<void>;
  secondarySubmitLabel?: string;
  projectId: string;
  clientName: string;
  projectName: string;
  heroImage: string;
  initialLabel: string;
  initialDueDate: string;
  initialMethod: string;
  initialTaxRate: number;
  initialStatus: string;
  initialLineItems: InvoiceLineItem[];
  initialPaymentSchedule: PaymentScheduleItem[];
  invoiceId?: string;
  previousLabel?: string;
  submitLabel: string;
  hiddenFields?: Record<string, string>;
  formId?: string;
};

function createBlankLineItem(): InvoiceLineItem {
  return {
    title: "",
    description: "",
    image: "",
    amount: 0,
  };
}

function createBlankScheduleItem(): PaymentScheduleItem {
  return {
    id: crypto.randomUUID(),
    amount: 0,
    dueDate: "",
    status: "UPCOMING",
    invoiceNumber: "",
  };
}

function addDays(dateString: string, days: number) {
  const baseDate = dateString ? new Date(`${dateString}T12:00:00`) : new Date();
  baseDate.setDate(baseDate.getDate() + days);
  return baseDate.toISOString().slice(0, 10);
}

function splitAmounts(total: number, percentages: number[]) {
  const centsTotal = Math.round(total * 100);
  let allocated = 0;

  return percentages.map((percentage, index) => {
    if (index === percentages.length - 1) {
      return (centsTotal - allocated) / 100;
    }

    const portion = Math.round(centsTotal * percentage);
    allocated += portion;
    return portion / 100;
  });
}

export function InvoiceWorkspace({
  action,
  secondaryAction,
  secondarySubmitLabel = "",
  projectId,
  clientName,
  projectName,
  heroImage,
  initialLabel,
  initialDueDate,
  initialMethod,
  initialTaxRate,
  initialStatus,
  initialLineItems,
  initialPaymentSchedule,
  invoiceId,
  previousLabel = "",
  submitLabel,
  hiddenFields = {},
  formId,
}: Props) {
  const [label, setLabel] = useState(initialLabel);
  const [dueDate] = useState(initialDueDate);
  const [method] = useState(initialMethod);
  const [status] = useState(initialStatus);
  const [taxRate, setTaxRate] = useState(String(initialTaxRate));
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    initialLineItems.length > 0 ? initialLineItems : [createBlankLineItem()]
  );
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>(
    initialPaymentSchedule.length > 0 ? initialPaymentSchedule : [createBlankScheduleItem()]
  );
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const hasMountedRef = useRef(false);

  function getDerivedPaymentStatus(item: PaymentScheduleItem) {
    if (item.status === "PAID") {
      return "PAID";
    }

    if (!item.dueDate) {
      return "UPCOMING";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(`${item.dueDate}T00:00:00`);

    if (Number.isNaN(due.getTime())) {
      return "UPCOMING";
    }

    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? "OVERDUE" : "UPCOMING";
  }

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [lineItems]
  );
  const parsedTaxRate = Number(taxRate || "0");
  const taxAmount = useMemo(
    () => (Number.isNaN(parsedTaxRate) ? 0 : Math.round(subtotal * parsedTaxRate) / 100),
    [parsedTaxRate, subtotal]
  );
  const grandTotal = subtotal + taxAmount;
  const scheduledTotal = useMemo(
    () => paymentSchedule.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [paymentSchedule]
  );
  const normalizedPaymentSchedule = useMemo(
    () =>
      paymentSchedule.map((item, index) => ({
        ...item,
        amount:
          paymentSchedule.length === 1
            ? Math.round(grandTotal * 100) / 100
            : item.amount,
        invoiceNumber: item.invoiceNumber || `#${(invoiceId || "draft").slice(0, 6).toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
        status: getDerivedPaymentStatus(item),
      })),
    [paymentSchedule, invoiceId, grandTotal]
  );

  useEffect(() => {
    if (!invoiceId) {
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const timeout = window.setTimeout(async () => {
      setAutosaveState("saving");

      try {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            label,
            dueDate,
            method,
            status,
            taxRate,
            lineItems,
            paymentSchedule: normalizedPaymentSchedule,
          }),
        });

        setAutosaveState(response.ok ? "saved" : "error");
      } catch {
        setAutosaveState("error");
      }
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [
    invoiceId,
    projectId,
    label,
    dueDate,
    method,
    status,
    taxRate,
    lineItems,
    normalizedPaymentSchedule,
  ]);

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

  function changeLineItemImage(index: number) {
    const currentImage = lineItems[index]?.image || "";
    const nextImage = window.prompt("Paste a new image URL for this item.", currentImage);

    if (nextImage === null) {
      return;
    }

    updateLineItem(index, "image", nextImage);
  }

  function updateGrandTotal(value: string) {
    const parsed = Number(value);

    if (Number.isNaN(parsed) || parsed < 0 || lineItems.length === 0) {
      return;
    }

    const targetSubtotal = parsed - taxAmount;
    const otherItemsTotal = lineItems.slice(0, -1).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const lastItemAmount = Math.max(0, Math.round((targetSubtotal - otherItemsTotal) * 100) / 100);

    setLineItems((current) =>
      current.map((item, index) =>
        index === current.length - 1
          ? {
              ...item,
              amount: lastItemAmount,
            }
          : item
      )
    );
  }

  function addLineItem() {
    setLineItems((current) => [...current, createBlankLineItem()]);
  }

  function removeLineItem(index: number) {
    setLineItems((current) => (current.length === 1 ? [createBlankLineItem()] : current.filter((_, itemIndex) => itemIndex !== index)));
  }

  function updateScheduleItem(index: number, key: keyof PaymentScheduleItem, value: string) {
    setPaymentSchedule((current) =>
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

  function addScheduleItem() {
    setPaymentSchedule((current) => [...current, createBlankScheduleItem()]);
  }

  function removeScheduleItem(index: number) {
    setPaymentSchedule((current) =>
      current.length === 1 ? [createBlankScheduleItem()] : current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function applyScheduleTemplate(
    template: "full" | "30-70" | "50-50" | "50-25-25" | "four" | "monthly" | "wedding"
  ) {
    if (grandTotal <= 0) {
      return;
    }

    const baseDate = dueDate || new Date().toISOString().slice(0, 10);

    const scheduleMap = {
      full: {
        amounts: splitAmounts(grandTotal, [1]),
        offsets: [0],
        notes: ["Full invoice payment"],
      },
      "30-70": {
        amounts: splitAmounts(grandTotal, [0.3, 0.7]),
        offsets: [0, 30],
        notes: ["Retainer", "Remaining balance"],
      },
      "50-50": {
        amounts: splitAmounts(grandTotal, [0.5, 0.5]),
        offsets: [0, 30],
        notes: ["Retainer", "Final payment"],
      },
      "50-25-25": {
        amounts: splitAmounts(grandTotal, [0.5, 0.25, 0.25]),
        offsets: [0, 30, 60],
        notes: ["Retainer", "Second payment", "Final payment"],
      },
      four: {
        amounts: splitAmounts(grandTotal, [0.25, 0.25, 0.25, 0.25]),
        offsets: [0, 30, 60, 90],
        notes: ["Installment 1", "Installment 2", "Installment 3", "Installment 4"],
      },
      monthly: {
        amounts: splitAmounts(grandTotal, [0.25, 0.25, 0.25, 0.25]),
        offsets: [0, 30, 60, 90],
        notes: ["Month 1 payment", "Month 2 payment", "Month 3 payment", "Month 4 payment"],
      },
      wedding: {
        amounts: splitAmounts(grandTotal, [0.35, 0.35, 0.3]),
        offsets: [0, 60, 120],
        notes: ["Booking retainer", "Pre-wedding payment", "Final delivery payment"],
      },
    } as const;

    const selected = scheduleMap[template];

    setPaymentSchedule(
      selected.amounts.map((amount, index) => ({
        id: crypto.randomUUID(),
        amount,
        dueDate: addDays(baseDate, selected.offsets[index] || 0),
        status: index === 0 ? "DUE_SOON" : "UPCOMING",
        invoiceNumber: `#${(invoiceId || "draft").slice(0, 6).toUpperCase()}-${String(index + 1).padStart(2, "0")}`,
      }))
    );
  }

  return (
    <form action={action} className="grid gap-6" id={formId}>
      <input name="projectId" type="hidden" value={projectId} />
      <input name="clientName" type="hidden" value={clientName} />
      <input name="invoiceId" type="hidden" value={invoiceId || ""} />
      <input name="previousLabel" type="hidden" value={previousLabel} />
      <input name="label" type="hidden" value={label} />
      <input name="dueDate" type="hidden" value={dueDate} />
      <input name="method" type="hidden" value={method} />
      <input name="status" type="hidden" value={status} />
      <input name="taxRate" type="hidden" value={taxRate} />
      <input name="lineItems" type="hidden" value={JSON.stringify(lineItems)} />
      <input name="paymentSchedule" type="hidden" value={JSON.stringify(normalizedPaymentSchedule)} />
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} />
      ))}

      <article id="invoice-section" className="rounded-[1.8rem] border border-black/[0.08] bg-white p-7 shadow-[0_18px_40px_rgba(58,34,17,0.08)]">
        <div
          className="overflow-hidden rounded-[2rem] border border-black/[0.08] bg-cover bg-center shadow-[0_22px_60px_rgba(58,34,17,0.12)]"
          style={{ backgroundImage: `linear-gradient(90deg,rgba(17,15,14,0.12),rgba(17,15,14,0.16)), url(${heroImage})` }}
        >
          <div className="flex min-h-[16rem] items-end bg-[linear-gradient(180deg,rgba(17,15,14,0.02),rgba(17,15,14,0.34))] px-8 py-8 text-white">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/75">StudioFlow</p>
              <input
                className="font-display mt-3 w-full max-w-4xl bg-transparent font-semibold tracking-[-0.05em] text-white outline-none placeholder:text-white/72"
                onChange={(e) => setLabel(e.target.value)}
                placeholder={projectName}
                style={{ fontSize: "50px", lineHeight: "0.95" }}
                value={label}
              />
              <p className="mt-2 text-lg text-white/84">{clientName}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[1.6rem] border border-black/[0.08] bg-[rgba(247,241,232,0.52)] p-5">
          <div className="flex flex-wrap items-start justify-between gap-5 border-b border-black/[0.08] pb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Invoice details</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Click the invoice title above to rename it while you build the items below.</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Balance</p>
              <p className="mt-2 text-3xl font-semibold">${grandTotal.toLocaleString()}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {scheduledTotal === grandTotal
                  ? "Payment plan matches this invoice total."
                  : "Payment plan needs to match the invoice total."}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-b border-black/[0.08] pb-5">
            <div className="grid flex-1 gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] md:grid-cols-[1.8fr_0.5fr_0.7fr_0.7fr]">
              <p>Items</p>
              <p>Qty</p>
              <p>Price</p>
              <p>Total</p>
            </div>
            <button className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]" onClick={addLineItem} type="button">
              Add item
            </button>
          </div>

          <div className="grid gap-5 pt-6">
            {lineItems.map((item, index) => (
              <div
                key={`preview-${index}`}
                className="grid gap-4 py-2 md:grid-cols-[1.8fr_0.5fr_0.7fr_0.7fr_auto] md:items-center"
              >
                <div className="flex items-center gap-4">
                  <button
                    className="h-14 w-14 rounded-[1rem] bg-cover bg-center outline-none transition hover:brightness-95"
                    onClick={() => changeLineItemImage(index)}
                    style={{ backgroundImage: `url(${item.image || heroImage})` }}
                    type="button"
                  />
                  <div className="grid flex-1 gap-2">
                    <input
                      className="bg-transparent px-0 py-1 text-base font-extrabold outline-none"
                      onChange={(e) => updateLineItem(index, "title", e.target.value)}
                      placeholder="Item name"
                      value={item.title}
                    />
                    <input
                      className="bg-transparent px-0 py-1 text-[17px] font-extrabold outline-none"
                      onChange={(e) => updateLineItem(index, "description", e.target.value)}
                      placeholder="Description"
                      value={item.description}
                    />
                  </div>
                </div>
                <p className="text-sm font-medium">1</p>
                <input
                  className="bg-transparent px-0 py-1 text-sm font-medium outline-none"
                  min="0"
                  onChange={(e) => updateLineItem(index, "amount", e.target.value)}
                  step="0.01"
                  type="number"
                  value={String(item.amount)}
                />
                <p className="text-base font-semibold">${Number(item.amount || 0).toLocaleString()}</p>
                <div className="flex justify-end">
                  <button className="rounded-full border border-[rgba(207,114,79,0.24)] bg-[rgba(207,114,79,0.08)] px-4 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.14)]" onClick={() => removeLineItem(index)} type="button">
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
              <div className="flex items-center gap-2">
                <input
                  className="w-16 bg-transparent text-right font-medium outline-none"
                  min="0"
                  onChange={(e) => setTaxRate(e.target.value)}
                  step="0.01"
                  type="number"
                  value={taxRate}
                />
                <span>%</span>
                <span>${taxAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between border-t-2 border-[var(--ink)] pt-4 text-2xl font-semibold">
              <span>Grand Total</span>
              <div className="flex items-center gap-1">
                <span>$</span>
                <input
                  className="w-28 bg-transparent text-right outline-none"
                  min="0"
                  onChange={(e) => updateGrandTotal(e.target.value)}
                  step="0.01"
                  type="number"
                  value={String(Math.round(grandTotal * 100) / 100)}
                />
              </div>
            </div>
          </div>
        </div>
      </article>

      <article id="payment-schedule-section" className="rounded-[1.8rem] border border-black/[0.08] bg-white p-7 shadow-[0_18px_40px_rgba(58,34,17,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Payment schedule</p>
            <h2 className="mt-3 text-2xl font-semibold">Build the payment plan</h2>
          </div>
          <button className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]" onClick={addScheduleItem} type="button">
            Add payment
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
            onClick={() => applyScheduleTemplate("full")}
            type="button"
          >
            One payment
          </button>
          <button
            className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
            onClick={() => applyScheduleTemplate("50-50")}
            type="button"
          >
            50 / 50
          </button>
          <button
            className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
            onClick={() => applyScheduleTemplate("30-70")}
            type="button"
          >
            30 / 70
          </button>
          <button
            className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
            onClick={() => applyScheduleTemplate("50-25-25")}
            type="button"
          >
            50 / 25 / 25
          </button>
          <button
            className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
            onClick={() => applyScheduleTemplate("four")}
            type="button"
          >
            4 payments
          </button>
          <button
            className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
            onClick={() => applyScheduleTemplate("monthly")}
            type="button"
          >
            Monthly
          </button>
          <button
            className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
            onClick={() => applyScheduleTemplate("wedding")}
            type="button"
          >
            Wedding plan
          </button>
        </div>

        <div className="mt-6 grid gap-4 border-b border-black/[0.08] pb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] md:grid-cols-[0.75fr_0.95fr_1fr_0.8fr_auto]">
          <p>Amount</p>
          <p>When</p>
          <p>Invoice #</p>
          <p>Status</p>
          <p>Actions</p>
        </div>

        <div className="grid gap-3 pt-5">
          {normalizedPaymentSchedule.map((item, index) => (
            <div key={item.id} className="grid gap-3 border-b border-black/[0.08] pb-3 md:grid-cols-[0.75fr_0.95fr_1fr_0.8fr_auto] md:items-center">
              <input
                className="bg-transparent px-0 py-1 text-sm outline-none"
                min="0"
                onChange={(e) => updateScheduleItem(index, "amount", e.target.value)}
                step="0.01"
                type="number"
                value={String(item.amount)}
              />
              <input
                className="bg-transparent px-0 py-1 text-sm outline-none"
                onChange={(e) => updateScheduleItem(index, "dueDate", e.target.value)}
                type="date"
                value={item.dueDate}
              />
              <p className="text-sm font-medium text-[var(--muted)]">{item.invoiceNumber}</p>
              <p className="text-sm font-semibold text-[var(--ink)]">
                {item.status === "PAID" ? "Paid" : item.status === "OVERDUE" ? "Overdue" : "Upcoming"}
              </p>
              <div className="flex items-end">
                <button className="rounded-full border border-[rgba(207,114,79,0.24)] bg-[rgba(207,114,79,0.08)] px-4 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.14)]" onClick={() => removeScheduleItem(index)} type="button">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-black/[0.08] bg-white p-5 shadow-[0_18px_40px_rgba(58,34,17,0.08)]">
        <div>
          <p className="text-sm font-semibold">
            {invoiceId ? "This invoice saves automatically." : "Ready to save this invoice?"}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {invoiceId
              ? autosaveState === "saving"
                ? "Saving your latest changes..."
                : autosaveState === "saved"
                  ? "All changes are saved."
                  : autosaveState === "error"
                    ? "Autosave ran into an issue. Refresh and try again."
                    : "Any changes you make here will save automatically."
              : "The invoice preview above and the payment plan below are synced to the same saved record."}
          </p>
        </div>
        {!invoiceId ? (
          <button className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
            {submitLabel}
          </button>
        ) : secondaryAction ? (
          <button
            className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            formAction={secondaryAction}
          >
            {secondarySubmitLabel || "Send invoice"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
