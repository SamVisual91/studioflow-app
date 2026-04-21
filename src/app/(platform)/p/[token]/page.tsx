import Link from "next/link";
import { notFound } from "next/navigation";
import { respondToProposalAction } from "@/app/actions";
import { getDb, parseJsonList } from "@/lib/db";
import { currencyFormatter, dateTime, shortDate } from "@/lib/formatters";

type LineItem = {
  title: string;
  description: string;
  amount: number;
};

export default async function PublicProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{
    accepted?: string;
    declined?: string;
    commented?: string;
    error?: string;
  }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const db = getDb();

  const proposal = db.prepare("SELECT * FROM proposals WHERE public_token = ?").get(token) as
    | Record<string, unknown>
    | undefined;

  if (!proposal) {
    notFound();
  }

  const sections = parseJsonList(String(proposal.sections));
  const lineItems = parseJsonList(String(proposal.line_items ?? "[]")) as unknown as LineItem[];
  const status = String(proposal.status);
  const isSigned = status === "SIGNED";
  const isDeclined = status === "REJECTED";
  const total = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-10 text-[var(--ink)]">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-black/[0.08] bg-white/88 shadow-[0_24px_80px_rgba(58,34,17,0.12)]">
        <section className="bg-[linear-gradient(160deg,rgba(29,27,31,0.96),rgba(47,125,92,0.92))] px-8 py-10 text-white sm:px-10 sm:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-white/65">StudioFlow Proposal</p>
              <h1 className="mt-5 font-display text-5xl leading-none sm:text-6xl">
                {String(proposal.title)}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/76">
                Prepared for {String(proposal.client)}. Review the scope, pricing, and next steps below.
              </p>
            </div>
            <Link
              className="rounded-full border border-white/12 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16"
              href={`/p/${token}/print`}
            >
              Open print view
            </Link>
          </div>
        </section>

        <section className="grid gap-8 px-8 py-10 sm:px-10 sm:py-12">
          {query.accepted === "1" ? (
            <Banner tone="success" message="Proposal accepted successfully." />
          ) : null}
          {query.declined === "1" ? (
            <Banner tone="warning" message="Proposal declined. Your feedback has been recorded." />
          ) : null}
          {query.commented === "1" ? (
            <Banner tone="success" message="Your comment has been saved." />
          ) : null}
          {query.error === "signature" ? (
            <Banner tone="warning" message="Please type your full name to sign and accept the proposal." />
          ) : null}
          {query.error === "comment" ? (
            <Banner tone="warning" message="Please include a comment before sending feedback or declining." />
          ) : null}

          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Client" value={String(proposal.client)} />
            <StatCard label="Amount" value={currencyFormatter.format(Number(proposal.amount))} />
            <StatCard label="Expires" value={shortDate.format(new Date(String(proposal.expires_date)))} />
            <StatCard label="Status" value={isSigned ? "Signed" : isDeclined ? "Declined" : "Pending"} />
          </div>

          <article className="rounded-[1.75rem] border border-black/[0.08] bg-white p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Message</p>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--muted)]">
              {String(proposal.email_body || "")}
            </p>
          </article>

          <article className="rounded-[1.75rem] border border-black/[0.08] bg-white p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Line items</p>
                <h2 className="mt-3 text-2xl font-semibold">What’s included</h2>
              </div>
              <p className="text-xl font-semibold">{currencyFormatter.format(total || Number(proposal.amount))}</p>
            </div>
            <div className="mt-6 grid gap-4">
              {lineItems.map((item, index) => (
                <div
                  key={`${String(proposal.id)}-${index}`}
                  className="flex flex-col gap-3 rounded-[1.25rem] border border-black/[0.08] p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
                  </div>
                  <p className="font-semibold">{currencyFormatter.format(Number(item.amount))}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {sections.map((section) => (
                <span
                  key={section}
                  className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                >
                  {section}
                </span>
              ))}
            </div>
          </article>

          {String(proposal.client_comment || "") ? (
            <article className="rounded-[1.75rem] border border-black/[0.08] bg-white p-6">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Client feedback</p>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--muted)]">
                {String(proposal.client_comment)}
              </p>
              {String(proposal.signature_name || "") ? (
                <p className="mt-4 text-sm font-semibold text-[var(--ink)]">
                  Signed by {String(proposal.signature_name)}
                  {proposal.signed_at ? ` on ${dateTime.format(new Date(String(proposal.signed_at)))}` : ""}
                </p>
              ) : null}
            </article>
          ) : null}

          <form
            action={respondToProposalAction}
            className="grid gap-5 rounded-[1.75rem] border border-black/[0.08] bg-[linear-gradient(145deg,rgba(207,114,79,0.18),rgba(255,255,255,0.92))] p-6"
          >
            <input name="token" type="hidden" value={token} />
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Respond</p>
              <h2 className="mt-3 text-2xl font-semibold">
                {isSigned ? "This proposal has been accepted." : isDeclined ? "This proposal has been declined." : "Approve, decline, or send feedback."}
              </h2>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Comment
              <textarea
                className="min-h-32 rounded-2xl border border-black/[0.08] bg-white px-4 py-3"
                defaultValue={String(proposal.client_comment || "")}
                name="clientComment"
                placeholder="Ask a question, request a change, or leave a note."
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Signature name
              <input
                className="rounded-2xl border border-black/[0.08] bg-white px-4 py-3"
                defaultValue={String(proposal.signature_name || "")}
                name="signatureName"
                placeholder="Type your full name to sign"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              {!isSigned && !isDeclined ? (
                <button
                  className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(47,125,92,0.22)] transition hover:brightness-110"
                  name="intent"
                  value="accept"
                >
                  Accept and sign
                </button>
              ) : null}
              {!isDeclined ? (
                <button
                  className="rounded-full border border-black/[0.08] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-black/[0.03]"
                  name="intent"
                  value="comment"
                >
                  Save comment
                </button>
              ) : null}
              {!isSigned && !isDeclined ? (
                <button
                  className="rounded-full border border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] px-5 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-[rgba(207,114,79,0.12)]"
                  name="intent"
                  value="reject"
                >
                  Decline proposal
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Banner({ tone, message }: { tone: "success" | "warning"; message: string }) {
  const classes =
    tone === "success"
      ? "border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] text-[var(--forest)]"
      : "border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] text-[var(--accent)]";

  return <div className={`rounded-[1.5rem] border px-5 py-4 text-sm ${classes}`}>{message}</div>;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[1.5rem] border border-black/[0.08] bg-white p-5">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-xl font-semibold">{value}</p>
    </article>
  );
}
