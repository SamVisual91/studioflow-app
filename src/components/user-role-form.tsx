"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { updateUserRoleAction } from "@/app/actions";
import { type UserRole } from "@/lib/roles";

type RoleOption = {
  value: UserRole;
  label: string;
};

function PendingState() {
  const { pending } = useFormStatus();

  return (
    <span className="text-[11px] font-medium text-[var(--muted)]">
      {pending ? "Saving..." : "Auto-saves"}
    </span>
  );
}

export function UserRoleForm({
  userId,
  role,
  options,
  selectClassName,
}: {
  userId: string;
  role: UserRole;
  options: RoleOption[];
  selectClassName: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      action={updateUserRoleAction}
      className="flex items-center gap-3 rounded-[1rem] border border-black/[0.06] bg-[#fbf8f3] px-3 py-2"
      ref={formRef}
    >
      <input name="userId" type="hidden" value={userId} />
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        Role
      </span>
      <select
        className={`min-w-[8.75rem] rounded-full border px-3 py-2 text-sm font-medium normal-case tracking-normal outline-none ${selectClassName}`}
        defaultValue={role}
        name="role"
        onChange={() => formRef.current?.requestSubmit()}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <PendingState />
    </form>
  );
}
