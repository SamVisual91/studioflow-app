import type { Metadata } from "next";

export const marketingSiteUrl = "https://www.samthao.com";
const defaultOgImage = "/brand/sam-founder-portrait.jpg";

type BuildMarketingMetadataOptions = {
  description: string;
  noIndex?: boolean;
  ogImage?: string;
  path: string;
  title: string;
};

export function buildMarketingMetadata({
  description,
  noIndex = false,
  ogImage = defaultOgImage,
  path,
  title,
}: BuildMarketingMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "Sam Visual",
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: true,
        }
      : undefined,
  };
}
