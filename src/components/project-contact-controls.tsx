"use client";

import { useState } from "react";

type BaseProps = {
  projectId: string;
  returnTab: string;
  returnFile?: string;
};

type EditPrimaryProps = BaseProps & {
  mode: "primary";
  action: (formData: FormData) => void | Promise<void>;
  clientName: string;
  contactEmail: string;
};

type EditAdditionalProps = BaseProps & {
  mode: "additional";
  action: (formData: FormData) => void | Promise<void>;
  contactId: string;
  name: string;
  email: string;
};

type AddProps = BaseProps & {
  mode: "add";
  action: (formData: FormData) => void | Promise<void>;
};

type ProjectContactControlsProps = EditPrimaryProps | EditAdditionalProps | AddProps;

function getInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return (parts.map((part) => part[0]).join("") || "+").toUpperCase();
}

export function ProjectContactControls(props: ProjectContactControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isAdd = props.mode === "add";
  const label = isAdd ? "Add" : props.mode === "primary" ? props.clientName : props.name;
  const email = isAdd ? "" : props.mode === "primary" ? props.contactEmail : props.email;

  return (
    <>
      <button
        className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold transition ${
          isAdd
            ? "border border-dashed border-black/[0.12] bg-white text-[var(--ink)] hover:border-[var(--accent)] hover:bg-[rgba(207,114,79,0.08)]"
            : "bg-[rgba(247,241,232,0.96)] text-[var(--ink)] hover:scale-[1.03] hover:bg-[rgba(207,114,79,0.16)]"
        }`}
        onClick={() => setIsOpen(true)}
        title={isAdd ? "Add another client contact" : `Edit ${label}`}
        type="button"
      >
        {isAdd ? "+" : getInitials(label)}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,15,14,0.52)] px-4 py-8">
          <div className="w-full max-w-lg rounded-[1.9rem] border border-black/[0.08] bg-white p-6 shadow-[0_28px_70px_rgba(17,15,14,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                  {isAdd ? "Project contact" : "Client quick edit"}
                </p>
                <h2 className="mt-3 text-2xl font-semibold">
                  {isAdd ? "Add another client" : "Update contact details"}
                </h2>
              </div>
              <button
                aria-label="Close"
                className="rounded-full border border-black/[0.08] px-3 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-black/[0.03] hover:text-[var(--ink)]"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {isAdd
                ? "Add another contact to this project and it will appear as its own initials badge."
                : "Change the contact details from here without leaving the page."}
            </p>

            <form action={props.action} className="mt-6 grid gap-4">
              <input name="projectId" type="hidden" value={props.projectId} />
              <input name="returnTab" type="hidden" value={props.returnTab} />
              <input name="returnFile" type="hidden" value={props.returnFile || ""} />
              {props.mode === "primary" ? (
                <input name="clientName" type="hidden" value={props.clientName} />
              ) : null}
              {props.mode === "additional" ? (
                <input name="contactId" type="hidden" value={props.contactId} />
              ) : null}

              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                Client name
                <input
                  className="rounded-2xl border border-black/[0.08] px-4 py-3"
                  defaultValue={props.mode === "primary" ? props.clientName : props.mode === "additional" ? props.name : ""}
                  name={props.mode === "primary" ? "nextClientName" : "name"}
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                Client email
                {props.mode === "primary" ? (
                  <input
                    className="rounded-2xl border border-black/[0.08] px-4 py-3"
                    defaultValue={email}
                    name="contactEmail"
                    required
                    type="email"
                  />
                ) : (
                  <input
                    className="rounded-2xl border border-black/[0.08] px-4 py-3"
                    defaultValue={email}
                    name="email"
                    required
                    type="email"
                  />
                )}
              </label>

              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-[var(--sidebar)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  type="submit"
                >
                  {isAdd ? "Add client" : "Save contact"}
                </button>
                <button
                  className="rounded-full border border-black/[0.08] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
