"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  archiveProjectsAction,
  bulkDeleteProjectsAction,
  updateProjectPipelineAction,
} from "@/app/actions";
import { DoubleChevronDownIcon } from "@/components/double-chevron-down-icon";
import { NewProjectModal } from "@/components/new-project-modal";
import { canManageProjectBulkActions, type UserRole } from "@/lib/roles";

type ProjectRow = {
  id: string;
  name: string;
  client: string;
  contactEmail: string;
  progress: number;
  phase: string;
  archivedAt: string;
  publicPortalToken: string;
  type: string;
  projectDate: string;
  location: string;
  description: string;
  leadSource: string;
  recentActivity: string;
  nextMilestone: string;
};

type Props = {
  projects: ProjectRow[];
  activeStages: string[];
  userRole: UserRole;
  unavailableDates: Array<{
    label: string;
    projectId?: string;
    value: string;
  }>;
};

const desktopProjectGrid =
  "grid-cols-[minmax(16rem,18rem)_minmax(12rem,14rem)_7rem_9rem_9rem_minmax(16rem,1fr)_9rem_auto]";

function getProjectStatus(phase: string) {
  return String(phase || "").trim().toUpperCase() === "DISMISSED" ? "DISMISSED" : "BOOKED";
}

function statusTone(status: string) {
  return status === "DISMISSED"
    ? "border-[rgba(207,114,79,0.2)] bg-[rgba(207,114,79,0.12)] text-[#cf724f]"
    : "border-[rgba(47,125,92,0.2)] bg-[rgba(47,125,92,0.12)] text-[#2f7d5c]";
}

function ProjectTypeIcon({ type }: { type: string }) {
  const normalizedType = type.trim().toLowerCase();

  if (normalizedType === "wedding") {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgba(236,72,153,0.16)] text-[#db2777]">
        <svg
          aria-hidden="true"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M12 20s-6.5-4.35-6.5-9.5A3.5 3.5 0 0 1 9 7a3.9 3.9 0 0 1 3 1.54A3.9 3.9 0 0 1 15 7a3.5 3.5 0 0 1 3.5 3.5C18.5 15.65 12 20 12 20Z" />
        </svg>
      </span>
    );
  }

  if (
    normalizedType === "business" ||
    normalizedType === "brand" ||
    normalizedType === "commercial" ||
    normalizedType === "corporate"
  ) {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgba(59,130,246,0.16)] text-[#2563eb]">
        <svg
          aria-hidden="true"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M3 20h18" />
          <path d="M5 20V8h14v12" />
          <path d="M9 8V5h6v3" />
          <path d="M9 12h.01" />
          <path d="M15 12h.01" />
        </svg>
      </span>
    );
  }

  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgba(15,23,42,0.1)] text-[#475569]">
      <svg
        aria-hidden="true"
        className="h-4.5 w-4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2.5 2.5" />
      </svg>
    </span>
  );
}

