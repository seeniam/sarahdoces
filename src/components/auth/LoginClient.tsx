"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "cn";
import { Azulejo } from "@/components/brand/Azulejo";
import { Logo } from "@/components/brand/Logo";
import { useIniciarTour } from "@/components/tour/usarTour";
import { BLUR_ESCURO } from "@/lib/brand/blur";
import { PinPad } from "./PinPad";
import { USUARIOS } from "@/lib/mock/data";
import { useSessaoStore, type LojaAtiva } from "@/lib/store";
import { rotaInicial } from "@/lib/auth/navegacao";
import type { Perfil, Usuario } from "@/types";

const ROTULO_PERFIL: Record<Perfil, string> = {
  dona: "Dona",
  gerente: "Gerente",
  atendente: "Atendente",
  cozinha: "Cozinha",
};

function lojaInicial(u: Usuario): LojaAtiva {
  if (u.perfil === "dona") return "todas";
  return u.lojaId ?? "loja-1";
}

/** Avatar neutro: açúcar + iniciais em cacau (Gloock). Sem cor por perfil. */
function Avatar({ u, className }: { u: Usuario; className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-acucar font-display text-cacau dark:bg-popover dark:text-foreground",
        className,
      )}
    >
      {u.avatar}
    </span>
  );
}

const SARAH = USUARIOS.find((u) => u.perfil === "dona")!;
const GESTAO = USUARIOS.filter((u) => u.perfil === "gerente");
const ATENDIMENTO = USUARIOS.filter((u) => u.perfil === "atendente");
const COZINHA = USUARIOS.filter((u) => u.perfil === "cozinha");

export function LoginClient() {
  const router = useRouter();
  const entrar = useSessaoStore((s) => s.entrar);
  const iniciarTour = useIniciarTour();
  const semMovimento = useReducedMotion();

  const [selecionado, setSelecionado] = useState<Usuario | null>(null);
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState(false);

  function aoDigitar(v: string) {
    setPin(v);
    if (v.length < 4 || !selecionado) return;
    if (v === selecionado.pin) {
      entrar(selecionado.id, lojaInicial(selecionado));
      router.replace(rotaInicial(selecionado.perfil));
    } else {
      setErro(true);
      setTimeout(() => {
        setErro(false);
        setPin("");
      }, 650);
    }
  }

  function preencher() {
    if (!selecionado) return;
    const p = selecionado.pin;
    for (let n = 1; n <= p.length; n++) {
      setTimeout(() => aoDigitar(p.slice(0, n)), (n - 1) * 95);
    }
  }

  function escolher(u: Usuario) {
    setSelecionado(u);
    setPin("");
    setErro(false);
  }

  return (
    <main className="flex min-h-dvh flex-col lg:flex-row">
      {/* Parede de azulejo + foto-herói + logo */}
      <div className="relative shrink-0 lg:w-[54%]">
        <div className="relative hidden h-full min-h-dvh lg:block">
          <Azulejo tom="azulejo" tile={92} className="absolute inset-0" />
          <div className="absolute inset-0 p-7">
            <div className="relative h-full w-full overflow-hidden rounded-[20px] shadow-raised">
              <Image
                src="/images/hero.jpg"
                alt="Doces da Sarah Rangel"
                fill
                preload
                placeholder="blur"
                blurDataURL={BLUR_ESCURO}
                sizes="55vw"
                className="object-cover object-center [filter:saturate(1.05)_contrast(1.03)]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1b100e] via-[#1b100e]/55 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-9">
                <Logo
                  variante="completa"
                  textClassName="text-white"
                  taglineClassName="text-white/80"
                />
                <p className="mt-5 max-w-sm font-display text-[1.7rem] leading-tight text-white">
                  Cada pedido registrado, cada grama de carne contada.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Celular: faixa de azulejo com o logo numa placa de porcelana */}
        <div className="relative h-32 overflow-hidden lg:hidden">
          <Azulejo tom="azulejo" tile={72} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <div className="rounded-full bg-card px-4 py-2 shadow-soft">
              <Logo variante="compacta" />
            </div>
          </div>
        </div>
      </div>

      {/* Escolha de perfil + PIN */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" initial={false}>
            {!selecionado ? (
              <motion.div
                key="perfis"
                initial={semMovimento ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={semMovimento ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="font-display text-3xl text-foreground">
                    Quem está entrando?
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Toque no seu perfil para digitar o PIN.
                  </p>
                </div>

                {/* Tour guiado: reseta a demo e conduz pelos 4 fluxos */}
                <button
                  type="button"
                  onClick={() => iniciarTour({ comLogin: true })}
                  className="flex min-h-[64px] w-full items-center gap-3 rounded-[16px] border border-azulejo/30 bg-azulejo/10 p-4 text-left transition-colors hover:bg-azulejo/15 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-azulejo/15"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-azulejo text-white">
                    <Sparkles className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base text-foreground">
                      Ver demonstração guiada
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Um tour de 2 minutos pelos 4 pontos que mais pesam.
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-azulejo" />
                </button>

                {/* Sarah em destaque (abre a demonstração) */}
                <button
                  type="button"
                  onClick={() => escolher(SARAH)}
                  className="flex min-h-[72px] w-full items-center gap-4 rounded-[16px] border border-border bg-card p-4 text-left shadow-soft transition-colors hover:bg-acucar/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Avatar u={SARAH} className="size-14 text-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg text-foreground">
                      Entrar como Sarah
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Dona · vê as duas lojas
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </button>

                <Grupo titulo="Gestão" usuarios={GESTAO} onPick={escolher} />
                <Grupo titulo="Atendimento" usuarios={ATENDIMENTO} onPick={escolher} />
                <Grupo titulo="Cozinha" usuarios={COZINHA} onPick={escolher} />
              </motion.div>
            ) : (
              <motion.div
                key="pin"
                initial={semMovimento ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={semMovimento ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <button
                  type="button"
                  onClick={() => setSelecionado(null)}
                  className="mb-6 inline-flex items-center gap-1 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ChevronLeft className="size-4" />
                  Trocar perfil
                </button>

                <Avatar u={selecionado} className="size-16 text-xl" />
                <h2 className="mt-3 font-display text-2xl text-foreground">
                  {selecionado.nome}
                </h2>
                <p className="mb-7 text-sm">
                  {erro ? (
                    <span className="font-medium text-alerta">
                      PIN incorreto. Tente de novo.
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Digite o PIN</span>
                  )}
                </p>

                <PinPad value={pin} onChange={aoDigitar} erro={erro} />

                <div className="mt-7 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    PIN de demonstração:{" "}
                    <span className="font-semibold text-foreground tnum">
                      {selecionado.pin}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={preencher}
                    className="rounded-full border border-border bg-card px-3 py-1 font-medium text-foreground transition-colors hover:bg-acucar/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    Preencher
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}

function Grupo({
  titulo,
  usuarios,
  onPick,
}: {
  titulo: string;
  usuarios: Usuario[];
  onPick: (u: Usuario) => void;
}) {
  if (usuarios.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="px-1 text-[11px] font-medium text-muted-foreground">{titulo}</p>
      <div className="space-y-1.5">
        {usuarios.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onPick(u)}
            className="flex min-h-[56px] w-full items-center gap-3 rounded-[12px] border border-border bg-card px-3 text-left transition-colors hover:bg-acucar/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Avatar u={u} className="size-10 text-sm" />
            <span className="flex-1 text-sm font-medium text-foreground">
              {u.nome}
            </span>
            <span className="text-xs text-muted-foreground">
              {ROTULO_PERFIL[u.perfil]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
