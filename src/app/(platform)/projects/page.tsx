import Link from "next/link";
import {
} from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { NewProjectModal } from "@/components/new-project-modal";
import { ProjectsTable } from "@/components/projects-table";
import { canCreateProjects } from "@/lib/auth";
import { getDashboardPageData } from "@/lib/dashboard-page";

const stageOrder = [
  "Inquiry",
  "Follow-up",
  "Meeting",
  "Proposal Sent",
  "Proposal Signed",
  "Planning",
  "Completed",
];
const activeStages = stageOrder.filter((stage) => stage !== "Completed");
const sortOptions = {
  recent: "Recently updated",
  dateAsc: "Date soonest first",
  dateDesc: "Date latest first",
  nameAsc: "Name A-Z",
  stage: "Stage",
} as const;

const stageCardStyles: Record<
  string,
  {
    accent: string;
    icon: React.ReactNode;
  }
> = {
  Inquiry: {
    accent: "bg-[rgba(255,184,107,0.18)] text-[#f3a43d]",
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  "Follow-up": {
    accent: "bg-[rgba(96,165,250,0.18)] text-[#3b82f6]",
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M7 12h10" />
        <path d="M12 7l5 5-5 5" />
      </svg>
    ),
  },
  Meeting: {
    accent: "bg-[rgba(96,165,250,0.18)] text-[#4f8df7]",
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect height="12" rx="3" width="16" x="4" y="6" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
      </svg>
    ),
  },
  "Proposal Sent": {
    accent: "bg-[rgba(196,181,253,0.24)] text-[#8b5cf6]",
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M4 7h16v10H4z" />
        <path d="m5 8 7 6 7-6" />
      </svg>
    ),
  },
  "Proposal Signed": {
    accent: "bg-[rgba(134,239,172,0.2)] text-[#35a867]",
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M4 7h16v10H4z" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    ),
  },
  Planning: {
    accent: "bg-[rgba(125,211,252,0.22)] text-[#25a8ba]",
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M8 12h8" />
        <path d="M12 8v8" />
        <circle cx="12" cy="12" r="8" />
      </svg>
    ),
  },
  Completed: {
    accent: "bg-[rgba(96,165,250,0.18)] text-[#4f8df7]",
    icon: (
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
};

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
  const showDescriptionSaved = params.description === "1";
  const showTypeUpdated = params.typeUpdated === "1";
  const stageFilter = String(params.stage ?? "").trim();
  const typeFilter = String(params.type ?? "").trim();
  const sourceFilter = String(params.source ?? "").trim();
  const viewFilter = String(params.view ?? "active").trim();
  const sortFilter = String(params.sort ?? "recent").trim();
  const errorMessage =
    params.error === "project-invalid"
      ? "Fill out every new client field before creating the project."
      : params.error === "project-phase-invalid"
        ? "Choose a valid project stage before updating the pipeline."
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
        project.phase,
      ].some((value) => matchesSearch(value, query));
    const matchesStage = !stageFilter || project.phase === stageFilter;
    const matchesType = !typeFilter || project.type === typeFilter;
    const matchesSource = !sourceFilter || project.leadSource === sourceFilter;
    const matchesView =
      viewFilter === "all" ||
      (viewFilter === "archived"
        ? Boolean(project.archivedAt)
        : viewFilter === "completed"
          ? !project.archivedAt && project.phase === "Completed"
          : !project.archivedAt && project.phase !== "Completed");

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
      return stageOrder.indexOf(left.phase) - stageOrder.indexOf(right.phase);
    }

    return (right.stageMovedAt || "").localeCompare(left.stageMovedAt || "");
  });

  const stageCounts = stageOrder.map((stage) => ({
    label: stage,
    count: data.projects.filter((project) => !project.archivedAt && project.phase === stage).length,
  }));
  const typeOptions = Array.from(new Set(data.projects.map((project) => project.type).filter(Boolean))).sort();
  const sourceOptions = Array.from(new Set(data.projects.map((project) => project.leadSource).filter(Boolean))).sort();

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
      <section className="grid gap-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Projects</h1>
          </div>

          <div className="flex items-center gap-4 self-start">
            {canCreateNewProjects ? <NewProjectModal unavailableDates={unavailableDates} /> : null}
          </div>
        </div>

        {showCreated ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            New client and project added successfully.
          </div>
        ) : null}

        {showDeleted ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Project deleted successfully.
          </div>
        ) : null}

        {showArchived ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Project archive updated.
          </div>
        ) : null}

        {showDescriptionSaved ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Project description updated.
          </div>
        ) : null}

        {showTypeUpdated ? (
          <div className="rounded-[1.5rem] border border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] px-5 py-4 text-sm text-[var(--forest)]">
            Project type updated.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[1.5rem] border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-4 text-sm text-[var(--accent)]">
            {errorMessage}
          </div>
        ) : null}

        <div className="border border-black/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,248,244,0.96))] p-6 shadow-[0_22px_60px_rgba(31,27,24,0.06)]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <form className="flex flex-wrap items-center gap-3" method="get">
                  <input name="q" type="hidden" value={query} />
                  <input name="stage" type="hidden" value={stageFilter} />
                  <input name="type" type="hidden" value={typeFilter} />
                  <input name="source" type="hidden" value={sourceFilter} />
                  <input name="view" type="hidden" value={viewFilter} />
                  <label className="flex items-center gap-2 border border-[#d8dfeb] bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink)] shadow-[0_10px_30px_rgba(31,27,24,0.03)]">
                    <svg aria-hidden="true" className="h-4 w-4 text-[#64748b]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M3 6h18" />
                      <path d="M7 12h10" />
                      <path d="M10 18h4" />
                    </svg>
                    <select
                      className="bg-transparent text-sm font-medium text-[var(--ink)] outline-none"
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
                    className="flex h-10 items-center justify-center rounded-full border border-[#d8dfeb] bg-white px-4 text-sm font-medium text-[#3b82f6] shadow-[0_10px_30px_rgba(31,27,24,0.03)] transition hover:bg-[#f8fafc]"
                    type="submit"
                  >
                    Apply
                  </button>
                </form>

                <details className="group relative">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-2 text-[1.05rem] font-medium text-[#3b82f6] transition hover:opacity-80">
                    <span className="text-xl leading-none">+</span>
                    <span>Add Filter</span>
                  </summary>
                  <div className="absolute left-0 top-full z-20 mt-3 w-[20rem] border border-[#d8dfeb] bg-white p-4 shadow-[0_18px_44px_rgba(31,27,24,0.12)]">
                    <form className="grid gap-3" method="get">
                      <input name="q" type="hidden" value={query} />
                      <input name="sort" type="hidden" value={sortFilter} />
                      <input name="view" type="hidden" value={viewFilter} />
                      <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
                        <span>Stage</span>
                        <select className="border border-[#d8dfeb] bg-white px-3 py-2.5 text-sm outline-none" defaultValue={stageFilter} name="stage">
                          <option value="">All stages</option>
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
                        <button className="bg-[linear-gradient(180deg,#2c394d,#1f2937)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
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
                <label className="flex items-center gap-3 border border-[#d8dfeb] bg-white px-4 py-3 text-sm text-[var(--muted)] shadow-[0_10px_30px_rgba(31,27,24,0.03)]">
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

            <div className="flex items-center gap-2">
              {[
                <svg key="list" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M8 6h12" /><path d="M8 12h12" /><path d="M8 18h12" /><path d="M4 6h.01" /><path d="M4 12h.01" /><path d="M4 18h.01" /></svg>,
                <svg key="stack" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></svg>,
                <svg key="board" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><rect height="14" rx="2" width="16" x="4" y="5" /><path d="M9 5v14" /><path d="M15 5v14" /></svg>,
                <svg key="grid" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><rect height="6" rx="1" width="6" x="4" y="4" /><rect height="6" rx="1" width="6" x="14" y="4" /><rect height="6" rx="1" width="6" x="4" y="14" /><rect height="6" rx="1" width="6" x="14" y="14" /></svg>,
              ].map((icon, index) => (
                <button
                  key={`view-icon-${index}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8dfeb] bg-white text-[#64748b] shadow-[0_10px_30px_rgba(31,27,24,0.03)] transition hover:bg-[#f8fafc]"
                  type="button"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-7">
            {stageCounts.map((item, index) => (
              <article
                key={item.label}
                className={`border px-5 py-4 transition hover:-translate-y-0.5 ${
                  index === stageCounts.length - 1
                    ? "border-[#263245] bg-[linear-gradient(180deg,#31415a,#243043)] text-white shadow-[0_18px_34px_rgba(36,48,67,0.18)]"
                    : "border-[#e2e8f2] bg-white shadow-[0_10px_28px_rgba(31,27,24,0.04)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {index !== stageCounts.length - 1 ? (
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${stageCardStyles[item.label]?.accent || "bg-[rgba(15,23,42,0.08)] text-[var(--ink)]"}`}>
                      {stageCardStyles[item.label]?.icon}
                    </span>
                  ) : null}
                  <div>
                    <p className={`text-4xl font-semibold leading-none ${index === stageCounts.length - 1 ? "text-white" : "text-[var(--ink)]"}`}>
                      {item.count}
                    </p>
                    <p className={`mt-2 text-sm leading-5 ${index === stageCounts.length - 1 ? "text-white/72" : "text-[var(--muted)]"}`}>
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
