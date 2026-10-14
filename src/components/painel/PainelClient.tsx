"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ChevronRight,
  Info,
  Receipt,
  Timer,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "cn";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NumeroHeroi } from "@/components/shared/NumeroHeroi";
import { EstadoVazio } from "@/components/shared/EstadoVazio";
import { VendasPorHoraChart } from "@/components/charts/VendasPorHoraChart";
import { TopProdutosChart } from "@/components/charts/TopProdutosChart";
import { FormasPagamentoBar } from "@/components/charts/FormasPagamentoBar";
import { VendaPerdaChart } from "@/components/charts/VendaPerdaChart";
import { useDadosStore, useSessaoStore } from "@/lib/store";
import {
  metricasPainel,
  vendasPorHora,
  faturamentoPorLoja,
  topProdutos,
  formasPagamento,
  vendaXPerda,
  alertasPainel,
  faturamentoDeComanda,
  type Periodo,
  type LojaFiltro,
} from "@/lib/domain";
import { formatBRL, formatPorcentagem } from "@/lib/format";
import type { CategoriaIcone } from "@/components/brand/icons";
import type { DadosState } from "@/lib/store";
import type { LojaId } from "@/types";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "7dias", label: "7 dias" },
  { id: "30dias", label: "30 dias" },
];

function saudacao(hora: number): string {
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}
function horaFortaleza(d: Date): { h: number; min: number } {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const num = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return { h: num("hour"), min: num("minute") };
}

const SEV_CLS: Record<string, string> = {
  critico: "border-alerta/30 bg-alerta/8",
  atencao: "border-doce-de-leite/30 bg-doce-de-leite/8",
  info: "border-border bg-card",
};
const SEV_DOT: Record<string, string> = {
  critico: "bg-alerta",
  atencao: "bg-doce-de-leite",
  info: "bg-muted-foreground",
};

