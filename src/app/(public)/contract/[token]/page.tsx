import { notFound } from "next/navigation";
import { signProjectContractAction } from "@/app/actions";
import { parseContractDocument } from "@/lib/contracts";
import { getDb } from "@/lib/db";

const signatureFont = '"Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive';

export default async function PublicContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ signed?: string; error?: string }>;
}) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const db = getDb();
  const file = db
    .prepare(
      "SELECT id, title, summary, body, linked_path FROM project_files WHERE type = 'CONTRACT' AND linked_path = ? LIMIT 1"
    )
    .get(`/contract/${token}`) as
    | { id?: string; title?: string | null; summary?: string | null; body?: string | null; linked_path?: string | null }
    | undefined;

  if (!file?.id) {
    notFound();
  }

  const contract = parseContractDocument(String(file.body || ""));

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-3 py-8 text-[var(--ink)]">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[1.6rem] border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(58,34,17,0.12)]">
        {query.signed === "client" ? (
          <Banner message="Contract signed successfully." tone="success" />
        ) : null}
        {query.error === "signature" ? (
          <Banner message="Please type your name before signing." tone="warning" />
        ) : null}

        <div
          className="relative overflow-hidden px-8 py-10 text-white"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(17,16,15,0.72), rgba(17,16,15,0.18)), url(${contract.heroImage})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <p className="text-xs uppercase tracking-[0.32em] text-white/70">{contract.contractLabel}</p>
          <div className="mt-6">
            <h1 className="text-4xl font-semibold leading-none">{contract.businessName}</h1>
            <p className="mt-3 text-xl font-semibold text-white/86">{contract.businessOwner}</p>
          </div>
        </div>

        <div className="grid gap-8 px-7 py-8 sm:px-8">
          <div className="grid gap-4 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">{contract.contractLabel}</p>
            <h2 className="text-3xl font-semibold">{contract.contractTitle}</h2>
            <div className="border-t border-black/[0.14] pt-5">
              <h3 className="text-4xl font-semibold">{contract.agreementTitle}</h3>
            </div>
          </div>

          <div className="grid gap-4 text-center text-lg leading-8 text-[var(--muted)]">
            <p>
              Entered into on <InlineValue>{contract.enteredOn}</InlineValue>.
            </p>
            <p>
              Event is on <InlineValue>{contract.eventDate}</InlineValue> at{" "}
              <InlineValue>{contract.venue}</InlineValue>.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <PartyCard
              email={contract.businessEmail}
              heading="Vendor"
              lines={[contract.businessName, contract.businessAddress, contract.businessPhone]}
            />
            <PartyCard
              email={contract.clientEmail}
              heading="Client"
              lines={[contract.clientName, contract.clientAddress, contract.clientPhone]}
            />
          </div>

          <div className="grid gap-3 rounded-[1.3rem] bg-[rgba(247,241,232,0.58)] p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Service overview</p>
            <p className="text-lg font-semibold">{contract.serviceType} | {contract.packageName}</p>
            <p className="text-sm leading-7 text-[var(--muted)]">{contract.packageOverview}</p>
            <div className="grid gap-2 pt-2">
              {contract.deliverables.map((deliverable) => (
                <p key={deliverable} className="text-sm leading-7 text-[var(--ink)]">
                  - {deliverable}
                </p>
              ))}
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.3rem] bg-[rgba(247,241,232,0.58)] p-5 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Package" value={contract.packagePrice} />
            <Metric label="Credit / Discount" value={contract.creditAmount} />
            <Metric label="Add-ons" value={contract.addOnAmount} />
            <Metric label="Travel" value={contract.travelAmount} />
            <Metric label="Retainer %" value={contract.retainerPercent} />
            <Metric label="Retainer due today" value={contract.retainerDueToday} />
            <Metric label="Remaining balance" value={contract.remainingBalance} />
            <Metric label="Final payment due" value={contract.finalPaymentDue} />
          </div>

          <div className="grid gap-6">
            {contract.sections.map((section) => (
              <section className="grid gap-3 border-t border-black/[0.12] pt-6" key={section.heading}>
                <h4 className="text-2xl font-semibold">{section.heading}</h4>
                <p className="whitespace-pre-line text-base leading-8 text-[var(--ink)]">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="grid gap-4 border-t border-black/[0.12] pt-8 lg:grid-cols-2">
            <SignatureCard
              email={contract.businessEmail}
              label={contract.businessOwner}
              name={contract.vendorSignature.name}
              signedAt={contract.vendorSignature.signedAt}
            />

            <form action={signProjectContractAction} className="grid gap-3 rounded-[1.2rem] border border-black/[0.08] bg-white px-4 py-4">
              <input name="token" type="hidden" value={token} />
              <input name="signer" type="hidden" value="client" />
              <div className="border-b border-dashed border-[#7e776d] pb-2">
                <p
                  className={`min-h-10 text-[2.1rem] leading-none text-[var(--ink)] ${
                    contract.clientSignature.name ? "" : "opacity-45"
                  }`}
                  style={{ fontFamily: signatureFont }}
                >
                  {contract.clientSignature.name || "Click to sign"}
                </p>
              </div>
              <label className="grid gap-2 text-sm">
                <span className="font-semibold text-[var(--ink)]">Signature name</span>
                <input
                  className="rounded-[0.9rem] border border-black/[0.08] px-3 py-2 outline-none transition focus:border-[var(--forest)]"
                  defaultValue={contract.clientSignature.name || contract.clientName}
                  name="signatureName"
                  placeholder="Type your full name"
                />
              </label>
              <div className="flex items-center justify-between gap-4 text-sm text-[var(--muted)]">
                <div>
                  <p className="font-semibold text-[var(--ink)]">{contract.clientName || "Client"}</p>
                  <p className="mt-1">{contract.clientEmail || "No email added"}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--ink)]">Signed</p>
                  <p className="mt-1">{contract.clientSignature.signedAt || "Pending"}</p>
                </div>
              </div>
              <button className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                Sign contract
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

function Banner({ message, tone }: { message: string; tone: "success" | "warning" }) {
  const classes =
    tone === "success"
      ? "border-[rgba(47,125,92,0.24)] bg-[rgba(47,125,92,0.08)] text-[var(--forest)]"
      : "border-[rgba(207,114,79,0.26)] bg-[rgba(207,114,79,0.08)] text-[var(--accent)]";

  return <div className={`border-b px-5 py-4 text-sm ${classes}`}>{message}</div>;
}

function InlineValue({ children }: { children: React.ReactNode }) {
  return <span className="border-b border-dashed border-[#a9a29a] bg-[rgba(31,27,24,0.04)] px-2 py-1 text-[var(--ink)]">{children || "Not added"}</span>;
}

function PartyCard({
  email,
  heading,
  lines,
}: {
  email: string;
  heading: string;
  lines: string[];
}) {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{heading}</p>
      {lines.filter(Boolean).map((line) => (
        <InlineValue key={line}>{line}</InlineValue>
      ))}
      <InlineValue>{email}</InlineValue>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
      <p className="text-lg font-semibold text-[var(--ink)]">{value || "0"}</p>
    </div>
  );
}

function SignatureCard({
  email,
  label,
  name,
  signedAt,
}: {
  email: string;
  label: string;
  name: string;
  signedAt: string;
}) {
  return (
    <div className="grid gap-2 rounded-[1.2rem] border border-black/[0.08] bg-white px-4 py-4">
      <div className="border-b border-dashed border-[#7e776d] pb-2">
        <p
          className={`min-h-10 text-[2.1rem] leading-none text-[var(--ink)] ${name ? "" : "opacity-45"}`}
          style={{ fontFamily: signatureFont }}
        >
          {name || "Pending signature"}
        </p>
      </div>
      <div className="flex items-start justify-between gap-4 text-sm text-[var(--muted)]">
        <div>
          <p className="font-semibold text-[var(--ink)]">{label}</p>
          <p className="mt-1">{email || "No email added"}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-[var(--ink)]">Signed</p>
          <p className="mt-1">{signedAt || "Pending"}</p>
        </div>
      </div>
    </div>
  );
}
