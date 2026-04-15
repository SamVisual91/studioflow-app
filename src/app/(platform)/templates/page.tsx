import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { SectionHeader } from "@/components/dashboard-ui";
import { getDashboardPageData } from "@/lib/dashboard-page";
import { getTemplateSlug, templateTypes } from "@/lib/templates";

const templateDescriptions: Record<string, string> = {
  Packages: "Build reusable wedding, business, and other pricing collections.",
  Contract: "Terms, usage rights, cancellation policy, and signature language.",
  Invoice: "Payment-ready billing outline and installment language.",
  Questionnaire: "Planning questions for weddings, businesses, and creative shoots.",
  "Services guide": "A polished overview of what you offer and how clients work with you.",
  "Timeline planner": "Shoot-day, wedding-day, or production-day timeline structure.",
  "Shot list": "Must-have photo/video moments, scenes, products, or deliverables.",
  "Mood board": "Creative direction, references, visual tone, and brand notes.",
  "Welcome guide": "Onboarding guide for expectations, process, and next steps.",
};

export default async function TemplatesPage() {
  const { user, data } = await getDashboardPageData();
  const templateCards = ["Packages", ...templateTypes.filter((type) => type !== "Proposal")];

  return (
    <DashboardShell
      currentPath="/templates"
      summary={{
        weeklyRevenue: data.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
        tasksDue: data.stats.tasksDue,
        eventCount: data.schedule.length,
      }}
      user={user}
    >
      <section className="grid gap-6 rounded-[2rem] border border-black/[0.08] bg-white/88 p-6 shadow-[0_22px_60px_rgba(59,36,17,0.09)] sm:p-8">
        <SectionHeader
          eyebrow="Templates"
          title="Your Custom Templates"
          copy="Open a template type to work from a ready-made starter page, or jump into Packages to manage your reusable pricing collections."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templateCards.map((type) => (
            <Link
              className="rounded-[1.35rem] border border-black/[0.08] bg-[rgba(247,241,232,0.56)] p-5 transition hover:-translate-y-0.5 hover:border-[var(--forest)] hover:bg-white hover:shadow-[0_18px_45px_rgba(59,36,17,0.1)]"
              href={type === "Packages" ? "/packages" : `/templates/${getTemplateSlug(type)}`}
              key={type}
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                Template type
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{type}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {templateDescriptions[type]}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
