import { marketingSiteUrl } from "@/lib/marketing-metadata";

const businessName = "Sam Visual";
const alternateBusinessName = "Filmchaser Media";
const businessEmail = "contactme@samthao.com";
const defaultImagePath = "/brand/sam-founder-portrait.jpg";
const defaultLogoPath = "/brand/filmchaser.png";

type VideoStructuredDataOptions = {
  contentUrl?: string;
  description: string;
  embedUrl?: string;
  name: string;
  pagePath: string;
  thumbnailPath: string;
};

type LocalBusinessStructuredDataOptions = {
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  description: string;
  imagePath?: string;
  pagePath: string;
  reviews?: Array<{
    author: string;
    rating?: number;
    reviewBody: string;
  }>;
  serviceTypes?: string[];
};

type FaqStructuredDataQuestion = {
  answer: string;
  question: string;
};

export function absoluteMarketingUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${marketingSiteUrl}${path}`;
}

function getServiceAreas() {
  return [
    {
      "@type": "City",
      name: "Hickory",
      containedInPlace: {
        "@type": "State",
        name: "North Carolina",
      },
    },
    {
      "@type": "AdministrativeArea",
      name: "Western North Carolina",
    },
    {
      "@type": "State",
      name: "North Carolina",
    },
  ];
}

export function buildOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${marketingSiteUrl}/#organization`,
    name: businessName,
    alternateName: alternateBusinessName,
    url: absoluteMarketingUrl("/home"),
    logo: absoluteMarketingUrl(defaultLogoPath),
    image: absoluteMarketingUrl(defaultImagePath),
    email: businessEmail,
    description:
      "Sam Visual creates wedding films, brand campaigns, commercial photography, and marketing visuals for couples and businesses in Hickory and across North Carolina.",
  };
}

export function buildLocalBusinessStructuredData({
  aggregateRating,
  description,
  imagePath = defaultImagePath,
  pagePath,
  reviews = [],
  serviceTypes = [],
}: LocalBusinessStructuredDataOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${marketingSiteUrl}/#professional-service`,
    name: businessName,
    alternateName: alternateBusinessName,
    url: absoluteMarketingUrl("/home"),
    image: absoluteMarketingUrl(imagePath),
    logo: absoluteMarketingUrl(defaultLogoPath),
    email: businessEmail,
    description,
    areaServed: getServiceAreas(),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hickory",
      addressRegion: "NC",
      addressCountry: "US",
    },
    mainEntityOfPage: absoluteMarketingUrl(pagePath),
    serviceType: serviceTypes,
    knowsAbout: serviceTypes,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: businessEmail,
      areaServed: "US",
      availableLanguage: "English",
    },
    aggregateRating: aggregateRating
      ? {
          "@type": "AggregateRating",
          ratingValue: aggregateRating.ratingValue,
          reviewCount: aggregateRating.reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    review:
      reviews.length > 0
        ? reviews.map((item) => ({
            "@type": "Review",
            reviewBody: item.reviewBody,
            author: {
              "@type": "Person",
              name: item.author,
            },
            reviewRating: {
              "@type": "Rating",
              ratingValue: item.rating || 5,
              bestRating: 5,
              worstRating: 1,
            },
          }))
        : undefined,
  };
}

export function buildVideoObjectStructuredData({
  contentUrl,
  description,
  embedUrl,
  name,
  pagePath,
  thumbnailPath,
}: VideoStructuredDataOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name,
    description,
    thumbnailUrl: [absoluteMarketingUrl(thumbnailPath)],
    url: absoluteMarketingUrl(pagePath),
    embedUrl: embedUrl || undefined,
    contentUrl: contentUrl ? absoluteMarketingUrl(contentUrl) : undefined,
    publisher: {
      "@id": `${marketingSiteUrl}/#organization`,
    },
  };
}

export function buildFaqStructuredData(questions: FaqStructuredDataQuestion[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
