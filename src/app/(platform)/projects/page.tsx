import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { NewProjectModal } from "@/components/new-project-modal";
import { ProjectsTable } from "@/components/projects-table";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { canCreateProjects } from "@/lib/roles";

const stageOrder = ["BOOKED", "DISMISSED"];
const activeStages = [...stageOrder];
const sortOptions = {
  recent: "Recently updated",
  dateAsc: "Date soonest first",
  dateDesc: "Date latest first",
  nameAsc: "Name A-Z",
  stage: "Status",
} as const;
const viewOptions = [
  { value: "booked", label: "BOOKED" },
  { value: "dismissed", label: "DISMISSED" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
] as const;

const stageCardStyles: Record<
  string,
  {
    accent: string;
    icon: React.ReactNode;
  }
> = {
  BOOKED: {
    accent: "bg-[rgba(47,125,92,0.16)] text-[#2f7d5c]",
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M4 7h16v10H4z" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    ),
  },
  DISMISSED: {
    accent: "bg-[rgba(207,114,79,0.16)] text-[#cf724f]",
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" />
        <path d="m9 9 6 6" />
        <path d="m15 9-6 6" />
      </svg>
    ),
  },
};

function getProjectStatus(phase: string) {
  return String(phase || "").trim().toUpperCase() === "DISMISSED" ? "DISMISSED" : "BOOKED";
}

