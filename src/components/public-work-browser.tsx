"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicWorkSection } from "@/lib/public-work";

type PublicWorkBrowserProps = {
  sections: PublicWorkSection[];
};

type WorkMeta = {
  projectType:
    | "Campaign Videos"
    | "Commercial & Product"
    | "Events & Sports"
    | "Portrait & Editorial"
    | "Documentary & Story"
    | "Social Media Campaigns";
  industry: string;
  genre: string;
};

const workMetaBySlug: Record<string, WorkMeta> = {
  "lake-hickory-haunts-2026-promo": {
    projectType: "Campaign Videos",
    industry: "Attractions",
    genre: "Promotional",
  },
  "lake-hickory-haunts-midway-tour": {
    projectType: "Documentary & Story",
    industry: "Attractions",
    genre: "Tour / Experience",
  },
  "nightmare-factory-unleashed": {
    projectType: "Social Media Campaigns",
    industry: "Attractions",
    genre: "Horror",
  },
  "lake-hickory-haunts-new-driveway": {
    projectType: "Campaign Videos",
    industry: "Attractions",
    genre: "Construction",
  },
  "dreams-become-reality": {
    projectType: "Documentary & Story",
    industry: "Attractions",
    genre: "Docu-Series",
  },
  "jonas-ridge-snow-tubing": {
    projectType: "Campaign Videos",
    industry: "Tourism",
    genre: "Seasonal Campaign",
  },
  "bulova-octava": {
    projectType: "Commercial & Product",
    industry: "Luxury Goods",
    genre: "Commercial",
  },
  "truly-ad": {
    projectType: "Commercial & Product",
    industry: "Beverage",
    genre: "Advertising",
  },
  "jack-daniels-product-spot": {
    projectType: "Commercial & Product",
    industry: "Spirits",
    genre: "Commercial",
  },
  "renowned-deck-building-game": {
    projectType: "Social Media Campaigns",
    industry: "Gaming",
    genre: "Product Launch",
  },
  "camp-enterprise": {
    projectType: "Social Media Campaigns",
    industry: "Education",
    genre: "Youth Leadership",
  },
  "kamikaze-flag-football": {
    projectType: "Events & Sports",
    industry: "Sports",
    genre: "Action",
  },
  "edm-nights": {
    projectType: "Events & Sports",
    industry: "Entertainment",
    genre: "Nightlife",
  },
  "k-pop-eras": {
    projectType: "Events & Sports",
    industry: "Entertainment",
    genre: "Nightlife",
  },
  "horsepower-park": {
    projectType: "Events & Sports",
    industry: "Motorsports",
    genre: "Action",
  },
  "kelly-editorial-portrait": {
    projectType: "Portrait & Editorial",
    industry: "Personal Brand",
    genre: "Editorial",
  },
  "emma-golden-hour-portrait": {
    projectType: "Portrait & Editorial",
    industry: "Personal Brand",
    genre: "Portrait",
  },
  "megan-soft-glow-portrait": {
    projectType: "Portrait & Editorial",
    industry: "Beauty",
    genre: "Portrait",
  },
  "stacey-sunlit-drive": {
    projectType: "Portrait & Editorial",
    industry: "Lifestyle",
    genre: "Editorial",
  },
  "em-shoreline-portrait": {
    projectType: "Portrait & Editorial",
    industry: "Lifestyle",
    genre: "Portrait",
  },
  "motion-books": {
    projectType: "Portrait & Editorial",
    industry: "Wedding",
    genre: "Luxury Detail",
  },
};

function getFilterOptions(values: string[]) {
  return ["All", ...Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))];
}

