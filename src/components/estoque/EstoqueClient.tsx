"use client";

import { useMemo, useState } from "react";
import { Search, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstadoVazio } from "@/components/shared/EstadoVazio";
import { EstoqueNav } from "./EstoqueNav";
import { LojaSegmented } from "./LojaSegmented";
import { ExtratoSheet } from "./ExtratoSheet";
import { useDadosStore, useSessaoStore, useHidratado } from "@/lib/store";
import type { DadosState } from "@/lib/store";
import {
  balancoInsumo,
  construirMovimentacoes,
  rotuloStatusEstoque,
  statusEstoque,
  type StatusEstoque,
} from "@/lib/domain";
import { FICHA_POR_PRODUTO } from "@/lib/mock/data";
import { formatBRL, formatData, formatQuantidade } from "@/lib/format";
import type { CategoriaInsumo, Insumo, LojaId } from "@/types";

const CATEGORIA_LABEL: Record<CategoriaInsumo, string> = {
  proteina: "Proteínas",
  graos: "Grãos e mercearia",
  laticinios: "Laticínios",
  hortifruti: "Hortifruti",
  mercearia: "Mercearia",
  bebidas: "Bebidas",
  confeitaria: "Confeitaria",
  descartaveis: "Descartáveis",
};

const STATUS_COR: Record<StatusEstoque, string> = {
  ok: "bg-pistache",
  baixo: "bg-doce-de-leite",
  critico: "bg-alerta",
};

interface Linha {
  insumo: Insumo;
  teorico: number;
  contado: number | null;
  dataContagem: string | null;
  custoEmEstoque: number;
  status: StatusEstoque;
}

