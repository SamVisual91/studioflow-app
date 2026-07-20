import type { MetadataRoute } from "next";
import { marketingSiteUrl } from "@/lib/marketing-metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/about",
          "/business",
          "/contact",
          "/home",
          "/photography",
          "/portfolio",
          "/video-production",
          "/wedding-videography",
          "/wedding-photography",
        ],
        disallow: [
          "/api/",
          "/automations",
          "/client-portal/",
          "/contract/",
          "/crm",
          "/follow-ups",
          "/invoice/",
          "/invoices",
          "/ledger",
          "/leads",
          "/login",
          "/messages",
          "/overview",
          "/p/",
          "/package-brochure/",
          "/packages",
          "/projects",
          "/proposals",
          "/schedule",
          "/templates",
          "/uploads/",
          "/users",
          "/video-paywall/",
        ],
      },
    ],
    sitemap: `${marketingSiteUrl}/sitemap.xml`,
    host: marketingSiteUrl,
  };
}
