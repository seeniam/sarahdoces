"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "cn";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NumeroHeroi } from "@/components/shared/NumeroHeroi";
import {
  formasPagamento,
  janelasDoPeriodo,
  ROTULO_MOTIVO_PERDA,
  ROTULO_FORMA_PAGAMENTO,
  type DRE,
  type LojaFiltro,
  type Periodo,
} from "@/lib/domain";
import { formatBRL, formatPorcentagem } from "@/lib/format";
import type { BancoMock } from "@/types";

type Degrau = "faturamento" | "cmv" | "perdas" | "despesas" | "lucro";

const ROTULO: Record<Degrau, string> = {
  faturamento: "Faturamento",
  cmv: "Custo dos produtos (CMV)",
  perdas: "Perdas",
  despesas: "Despesas",
  lucro: "Lucro",
};

export function DreWaterfall({
  dre,
  banco,
  filtro,
  periodo,
  agora,
}: {
  dre: DRE;
  banco: BancoMock;
  filtro: LojaFiltro;
  periodo: Periodo;
  agora: Date;
}) {
  const [detalhe, setDetalhe] = useState<Degrau | null>(null);
  const escala = Math.max(dre.faturamento, 1);

  // Cada degrau: faixa [de, ate] em R$ sobre o faturamento (para a cascata).
  const passos: {
    id: Degrau;
    valor: number;
    de: number;
    ate: number;
    cor: string;
    sinal: "+" | "−" | "=";
  }[] = [
    { id: "faturamento", valor: dre.faturamento, de: 0, ate: dre.faturamento, cor: "bg-cereja", sinal: "+" },
    {
      id: "cmv",
      valor: dre.cmv,
      de: dre.faturamento - dre.cmv,
      ate: dre.faturamento,
      cor: "bg-doce-de-leite",
      sinal: "−",
    },
    {
      id: "perdas",
      valor: dre.perdas,
      de: dre.faturamento - dre.cmv - dre.perdas,
      ate: dre.faturamento - dre.cmv,
      cor: "bg-alerta",
      sinal: "−",
    },
    {
      id: "despesas",
      valor: dre.despesas,
      de: dre.lucro,
      ate: dre.faturamento - dre.cmv - dre.perdas,
      cor: "bg-azulejo",
      sinal: "−",
    },
    {
      id: "lucro",
      valor: dre.lucro,
      de: Math.min(0, dre.lucro),
      ate: Math.max(0, dre.lucro),
      cor: dre.lucro >= 0 ? "bg-pistache" : "bg-alerta",
      sinal: "=",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-[20px] border border-border bg-card p-5">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Lucro do período</p>
            <NumeroHeroi
              valor={dre.lucro}
              tamanho="grande"
              className={dre.lucro < 0 ? "text-alerta" : "text-foreground"}
            />
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-sm font-medium",
              dre.margemLucro >= 0.15
                ? "bg-pistache/12 text-pistache"
                : dre.margemLucro >= 0
                  ? "bg-doce-de-leite/15 text-doce-de-leite"
                  : "bg-alerta/12 text-alerta",
            )}
          >
            margem {formatPorcentagem(dre.margemLucro, 0)}
          </span>
        </div>

        <ul className="space-y-2.5">
          {passos.map((p) => {
            const larguraPct = (Math.abs(p.ate - p.de) / escala) * 100;
            const offsetPct = (Math.max(0, p.de) / escala) * 100;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setDetalhe(p.id)}
                  className="w-full rounded-[12px] px-1 py-1.5 text-left transition-colors hover:bg-secondary/40"
                >
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      {ROTULO[p.id]}
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </span>
                    <span
                      className={cn(
                        "tnum font-semibold",
                        p.id === "faturamento"
                          ? "text-foreground"
                          : p.id === "lucro"
                            ? p.valor >= 0
                              ? "text-pistache"
                              : "text-alerta"
                            : "text-muted-foreground",
                      )}
                    >
                      {p.sinal === "−" ? "− " : p.sinal === "=" ? "= " : ""}
                      {formatBRL(Math.abs(p.valor))}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn("h-full rounded-full", p.cor)}
                      style={{ marginLeft: `${offsetPct}%`, width: `${Math.max(1, larguraPct)}%` }}
                    />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Faturamento − CMV − Perdas − Despesas = Lucro. Toque num degrau para o detalhe.
        </p>
      </div>

      <DetalheDegrau
        degrau={detalhe}
        onClose={() => setDetalhe(null)}
        dre={dre}
        banco={banco}
        filtro={filtro}
        periodo={periodo}
        agora={agora}
      />
    </section>
  );
}

