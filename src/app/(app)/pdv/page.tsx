import type { Metadata } from "next";
import { PdvClient } from "@/components/pdv/PdvClient";

export const metadata: Metadata = { title: "PDV" };

export default function Page() {
  return <PdvClient />;
}
