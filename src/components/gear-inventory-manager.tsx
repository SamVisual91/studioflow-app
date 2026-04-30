"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteGearItemAction, removeGearBarcodeAction, updateGearItemAction } from "@/app/actions";
import { BarcodeLabel } from "@/components/barcode-label";
import { PrintBarcodesButton } from "@/components/print-barcodes-button";
import { currencyFormatter, shortDate } from "@/lib/formatters";

export type GearInventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  barcode: string | null;
  serial_number: string | null;
  status: string;
  condition: string;
  daily_rate: number;
  replacement_value: number;
  current_holder: string | null;
  checked_out_at: string | null;
  due_back_at: string | null;
  notes: string | null;
};

type DraftRow = {
  barcode: string;
  category: string;
  condition: string;
  dailyRate: string;
  name: string;
  notes: string;
  quantity: string;
  replacementValue: string;
  serialNumber: string;
};

type SaveState = {
  message: string;
  tone: "error" | "idle" | "saving" | "saved";
};

const defaultSaveState: SaveState = {
  message: "Autosave ready",
  tone: "idle",
};

function statusTone(status: string) {
  if (status === "AVAILABLE") {
    return "border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] text-[var(--forest)]";
  }

  if (status === "OUT_ON_RENTAL") {
    return "border-[rgba(207,114,79,0.24)] bg-[rgba(207,114,79,0.08)] text-[var(--accent)]";
  }

  if (status === "ON_PROJECT") {
    return "border-black/[0.08] bg-[rgba(29,27,31,0.06)] text-[var(--ink)]";
  }

  return "border-black/[0.08] bg-white text-[var(--muted)]";
}

function toDraftRow(item: GearInventoryItem): DraftRow {
  return {
    barcode: item.barcode ?? "none",
    category: item.category,
    condition: item.condition,
    dailyRate: String(item.daily_rate),
    name: item.name,
    notes: item.notes ?? "",
    quantity: String(item.quantity),
    replacementValue: String(item.replacement_value),
    serialNumber: item.serial_number ?? "",
  };
}

function saveStateClassName(tone: SaveState["tone"]) {
  if (tone === "error") {
    return "text-[var(--accent)]";
  }

  if (tone === "saved") {
    return "text-[var(--forest)]";
  }

  return "text-[var(--muted)]";
}

