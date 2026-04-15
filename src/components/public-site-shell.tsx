import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const primaryNavItems = [
  { href: "/video-production", label: "Video Production", key: "video-production" },
  { href: "/weddings", label: "Photography", key: "photography" },
  { href: "/wedding", label: "Wedding", key: "wedding" },
  { href: "/business", label: "Social Media Marketing", key: "social-media-marketing" },
  { href: "/portfolio", label: "Our Work", key: "our-work" },
  { href: "/about", label: "About", key: "about" },
];

export function PublicSiteShell({
  children,
  currentPath,
  currentNavKey,
}: {
  children: ReactNode;
  currentPath: string;
  currentNavKey?: string;
}) {
  const isHomePage = currentPath === "/home";

  return (
    <div
      className={`min-h-screen text-[var(--ink)] ${
        isHomePage
          ? "bg-[#111111]"
          : "bg-[radial-gradient(circle_at_top,#ead8c8_0%,transparent_32%),linear-gradient(180deg,#f8f4ee,#f2ece3)]"
      }`}
    >
      <header
        className="sticky top-0 z-40 border-b border-white/8 bg-[#141414]/94 backdrop-blur-xl"
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link className="flex min-w-0 flex-col items-start" href="/home">
            <Image
              alt="Filmchaser logo"
              className="h-auto w-[12rem] max-w-full object-contain sm:w-[13.5rem] lg:w-[15.5rem]"
              height={241}
              priority={isHomePage}
              src="/brand/filmchaser.png"
              width={1024}
            />
            <p
              className="-mt-2 pl-[4.15rem] text-[0.56rem] font-semibold uppercase tracking-[0.28em] text-white/72"
            >
              Sam Visual
            </p>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex xl:gap-2">
            {primaryNavItems.map((item) => {
              const isActive = currentNavKey ? currentNavKey === item.key : currentPath === item.href;
              return (
                <Link
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-[0.92rem] font-semibold transition xl:px-4 ${
                    isActive
                      ? "bg-white text-[#111111]"
                      : "text-white hover:bg-white/8"
                  }`}
                  href={item.href}
                  key={item.key}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              className="whitespace-nowrap bg-[#c97d21] px-4 py-2.5 text-sm font-semibold text-[#15120f] transition hover:brightness-110"
              href="/contact"
            >
              {isHomePage ? "Contact Us" : "Contact Us"}
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/8 bg-[#141414] text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Link className="inline-flex min-w-0 flex-col items-start" href="/home">
              <Image
                alt="Filmchaser logo"
                className="h-auto w-[12.5rem] max-w-full object-contain sm:w-[14rem]"
                height={241}
                src="/brand/filmchaser.png"
                width={1024}
              />
              <p className="-mt-2 pl-[4.3rem] text-[0.55rem] font-semibold uppercase tracking-[0.28em] text-white/68">
                Sam Visual
              </p>
            </Link>

            <h2 className="mt-5 max-w-3xl font-display text-4xl leading-none text-white">
              Cinematic work for brands, couples, campaigns, and stories worth remembering.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/66">
              Sam Visual brings together production, strategy, websites, and delivery so the public-facing experience
              feels as polished as the work behind it.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/42">Navigate</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {primaryNavItems.map((item) => (
                  <Link
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-[#111111]"
                    href={item.href}
                    key={`footer-${item.key}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-3 text-sm text-white/66">
              <Link className="font-semibold text-white transition hover:text-[#d99233]" href="/contact">
                Start an inquiry
              </Link>
              <Link className="font-semibold text-white transition hover:text-[#d99233]" href="/portfolio">
                Portfolio
              </Link>
              <Link className="font-semibold text-white transition hover:text-[#d99233]" href="/login">
                Studio login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
