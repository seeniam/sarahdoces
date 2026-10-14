"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { CerejaMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  PASSOS,
  TOTAL_PASSOS,
  useTourStore,
  type FluxoId,
} from "@/lib/store/tour";

const FLUXOS: { id: FluxoId; rotulo: string }[] = [
  { id: "i", rotulo: "Pedido no caixa" },
  { id: "ii", rotulo: "Desconto com PIN" },
  { id: "iii", rotulo: "A carne que some" },
  { id: "iv", rotulo: "Caixa que não fecha" },
];

const MARGEM = 8; // respiro entre o recorte e a borda do elemento
const LARGURA_BALAO = 360;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay() {
  const ativo = useTourStore((s) => s.ativo);
  const indice = useTourStore((s) => s.indice);
  const proximo = useTourStore((s) => s.proximo);
  const voltar = useTourStore((s) => s.voltar);
  const encerrar = useTourStore((s) => s.encerrar);
  const emitir = useTourStore((s) => s.emitir);

  const router = useRouter();
  const pathname = usePathname();
  const semMovimento = useReducedMotion();

  const [rect, setRect] = useState<Rect | null>(null);
  const [pronto, setPronto] = useState(false);
  const [janela, setJanela] = useState({ w: 1440, h: 900 });
  // Transição com espera (ex.: deixar a impressão animar antes de avançar).
  const [avancando, setAvancando] = useState(false);
  const buscaRef = useRef<number | null>(null);
  const timerAvancoRef = useRef<number | null>(null);

  const limparTimerAvanco = useCallback(() => {
    if (timerAvancoRef.current) {
      window.clearTimeout(timerAvancoRef.current);
      timerAvancoRef.current = null;
    }
    setAvancando(false);
  }, []);
  // Limpa o timer pendente ao desmontar.
  useEffect(() => () => {
    if (timerAvancoRef.current) window.clearTimeout(timerAvancoRef.current);
  }, []);

  // Tamanho da janela reativo (para posicionar o balão certo no celular).
  useEffect(() => {
    const atualizar = () =>
      setJanela({ w: window.innerWidth, h: window.innerHeight });
    atualizar();
    window.addEventListener("resize", atualizar);
    return () => window.removeEventListener("resize", atualizar);
  }, []);

  const passo = ativo ? PASSOS[indice] : null;
  const ultimo = indice >= TOTAL_PASSOS - 1;

  // Navega até a rota do passo e emite o sinal de preparação da tela.
  useEffect(() => {
    if (!passo) return;
    // Esconde o recorte antigo ao trocar de passo (reset intencional).
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setPronto(false);
    setRect(null);
    if (pathname !== passo.rota) {
      router.push(passo.rota);
    }
    if (passo.aoEntrar) {
      // Deixa a rota montar antes de preparar a tela.
      const t = setTimeout(() => emitir(passo.aoEntrar!), pathname !== passo.rota ? 240 : 60);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo?.id, pathname]);

  // Mede o elemento-alvo (com polling, pois ele pode montar após a navegação).
  const medir = useCallback(() => {
    if (!passo) return;
    if (!passo.alvo || passo.lado === "centro") {
      setRect(null);
      setPronto(true);
      return;
    }
    const el = document.querySelector<HTMLElement>(passo.alvo);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    setPronto(true);
  }, [passo]);

  useEffect(() => {
    if (!passo || pathname !== passo.rota) return;
    let tentativas = 0;
    const el0 = passo.alvo ? document.querySelector<HTMLElement>(passo.alvo) : null;
    el0?.scrollIntoView({ block: "center", behavior: semMovimento ? "auto" : "smooth" });

    const loop = () => {
      tentativas += 1;
      medir();
      const achou = !passo.alvo || passo.lado === "centro" || !!document.querySelector(passo.alvo);
      if (achou && tentativas > 2) return; // mede mais 2x após achar (estabiliza)
      if (tentativas < 40) buscaRef.current = window.setTimeout(loop, 80);
    };
    loop();
    return () => {
      if (buscaRef.current) window.clearTimeout(buscaRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo?.id, pathname, medir]);

  // Reposiciona em scroll/resize enquanto o passo está ativo.
  useEffect(() => {
    if (!ativo) return;
    const h = () => medir();
    window.addEventListener("resize", h);
    window.addEventListener("scroll", h, true);
    return () => {
      window.removeEventListener("resize", h);
      window.removeEventListener("scroll", h, true);
    };
  }, [ativo, medir]);

  const avancar = useCallback(() => {
    if (!passo || avancando) return; // ignora clique duplo durante a espera
    if (passo.aoAvancar) {
      emitir(passo.aoAvancar);
      if (passo.esperaAposAvancar) {
        setAvancando(true);
        timerAvancoRef.current = window.setTimeout(() => {
          timerAvancoRef.current = null;
          setAvancando(false);
          proximo();
        }, passo.esperaAposAvancar);
        return;
      }
    }
    proximo();
  }, [passo, avancando, emitir, proximo]);

  const aoVoltar = useCallback(() => {
    limparTimerAvanco();
    voltar();
  }, [limparTimerAvanco, voltar]);
  const aoEncerrar = useCallback(() => {
    limparTimerAvanco();
    encerrar();
  }, [limparTimerAvanco, encerrar]);

  // Fecha com ESC.
  useEffect(() => {
    if (!ativo) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoEncerrar();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [ativo, aoEncerrar]);

  if (!passo) return null;

  const centro = passo.lado === "centro" || !passo.alvo || !rect;
  const temRecorte = !!rect && !centro;

  // Posição do balão.
  const vw = janela.w;
  const vh = janela.h;
  const mobile = vw < 640;

  let estiloBalao: React.CSSProperties;
  if (centro || mobile) {
    // Centraliza por `left` em px (não por transform: o framer-motion usa o
    // transform para animar, o que sobrescreveria um translateX(-50%)).
    const largura = mobile ? vw - 32 : LARGURA_BALAO;
    estiloBalao = {
      left: Math.max(16, (vw - largura) / 2),
      bottom: mobile ? 16 : 28,
      width: largura,
      maxWidth: vw - 32,
    };
  } else {
    const r = rect!;
    const espacoAbaixo = vh - (r.top + r.height);
    const abaixo = espacoAbaixo > 240;
    const left = Math.min(
      Math.max(12, r.left + r.width / 2 - LARGURA_BALAO / 2),
      vw - LARGURA_BALAO - 12,
    );
    estiloBalao = {
      left,
      width: LARGURA_BALAO,
      ...(abaixo
        ? { top: r.top + r.height + MARGEM + 6 }
        : { top: Math.max(12, r.top - MARGEM - 6 - 220) }),
    };
  }

  const fade = semMovimento
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 } };

  return (
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label="Demonstração guiada"
    >
      {/* Véu + recorte do elemento (ou véu cheio quando centralizado). */}
      {temRecorte ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-[14px] ring-2 ring-white/90"
          style={{
            top: rect!.top - MARGEM,
            left: rect!.left - MARGEM,
            width: rect!.width + MARGEM * 2,
            height: rect!.height + MARGEM * 2,
            boxShadow: "0 0 0 9999px rgba(27, 16, 14, 0.66)",
            transition: semMovimento ? undefined : "all 0.25s ease",
          }}
        />
      ) : (
        !centro && (
          <div aria-hidden className="absolute inset-0 bg-cacau/60" />
        )
      )}
      {/* Clique no véu não fecha (evita sair sem querer); só os botões fecham. */}
      <div
        className="absolute inset-0"
        onClick={(e) => e.stopPropagation()}
        aria-hidden
      />

      {/* Balão guia */}
      <AnimatePresence mode="wait">
        <motion.div
          key={passo.id}
          {...fade}
          transition={{ duration: 0.22 }}
          data-tour-balloon
          className="absolute rounded-[18px] border border-border bg-popover p-5 shadow-raised"
          style={estiloBalao}
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-acucar">
              <CerejaMark className="size-5 text-cacau" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-doce-de-leite">
                {passo.rotuloFluxo}
              </p>
              <h2 className="mt-0.5 font-display text-lg leading-tight text-foreground">
                {passo.titulo}
              </h2>
            </div>
            <button
              type="button"
              onClick={aoEncerrar}
              aria-label="Pular tour"
              className="-mr-1 -mt-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-foreground/90">
            {passo.texto}
          </p>

          {/* Progresso por fluxo */}
          <div className="mt-4 flex items-center gap-1.5" aria-hidden>
            {FLUXOS.map((f) => {
              const ativoFluxo = f.id === passo.fluxo;
              const passado =
                FLUXOS.findIndex((x) => x.id === f.id) <
                FLUXOS.findIndex((x) => x.id === passo.fluxo);
              return (
                <span
                  key={f.id}
                  className={`h-1.5 flex-1 rounded-full ${
                    ativoFluxo
                      ? "bg-cereja"
                      : passado
                        ? "bg-cereja/40"
                        : "bg-border"
                  }`}
                />
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={aoEncerrar}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pular tour
            </button>
            <div className="flex items-center gap-2">
              {indice > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={aoVoltar}
                  className="h-9"
                >
                  <ArrowLeft className="size-4" />
                  Voltar
                </Button>
              )}
              <Button
                size="sm"
                onClick={avancar}
                className="h-9"
                disabled={(!pronto && !centro) || avancando}
                data-tour-proximo
              >
                {ultimo ? "Explorar por conta própria" : "Próximo"}
                {!ultimo && <ArrowRight className="size-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
