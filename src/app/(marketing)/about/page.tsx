import Link from "next/link";
import { PublicSiteShell } from "@/components/public-site-shell";

const steps = [
  {
    number: "1",
    title: "Get Aligned",
    copy: "We start by understanding your goals, audience, timeline, and the kind of visual direction that will actually support the brand you are building.",
  },
  {
    number: "2",
    title: "Get to Work",
    copy: "Once the direction is clear, we move into planning, production, and execution with a process that stays organized, efficient, and creative.",
  },
  {
    number: "3",
    title: "Get Results",
    copy: "The end goal is not just finished content. It is content that helps your business look stronger, feel more premium, and connect with the right people.",
  },
];

const workflow = [
  {
    title: "Creative planning",
    description: "We shape the direction before the shoot so the work has purpose, clarity, and a visual language that fits the client.",
  },
  {
    title: "Production with intention",
    description: "Whether it is a wedding, a campaign, a brand video, or a photo set, the goal is to create work that feels polished and emotionally grounded.",
  },
  {
    title: "Delivery that feels finished",
    description: "Private galleries, portals, films, and final assets are presented in a way that feels premium and easy to experience.",
  },
];

export default function AboutPage() {
  return (
    <PublicSiteShell currentPath="/about" currentNavKey="about">
      <section className="relative overflow-hidden bg-[#141414] py-16 text-white sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,184,148,0.16),transparent_34%),linear-gradient(180deg,rgba(20,20,20,0.9),rgba(20,20,20,1))]" />
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.38em] text-[#d7b892]/68">About Sam Visual</p>
              <h1 className="mt-6 max-w-4xl text-balance font-display text-5xl leading-[0.94] text-white sm:text-6xl lg:text-7xl">
                Built for clients who care about both the work itself and how it is delivered.
              </h1>
              <div className="mt-8 h-px w-44 bg-[linear-gradient(90deg,rgba(215,184,146,0.18),rgba(215,184,146,0.9),rgba(215,184,146,0.18))]" />
              <p className="mt-8 max-w-3xl text-lg leading-9 text-white/74">
                Sam Visual is a cinematic studio approach built around polished visuals, calm direction, and a client
                experience that feels intentional from the first conversation through final delivery. The same care
                that shapes the work also shapes how people receive it.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="bg-[#c97d21] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#15120f] transition hover:brightness-110"
                  href="/portfolio"
                >
                  View Our Work
                </Link>
                <Link
                  className="border border-white/14 bg-white/[0.04] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.08]"
                  href="/contact"
                >
                  Start An Inquiry
                </Link>
              </div>
            </div>

            <div className="overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-4 shadow-[0_26px_80px_rgba(0,0,0,0.28)]">
              <div
                className="min-h-[30rem] bg-cover bg-center sm:min-h-[36rem]"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg,rgba(17,15,14,0.08),rgba(17,15,14,0.18)),url('/brand/sam-founder-portrait.jpg')",
                }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-left text-white/72 sm:grid-cols-3">
            {workflow.map((item) => (
              <div className="border border-white/8 bg-white/[0.02] px-5 py-4" key={item.title}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#d7b892]/78">{item.title}</p>
                <p className="mt-2 text-sm leading-6">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#141414] pb-24 text-white">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="border-t border-white/8 pt-14">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/64">Our Process</p>
              <h2 className="mt-5 text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                Three steps to amazing content for your brand.
              </h2>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
              <div className="overflow-hidden border border-white/10 bg-[#101010]">
                <div
                  className="h-full min-h-[24rem] bg-cover bg-center sm:min-h-[32rem] lg:min-h-full"
                  style={{
                    backgroundImage:
                      "linear-gradient(180deg,rgba(17,15,14,0.08),rgba(17,15,14,0.24)),url('/brand/about-process-photo.png')",
                  }}
                />
              </div>

              <div className="border border-white/10 bg-[#101010] px-6 py-7 sm:px-8">
                <div className="space-y-0">
                  {steps.map((step, index) => (
                    <div
                      className={`${index === 0 ? "border-t border-white/12" : ""} border-b border-white/12 py-6`}
                      key={step.title}
                    >
                      <div className="flex items-start gap-5">
                        <span className="mt-0.5 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#8ea89b]/72 text-xl font-semibold text-white">
                          {step.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="text-3xl font-semibold text-white">{step.title}</h3>
                            <span className="text-5xl leading-none text-[#8ea89b]/72">+</span>
                          </div>
                          <p className="mt-4 max-w-3xl text-base leading-8 text-white/72">{step.copy}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-14 border border-white/10 bg-[linear-gradient(180deg,#171717,#101010)] px-7 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:px-9">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d7b892]/62">Our Team</p>
                <h2 className="mt-5 max-w-4xl text-balance font-display text-4xl leading-[0.98] text-white sm:text-5xl">
                  The people behind the creative direction, production, and client experience.
                </h2>
                <p className="mt-6 max-w-4xl text-base leading-8 text-white/70">
                  Sam Visual is built around a hands-on creative process, but it is still a team effort. This section
                  gives us a clean place to introduce the people behind the work as the studio grows.
                </p>
              </div>

              <div className="mt-10 grid gap-5 lg:grid-cols-3">
                <article className="overflow-hidden border border-white/10 bg-[#101010]">
                  <div
                    className="min-h-[20rem] bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg,rgba(17,15,14,0.08),rgba(17,15,14,0.28)),url('/brand/sam-founder-portrait.jpg')",
                    }}
                  />
                  <div className="px-6 py-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d7b892]/72">Founder</p>
                    <h3 className="mt-4 text-3xl font-semibold text-white">Sam</h3>
                    <p className="mt-4 text-base leading-8 text-white/72">
                      Founder of Filmchaser Media and Sam Visual, leading the creative direction, production vision,
                      and overall client experience.
                    </p>
                  </div>
                </article>

                <article className="overflow-hidden border border-white/10 bg-[#101010]">
                  <div
                    className="min-h-[20rem] bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg,rgba(17,15,14,0.04),rgba(17,15,14,0.18)),url('/brand/phillip-team.png')",
                    }}
                  />
                  <div className="px-6 py-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d7b892]/72">Lead Editor / Videographer</p>
                    <h3 className="mt-4 text-3xl font-semibold text-white">Phillip</h3>
                    <p className="mt-4 text-base leading-8 text-white/72">
                      Phillip helps shape the final look and rhythm of the work through editing, camera operation, and
                      production support across client projects.
                    </p>
                  </div>
                </article>

                <article className="overflow-hidden border border-white/10 bg-[#101010]">
                  <div
                    className="min-h-[20rem] bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg,rgba(17,15,14,0.04),rgba(17,15,14,0.18)),url('/brand/kaesie-team.png')",
                    }}
                  />
                  <div className="px-6 py-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d7b892]/72">Lead Photographer</p>
                    <h3 className="mt-4 text-3xl font-semibold text-white">Kaesie</h3>
                    <p className="mt-4 text-base leading-8 text-white/72">
                      Kaesie brings the still-image side of the studio to life through portrait work, wedding coverage,
                      and polished photography that supports the full brand experience.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
