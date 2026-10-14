"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Plus, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstadoVazio } from "@/components/shared/EstadoVazio";
import { RegistrarPerdaModal } from "@/components/kds/RegistrarPerdaModal";
import { useDadosStore, useSessaoStore, useHidratado } from "@/lib/store";
import type { DadosState } from "@/lib/store";
import {
  ROTULO_MOTIVO_PERDA,
  balancoInsumo,
  faturamentoDeComanda,
  registrarEvento,
} from "@/lib/domain";
import { FICHA_POR_PRODUTO } from "@/lib/mock/data";
import { novoId, agoraISO } from "@/lib/id";
import { formatBRL, formatPorcentagem, formatQuantidade } from "@/lib/format";
import type { CategoriaIcone } from "@/components/brand/icons";
import type { LojaId, Perda } from "@/types";

const DIA_MS = 24 * 60 * 60 * 1000;

export function PerdasClient() {
  const hidratado = useHidratado();
  const banco = useDadosStore() as DadosState;
  const adicionarPerda = useDadosStore((s) => s.adicionarPerda);
  const adicionarEvento = useDadosStore((s) => s.adicionarEvento);
  const usuarioId = useSessaoStore((s) => s.usuarioId);
  const lojaAtiva = useSessaoStore((s) => s.lojaAtiva);

  const [dias, setDias] = useState(7);
  const [modalAberto, setModalAberto] = useState(false);
  const [insumoCarne, setInsumoCarne] = useState("ins-carne");
  // Perdas são por loja; na visão "todas" o registro assume a Loja 1.
  const lojaRegistro: LojaId = lojaAtiva === "todas" ? "loja-1" : lojaAtiva;

  const noFiltro = (lojaId: LojaId) => lojaAtiva === "todas" || lojaId === lojaAtiva;
  const nomeUsuario = useMemo(
    () => new Map(banco.usuarios.map((u) => [u.id, u.nome.split(" ")[0]])),
    [banco.usuarios],
  );
  const nomeInsumo = useMemo(() => new Map(banco.insumos.map((i) => [i.id, i.nome])), [banco.insumos]);
  const nomeProduto = useMemo(() => new Map(banco.produtos.map((p) => [p.id, p.nome])), [banco.produtos]);
  const nomeLoja = (id: LojaId) =>
    banco.lojas.find((l) => l.id === id)?.nome.replace(/^Loja \d+\s*[—-]\s*/, "") ?? "";
  const iconePorCategoria = useMemo(
    () =>
      Object.fromEntries(banco.categorias.map((c) => [c.id, c.icone])) as Record<string, CategoriaIcone>,
    [banco.categorias],
  );

  const [agora] = useState(() => Date.now());
  const inicioMs = agora - dias * DIA_MS;

  const perdasPeriodo = useMemo(
    () =>
      banco.perdas.filter((p) => {
        const t = new Date(p.data).getTime();
        return noFiltro(p.lojaId) && t >= inicioMs && t <= agora;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [banco.perdas, lojaAtiva, inicioMs, agora],
  );

  const totalPerdas = perdasPeriodo.reduce((s, p) => s + p.custo, 0);

  const faturamento = useMemo(() => {
    let total = 0;
    for (const c of banco.comandas) {
      if (c.status !== "paga" || !noFiltro(c.lojaId)) continue;
      const t = new Date(c.pagaEm ?? c.criadaEm).getTime();
      if (t >= inicioMs && t <= agora) total += faturamentoDeComanda(c);
    }
    return total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banco.comandas, lojaAtiva, inicioMs, agora]);

  const pctPerda = faturamento > 0 ? totalPerdas / faturamento : 0;

  // --- Agrupamentos (R$) ---
  const { porMotivo, porItem, porPessoa, porLoja } = useMemo(() => {
    const agrupar = (chave: (p: Perda) => string) => {
      const mapa = new Map<string, number>();
      for (const p of perdasPeriodo) mapa.set(chave(p), (mapa.get(chave(p)) ?? 0) + p.custo);
      return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
    };
    return {
      porMotivo: agrupar((p) => ROTULO_MOTIVO_PERDA[p.motivo]),
      porItem: agrupar((p) =>
        p.insumoId
          ? (nomeInsumo.get(p.insumoId) ?? "Insumo")
          : (nomeProduto.get(p.produtoId ?? "") ?? "Produto"),
      ),
      porPessoa: agrupar((p) => nomeUsuario.get(p.usuarioId) ?? "—"),
      porLoja: agrupar((p) => nomeLoja(p.lojaId)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perdasPeriodo]);

  // --- "Para onde foi a carne?" ---
  const lojaCarne: LojaId = lojaAtiva === "todas" ? "loja-1" : lojaAtiva;
  const balanco = useMemo(
    () => balancoInsumo(banco, insumoCarne, lojaCarne, FICHA_POR_PRODUTO, { dias: 7 }),
    [banco, insumoCarne, lojaCarne],
  );
  const insumosProteina = useMemo(
    () => banco.insumos.filter((i) => i.categoria === "proteina"),
    [banco.insumos],
  );

  function registrarPerda(perda: Perda, custo: number) {
    adicionarPerda(perda);
    const nomeAlvo =
      nomeProduto.get(perda.produtoId ?? "") ?? nomeInsumo.get(perda.insumoId ?? "") ?? "item";
    adicionarEvento(
      registrarEvento(
        {
          tipo: "perda",
          lojaId: perda.lojaId,
          usuarioId: perda.usuarioId,
          descricao: `Perda registrada: ${perda.qtd}× ${nomeAlvo} (${ROTULO_MOTIVO_PERDA[perda.motivo]})`,
          valorImpacto: -custo,
          refId: perda.id,
        },
        novoId("ev"),
        agoraISO(),
      ),
    );
    toast.success("Perda registrada");
  }

  if (!hidratado) {
    return <div className="h-64 animate-pulse rounded-[20px] bg-muted" />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-tight">Perdas &amp; desperdício</h1>
          <p className="text-sm text-muted-foreground">
            O que foi jogado fora — e o que sumiu sem ninguém registrar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(dias)}
            onValueChange={(v) => setDias(Number(v))}
            items={{ "7": "7 dias", "30": "30 dias" }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setModalAberto(true)} className="bg-cereja text-white hover:bg-cereja-calda">
            <Plus className="size-4" />
            Registrar perda
          </Button>
        </div>
      </header>

      {/* Destaque: Para onde foi a carne? */}
      <ParaOndeFoi
        balanco={balanco}
        insumos={insumosProteina}
        insumoSel={insumoCarne}
        onInsumoChange={setInsumoCarne}
        nomeLoja={nomeLoja(lojaCarne)}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Perdas no período</p>
          <p className="mt-1 font-display text-2xl tnum">{formatBRL(totalPerdas)}</p>
        </div>
        <div className="rounded-[18px] border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">% sobre o faturamento</p>
          <p
            className={cn(
              "mt-1 font-display text-2xl tnum",
              pctPerda > 0.03 ? "text-alerta" : "text-foreground",
            )}
          >
            {formatPorcentagem(pctPerda, 1)}
          </p>
        </div>
        <div className="col-span-2 rounded-[18px] border border-border bg-card p-4 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Registros</p>
          <p className="mt-1 font-display text-2xl tnum">{perdasPeriodo.length}</p>
        </div>
      </div>

      {perdasPeriodo.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma perda no período"
          descricao="Quando algo for descartado, registre aqui para a conta fechar no fim do mês."
          tom="cereja"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Ranking titulo="Por motivo" dados={porMotivo} total={totalPerdas} cor="doce-de-leite" />
          <Ranking titulo="Por item" dados={porItem} total={totalPerdas} cor="cereja" />
          <Ranking titulo="Por pessoa" dados={porPessoa} total={totalPerdas} cor="azulejo" />
          <Ranking titulo="Por loja" dados={porLoja} total={totalPerdas} cor="cacau" />
        </div>
      )}

      <RegistrarPerdaModal
        aberto={modalAberto}
        onOpenChange={setModalAberto}
        lojaId={lojaRegistro}
        usuarioId={usuarioId ?? "u-marta"}
        produtos={banco.produtos.filter((p) => p.ativo)}
        insumos={banco.insumos}
        iconePorCategoria={iconePorCategoria}
        onRegistrar={registrarPerda}
      />
    </div>
  );
}

function Ranking({
  titulo,
  dados,
  total,
  cor,
}: {
  titulo: string;
  dados: [string, number][];
  total: number;
  cor: "cereja" | "azulejo" | "doce-de-leite" | "cacau";
}) {
  const BG: Record<string, string> = {
    cereja: "bg-cereja",
    azulejo: "bg-azulejo",
    "doce-de-leite": "bg-doce-de-leite",
    cacau: "bg-cacau",
  };
  const max = dados[0]?.[1] ?? 1;
  return (
    <section className="rounded-[18px] border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{titulo}</h2>
      <ul className="space-y-2.5">
        {dados.slice(0, 5).map(([rotulo, valor]) => (
          <li key={rotulo}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="truncate text-foreground">{rotulo}</span>
              <span className="tnum shrink-0 pl-2 text-muted-foreground">
                {formatBRL(valor)}
                {total > 0 && (
                  <span className="ml-1 text-xs">({formatPorcentagem(valor / total, 0)})</span>
                )}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn("h-full rounded-full", BG[cor])}
                style={{ width: `${Math.max(4, (valor / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ParaOndeFoi({
  balanco,
  insumos,
  insumoSel,
  onInsumoChange,
  nomeLoja,
}: {
  balanco: ReturnType<typeof balancoInsumo>;
  insumos: { id: string; nome: string }[];
  insumoSel: string;
  onInsumoChange: (v: string) => void;
  nomeLoja: string;
}) {
  const un = balanco.unidade;
  const total = balanco.disponivel || 1;
  const segmentos = [
    { rotulo: "Vendido", qtd: balanco.vendido, cor: "bg-cereja" },
    { rotulo: "Perdas", qtd: balanco.perdido, cor: "bg-doce-de-leite" },
    { rotulo: "Transferido", qtd: balanco.transferenciaSaida, cor: "bg-azulejo" },
    { rotulo: "Em estoque", qtd: balanco.emEstoque, cor: "bg-pistache" },
    { rotulo: "Sem explicação", qtd: Math.max(0, balanco.semExplicacao), cor: "bg-alerta" },
  ].filter((s) => s.qtd > 0.001);

  const reaisSemExpl = balanco.semExplicacao * balanco.custoMedio;

  return (
    <section className="overflow-hidden rounded-[20px] border border-alerta/25 bg-gradient-to-br from-alerta/[0.06] to-transparent">
      <div className="flex flex-col gap-3 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl leading-tight">Para onde foi a carne?</h2>
          <p className="text-sm text-muted-foreground">
            Últimos 7 dias · {nomeLoja} · comprado × vendido × perdido × sem explicação
          </p>
        </div>
        <Select
          value={insumoSel}
          onValueChange={(v) => onInsumoChange(v ?? insumoSel)}
          items={Object.fromEntries(insumos.map((i) => [i.id, i.nome]))}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {insumos.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 px-5 py-4">
        <p className="text-sm text-muted-foreground">
          Tínhamos{" "}
          <span className="font-medium text-foreground">{formatQuantidade(balanco.disponivel, un)}</span>{" "}
          (estoque inicial {formatQuantidade(balanco.estoqueInicio, un)} + comprado{" "}
          {formatQuantidade(balanco.comprado, un)}).
        </p>

        {/* Barra empilhada única */}
        <div className="flex h-9 w-full overflow-hidden rounded-full border border-border bg-secondary">
          {segmentos.map((s) => (
            <div
              key={s.rotulo}
              className={cn("h-full", s.cor)}
              style={{ width: `${(s.qtd / total) * 100}%` }}
              title={`${s.rotulo}: ${formatQuantidade(s.qtd, un)}`}
            />
          ))}
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {segmentos.map((s) => (
            <span key={s.rotulo} className="inline-flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", s.cor)} />
              <span className="text-muted-foreground">{s.rotulo}</span>
              <span className="tnum font-medium text-foreground">{formatQuantidade(s.qtd, un)}</span>
            </span>
          ))}
        </div>

        {/* Destaque sem explicação */}
        {balanco.semExplicacao > 0.01 ? (
          <div className="flex flex-col gap-3 rounded-[16px] border border-alerta/30 bg-alerta/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-alerta" />
              <span className="text-foreground">
                Dos{" "}
                <span className="font-semibold">{formatQuantidade(balanco.comprado, un)}</span> comprados,{" "}
                <span className="font-semibold text-alerta">
                  {formatQuantidade(balanco.semExplicacao, un)} ({formatBRL(reaisSemExpl)})
                </span>{" "}
                não têm explicação.
              </span>
            </p>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/estoque" />}
              className="shrink-0 border-alerta/30 text-alerta hover:bg-alerta/10"
            >
              Ver no extrato
              <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : (
          <p className="rounded-[16px] border border-pistache/30 bg-pistache/8 px-4 py-3 text-sm text-foreground">
            Tudo certo: a carne contada bate com o esperado neste período.
          </p>
        )}
      </div>
    </section>
  );
}
