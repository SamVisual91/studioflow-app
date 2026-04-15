import type { Metadata } from "next";
import { Suspense } from "react";
import { ScrollPositionRestorer } from "@/components/scroll-position-restorer";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudioFlow",
  description:
    "A HoneyBook-style client operations dashboard for CRM, proposals, invoicing, scheduling, messaging, projects, and automations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <ScrollPositionRestorer />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