function formatProjectDate(value: string) {
  if (!value) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ProjectsTable({ projects, activeStages, unavailableDates, userRole }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [openStatusProjectId, setOpenStatusProjectId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const allVisibleSelected = useMemo(
    () => projects.length > 0 && projects.every((project) => selectedIds.includes(project.id)),
    [projects, selectedIds]
  );
  const canManageBulkActions = canManageProjectBulkActions(userRole);
  const openProject = projects.find((project) => project.id === openProjectId) ?? null;
  const openStatusProject = projects.find((project) => project.id === openStatusProjectId) ?? null;
  const openStatus = openStatusProject ? getProjectStatus(openStatusProject.phase) : null;

  useEffect(() => {
    setIsEditModalOpen(Boolean(openProjectId));
  }, [openProjectId]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => projects.some((project) => project.id === id)));
  }, [projects]);

  function toggleProject(projectId: string) {
    setSelectedIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId]
    );
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !projects.some((project) => project.id === id));
      }

      const merged = new Set(current);
      projects.forEach((project) => merged.add(project.id));
      return Array.from(merged);
    });
  }

  return (
    <>
      <div className="overflow-hidden border border-black/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(250,249,246,0.96))] shadow-[0_16px_42px_rgba(31,27,24,0.05)]">
        {canManageBulkActions ? (
          <div className="flex flex-col gap-3 border-b border-[#e5ebf3] bg-white/86 px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.85rem] font-semibold text-[var(--ink)]">Bulk project actions</p>
              <p className="mt-1 text-[0.82rem] text-[var(--muted)]">
                Select one or more projects to archive them safely or delete them permanently.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="min-w-[8.75rem] border border-[#d8dfeb] bg-white px-3.5 py-2 text-[0.8rem] font-semibold text-[var(--ink)] shadow-[0_8px_18px_rgba(31,27,24,0.04)] transition hover:bg-[#f8fafc]"
                onClick={toggleAllVisible}
                type="button"
              >
                {allVisibleSelected ? "Clear visible" : "Select visible"}
              </button>

              <form action={archiveProjectsAction}>
                {selectedIds.map((projectId) => (
                  <input key={`archive-${projectId}`} name="projectIds" type="hidden" value={projectId} />
                ))}
                <button
                  className="min-w-[10.5rem] border border-[rgba(47,125,92,0.16)] bg-[rgba(47,125,92,0.08)] px-3.5 py-2 text-[0.8rem] font-semibold text-[var(--forest)] transition hover:bg-[rgba(47,125,92,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedIds.length === 0}
                >
                  Archive selected ({selectedIds.length})
                </button>
              </form>

              <form action={bulkDeleteProjectsAction}>
                {selectedIds.map((projectId) => (
                  <input key={`delete-${projectId}`} name="projectIds" type="hidden" value={projectId} />
                ))}
                <button
                  className="min-w-[10rem] border border-[rgba(207,114,79,0.16)] bg-[rgba(207,114,79,0.08)] px-3.5 py-2 text-[0.8rem] font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedIds.length === 0}
                >
                  Delete selected
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {projects.length === 0 ? (
          <div className="px-5 py-10 text-sm text-[var(--muted)]">No projects matched that search yet.</div>
        ) : (
          <>
            <div className="divide-y divide-[#edf1f6] bg-white lg:hidden">
              {projects.map((project) => {
                const projectStatus = getProjectStatus(project.phase);

                return (
                  <article key={`${project.id}-mobile`} className="space-y-4 px-4 py-4 sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        {canManageBulkActions ? (
                          <input
                            checked={selectedIds.includes(project.id)}
                            className="mt-1.5 shrink-0"
                            onChange={() => toggleProject(project.id)}
                            type="checkbox"
                          />
                        ) : null}
                        <ProjectTypeIcon type={project.type || "Others"} />
                        <div className="min-w-0">
                          <Link
                            className="block break-words text-[0.98rem] font-semibold leading-6 text-[var(--ink)] underline-offset-4 hover:underline"
                            href={`/projects/${project.id}`}
                          >
                            {project.name}
                          </Link>
                          <p className="mt-0.5 text-[0.82rem] leading-5 text-[var(--muted)]">
                            {project.type || "Others"}
                          </p>
                        </div>
                      </div>

                      <button
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d8dfeb] bg-white text-sm font-semibold text-[var(--muted)] transition hover:bg-[#f8fafc]"
                        onClick={() => setOpenProjectId(project.id)}
                        type="button"
                      >
                        ...
                      </button>
                    </div>

                    <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[#7c8aa0]">Contact</p>
                        <p className="mt-1 break-words text-[0.84rem] leading-5 text-[var(--ink)]">
                          {project.contactEmail || project.client}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[#7c8aa0]">Date</p>
                        <p className="mt-1 text-[0.84rem] leading-5 text-[var(--ink)]">
                          {formatProjectDate(project.projectDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[#7c8aa0]">Location</p>
                        <p className="mt-1 break-words text-[0.84rem] leading-5 text-[var(--ink)]">
                          {project.location || "TBD"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[#7c8aa0]">Lead source</p>
                        <p className="mt-1 break-words text-[0.84rem] leading-5 text-[var(--ink)]">
                          {project.leadSource || "Direct"}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[#7c8aa0]">Description</p>
                        <p className="mt-1 break-words text-[0.84rem] leading-5 text-[var(--muted)]">
                          {project.description || "No description yet."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 border-t border-[#edf1f6] pt-3">
                      <button
                        className={`inline-flex min-w-[8.2rem] items-center justify-between gap-2.5 border px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] transition hover:brightness-[0.98] ${statusTone(projectStatus)}`}
                        onClick={() => setOpenStatusProjectId(project.id)}
                        type="button"
                      >
                        <span>{projectStatus}</span>
                        <DoubleChevronDownIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      </button>

                      <Link
                        className="inline-flex items-center justify-center border border-[#d8dfeb] px-3.5 py-1.5 text-[0.8rem] font-semibold text-[var(--ink)] transition hover:bg-[#f8fafc]"
                        href={`/projects/${project.id}`}
                      >
                        Open project
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden bg-white lg:block">
              <div className={`grid ${desktopProjectGrid} gap-x-6 border-b border-[#edf1f6] bg-[#fbfbfb] px-5 py-3 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[#718096] xl:px-6`}>
                <div className="flex items-center gap-3">
                  {canManageBulkActions ? (
                    <label className="flex items-center">
                      <input checked={allVisibleSelected} onChange={toggleAllVisible} type="checkbox" />
                      <span className="sr-only">Select visible projects</span>
                    </label>
                  ) : null}
                  <span>Name</span>
                </div>
                <div className="flex items-center">Contacts</div>
                <div className="flex items-center">Type</div>
                <div className="flex items-center">Date</div>
                <div className="flex items-center">Location</div>
                <div className="flex items-center">Description</div>
                <div className="flex items-center">Lead Source</div>
                <div className="flex items-center justify-start">Actions</div>
              </div>

              <div className="divide-y divide-[#edf1f6]">
                {projects.map((project) => {
                  const projectStatus = getProjectStatus(project.phase);

                  return (
                    <article
                      key={project.id}
                      className={`grid ${desktopProjectGrid} gap-x-6 px-5 py-4 text-[0.87rem] leading-6 text-[var(--ink)] transition hover:bg-[#fcfcfd] xl:px-6`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {canManageBulkActions ? (
                          <input
                            checked={selectedIds.includes(project.id)}
                            onChange={() => toggleProject(project.id)}
                            type="checkbox"
                          />
                        ) : null}
                        <ProjectTypeIcon type={project.type || "Others"} />
                        <Link
                          className="block min-w-0 break-words font-semibold text-[var(--ink)] underline-offset-4 hover:underline"
                          href={`/projects/${project.id}`}
                        >
                          {project.name}
                        </Link>
                      </div>

                      <div className="break-words text-[0.84rem] text-[var(--ink)]">
                        {project.contactEmail || project.client}
                      </div>

                      <div className="text-[0.84rem] text-[var(--ink)]">{project.type || "Others"}</div>

                      <div className="text-[0.84rem] text-[var(--ink)]">{formatProjectDate(project.projectDate)}</div>

                      <div className="break-words text-[0.84rem] text-[var(--ink)]">{project.location || "TBD"}</div>

                      <div className="break-words text-[0.84rem] text-[var(--muted)]">
                        {project.description || "No description yet."}
                      </div>

                      <div className="break-words text-[0.84rem] text-[var(--ink)]">{project.leadSource || "Direct"}</div>

                      <div className="flex items-start gap-2.5">
                        <button
                          className={`inline-flex min-w-[8rem] items-center justify-between gap-2 border px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] transition hover:brightness-[0.98] ${statusTone(projectStatus)}`}
                          onClick={() => setOpenStatusProjectId(project.id)}
                          type="button"
                        >
                          <span>{projectStatus}</span>
                          <DoubleChevronDownIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        </button>

                        <Link
                          className="inline-flex items-center justify-center border border-[#d8dfeb] px-3 py-1.5 text-[0.78rem] font-semibold text-[var(--ink)] transition hover:bg-[#f8fafc]"
                          href={`/projects/${project.id}`}
                        >
                          Open project
                        </Link>

                        <button
                          className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-[#d8dfeb] bg-white text-sm font-semibold text-[var(--muted)] transition hover:bg-[#f8fafc]"
                          onClick={() => setOpenProjectId(project.id)}
                          type="button"
                        >
                          ...
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {openProject ? (
        <NewProjectModal
          initialProject={{
            id: openProject.id,
            clientName: openProject.client,
            contactEmail: openProject.contactEmail,
            description: openProject.description,
            leadSource: openProject.leadSource,
            location: openProject.location,
            projectDate: openProject.projectDate,
            projectName: openProject.name,
            type: openProject.type,
          }}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) {
              setOpenProjectId(null);
            }
          }}
          open={isEditModalOpen}
          unavailableDates={unavailableDates}
          withTrigger={false}
        />
      ) : null}

      {openStatusProject ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(17,15,14,0.32)] p-4 pt-24 backdrop-blur-sm">
          <div className="w-full max-w-xs border border-black/[0.08] bg-white p-4 shadow-[0_26px_70px_rgba(31,27,24,0.20)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Change status</p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--ink)]">{openStatusProject.name}</h3>
              </div>
              <button
                className="border border-black/[0.08] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                onClick={() => setOpenStatusProjectId(null)}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-1">
              {activeStages.map((stage) => (
                <form action={updateProjectPipelineAction} key={`${openStatusProject.id}-status-popup-${stage}`}>
                  <input name="projectId" type="hidden" value={openStatusProject.id} />
                  <input name="phase" type="hidden" value={stage} />
                  <button
                    className={`w-full border px-3 py-2.5 text-left text-sm font-semibold uppercase tracking-[0.12em] transition ${
                      stage === openStatus
                        ? statusTone(stage)
                        : stage === "DISMISSED"
                          ? "border-[rgba(207,114,79,0.12)] text-[#cf724f] hover:bg-[rgba(207,114,79,0.06)]"
                          : "border-[rgba(47,125,92,0.12)] text-[#2f7d5c] hover:bg-[rgba(47,125,92,0.06)]"
                    }`}
                  >
                    {stage}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

