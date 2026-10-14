import { Suspense } from "react";
import { AuditoriaClient } from "@/components/auditoria/AuditoriaClient";

export const metadata = { title: "Auditoria" };

export default function Page() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[20px] bg-muted" />}>
      <AuditoriaClient />
    </Suspense>
  );
}