export function PainelClient() {
  const banco = useDadosStore() as DadosState;
  const usuarioId = useSessaoStore((s) => s.usuarioId);
  const lojaAtiva = useSessaoStore((s) => s.lojaAtiva);
  const setLoja = useSessaoStore((s) => s.setLoja);
  const nome =
    banco.usuarios.find((u) => u.id === usuarioId)?.nome.split(" ")[0] ?? "Sarah";

  const [periodo, setPeriodo] = useState<Periodo>("hoje");
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const filtro: LojaFiltro = lojaAtiva;

  const iconePorCategoria = useMemo(
    () =>
      Object.fromEntries(banco.categorias.map((c) => [c.id, c.icone])) as Record<
        string,
        CategoriaIcone
      >,
    [banco.categorias],
  );

  const m = useMemo(
    () => metricasPainel(banco, filtro, periodo, agora),
    [banco, filtro, periodo, agora],
  );
  const alertas = useMemo(
    () => alertasPainel(banco, filtro, agora).slice(0, 3),
    [banco, filtro, agora],
  );
  const porHora = useMemo(() => vendasPorHora(banco, filtro, agora), [banco, filtro, agora]);
  const porLoja = useMemo(() => faturamentoPorLoja(banco, periodo, agora), [banco, periodo, agora]);
  const top = useMemo(() => topProdutos(banco, filtro, periodo, agora, 5), [banco, filtro, periodo, agora]);
  const pagamentos = useMemo(() => formasPagamento(banco, filtro, periodo, agora), [banco, filtro, periodo, agora]);
  const vXp = useMemo(() => vendaXPerda(banco, filtro, agora, 14), [banco, filtro, agora]);

  // Faturamento de ONTEM (dia inteiro) para o estado "antes da abertura".
  const ontem = useMemo(() => {
    const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(
      new Date(agora.getTime() - 86_400_000),
    );
    let total = 0;
    for (const c of banco.comandas) {
      if (c.status !== "paga" || !c.pagaEm) continue;
      if (filtro !== "todas" && c.lojaId !== filtro) continue;
      const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(
        new Date(c.pagaEm),
      );
      if (dia === ymd) total += faturamentoDeComanda(c);
    }
    return total;
  }, [banco.comandas, filtro, agora]);

  const { h: horaAtual, min: minAtual } = horaFortaleza(agora);
  const antesDaAbertura = periodo === "hoje" && horaAtual * 60 + minAtual < 6 * 60 + 30;

  // Id do último pagamento da loja filtrada: muda só quando há venda nova
  // relevante — serve de gatilho da animação do herói (nunca pelo relógio).
  const ultimoPagId = useMemo(() => {
    for (let i = banco.pagamentos.length - 1; i >= 0; i--) {
      const p = banco.pagamentos[i];
      if (filtro === "todas" || p.lojaId === filtro) return p.id;
    }
    return "";
  }, [banco.pagamentos, filtro]);

  // --- Ao vivo: nova venda paga em outra aba → aviso discreto. Só para vendas
  // da loja filtrada, nunca na carga inicial nem antes da abertura. ---
  const ultimoPag = useRef<string | null>(null);
  useEffect(() => {
    const ultimo = banco.pagamentos[banco.pagamentos.length - 1];
    if (!ultimo) return;
    if (ultimoPag.current === null) {
      ultimoPag.current = ultimo.id; // baseline, sem aviso
      return;
    }
    if (ultimo.id === ultimoPag.current) return;
    ultimoPag.current = ultimo.id;
    const c = banco.comandas.find((x) => x.id === ultimo.comandaId);
    if (c && filtro !== "todas" && c.lojaId !== filtro) return; // outra loja
    if (antesDaAbertura) return; // painel mostra outro estado
    const alvo = c
      ? `${c.tipo === "mesa" ? "Mesa" : c.tipo === "balcao" ? "Balcão" : "Viagem"} ${c.identificador}`
      : "Venda";
    toast.success(`Nova venda · ${alvo} · ${formatBRL(ultimo.valor)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banco.pagamentos.length, filtro, periodo]);

  const lojas = banco.lojas;
  const nomeCurto = (id: LojaId) =>
    lojas.find((l) => l.id === id)?.nome.replace(/^Loja \d+\s*[—-]\s*/, "") ?? "";

  // Perdas DO MESMO período do gráfico (14 dias) e da mesma fonte (vXp), para o
  // número bater com a linha de perda ao lado. Não usa a DRE do período do topo.
  const perda14 = vXp.reduce((s, p) => s + p.perda, 0);
  const venda14 = vXp.reduce((s, p) => s + p.venda, 0);
  const perdaPct14 = venda14 > 0 ? perda14 / venda14 : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl text-foreground sm:text-3xl">
            {saudacao(horaAtual)}, {nome}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-card p-0.5">
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodo(p.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  periodo === p.id
                    ? "bg-cereja text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <select
            value={filtro}
            onChange={(e) => setLoja(e.target.value as LojaFiltro)}
            className="h-9 rounded-full border border-border bg-card px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="todas">Todas as lojas</option>
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>
                {nomeCurto(l.id)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {antesDaAbertura ? (
        <EstadoVazio
          titulo="A loja ainda não abriu"
          descricao={`O movimento começa às 6h30. Ontem: ${formatBRL(ontem)}.`}
        />
      ) : (
        <>
          {/* Herói */}
          <div>
            <motion.div
              key={`${periodo}-${filtro}-${ultimoPagId}`}
              initial={{ opacity: 0.4, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <NumeroHeroi valor={m.faturamento} tamanho="hero" />
            </motion.div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              <span>
                {periodo === "hoje"
                  ? "faturado hoje"
                  : periodo === "7dias"
                    ? "faturado em 7 dias"
                    : "faturado em 30 dias"}
              </span>
              <Variacao valor={m.variacao.faturamento} rotulo={`vs ${m.rotuloComparacao}`} />
              {m.descontos > 0 && (
                <span className="text-pistache">
                  · {formatBRL(m.descontos)} em descontos
                </span>
              )}
            </p>
          </div>

          {/* Alertas (carrossel no celular) */}
          {alertas.length > 0 && (
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
              {alertas.map((a) => (
                <Link
                  key={a.id}
                  href={a.href as never}
                  className={cn(
                    "flex min-w-[82%] snap-start items-start gap-2.5 rounded-[14px] border p-3 transition-colors hover:bg-muted/40 sm:min-w-0",
                    SEV_CLS[a.severidade],
                  )}
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", SEV_DOT[a.severidade])} />
                  <span className="min-w-0 flex-1 text-sm leading-snug text-foreground">
                    {a.texto}
                  </span>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
              <Link
                href="/auditoria"
                className="flex min-w-[55%] snap-start items-center justify-center gap-1 rounded-[14px] border border-dashed border-border px-3 text-sm font-medium text-muted-foreground hover:text-foreground sm:hidden"
              >
                Ver todos <ChevronRight className="size-4" />
              </Link>
            </div>
          )}

          {/* Vendas por hora (2/3) + Loja × Loja (1/3) */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Cartao
              titulo="Vendas por hora"
              className="lg:col-span-2"
              extra={
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full bg-cereja" />
                    Hoje
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0 w-4 border-t-2 border-dashed border-azulejo" />
                    média 4 sem.
                  </span>
                </div>
              }
            >
              <div className="h-56">
                <VendasPorHoraChart dados={porHora} />
              </div>
            </Cartao>
            <Cartao titulo={`${nomeCurto("loja-1")} × ${nomeCurto("loja-2")}`}>
              <LojaVsLoja dados={porLoja} nomeCurto={nomeCurto} />
            </Cartao>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi icone={Receipt} rotulo="Pedidos" valor={String(m.pedidos)}>
              <Variacao valor={m.variacao.pedidos} compacto />
            </Kpi>
            <Kpi icone={Wallet} rotulo="Ticket médio" valor={formatBRL(m.ticketMedio)}>
              <Variacao valor={m.variacao.ticketMedio} compacto />
            </Kpi>
            <LucroKpi dre={m.dre} />
            <Kpi
              icone={Timer}
              rotulo="Tempo médio de preparo"
              valor={m.tempoMedioPreparoMin != null ? `${m.tempoMedioPreparoMin} min` : "—"}
            />
          </div>

          {/* Perdas + Top produtos + Formas de pagamento + Venda×Perda */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Cartao titulo="Top produtos">
              <TopProdutosChart dados={top} iconePorCategoria={iconePorCategoria} />
            </Cartao>
            <Cartao titulo="Formas de pagamento">
              <FormasPagamentoBar dados={pagamentos} />
            </Cartao>
            <Cartao
              titulo="Venda × Perda (14 dias)"
              extra={
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-cereja" />
                    Venda
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0 w-4 border-t-2 border-dashed border-doce-de-leite" />
                    Perda
                  </span>
                  <span>
                    Perdas (14 dias):{" "}
                    <span className="font-semibold text-doce-de-leite tnum">{formatBRL(perda14)}</span>{" "}
                    ({formatPorcentagem(perdaPct14, 1)})
                  </span>
                </div>
              }
              className="lg:col-span-2"
            >
              <div className="h-52">
                <VendaPerdaChart dados={vXp} />
              </div>
            </Cartao>
          </div>
        </>
      )}
    </div>
  );
}

function Cartao({
  titulo,
  extra,
  className,
  children,
}: {
  titulo: string;
  extra?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[20px] border border-border bg-card p-4 shadow-soft",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg text-foreground">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Kpi({
  icone: Icone,
  rotulo,
  valor,
  children,
}: {
  icone: typeof Receipt;
  rotulo: string;
  valor: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icone className="size-3.5" />
        {rotulo}
      </div>
      <p className="mt-1.5 font-display text-2xl text-foreground tnum">{valor}</p>
      {children}
    </div>
  );
}

function LucroKpi({ dre }: { dre: import("@/lib/domain").MetricasPainel["dre"] }) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <TrendingUp className="size-3.5" />
          Lucro estimado
        </span>
        <Sheet>
          <SheetTrigger
            render={
              <button
                type="button"
                aria-label="Como calculamos"
                className="text-muted-foreground hover:text-foreground"
              />
            }
          >
            <Info className="size-3.5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-sm">
            <SheetHeader>
              <SheetTitle className="font-display text-xl">Como calculamos</SheetTitle>
            </SheetHeader>
            <div className="space-y-2 px-4 text-sm">
              <p className="text-muted-foreground">
                Uma estimativa: as despesas fixas são rateadas por dia.
              </p>
              <Linha rotulo="Faturamento" valor={dre.faturamento} />
              <Linha rotulo="− CMV (custo da ficha)" valor={-dre.cmv} />
              <Linha rotulo="− Perdas" valor={-dre.perdas} />
              <Linha rotulo="− Despesas (rateio diário)" valor={-dre.despesas} />
              <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
                <span>Lucro estimado</span>
                <span className="tnum">{formatBRL(dre.lucro)}</span>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <p className="mt-1.5 font-display text-2xl text-foreground tnum">
        {formatBRL(dre.lucro)}
      </p>
      <p className="text-xs text-muted-foreground">
        margem {formatPorcentagem(dre.margemLucro, 0)} · estimado
      </p>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="tnum">{formatBRL(valor)}</span>
    </div>
  );
}

function Variacao({
  valor,
  rotulo,
  compacto = false,
}: {
  valor: number | null;
  rotulo?: string;
  compacto?: boolean;
}) {
  if (valor == null) {
    return <span className="text-xs text-muted-foreground">sem base</span>;
  }
  const positivo = valor >= 0;
  const Icone = positivo ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        positivo ? "text-pistache" : "text-alerta",
        compacto && "mt-1",
      )}
    >
      <Icone className="size-3.5" />
      {positivo ? "+" : "−"}
      {formatPorcentagem(Math.abs(valor), 0)}
      {rotulo && <span className="font-normal text-muted-foreground">{rotulo}</span>}
    </span>
  );
}

function LojaVsLoja({
  dados,
  nomeCurto,
}: {
  dados: { lojaId: LojaId; faturamento: number }[];
  nomeCurto: (id: LojaId) => string;
}) {
  const max = Math.max(1, ...dados.map((d) => d.faturamento));
  return (
    <div className="space-y-4 pt-1">
      {dados.map((d) => (
        <div key={d.lojaId}>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-foreground">{nomeCurto(d.lojaId)}</span>
            <span className="text-sm font-semibold text-foreground tnum">
              {formatBRL(d.faturamento)}
            </span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", d.lojaId === "loja-1" ? "bg-loja-1" : "bg-loja-2")}
              style={{ width: `${(d.faturamento / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