export function GearInventoryManager({ initialGearItems }: { initialGearItems: GearInventoryItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});
  const [gearItems, setGearItems] = useState(initialGearItems);
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [, startTransition] = useTransition();
  const autosaveTimersRef = useRef<Record<string, number>>({});
  const latestSaveRequestRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const timers = autosaveTimersRef.current;
    return () => {
      Object.values(timers).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  const gearItemsWithBarcodes = gearItems.filter((item) => Boolean(item.barcode));

  function beginEditing(item: GearInventoryItem) {
    setEditingId(item.id);
    setDrafts((current) => ({
      ...current,
      [item.id]: current[item.id] ?? toDraftRow(item),
    }));
    setSaveStates((current) => ({
      ...current,
      [item.id]: current[item.id] ?? defaultSaveState,
    }));
  }

  function stopEditing(itemId: string) {
    flushAutosave(itemId);
    setEditingId((current) => (current === itemId ? null : current));
  }

  function queueAutosave(itemId: string, draft: DraftRow) {
    const pendingTimer = autosaveTimersRef.current[itemId];
    if (pendingTimer) {
      window.clearTimeout(pendingTimer);
    }

    setSaveStates((current) => ({
      ...current,
      [itemId]: {
        message: "Saving changes...",
        tone: "saving",
      },
    }));

    autosaveTimersRef.current[itemId] = window.setTimeout(() => {
      void persistDraft(itemId, draft);
    }, 700);
  }

  function flushAutosave(itemId: string) {
    const timerId = autosaveTimersRef.current[itemId];
    if (!timerId) {
      return;
    }

    window.clearTimeout(timerId);
    delete autosaveTimersRef.current[itemId];
    const draft = drafts[itemId];
    if (draft) {
      void persistDraft(itemId, draft);
    }
  }

  function updateDraft(itemId: string, field: keyof DraftRow, value: string) {
    setDrafts((current) => {
      const existing = current[itemId] ?? toDraftRow(gearItems.find((item) => item.id === itemId)!);
      const nextDraft = {
        ...existing,
        [field]: value,
      };

      queueAutosave(itemId, nextDraft);

      return {
        ...current,
        [itemId]: nextDraft,
      };
    });
  }

  async function persistDraft(itemId: string, draft: DraftRow) {
    delete autosaveTimersRef.current[itemId];
    latestSaveRequestRef.current[itemId] = (latestSaveRequestRef.current[itemId] ?? 0) + 1;
    const requestId = latestSaveRequestRef.current[itemId];

    startTransition(async () => {
      const formData = new FormData();
      formData.set("gearId", itemId);
      formData.set("name", draft.name);
      formData.set("category", draft.category);
      formData.set("quantity", draft.quantity);
      formData.set("barcode", draft.barcode);
      formData.set("serialNumber", draft.serialNumber);
      formData.set("condition", draft.condition);
      formData.set("dailyRate", draft.dailyRate);
      formData.set("replacementValue", draft.replacementValue);
      formData.set("notes", draft.notes);

      const result = await updateGearItemAction(formData);

      if (latestSaveRequestRef.current[itemId] !== requestId) {
        return;
      }

      if (!result?.ok || !result.item) {
        const message =
          result?.error === "gear-barcode-duplicate"
            ? "That barcode is already in use."
            : "Could not save changes.";

        setSaveStates((current) => ({
          ...current,
          [itemId]: {
            message,
            tone: "error",
          },
        }));
        return;
      }

      const savedItem = result.item as GearInventoryItem;
      setGearItems((current) => current.map((item) => (item.id === itemId ? savedItem : item)));
      setDrafts((current) => ({
        ...current,
        [itemId]: toDraftRow(savedItem),
      }));
      setSaveStates((current) => ({
        ...current,
        [itemId]: {
          message: "All changes saved",
          tone: "saved",
        },
      }));
    });
  }

  return (
    <>
      <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]" id="full-inventory">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Full inventory</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Gear list</h2>
          </div>
          <p className="text-sm text-[var(--muted)]">Track status, rates, and current holder at a glance.</p>
        </div>

        <datalist id="gear-barcode-options">
          <option value="none" />
        </datalist>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1210px] border-collapse text-left">
            <thead className="border-b border-black/[0.06] bg-[#fbf8f3] text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-4 font-semibold">Gear</th>
                <th className="px-4 py-4 font-semibold">Category</th>
                <th className="px-4 py-4 font-semibold">Quantity</th>
                <th className="px-4 py-4 font-semibold">Barcode</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold">Condition</th>
                <th className="px-4 py-4 font-semibold">Daily rate</th>
                <th className="px-4 py-4 font-semibold">Current holder</th>
                <th className="px-4 py-4 font-semibold">Due back</th>
                <th className="px-4 py-4 text-right font-semibold">Edit</th>
                <th className="px-4 py-4 text-right font-semibold sr-only">Delete</th>
              </tr>
            </thead>
            <tbody>
              {gearItems.map((item) => {
                const isEditing = editingId === item.id;
                const draft = drafts[item.id] ?? toDraftRow(item);
                const saveState = saveStates[item.id] ?? defaultSaveState;

                return (
                  <tr className="border-t border-black/[0.05] transition hover:bg-[#fbf8f3]" key={item.id}>
                    <td className="px-4 py-4 align-top">
                      {isEditing ? (
                        <div className="grid gap-2">
                          <input
                            className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm font-semibold text-[var(--ink)]"
                            name="name"
                            onBlur={() => flushAutosave(item.id)}
                            onChange={(event) => updateDraft(item.id, "name", event.target.value)}
                            value={draft.name}
                          />
                          <input
                            className="rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-xs text-[var(--muted)]"
                            name="serialNumber"
                            onBlur={() => flushAutosave(item.id)}
                            onChange={(event) => updateDraft(item.id, "serialNumber", event.target.value)}
                            placeholder="Serial #"
                            value={draft.serialNumber}
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-[var(--ink)]">{item.name}</p>
                          {item.serial_number ? <p className="mt-1 text-xs text-[var(--muted)]">Serial #{item.serial_number}</p> : null}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {isEditing ? (
                        <input
                          className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm text-[var(--muted)]"
                          name="category"
                          onBlur={() => flushAutosave(item.id)}
                          onChange={(event) => updateDraft(item.id, "category", event.target.value)}
                          value={draft.category}
                        />
                      ) : (
                        <span className="text-sm text-[var(--muted)]">{item.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {isEditing ? (
                        <input
                          className="w-24 rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm text-[var(--ink)]"
                          min="1"
                          name="quantity"
                          onBlur={() => flushAutosave(item.id)}
                          onChange={(event) => updateDraft(item.id, "quantity", event.target.value)}
                          step="1"
                          type="number"
                          value={draft.quantity}
                        />
                      ) : (
                        <span className="text-sm font-semibold text-[var(--ink)]">{item.quantity}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {isEditing ? (
                        <div className="grid gap-2">
                          <input
                            className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm text-[var(--ink)]"
                            list="gear-barcode-options"
                            name="barcode"
                            onBlur={() => flushAutosave(item.id)}
                            onChange={(event) => updateDraft(item.id, "barcode", event.target.value)}
                            value={draft.barcode}
                          />
                          <p className="text-[11px] text-[var(--muted)]">Use <span className="font-mono">none</span> for no barcode, or clear the field to auto-generate one.</p>
                        </div>
                      ) : (
                        <>
                          <div className="max-w-[9rem]">
                            <BarcodeLabel small value={item.barcode || ""} />
                          </div>
                          {item.barcode ? (
                            <form action={removeGearBarcodeAction} className="mt-2">
                              <input name="gearId" type="hidden" value={item.id} />
                              <button className="text-xs font-semibold text-[var(--accent)] transition hover:opacity-80" type="submit">
                                Remove barcode
                              </button>
                            </form>
                          ) : null}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${statusTone(item.status)}`}>
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {isEditing ? (
                        <input
                          className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm text-[var(--ink)]"
                          name="condition"
                          onBlur={() => flushAutosave(item.id)}
                          onChange={(event) => updateDraft(item.id, "condition", event.target.value)}
                          value={draft.condition}
                        />
                      ) : (
                        <span className="text-sm text-[var(--ink)]">{item.condition}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      {isEditing ? (
                        <input
                          className="w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm text-[var(--ink)]"
                          min="0"
                          name="dailyRate"
                          onBlur={() => flushAutosave(item.id)}
                          onChange={(event) => updateDraft(item.id, "dailyRate", event.target.value)}
                          step="0.01"
                          type="number"
                          value={draft.dailyRate}
                        />
                      ) : (
                        <span className="text-sm text-[var(--ink)]">
                          {item.daily_rate > 0 ? currencyFormatter.format(item.daily_rate) : "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)] align-top">{item.current_holder || "Available"}</td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)] align-top">
                      {item.due_back_at ? shortDate.format(new Date(item.due_back_at)) : "—"}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col items-end gap-2">
                        <button
                          className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                          onClick={() => (isEditing ? stopEditing(item.id) : beginEditing(item))}
                          type="button"
                        >
                          {isEditing ? "Done" : "Edit"}
                        </button>
                        <p className={`text-[11px] ${saveStateClassName(saveState.tone)}`}>{saveState.message}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex justify-end">
                        <form action={deleteGearItemAction}>
                          <input name="gearId" type="hidden" value={item.id} />
                          <button
                            aria-label={`Delete ${item.name}`}
                            className="flex h-9 w-9 items-center justify-center border border-[rgba(207,114,79,0.2)] bg-[rgba(207,114,79,0.08)] text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.14)]"
                            title={`Delete ${item.name}`}
                            type="submit"
                          >
                            🗑
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-black/[0.06] bg-white/92 p-6 shadow-[0_18px_50px_rgba(31,27,24,0.06)]" id="gear-labels">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Print-ready labels</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Barcode labels</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Print these labels and place them directly on your gear for USB scanner check-in and check-out.
            </p>
          </div>
          <PrintBarcodesButton />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {gearItemsWithBarcodes.map((item) => (
            <article className="border border-black/[0.06] bg-white p-4" key={`${item.id}-label`}>
              <p className="font-semibold text-[var(--ink)]">{item.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {item.category}
                {item.serial_number ? ` • ${item.serial_number}` : ""}
              </p>
              <div className="mt-4">
                <BarcodeLabel value={item.barcode || ""} />
              </div>
            </article>
          ))}
        </div>
        {!gearItemsWithBarcodes.length ? (
          <p className="mt-6 text-sm text-[var(--muted)]">No barcode labels to print yet.</p>
        ) : null}
      </section>
    </>
  );
}
