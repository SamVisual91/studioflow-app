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
  unavailableDates: Array<{
    label: string;
    projectId?: string;
    value: string;
  }>;
};

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

function shortenText(value: string, maxLength: number) {
  if (!value) {
    return "";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

export function ProjectsTable({ projects, activeStages, unavailableDates }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [openStatusProjectId, setOpenStatusProjectId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const allVisibleSelected = useMemo(
    () => projects.length > 0 && projects.every((project) => selectedIds.includes(project.id)),
    [projects, selectedIds]
  );
  const openProject = projects.find((project) => project.id === openProjectId) ?? null;
  const openStatusProject = projects.find((project) => project.id === openStatusProjectId) ?? null;

  useEffect(() => {
    setIsEditModalOpen(Boolean(openProjectId));
  }, [openProjectId]);

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
      <div className="overflow-hidden border border-black/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(250,249,246,0.96))] shadow-[0_22px_60px_rgba(31,27,24,0.06)]">
        <div className="flex flex-col gap-4 border-b border-[#e5ebf3] bg-white/86 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">Bulk project actions</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Select one or more projects to archive them safely or delete them permanently.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="min-w-[9.75rem] border border-[#d8dfeb] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[0_8px_18px_rgba(31,27,24,0.04)] transition hover:bg-[#f8fafc]"
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
                className="min-w-[11.5rem] border border-[rgba(47,125,92,0.16)] bg-[rgba(47,125,92,0.08)] px-4 py-2 text-[0.92rem] font-semibold text-[var(--forest)] transition hover:bg-[rgba(47,125,92,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
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
                className="min-w-[10.75rem] border border-[rgba(207,114,79,0.16)] bg-[rgba(207,114,79,0.08)] px-4 py-2 text-[0.92rem] font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={selectedIds.length === 0}
              >
                Delete selected
              </button>
            </form>
          </div>
        </div>

        <div className="overflow-x-auto bg-white">
          <table className="w-full min-w-[1120px] table-fixed border-collapse xl:min-w-0">
            <thead className="border-b border-[#e5ebf3] bg-[rgba(247,249,252,0.9)] text-left">
              <tr className="text-xs uppercase tracking-[0.18em] text-[#7c8aa0]">
                <th className="w-10 px-3 py-4 font-semibold">
                  <label className="flex items-center justify-center">
                    <input checked={allVisibleSelected} onChange={toggleAllVisible} type="checkbox" />
                    <span className="sr-only">Select visible projects</span>
                  </label>
                </th>
                <th className="w-[19%] px-4 py-4 font-semibold">Name</th>
                <th className="w-[17%] px-4 py-4 font-semibold">Contact</th>
                <th className="w-[7%] px-4 py-4 font-semibold">Type</th>
                <th className="w-[11%] px-4 py-4 font-semibold">Date</th>
                <th className="w-[10%] px-4 py-4 font-semibold">Location</th>
                <th className="w-[12%] px-4 py-4 font-semibold">Description</th>
                <th className="w-[9%] px-4 py-4 font-semibold">Lead source</th>
                <th className="w-[10%] px-4 py-4 font-semibold">Status</th>
                <th className="w-[5%] px-5 py-4 text-right font-semibold">
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center justify-end text-base tracking-[0.2em] text-[var(--muted)]"
                  >
                    ⋮
                  </span>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-sm text-[var(--muted)]" colSpan={10}>
                    No projects matched that search yet.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="border-t border-[#edf1f6] transition hover:bg-[#fbfcff]">
                    <td className="px-3 py-4 text-center align-middle">
                      <input
                        checked={selectedIds.includes(project.id)}
                        onChange={() => toggleProject(project.id)}
                        type="checkbox"
                      />
                    </td>
                    <td className="min-w-0 px-4 py-4 align-middle">
                      <div className="flex min-w-0 items-center gap-3">
                        <ProjectTypeIcon type={project.type || "Others"} />
                        <Link
                          className="block truncate whitespace-nowrap text-[0.86rem] font-semibold leading-5 text-[var(--ink)] underline-offset-4 hover:underline"
                          href={`/projects/${project.id}`}
                          title={project.name}
                        >
                          {project.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-[0.8rem] text-[var(--ink)]">
                      <span className="block truncate whitespace-nowrap" title={project.contactEmail || project.client}>
                        {project.contactEmail || project.client}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle text-[0.82rem] text-[var(--ink)]">
                      <span className="block truncate whitespace-nowrap" title={project.type || "Others"}>
                        {project.type || "Others"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle text-[0.82rem] text-[var(--ink)]">
                      <span className="block whitespace-nowrap">{formatProjectDate(project.projectDate)}</span>
                    </td>
                    <td className="px-4 py-4 align-middle text-[0.82rem] text-[var(--ink)]">
                      <span className="block truncate whitespace-nowrap" title={project.location || "TBD"}>
                        {project.location || "TBD"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle text-[0.8rem] text-[var(--muted)]">
                      <p
                        className="max-w-[10rem] truncate whitespace-nowrap leading-5"
                        title={project.description || "No description yet."}
                      >
                        {shortenText(project.description || "No description yet.", 80)}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-middle text-[0.8rem] text-[var(--ink)]">
                      <span className="block truncate whitespace-nowrap" title={project.leadSource || "Direct"}>
                        {project.leadSource || "Direct"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex flex-col gap-2">
                        <button
                          className="flex w-fit max-w-full items-center gap-1.5 bg-transparent p-0 text-[0.82rem] font-semibold text-[#5b6f8b] transition hover:text-[var(--ink)]"
                          onClick={() => setOpenStatusProjectId(project.id)}
                          type="button"
                        >
                          <span className="truncate whitespace-nowrap" title={project.phase}>
                            {project.phase}
                          </span>
                          <DoubleChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center justify-end">
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8dfeb] bg-white text-sm font-semibold text-[var(--muted)] shadow-[0_6px_16px_rgba(31,27,24,0.04)] transition hover:bg-[#f8fafc]"
                          onClick={() => setOpenProjectId(project.id)}
                          type="button"
                        >
                          ⋮
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
              {(openStatusProject.phase === "Completed"
                ? [...activeStages, "Completed"]
                : activeStages
              ).map((stage) => (
                <form action={updateProjectPipelineAction} key={`${openStatusProject.id}-status-popup-${stage}`}>
                  <input name="projectId" type="hidden" value={openStatusProject.id} />
                  <input name="phase" type="hidden" value={stage} />
                  <button
                    className={`w-full px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-black/[0.04] ${
                      stage === openStatusProject.phase
                        ? "bg-[rgba(47,125,92,0.1)] text-[var(--forest)]"
                        : "text-[var(--ink)]"
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
