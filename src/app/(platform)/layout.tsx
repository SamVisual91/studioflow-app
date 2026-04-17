import type { ReactNode } from "react";
import { headers } from "next/headers";
import { requirePathAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") || "";
  await requirePathAccess(pathname);

  return children;
}
