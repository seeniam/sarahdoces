import type { Metadata } from "next";
import { LoginClient } from "@/components/auth/LoginClient";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return <LoginClient />;
}
