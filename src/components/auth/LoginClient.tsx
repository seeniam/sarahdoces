"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Azulejo } from "@/components/brand/Azulejo";
import { Logo } from "@/components/brand/Logo";
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

const COR_PERFIL: Record<Perfil, string> = {
  dona: "var(--cereja)",
  gerente: "var(--azulejo)",
  cozinha: "var(--doce-de-leite)",
  atendente: "var(--pistache)",
};

function lojaInicial(u: Usuario): LojaAtiva {
  if (u.perfil === "dona") return "todas";
  return u.lojaId ?? "loja-1";
}

export function LoginClient() {
  const router = useRouter();
  const entrar = useSessaoStore((s) => s.entrar);
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

  function escolher(u: Usuario) {
    setSelecionado(u);
    setPin("");
    setErro(false);
  }

  return (
    <main className="flex min-h-dvh flex-col lg:flex-row">
      {/* Parede de azulejo + foto-herói + logo */}
      <div className="relative shrink-0 lg:w-[54%]">
        {/* Desktop: parede inteira */}
        <div className="relative hidden h-full min-h-dvh lg:block">
          <Azulejo tom="azulejo" tile={92} className="absolute inset-0" />
          <div className="absolute inset-0 p-7">
            <div className="relative h-full w-full overflow-hidden rounded-[20px] shadow-raised">
              <Image
                src="/images/hero.jpg"
                alt="Salão da Sarah Rangel"
                fill
                preload
                placeholder="blur"
                blurDataURL={BLUR_ESCURO}
                sizes="55vw"
                className="object-cover [filter:saturate(1.05)_contrast(1.03)]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1b100e]/90 via-[#1b100e]/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-9 text-white">
                <Logo variante="completa" textClassName="text-white" />
                <p className="mt-5 max-w-sm font-display text-[1.7rem] leading-tight">
                  Cada pedido registrado, cada grama de carne contada.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Celular: faixa de azulejo no topo */}
        <div className="relative h-32 overflow-hidden lg:hidden">
          <Azulejo tom="azulejo" tile={72} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <Logo variante="compacta" />
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
              >
                <h1 className="text-center font-display text-3xl text-foreground">
                  Quem está entrando?
                </h1>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  Toque no seu perfil para digitar o PIN.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {USUARIOS.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => escolher(u)}
                      className="flex flex-col items-center gap-2 rounded-[14px] border border-border bg-card p-4 text-center shadow-soft transition-colors hover:bg-acucar/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span
                        className="grid size-12 place-items-center rounded-full font-display text-base text-white"
                        style={{ backgroundColor: COR_PERFIL[u.perfil] }}
                      >
                        {u.avatar}
                      </span>
                      <span className="text-sm font-semibold leading-tight text-foreground">
                        {u.nome}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {ROTULO_PERFIL[u.perfil]}
                      </span>
                    </button>
                  ))}
                </div>

                <p className="mt-8 text-center text-xs text-muted-foreground">
                  PINs da demonstração — Dona 1234 · Gerente 2222 · Atendentes
                  3333+ · Cozinha 4444
                </p>
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

                <span
                  className="grid size-16 place-items-center rounded-full font-display text-xl text-white"
                  style={{ backgroundColor: COR_PERFIL[selecionado.perfil] }}
                >
                  {selecionado.avatar}
                </span>
                <h2 className="mt-3 font-display text-2xl text-foreground">
                  {selecionado.nome}
                </h2>
                <p className="mb-7 text-sm text-muted-foreground">
                  {erro ? (
                    <span className="font-medium text-alerta">
                      PIN incorreto. Tente de novo.
                    </span>
                  ) : (
                    "Digite o PIN"
                  )}
                </p>

                <PinPad value={pin} onChange={aoDigitar} erro={erro} />

                <p className="mt-7 text-xs text-muted-foreground">
                  Dica da demonstração: PIN{" "}
                  <span className="font-semibold text-foreground tnum">
                    {selecionado.pin}
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
