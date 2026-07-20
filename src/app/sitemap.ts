import type { MetadataRoute } from "next";
import { marketingSiteUrl } from "@/lib/marketing-metadata";
import { publicWorks } from "@/lib/public-work";

const marketingRoutes = [
  "/about",
  "/business",
  "/contact",
  "/home",
  "/photography",
  "/portfolio",
  "/video-production",
  "/wedding-videography",
  "/wedding-photography",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = marketingRoutes.map((path) => ({
    url: `${marketingSiteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "/home" ? "weekly" : "monthly",
    priority: path === "/home" ? 1 : path === "/wedding-videography" || path === "/business" ? 0.9 : 0.7,
  }));

  const portfolioEntries: MetadataRoute.Sitemap = publicWorks.map((work) => ({
    url: `${marketingSiteUrl}/portfolio/${work.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  return [...staticEntries, ...portfolioEntries];
}
