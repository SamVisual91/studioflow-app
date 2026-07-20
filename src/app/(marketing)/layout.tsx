import type { Metadata } from "next";
import type { ReactNode } from "react";
import { marketingSiteUrl } from "@/lib/marketing-metadata";

export const metadata: Metadata = {
  metadataBase: new URL(marketingSiteUrl),
  applicationName: "Sam Visual",
  creator: "Sam Visual",
  publisher: "Sam Visual",
  authors: [{ name: "Sam Visual" }],
  openGraph: {
    locale: "en_US",
    siteName: "Sam Visual",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
