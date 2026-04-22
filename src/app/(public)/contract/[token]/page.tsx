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
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[0.6rem] border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(58,34,17,0.12)]">
        {query.signed === "client" ? (
          <Banner message="Contract signed successfully." tone="success" />
        ) : null}
        {query.error === "signature" ? (
          <Banner message="Please type your name before signing." tone="warning" />
        ) : null}

        <div
          className="relative overflow-hidden px-8 py-9 text-white sm:px-10"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(17,16,15,0.64), rgba(17,16,15,0.16)), url(${contract.heroImage})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="max-w-xl">
            <h1 className="text-4xl font-semibold leading-none">{contract.businessName}</h1>
            <p className="mt-3 text-2xl font-semibold text-white/88">{contract.businessOwner}</p>
          </div>
        </div>

        <div className="mx-auto max-w-[8.5in] px-6 py-8 sm:px-8">
          <div className="space-y-8 text-[0.94rem] leading-7 text-[var(--muted)]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ink)]">
                {contract.contractLabel}
              </p>
              <div className="mt-5 text-center">
                <h2 className="text-[1.6rem] font-semibold text-[var(--ink)]">{contract.contractTitle}</h2>
                <div className="mt-5 border-t border-black/[0.16] pt-5">
                  <h3 className="text-[2rem] font-bold text-[var(--ink)]">{contract.agreementTitle}</h3>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-center">
              <p>
                Entered into on <InlineValue>{contract.enteredOn}</InlineValue>.
              </p>
              <p>
                Event is on <InlineValue>{contract.eventDate}</InlineValue> at{" "}
                <InlineValue>{contract.venue}</InlineValue>.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-base font-bold text-[var(--ink)]">Vendor</p>
                <InlineValue>{contract.businessName}</InlineValue>
                <InlineValue>{contract.businessEmail}</InlineValue>
                <InlineValue>{contract.businessAddress}</InlineValue>
                <InlineValue>{contract.businessPhone}</InlineValue>
              </div>
              <div className="space-y-2">
                <p className="text-base font-bold text-[var(--ink)]">Client</p>
                <InlineValue>{contract.clientName}</InlineValue>
                <InlineValue>{contract.clientEmail}</InlineValue>
                <InlineValue>{contract.clientAddress}</InlineValue>
                <InlineValue>{contract.clientPhone}</InlineValue>
              </div>
            </div>
            <div className="space-y-3">
              <p>
                Collectively, all of the above people or businesses entering this Agreement will be referred to as the &quot;Parties.&quot;
              </p>
            </div>

            <SectionHeading>Purpose of the Agreement</SectionHeading>

            <p>
              Client wishes to hire Vendors to provide services relating to Client&apos;s{" "}
              <InlineValue>{contract.serviceType}</InlineValue> as detailed in this Agreement. Vendor has
              agreed to provide such services according to the terms of this Agreement.
            </p>

            {contract.sections.map((section) => {
              const isPleaseRead =
                section.heading.toLowerCase().includes("cancellation") ||
                section.heading.toLowerCase().includes("illness") ||
                section.heading.toLowerCase().includes("reschedule");

              return (
                <div className="space-y-4" key={section.heading}>
                  {isPleaseRead ? (
                    <p className="pt-5 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--ink)]">
                      Please read
                    </p>
                  ) : null}

                  {section.heading === "Terms" ? (
                    <SectionHeading>
                      <span className="underline decoration-black/[0.45] underline-offset-4">Terms</span>
                    </SectionHeading>
                  ) : null}

                  {section.heading !== "Terms" ? (
                    <h4 className="text-[1.2rem] font-bold leading-[1.25] text-[var(--ink)]">
                      {section.heading}
                    </h4>
                  ) : null}

                  <p className="whitespace-pre-line">{section.body}</p>
                </div>
              );
            })}

            <SectionHeading>General Provisions</SectionHeading>

            <div className="space-y-4">
              <p>
                The undersigned have read this contract, understand its terms, and agree to be bound thereby. Any additions, deletions, or revisions must be made in writing and approved by all responsible parties. The parties agree that this contract is the complete and exclusive statement of the mutual understanding of the parties.
              </p>
              <p>
                <span className="font-semibold text-[var(--ink)]">Notice.</span> Parties shall provide effective notice to each other via approved written delivery methods including email.
              </p>
              <div className="space-y-2 pl-4">
                <p>1. Vendor&apos;s Email: <InlineValue>{contract.businessEmail}</InlineValue></p>
                <p>2. Client Email: <InlineValue>{contract.clientEmail}</InlineValue></p>
              </div>
            </div>

            <div className="space-y-4 border-t border-black/[0.16] pt-12">
              <div className="grid gap-12 lg:grid-cols-2">
                <StaticSignature
                  dateLabel={contract.vendorSignature.signedAt}
                  email={contract.businessEmail}
                  name={contract.vendorSignature.name}
                  personLabel={contract.businessOwner || "Vendor"}
                />

                <form action={signProjectContractAction} className="space-y-4">
                  <input name="token" type="hidden" value={token} />
                  <input name="signer" type="hidden" value="client" />
                  <button className="block w-full text-left" type="submit">
                    <div className="min-h-16 border-b-2 border-dashed border-[#7f776b] pb-1">
                      <p
                        className={`text-[3rem] leading-none text-[var(--ink)] transition ${
                          contract.clientSignature.name ? "" : "opacity-40"
                        }`}
                        style={{ fontFamily: signatureFont }}
                      >
                        {contract.clientSignature.name || contract.clientName || "Click to sign"}
                      </p>
                    </div>
                  </button>
                  <label className="block text-sm">
                    <span className="font-semibold text-[var(--ink)]">Signature name</span>
                    <input
                      className="mt-2 w-full rounded-[0.85rem] border border-black/[0.10] px-3 py-2 outline-none transition focus:border-[var(--forest)]"
                      defaultValue={contract.clientSignature.name || contract.clientName}
                      name="signatureName"
                      placeholder="Type your full name"
                    />
                  </label>
                  <div className="grid gap-1 text-sm text-[var(--muted)]">
                    <p className="font-semibold text-[var(--ink)]">{contract.clientName || "Client"}</p>
                    <p>{contract.clientEmail || "No email added"}</p>
                    <p>Signed: {contract.clientSignature.signedAt || "Pending"}</p>
                  </div>
                  <button className="rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110">
                    Sign contract
                  </button>
                </form>
              </div>
            </div>
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
  return (
    <span className="inline-flex min-w-[7rem] border-b border-dotted border-[#8f877c] bg-[rgba(31,27,24,0.06)] px-2 py-0.5 text-[var(--ink)]">
      {children || "Not added"}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-8 text-center">
      <div className="mx-auto h-px w-full bg-black/[0.16]" />
      <h3 className="mt-5 text-[1.45rem] font-bold text-[var(--ink)]">{children}</h3>
    </div>
  );
}

function StaticSignature({
  dateLabel,
  email,
  name,
  personLabel,
}: {
  name: string;
  email: string;
  dateLabel: string;
  personLabel: string;
}) {
  return (
    <div>
      <div className="min-h-16 border-b-2 border-dashed border-[#7f776b] pb-1">
        <p
          className={`text-[3rem] leading-none text-[var(--ink)] transition ${name ? "" : "opacity-40"}`}
          style={{ fontFamily: signatureFont }}
        >
          {name || "Pending signature"}
        </p>
      </div>
      <div className="mt-2 grid gap-1 text-sm text-[var(--muted)]">
        <p className="font-semibold text-[var(--ink)]">{personLabel}</p>
        <p>{email || "No email added"}</p>
        <p>Signed: {dateLabel || "Pending"}</p>
      </div>
    </div>
  );
}
