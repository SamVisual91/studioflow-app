"use client";

import { useMemo, useState } from "react";
import { createProjectClientAction, updateProjectClientAction } from "@/app/actions";

const projectTypeOptions = ["Wedding", "Business", "Others"] as const;
const timezoneOptions = ["EDT/EST", "CDT/CST", "MDT/MST", "PDT/PST"] as const;

type ProjectModalProject = {
  id?: string;
  clientName?: string;
  contactEmail?: string;
  description?: string;
  leadSource?: string;
  location?: string;
  projectDate?: string;
  projectName?: string;
  type?: string;
};

type UnavailableProjectDate = {
  label: string;
  projectId?: string;
  value: string;
};

export function NewProjectModal({
  initialProject,
  onOpenChange,
  open,
  triggerLabel = "+ New client",
  unavailableDates = [],
  withTrigger = true,
}: {
  initialProject?: ProjectModalProject;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  triggerLabel?: string;
  unavailableDates?: UnavailableProjectDate[];
  withTrigger?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialProject?.projectDate || "");
  const controlledOpen = typeof open === "boolean";
  const isOpen = controlledOpen ? open : internalOpen;

  const dateConflict = useMemo(
    () =>
      unavailableDates.find(
        (item) => item.value === selectedDate && item.projectId !== initialProject?.id
      ) || null,
    [initialProject?.id, selectedDate, unavailableDates]
  );

  function setOpen(nextValue: boolean) {
    if (!controlledOpen) {
      setInternalOpen(nextValue);
    }
    if (nextValue) {
      setSelectedDate(initialProject?.projectDate || "");
    }
    onOpenChange?.(nextValue);
  }

  return (
    <>
      {withTrigger ? (
        <button
          className="bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          onClick={() => setOpen(true)}
          type="button"
        >
          {triggerLabel}
        </button>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(17,15,14,0.36)] p-4 pt-10 backdrop-blur-sm sm:p-6 sm:pt-14">
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-[28rem] overflow-y-auto border border-black/[0.08] bg-white shadow-[0_26px_70px_rgba(31,27,24,0.20)]">
            <div className="flex items-center justify-between border-b border-black/[0.08] px-5 py-4">
              <h3 className="text-base font-medium text-[var(--ink)]">
                {initialProject?.id ? "Edit project" : "Create new project"}
              </h3>
              <button
                aria-label="Close new project modal"
                className="text-3xl leading-none text-[var(--muted)] transition hover:text-[var(--ink)]"
                onClick={() => setOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <form
              action={initialProject?.id ? updateProjectClientAction : createProjectClientAction}
              className="grid gap-5 px-5 py-6"
            >
              <input name="projectId" type="hidden" value={initialProject?.id || ""} />
              <input name="clientName" type="hidden" value={initialProject?.clientName || ""} />
              <input name="packageName" type="hidden" value="Custom project" />
              <input name="totalValue" type="hidden" value="0" />

              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                <span>Name *</span>
                <input
                  className="w-full min-w-0 border border-black/[0.08] bg-[rgba(15,23,42,0.03)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                  defaultValue={initialProject?.projectName || ""}
                  name="projectName"
                  placeholder="Type project title"
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                <span>Assign contacts *</span>
                <input
                  className="w-full min-w-0 border border-black/[0.08] bg-[rgba(15,23,42,0.03)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                  defaultValue={initialProject?.contactEmail || ""}
                  name="contactEmail"
                  placeholder="Search or enter client email"
                  required
                  type="email"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                <span>Service type *</span>
                <select
                  className="w-full min-w-0 border border-black/[0.08] bg-[rgba(15,23,42,0.03)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
                  defaultValue={initialProject?.type || "Wedding"}
                  name="category"
                  required
                >
                  {projectTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,8rem)]">
                <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--ink)]">
                  <span>Start date *</span>
                  <input
                    className="w-full min-w-0 border border-black/[0.08] bg-[rgba(15,23,42,0.03)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
                    defaultValue={initialProject?.projectDate || ""}
                    name="projectDate"
                    onChange={(event) => setSelectedDate(event.target.value)}
                    required
                    type="date"
                  />
                </label>

                <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--ink)]">
                  <span>Start time</span>
                  <input
                    className="w-full min-w-0 border border-black/[0.08] bg-[rgba(15,23,42,0.03)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
                    name="startTime"
                    type="time"
                  />
                </label>

                <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--ink)]">
                  <span>Timezone</span>
                  <select
                    className="w-full min-w-0 border border-black/[0.08] bg-[rgba(15,23,42,0.03)] px-3 py-3 text-sm text-[var(--ink)] outline-none"
                    defaultValue="EDT/EST"
                    name="timezone"
                  >
                    {timezoneOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {dateConflict ? (
                <div className="border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-4 py-3 text-sm text-[var(--accent)]">
                  This date is already booked for {dateConflict.label}.
                </div>
              ) : null}

              <details className="group">
                <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--ink)]">
                  More details <span className="ml-1 inline-block transition group-open:rotate-180">⌄</span>
                </summary>
                <div className="mt-4 grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--ink)]">
                      <span>Location</span>
                      <input
                        className="w-full min-w-0 border border-black/[0.08] bg-[rgba(15,23,42,0.03)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                        defaultValue={initialProject?.location || ""}
                        name="location"
                        placeholder="Venue or city"
                      />
                    </label>

                    <label className="grid min-w-0 gap-2 text-sm font-medium text-[var(--ink)]">
                      <span>Lead source</span>
                      <input
                        className="w-full min-w-0 border border-black/[0.08] bg-[rgba(15,23,42,0.03)] px-4 py-3 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                        defaultValue={initialProject?.leadSource || ""}
                        name="leadSource"
                        placeholder="Instagram"
                      />
                    </label>
                  </div>

                  <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                    <span>Description</span>
                    <textarea
                      className="w-full min-w-0 min-h-28 border border-black/[0.08] bg-[rgba(15,23,42,0.03)] px-4 py-3 text-sm text-[var(--ink)] outline-none"
                      defaultValue={initialProject?.description || ""}
                      name="description"
                    />
                  </label>
                </div>
              </details>

              <div className="flex justify-end pt-2">
                <button className="bg-[#17181d] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                  {initialProject?.id ? "Save project" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
