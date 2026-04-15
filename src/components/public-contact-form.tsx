"use client";

import { useState } from "react";
import { createPublicInquiryAction } from "@/app/actions";

const weddingBudgetOptions = [
  { value: "2500", label: "$2,500 Collection" },
  { value: "3500", label: "$3,500 Collection" },
  { value: "4500", label: "$4,500 Collection" },
];

const businessBudgetOptions = [
  { value: "2500", label: "$2,500+" },
  { value: "5000", label: "$5,000+" },
  { value: "7500", label: "$7,500+" },
  { value: "10000", label: "$10,000+" },
];

const otherBudgetOptions = [
  { value: "1000", label: "$1,000+" },
  { value: "2500", label: "$2,500+" },
  { value: "5000", label: "$5,000+" },
  { value: "7500", label: "$7,500+" },
];

const fieldClassName =
  "border border-white/10 bg-[#151515] px-4 py-3 text-white placeholder:text-white/28 focus:outline-none focus:ring-1 focus:ring-[#d0b18a]";

export function PublicContactForm() {
  const [service, setService] = useState("Wedding");

  return (
    <form action={createPublicInquiryAction} className="mt-6 grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-white/88">
          <span>
            Name <span className="text-[#d0b18a]">*</span>
          </span>
          <input className={fieldClassName} name="name" required />
        </label>
        <label className="grid gap-2 text-sm font-medium text-white/88">
          <span>
            Email <span className="text-[#d0b18a]">*</span>
          </span>
          <input className={fieldClassName} name="email" required type="email" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-white/88">
          <span>
            Service <span className="text-[#d0b18a]">*</span>
          </span>
          <select
            className={fieldClassName}
            name="service"
            onChange={(event) => setService(event.target.value)}
            value={service}
          >
            <option>Wedding</option>
            <option>Business</option>
            <option>Other</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium text-white/88">
          Source
          <input className={fieldClassName} defaultValue="Website" name="source" />
        </label>
      </div>

      {service === "Wedding" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-white/88">
              <span>
                Project date <span className="text-[#d0b18a]">*</span>
              </span>
              <input className={fieldClassName} name="eventDate" required type="date" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-white/88">
              Budget
              <select className={fieldClassName} name="budget">
                <option value="">Select collection</option>
                {weddingBudgetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium text-white/88">
            <span>
              Venue location <span className="text-[#d0b18a]">*</span>
            </span>
            <input className={fieldClassName} name="venueLocation" placeholder="City, venue, or area" required />
          </label>

          <label className="grid gap-2 text-sm font-medium text-white/88">
            <span>
              Tell us about your wedding <span className="text-[#d0b18a]">*</span>
            </span>
            <textarea
              className={`min-h-44 ${fieldClassName}`}
              name="notes"
              placeholder="Tell us about your date, the kind of coverage you want, and what matters most to you."
            />
          </label>
        </>
      ) : null}

      {service === "Business" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-white/88">
              Company / brand name
              <input className={fieldClassName} name="companyName" placeholder="Your business name" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-white/88">
              Target launch / campaign date
              <input className={fieldClassName} name="eventDate" type="date" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-white/88">
              What do you need?
              <select className={fieldClassName} name="projectGoal">
                <option value="">Select project type</option>
                <option>Commercial / ad campaign</option>
                <option>Brand video</option>
                <option>Social media content</option>
                <option>Photography</option>
                <option>Website + content</option>
                <option>Ongoing marketing support</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-white/88">
              Budget
              <select className={fieldClassName} name="budget">
                <option value="">Select budget range</option>
                {businessBudgetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium text-white/88">
            Website or social link
            <input className={fieldClassName} name="businessLink" placeholder="Website or Instagram URL" />
          </label>

          <label className="grid gap-2 text-sm font-medium text-white/88">
            <span>
              Tell us about your business project <span className="text-[#d0b18a]">*</span>
            </span>
            <textarea
              className={`min-h-44 ${fieldClassName}`}
              name="notes"
              placeholder="Tell us what you're launching, what the content needs to do, and what kind of support you're looking for."
            />
          </label>
        </>
      ) : null}

      {service === "Other" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-white/88">
              Project type
              <select className={fieldClassName} name="projectType">
                <option value="">Select project type</option>
                <option>Music video</option>
                <option>Photography</option>
                <option>Social media support</option>
                <option>Website</option>
                <option>Event coverage</option>
                <option>Something else</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-white/88">
              Desired project date
              <input className={fieldClassName} name="eventDate" type="date" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-white/88">
              Budget
              <select className={fieldClassName} name="budget">
                <option value="">Select budget range</option>
                {otherBudgetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-white/88">
              Platform / artist / brand name
              <input className={fieldClassName} name="projectName" placeholder="Artist, brand, or project name" />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium text-white/88">
            <span>
              Tell us about the project <span className="text-[#d0b18a]">*</span>
            </span>
            <textarea
              className={`min-h-44 ${fieldClassName}`}
              name="notes"
              placeholder="Tell us what you're making, what kind of content or support you need, and what outcome you're hoping for."
            />
          </label>
        </>
      ) : null}

      <button className="mt-2 bg-[#c97d21] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#15120f] transition hover:brightness-110">
        Send inquiry
      </button>
    </form>
  );
}