export function PublicWorkBrowser({ sections }: PublicWorkBrowserProps) {
  const allItems = useMemo(
    () =>
      sections.flatMap((section) =>
        section.items.map((item) => ({
          ...item,
          meta: workMetaBySlug[item.slug] ?? {
            projectType: "Campaign Videos",
            industry: "General",
            genre: "Visual Storytelling",
          },
        })),
      ),
    [sections],
  );

  const projectTypeOptions = [
    "All",
    "Campaign Videos",
    "Commercial & Product",
    "Events & Sports",
    "Portrait & Editorial",
    "Documentary & Story",
    "Social Media Campaigns",
  ];
  const industryOptions = useMemo(
    () => getFilterOptions(allItems.map((item) => item.meta.industry)),
    [allItems],
  );
  const genreOptions = useMemo(
    () => getFilterOptions(allItems.map((item) => item.meta.genre)),
    [allItems],
  );

  const [projectType, setProjectType] = useState("All");
  const [industry, setIndustry] = useState("All");
  const [genre, setGenre] = useState("All");

  const filteredItems = useMemo(
    () =>
      allItems.filter((item) => {
        const matchesProjectType = projectType === "All" || item.meta.projectType === projectType;
        const matchesIndustry = industry === "All" || item.meta.industry === industry;
        const matchesGenre = genre === "All" || item.meta.genre === genre;
        return matchesProjectType && matchesIndustry && matchesGenre;
      }),
    [allItems, genre, industry, projectType],
  );

  const selectClassName =
    "w-full appearance-none border border-[#6f8c80] bg-[#141414] px-5 py-4 text-base font-semibold text-white outline-none transition focus:border-white";

  return (
    <>
      <section className="bg-[#141414] py-16 text-white sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="text-balance text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Our Creative Portfolio
              <br />
              &amp; Case Studies
            </h1>
            <div className="mx-auto mt-8 h-px w-72 bg-[#8ea89b]" />
            <p className="mx-auto mt-8 max-w-5xl text-lg leading-10 text-white/82">
              Explore the full range of our work and move through campaigns, portraits, events, products, attractions,
              branded content, and story-driven visuals in one clean place.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-3">
            <div>
              <label className="mb-3 block text-xl font-semibold uppercase tracking-[0.02em] text-white" htmlFor="project-type">
                Project Type
              </label>
              <div className="relative">
                <select
                  className={selectClassName}
                  id="project-type"
                  onChange={(event) => setProjectType(event.target.value)}
                  value={projectType}
                >
                  {projectTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "All" ? "Select Project Type" : option}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#8ea89b]">
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.5 7.5 10 12l4.5-4.5" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-xl font-semibold uppercase tracking-[0.02em] text-white" htmlFor="industry">
                Industry
              </label>
              <div className="relative">
                <select
                  className={selectClassName}
                  id="industry"
                  onChange={(event) => setIndustry(event.target.value)}
                  value={industry}
                >
                  {industryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "All" ? "Select Industry" : option}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#8ea89b]">
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.5 7.5 10 12l4.5-4.5" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-xl font-semibold uppercase tracking-[0.02em] text-white" htmlFor="genre">
                Genre
              </label>
              <div className="relative">
                <select
                  className={selectClassName}
                  id="genre"
                  onChange={(event) => setGenre(event.target.value)}
                  value={genre}
                >
                  {genreOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "All" ? "Select Genre" : option}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#8ea89b]">
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.5 7.5 10 12l4.5-4.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#141414] pb-20 text-white">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/42">Showing</p>
              <p className="mt-2 text-sm text-white/66">
                {filteredItems.length} {filteredItems.length === 1 ? "project" : "projects"} in the current selection
              </p>
            </div>
            <button
              className="border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-[#111111]"
              onClick={() => {
                setProjectType("All");
                setIndustry("All");
                setGenre("All");
              }}
              type="button"
            >
              Reset filters
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <Link
                className="group overflow-hidden border border-white/10 bg-[#101010] transition hover:border-white/22"
                href={`/portfolio/${item.slug}`}
                key={item.slug}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    alt={item.title}
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    src={item.image}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.04),rgba(10,10,10,0.16)_42%,rgba(10,10,10,0.82)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/56">{item.subtitle}</p>
                    <h3 className="mt-3 text-3xl font-semibold leading-none text-white">{item.title}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-7 text-white/68">{item.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="border border-white/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/54">
                      {item.meta.projectType}
                    </span>
                    <span className="border border-white/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/54">
                      {item.meta.industry}
                    </span>
                    <span className="border border-white/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/54">
                      {item.meta.genre}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