export function EstoqueClient() {
  const hidratado = useHidratado();
  const banco = useDadosStore() as DadosState;
  const lojaAtiva = useSessaoStore((s) => s.lojaAtiva);

  const [loja, setLoja] = useState<LojaId>(
    lojaAtiva === "todas" ? "loja-1" : lojaAtiva,
  );
  const [busca, setBusca] = useState("");
  const [cat, setCat] = useState<CategoriaInsumo | "todas">("todas");
  const [filtroStatus, setFiltroStatus] = useState<StatusEstoque | "todos">("todos");
  const [aberto, setAberto] = useState<Insumo | null>(null);

  const nomeLoja =
    banco.lojas.find((l) => l.id === loja)?.nome.replace(/^Loja \d+\s*[—-]\s*/, "") ?? "";

  const linhas = useMemo<Linha[]>(() => {
    const estoqueDaLoja = new Map(
      banco.estoque.filter((e) => e.lojaId === loja).map((e) => [e.insumoId, e]),
    );
    return banco.insumos.map((insumo) => {
      const e = estoqueDaLoja.get(insumo.id);
      const teorico = e?.qtdTeorica ?? 0;
      return {
        insumo,
        teorico,
        contado: e?.dataContagem ? e.qtdUltimaContagem : null,
        dataContagem: e?.dataContagem ?? null,
        custoEmEstoque: Math.max(0, teorico) * insumo.custoMedio,
        status: statusEstoque(teorico, insumo.estoqueMinimo),
      };
    });
  }, [banco.estoque, banco.insumos, loja]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return linhas.filter((l) => {
      if (cat !== "todas" && l.insumo.categoria !== cat) return false;
      if (filtroStatus !== "todos" && l.status !== filtroStatus) return false;
      if (q && !l.insumo.nome.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [linhas, busca, cat, filtroStatus]);

  const resumo = useMemo(() => {
    const totalReais = linhas.reduce((s, l) => s + l.custoEmEstoque, 0);
    const baixos = linhas.filter((l) => l.status === "baixo").length;
    const criticos = linhas.filter((l) => l.status === "critico").length;
    return { totalReais, baixos, criticos };
  }, [linhas]);

  const extrato = useMemo(() => {
    if (!aberto) return { movimentacoes: [], balanco: null, teoricoAgora: 0 };
    return {
      movimentacoes: construirMovimentacoes(banco, aberto.id, loja, FICHA_POR_PRODUTO),
      balanco: balancoInsumo(banco, aberto.id, loja, FICHA_POR_PRODUTO, { dias: 7 }),
      teoricoAgora:
        banco.estoque.find((e) => e.insumoId === aberto.id && e.lojaId === loja)
          ?.qtdTeorica ?? 0,
    };
  }, [aberto, banco, loja]);

  const categoriasPresentes = useMemo(
    () => [...new Set(banco.insumos.map((i) => i.categoria))],
    [banco.insumos],
  );

  if (!hidratado) {
    return <div className="h-64 animate-pulse rounded-[20px] bg-muted" />;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground">
            Posição teórica, última contagem e custo parado — por loja.
          </p>
        </div>
        <LojaSegmented lojas={banco.lojas} valor={loja} onChange={setLoja} />
      </header>

      <EstoqueNav />

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Custo parado em estoque</p>
          <p className="mt-1 font-display text-2xl tnum">{formatBRL(resumo.totalReais)}</p>
        </div>
        <div className="rounded-[18px] border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Itens baixos</p>
          <p className="mt-1 font-display text-2xl tnum text-doce-de-leite">{resumo.baixos}</p>
        </div>
        <div className="col-span-2 rounded-[18px] border border-border bg-card p-4 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Itens críticos</p>
          <p className="mt-1 font-display text-2xl tnum text-alerta">{resumo.criticos}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar insumo…"
            className="pl-9"
          />
        </div>
        <Select
          value={cat}
          onValueChange={(v) => setCat(v as CategoriaInsumo | "todas")}
          items={{
            todas: "Todas as categorias",
            ...Object.fromEntries(categoriasPresentes.map((c) => [c, CATEGORIA_LABEL[c]])),
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categoriasPresentes.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORIA_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filtroStatus}
          onValueChange={(v) => setFiltroStatus(v as StatusEstoque | "todos")}
          items={{ todos: "Todos", ok: "Em dia", baixo: "Baixo", critico: "Crítico" }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ok">Em dia</SelectItem>
            <SelectItem value="baixo">Baixo</SelectItem>
            <SelectItem value="critico">Crítico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtradas.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum insumo encontrado"
          descricao="Ajuste a busca ou os filtros para ver os itens do estoque."
        />
      ) : (
        <>
          {/* Desktop: tabela densa */}
          <div className="hidden overflow-hidden rounded-[18px] border border-border md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Insumo</th>
                  <th className="px-4 py-2.5 text-right font-medium">Teórico</th>
                  <th className="px-4 py-2.5 text-right font-medium">Última contagem</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Custo parado</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((l) => (
                  <tr
                    key={l.insumo.id}
                    onClick={() => setAberto(l.insumo)}
                    className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-secondary/40"
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-foreground">{l.insumo.nome}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {CATEGORIA_LABEL[l.insumo.categoria]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tnum">
                      {formatQuantidade(l.teorico, l.insumo.unidade)}
                    </td>
                    <td className="px-4 py-2.5 text-right tnum text-muted-foreground">
                      {l.contado !== null ? (
                        <>
                          {formatQuantidade(l.contado, l.insumo.unidade)}
                          <span className="ml-1 text-xs">· {formatData(l.dataContagem!)}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-foreground">
                        <span className={cn("size-2 rounded-full", STATUS_COR[l.status])} />
                        {rotuloStatusEstoque(l.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tnum">{formatBRL(l.custoEmEstoque)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: lista de cartões */}
          <ul className="space-y-2 md:hidden">
            {filtradas.map((l) => (
              <li key={l.insumo.id}>
                <button
                  type="button"
                  onClick={() => setAberto(l.insumo)}
                  className="w-full rounded-[16px] border border-border bg-card p-3.5 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{l.insumo.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORIA_LABEL[l.insumo.categoria]}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-sm">
                      <span className={cn("size-2 rounded-full", STATUS_COR[l.status])} />
                      {rotuloStatusEstoque(l.status)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Teórico</p>
                      <p className="tnum font-semibold">
                        {formatQuantidade(l.teorico, l.insumo.unidade)}
                      </p>
                    </div>
                    <p className="tnum text-sm text-muted-foreground">
                      {formatBRL(l.custoEmEstoque)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {resumo.criticos > 0 && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <TriangleAlert className="size-3.5 text-alerta" />
          Toque num insumo para ver o extrato e descobrir para onde ele foi.
        </p>
      )}

      <ExtratoSheet
        aberto={aberto !== null}
        onOpenChange={(v) => !v && setAberto(null)}
        insumo={aberto}
        nomeLoja={nomeLoja}
        movimentacoes={extrato.movimentacoes}
        balanco={extrato.balanco}
        teoricoAgora={extrato.teoricoAgora}
      />
    </div>
  );
}
