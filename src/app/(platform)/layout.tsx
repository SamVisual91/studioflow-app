import type { ReactNode } from "react";
import { headers } from "next/headers";
import { requirePathAccess } from "@/lib/auth";
import { ensureMicrosoftGraphMessageSubscription } from "@/lib/microsoft-graph-mail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") || "";
  await requirePathAccess(pathname);
  try {
    await ensureMicrosoftGraphMessageSubscription();
  } catch (error) {
    console.error("Microsoft Graph subscription maintenance failed", error);
  }

  return children;
}
