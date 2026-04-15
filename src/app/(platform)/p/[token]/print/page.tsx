import { notFound } from "next/navigation";
import { getDb, parseJsonList } from "@/lib/db";
import { currencyFormatter, shortDate } from "@/lib/formatters";

type LineItem = {
  title: string;
  description: string;
  amount: number;
};

export default async function ProposalPrintPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const db = getDb();
  const proposal = db.prepare("SELECT * FROM proposals WHERE public_token = ?").get(token) as
    | Record<string, unknown>
    | undefined;

  if (!proposal) {
    notFound();
  }

  const lineItems = parseJsonList(String(proposal.line_items ?? "[]")) as unknown as LineItem[];
  const sections = parseJsonList(String(proposal.sections));

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-black">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="border-b border-black/10 pb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-black/55">StudioFlow Print View</p>
          <h1 className="mt-3 text-4xl font-semibold">{String(proposal.title)}</h1>
          <p className="mt-3 text-sm text-black/65">
            {String(proposal.client)} | Expires {shortDate.format(new Date(String(proposal.expires_date)))}
          </p>
        </header>

        <section>
          <h2 className="text-lg font-semibold">Message</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-black/70">
            {String(proposal.email_body || "")}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Line items</h2>
          <div className="mt-4 space-y-3">
            {lineItems.map((item, index) => (
              <div key={index} className="flex items-start justify-between gap-4 border border-black/10 p-4">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-black/70">{item.description}</p>
                </div>
                <p className="font-semibold">{currencyFormatter.format(Number(item.amount))}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-right text-xl font-semibold">
            {currencyFormatter.format(Number(proposal.amount))}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Included sections</h2>
          <p className="mt-3 text-sm text-black/70">{sections.join(", ")}</p>
        </section>

        {String(proposal.signature_name || "") ? (
          <section>
            <h2 className="text-lg font-semibold">Signature</h2>
            <p className="mt-3 text-sm text-black/70">{String(proposal.signature_name)}</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