function matchesSearch(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    created?: string;
    deleted?: string;
    archived?: string;
    pipeline?: string;
    description?: string;
    typeUpdated?: string;
    error?: string;
    stage?: string;
    type?: string;
    source?: string;
    view?: string;
    sort?: string;
  }>;
}) {
  const { user, data } = await getDashboardPageData();
  const canCreateNewProjects = canCreateProjects(user.role);
  const params = await searchParams;
  const query = String(params.q ?? "").trim();
  const showCreated = params.created === "1";
  const showDeleted = params.deleted === "1";
  const showArchived = params.archived === "1";
  const showPipelineUpdated = params.pipeline === "1";
  const showDescriptionSaved = params.description === "1";
  const showTypeUpdated = params.typeUpdated === "1";
  const stageFilter = String(params.stage ?? "").trim();
  const typeFilter = String(params.type ?? "").trim();
  const sourceFilter = String(params.source ?? "").trim();
  const viewFilter = String(params.view ?? "booked").trim();
  const sortFilter = String(params.sort ?? "recent").trim();
  const hasActiveFilters = Boolean(stageFilter || typeFilter || sourceFilter);
  const errorMessage =
    params.error === "project-invalid"
      ? "Fill out every new client field before creating the project."
      : params.error === "project-phase-invalid"
        ? "Choose a valid project status before updating the project."
        : params.error === "project-archive-invalid"
          ? "Select at least one project before archiving."
          : params.error === "project-description-invalid"
            ? "Add a description before saving the project."
            : params.error === "project-type-invalid"
              ? "Choose Business, Wedding, or Others before updating the project type."
        : params.error === "project-delete-invalid"
          ? "That project could not be deleted."
        : params.error === "project-create-forbidden"
          ? "This account can work inside projects, but it cannot create brand-new ones."
      : "";

  const clientEmailByProject = new Map(
    data.clients.map((client) => [client.project, client.contactEmail])
  );

  const enrichedProjects = data.projects.map((project) => ({
    ...project,
    contactEmail: clientEmailByProject.get(project.name) || "",
  }));
  const unavailableDates = enrichedProjects
    .filter((project) => project.projectDate && !project.archivedAt)
    .map((project) => ({
      label: project.name,
      projectId: project.id,
      value: project.projectDate,
    }));

  const filteredProjects = enrichedProjects.filter((project) => {
    const matchesQuery =
      !query ||
      [
        project.name,
        project.client,
        project.type,
        project.location,
        project.description,
        project.leadSource,
        getProjectStatus(project.phase),
      ].some((value) => matchesSearch(value, query));
    const projectStatus = getProjectStatus(project.phase);
    const matchesStage = !stageFilter || projectStatus === stageFilter;
    const matchesType = !typeFilter || project.type === typeFilter;
    const matchesSource = !sourceFilter || project.leadSource === sourceFilter;
    const matchesView =
      viewFilter === "all" ||
      (viewFilter === "archived"
        ? Boolean(project.archivedAt)
        : viewFilter === "dismissed"
          ? !project.archivedAt && projectStatus === "DISMISSED"
          : !project.archivedAt && projectStatus === "BOOKED");

    return matchesQuery && matchesStage && matchesType && matchesSource && matchesView;
  });

  const sortedProjects = [...filteredProjects].sort((left, right) => {
    if (sortFilter === "dateAsc") {
      return (left.projectDate || "9999-12-31").localeCompare(right.projectDate || "9999-12-31");
    }

    if (sortFilter === "dateDesc") {
      return (right.projectDate || "").localeCompare(left.projectDate || "");
    }

    if (sortFilter === "nameAsc") {
      return left.name.localeCompare(right.name);
    }

    if (sortFilter === "stage") {
      return stageOrder.indexOf(getProjectStatus(left.phase)) - stageOrder.indexOf(getProjectStatus(right.phase));
    }

    return (right.stageMovedAt || "").localeCompare(left.stageMovedAt || "");
  });

  const stageCounts = stageOrder.map((stage) => ({
    label: stage,
    count: data.projects.filter((project) => !project.archivedAt && getProjectStatus(project.phase) === stage).length,
  }));
  const typeOptions = Array.from(new Set(data.projects.map((project) => project.type).filter(Boolean))).sort();
  const sourceOptions = Array.from(new Set(data.projects.map((project) => project.leadSource).filter(Boolean))).sort();
  const activeProjectCount = data.projects.filter((project) => !project.archivedAt).length;

  return (
    <DashboardShell
      currentPath="/projects"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="grid gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Client pipeline
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-[2.1rem]">
              Projects
            </h1>
            <p className="text-sm text-[var(--muted)]">
              {sortedProjects.length} showing
              {viewFilter !== "all" ? ` in ${viewFilter}` : ""} from {activeProjectCount} active projects.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start">
            {canCreateNewProjects ? <NewProjectModal unavailableDates={unavailableDates} /> : null}
          </div>
        </div>

        {showCreated ? (
          <div className="border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm text-[var(--forest)]">
            New client and project added successfully.
          </div>
        ) : null}

        {showDeleted ? (
          <div className="border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm text-[var(--forest)]">
            Project deleted successfully.
          </div>
        ) : null}

        {showArchived ? (
          <div className="border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm text-[var(--forest)]">
            Project archive updated.
          </div>
        ) : null}

        {showPipelineUpdated ? (
          <div className="border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm text-[var(--forest)]">
            Project status updated.
          </div>
        ) : null}

        {showDescriptionSaved ? (
          <div className="border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm text-[var(--forest)]">
            Project description updated.
          </div>
        ) : null}

        {showTypeUpdated ? (
          <div className="border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-4 py-3 text-sm text-[var(--forest)]">
            Project type updated.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-4 py-3 text-sm text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <div className="border border-black/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,248,244,0.96))] p-4 shadow-[0_16px_42px_rgba(31,27,24,0.05)] sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <form className="flex flex-wrap items-center gap-3" method="get">
                  <input name="q" type="hidden" value={query} />
                  <input name="stage" type="hidden" value={stageFilter} />
                  <input name="type" type="hidden" value={typeFilter} />
                  <input name="source" type="hidden" value={sourceFilter} />
                  <input name="view" type="hidden" value={viewFilter} />
                  <label
                    className={`flex items-center gap-2 border px-3 py-2 text-[0.85rem] font-medium text-[var(--ink)] shadow-[0_8px_22px_rgba(31,27,24,0.03)] transition ${
                      sortFilter !== "recent"
                        ? "border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)]"
                        : "border-[#d8dfeb] bg-white"
                    }`}
                  >
                    <svg aria-hidden="true" className="h-4 w-4 text-[#64748b]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M3 6h18" />
                      <path d="M7 12h10" />
                      <path d="M10 18h4" />
                    </svg>
                    <select
                      className="bg-transparent text-[0.85rem] font-medium text-[var(--ink)] outline-none"
                      defaultValue={sortFilter}
                      name="sort"
                    >
                      {Object.entries(sortOptions).map(([value, label]) => (
                        <option key={value} value={value}>
                          Sort: {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="flex h-9 items-center justify-center border border-[#d8dfeb] bg-white px-3.5 text-[0.85rem] font-medium text-[#3b82f6] shadow-[0_8px_22px_rgba(31,27,24,0.03)] transition hover:bg-[#f8fafc] active:scale-[0.99]"
                    type="submit"
                  >
                    Apply
                  </button>
                </form>

                <details className="group relative">
                  <summary
                    className={`flex list-none items-center gap-2 border px-3 py-2 text-[0.85rem] font-medium transition hover:opacity-80 ${
                      hasActiveFilters
                        ? "border-[rgba(47,125,92,0.22)] bg-[rgba(47,125,92,0.10)] text-[var(--forest)]"
                        : "border-[#d8dfeb] bg-white text-[#3b82f6]"
                    }`}
                  >
                    <span className="text-base leading-none">+</span>
                    <span>{hasActiveFilters ? "Filters applied" : "Add Filter"}</span>
                  </summary>
                  <div className="absolute left-0 top-full z-20 mt-2.5 w-[18rem] border border-[#d8dfeb] bg-white p-4 shadow-[0_16px_34px_rgba(31,27,24,0.10)]">
                    <form className="grid gap-3" method="get">
                      <input name="q" type="hidden" value={query} />
                      <input name="sort" type="hidden" value={sortFilter} />
                      <input name="view" type="hidden" value={viewFilter} />
                      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                        <span>Status</span>
                        <select className="border border-[#d8dfeb] bg-white px-3 py-2.5 text-sm outline-none" defaultValue={stageFilter} name="stage">
                          <option value="">All statuses</option>
                          {stageOrder.map((stage) => (
                            <option key={stage} value={stage}>
                              {stage}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                        <span>Type</span>
                        <select className="border border-[#d8dfeb] bg-white px-3 py-2.5 text-sm outline-none" defaultValue={typeFilter} name="type">
                          <option value="">All types</option>
                          {typeOptions.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                        <span>Lead source</span>
                        <select className="border border-[#d8dfeb] bg-white px-3 py-2.5 text-sm outline-none" defaultValue={sourceFilter} name="source">
                          <option value="">All sources</option>
                          {sourceOptions.map((source) => (
                            <option key={source} value={source}>
                              {source}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex items-center gap-3 pt-1">
                        <button className="bg-[linear-gradient(180deg,#2c394d,#1f2937)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.99]">
                          Apply filters
                        </button>
                        <Link
                          className="text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
                          href="/projects"
                        >
                          Reset
                        </Link>
                      </div>
                    </form>
                  </div>
                </details>
              </div>
              <form className="max-w-xl" method="get">
                <input name="stage" type="hidden" value={stageFilter} />
                <input name="type" type="hidden" value={typeFilter} />
                <input name="source" type="hidden" value={sourceFilter} />
                <input name="view" type="hidden" value={viewFilter} />
                <input name="sort" type="hidden" value={sortFilter} />
                <label className="flex items-center gap-3 border border-[#d8dfeb] bg-white px-3.5 py-2.5 text-sm text-[var(--muted)] shadow-[0_8px_22px_rgba(31,27,24,0.03)]">
                  <span aria-hidden="true">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                  </span>
                  <input
                    className="w-full bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
                    defaultValue={query}
                    name="q"
                    placeholder="Search clients, projects, type, or source"
                  />
                </label>
              </form>
            </div>

            <form className="flex flex-wrap items-center gap-2" method="get">
              <input name="q" type="hidden" value={query} />
              <input name="stage" type="hidden" value={stageFilter} />
              <input name="type" type="hidden" value={typeFilter} />
              <input name="source" type="hidden" value={sourceFilter} />
              <input name="sort" type="hidden" value={sortFilter} />
              {viewOptions.map((option) => {
                const isSelected = viewFilter === option.value;

                return (
                  <button
                    key={option.value}
                    aria-pressed={isSelected}
                    className={`border px-3 py-1.5 text-[0.76rem] font-semibold uppercase tracking-[0.14em] shadow-[0_8px_22px_rgba(31,27,24,0.03)] transition active:scale-[0.99] ${
                      isSelected
                        ? "border-[rgba(47,125,92,0.28)] bg-[rgba(47,125,92,0.10)] text-[var(--forest)]"
                        : "border-[#d8dfeb] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                    }`}
                    name="view"
                    type="submit"
                    value={option.value}
                  >
                    {option.label}
                  </button>
                );
              })}
            </form>
          </div>

          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {stageCounts.map((item, index) => (
              <article
                key={item.label}
                className={`border px-4 py-3 transition hover:-translate-y-0.5 ${
                  index === stageCounts.length - 1
                    ? "border-[#263245] bg-[linear-gradient(180deg,#31415a,#243043)] text-white shadow-[0_14px_28px_rgba(36,48,67,0.16)]"
                    : "border-[#e2e8f2] bg-white shadow-[0_8px_18px_rgba(31,27,24,0.04)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {index !== stageCounts.length - 1 ? (
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${stageCardStyles[item.label]?.accent || "bg-[rgba(15,23,42,0.08)] text-[var(--ink)]"}`}>
                      {stageCardStyles[item.label]?.icon}
                    </span>
                  ) : null}
                  <div>
                    <p className={`text-[2rem] font-semibold leading-none ${index === stageCounts.length - 1 ? "text-white" : "text-[var(--ink)]"}`}>
                      {item.count}
                    </p>
                    <p className={`mt-1.5 text-[0.8rem] leading-5 ${index === stageCounts.length - 1 ? "text-white/72" : "text-[var(--muted)]"}`}>
                      {item.label}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <ProjectsTable
          activeStages={activeStages}
          projects={sortedProjects}
          userRole={user.role}
          unavailableDates={unavailableDates}
        />
      </section>
    </DashboardShell>
  );
}
