import { dateTime } from "@/lib/formatters";
import { type ProjectTimelineEvent } from "@/lib/project-activity";

function getTimelineGroupLabel(timestamp: string) {
  const current = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfCurrent = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfCurrent.getTime()) / 86400000);

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  return current.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: current.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function groupEvents(events: ProjectTimelineEvent[]) {
  return events.reduce(
    (groups, event) => {
      const label = getTimelineGroupLabel(event.occurredAt);
      const current = groups.get(label) || [];
      current.push(event);
      groups.set(label, current);
      return groups;
    },
    new Map<string, ProjectTimelineEvent[]>()
  );
}

type Props = {
  events: ProjectTimelineEvent[];
};

export function ProjectActivityTimeline({ events }: Props) {
  const grouped = groupEvents(events);

  if (events.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-black/[0.12] px-5 py-8 text-sm text-[var(--muted)]">
        No system activity has been recorded for this project yet.
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {Array.from(grouped.entries()).map(([label, group]) => (
        <section key={label} className="grid gap-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
          <div className="grid gap-3">
            {group.map((event) => (
              <article
                key={event.id}
                className="rounded-[1.35rem] border border-black/[0.08] bg-[rgba(255,255,255,0.84)] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{event.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      {event.actorName || "StudioFlow"} | {event.eventType.replaceAll("_", " ")}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">{dateTime.format(new Date(event.occurredAt))}</p>
                </div>
                {event.description ? (
                  <p className="mt-3 text-sm leading-7 text-[var(--ink)]">{event.description}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
