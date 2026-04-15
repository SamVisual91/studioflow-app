import { PublicContactForm } from "@/components/public-contact-form";
import { PublicSiteShell } from "@/components/public-site-shell";

const contactHighlights = [
  "Wedding films, photography, and keepsakes",
  "Brand campaigns, commercials, and content production",
  "Social media support, websites, and launch visuals",
];

const processPoints = [
  {
    title: "Share the vision",
    description: "Tell us what you're planning, what matters most, and what kind of experience you want the final work to create.",
  },
  {
    title: "We shape the direction",
    description: "We'll help you figure out the right coverage, deliverables, and creative path so the project feels clear from the start.",
  },
  {
    title: "Build something memorable",
    description: "From first reply to final delivery, we keep the process polished, collaborative, and focused on strong results.",
  },
];

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const query = await searchParams;
  const successMessage = query.sent ? "Your inquiry was sent. We'll follow up with you shortly." : "";
  const errorMessage =
    query.error === "missing"
      ? "Please fill out your name, email, service, and project details."
      : query.error === "email"
        ? "Please enter a valid email address."
        : query.error === "smtp-missing"
          ? "Inquiry email is not configured yet. Please set up SMTP to send submissions to contactme@samthao.com."
          : query.error === "send-failed"
            ? "We couldn't send your inquiry email right now. Please try again."
        : "";

  return (
    <PublicSiteShell currentPath="/contact">
      <section className="bg-[#141414] py-16 text-white sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.36em] text-white/48">Contact</p>
              <h1 className="mt-6 text-balance font-display text-5xl leading-[0.94] text-white sm:text-6xl">
                Tell us what you&apos;re planning.
              </h1>
              <p className="mt-8 max-w-3xl text-lg leading-9 text-white/74">
                Weddings, brand campaigns, promotional films, portraits, social content, and polished client
                experiences all start here. Send us the essentials and we&apos;ll help shape the next step with you.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {contactHighlights.map((item) => (
                  <div
                    className="border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/72"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-10 border border-white/10 bg-[#101010] p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/42">What happens next</p>
                <div className="mt-6 space-y-5">
                  {processPoints.map((point, index) => (
                    <div className="flex items-start gap-4" key={point.title}>
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#8ea89b]/70 text-sm font-semibold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xl font-semibold text-white">{point.title}</p>
                        <p className="mt-2 text-sm leading-8 text-white/68">{point.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-[#101010] p-6 shadow-[0_26px_80px_rgba(0,0,0,0.28)] sm:p-8">
              <div className="flex flex-col gap-3 border-b border-white/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/42">Project inquiry</p>
                  <h2 className="mt-3 text-3xl font-semibold text-white">Start the conversation</h2>
                </div>
                <p className="text-sm text-white/48">We&apos;ll guide the rest from here.</p>
              </div>

              {successMessage ? (
                <div className="mt-6 border border-[rgba(102,163,131,0.3)] bg-[rgba(102,163,131,0.08)] px-4 py-3 text-sm text-[#d7f0dc]">
                  {successMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="mt-6 border border-[rgba(206,124,88,0.32)] bg-[rgba(206,124,88,0.08)] px-4 py-3 text-sm text-[#ffd4c5]">
                  {errorMessage}
                </div>
              ) : null}

              <PublicContactForm />
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
