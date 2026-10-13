import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Azulejo } from "@/components/brand/Azulejo";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative grid min-h-full flex-1 place-items-center overflow-hidden px-6 py-16">
      <Azulejo
        tom="azulejo"
        opacity={0.06}
        tile={96}
        fade="bottom"
        className="absolute inset-x-0 top-0 h-64"
      />
      <div className="relative w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <Logo variante="completa" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl text-foreground">
            Protótipo do sistema
          </h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Cada pedido registrado, cada grama de carne contada. A demonstração
            completa chega nas próximas fases.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button size="lg" className="h-12 px-8 text-base" render={<Link href="/login" />}>
            Entrar na demonstração
          </Button>
          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground"
            render={<Link href="/design-system" />}
          >
            Ver o sistema de design
          </Button>
        </div>
      </div>
    </main>
  );
}