function DetalheDegrau({
  degrau,
  onClose,
  dre,
  banco,
  filtro,
  periodo,
  agora,
}: {
  degrau: Degrau | null;
  onClose: () => void;
  dre: DRE;
  banco: BancoMock;
  filtro: LojaFiltro;
  periodo: Periodo;
  agora: Date;
}) {
  const linhas = useMemo(() => {
    if (!degrau) return [];
    const j = janelasDoPeriodo(periodo, agora);
    const noFiltro = (lojaId: string | undefined) => filtro === "todas" || lojaId === filtro;
    const dentro = (iso?: string) => {
      if (!iso) return false;
      const t = new Date(iso).getTime();
      return t >= j.atual.inicio && t <= j.atual.fim;
    };

    if (degrau === "faturamento") {
      return formasPagamento(banco, filtro, periodo, agora).map((f) => ({
        rotulo: ROTULO_FORMA_PAGAMENTO[f.forma] ?? f.forma,
        valor: f.valor,
      }));
    }
    if (degrau === "cmv") {
      const custoPorProduto = new Map(banco.produtos.map((p) => [p.id, p.custo]));
      const nomePorProduto = new Map(banco.produtos.map((p) => [p.id, p.nome]));
      const mapa = new Map<string, number>();
      for (const c of banco.comandas) {
        if (c.status !== "paga" || !noFiltro(c.lojaId) || !dentro(c.pagaEm)) continue;
        for (const it of c.itens) {
          if (it.cancelado) continue;
          const custo = (custoPorProduto.get(it.produtoId) ?? 0) * it.qtd;
          mapa.set(it.produtoId, (mapa.get(it.produtoId) ?? 0) + custo);
        }
      }
      return [...mapa.entries()]
        .map(([id, v]) => ({ rotulo: nomePorProduto.get(id) ?? id, valor: v }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 8);
    }
    if (degrau === "perdas") {
      const nomeInsumo = new Map(banco.insumos.map((i) => [i.id, i.nome]));
      const nomeProduto = new Map(banco.produtos.map((p) => [p.id, p.nome]));
      const mapa = new Map<string, number>();
      for (const p of banco.perdas) {
        if (!noFiltro(p.lojaId) || !dentro(p.data)) continue;
        const nome =
          nomeInsumo.get(p.insumoId ?? "") ??
          nomeProduto.get(p.produtoId ?? "") ??
          ROTULO_MOTIVO_PERDA[p.motivo];
        mapa.set(nome, (mapa.get(nome) ?? 0) + p.custo);
      }
      return [...mapa.entries()]
        .map(([rotulo, valor]) => ({ rotulo, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 8);
    }
    if (degrau === "despesas") {
      const dias = j.dias;
      return banco.despesas
        .filter((d) => filtro === "todas" || !d.lojaId || d.lojaId === filtro)
        .map((d) => {
          const peso = filtro !== "todas" && !d.lojaId ? 0.5 : 1;
          // Recorrente: rateada por dia; avulsa: valor cheio só se cai no período.
          const valor = d.recorrente
            ? (d.valor * peso) / 30 * dias
            : dentro(d.pagoEm ?? d.vencimento)
              ? d.valor * peso
              : 0;
          return { rotulo: d.descricao, valor };
        })
        .filter((l) => l.valor > 0)
        .sort((a, b) => b.valor - a.valor);
    }
    return [];
  }, [degrau, banco, filtro, periodo, agora]);

  const total =
    degrau === "faturamento"
      ? dre.faturamento
      : degrau === "cmv"
        ? dre.cmv
        : degrau === "perdas"
          ? dre.perdas
          : degrau === "despesas"
            ? dre.despesas
            : dre.lucro;

  return (
    <Sheet open={degrau !== null} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-xl">
            {degrau ? ROTULO[degrau] : ""}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Total: {formatBRL(Math.abs(total))}
          </p>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {degrau === "lucro" ? (
            <ul className="space-y-2 text-sm">
              <LinhaDre rotulo="Faturamento" valor={dre.faturamento} />
              <LinhaDre rotulo="− CMV" valor={-dre.cmv} />
              <LinhaDre rotulo="− Perdas" valor={-dre.perdas} />
              <LinhaDre rotulo="− Despesas" valor={-dre.despesas} />
              <li className="flex items-center justify-between border-t border-border pt-2 font-semibold">
                <span>= Lucro</span>
                <span className={cn("tnum", dre.lucro < 0 && "text-alerta")}>
                  {formatBRL(dre.lucro)}
                </span>
              </li>
            </ul>
          ) : linhas.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem lançamentos no período.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {linhas.map((l, i) => (
                <li
                  key={`${l.rotulo}-${i}`}
                  className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0"
                >
                  <span className="min-w-0 truncate text-foreground">{l.rotulo}</span>
                  <span className="tnum shrink-0 text-muted-foreground">{formatBRL(l.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LinhaDre({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="tnum">{formatBRL(valor)}</span>
    </li>
  );
}
