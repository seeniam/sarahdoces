"use client";

import { useMemo, useState } from "react";
import { Calculator, Minus, Plus } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FotoProduto } from "@/components/shared/FotoProduto";
import { useDadosStore, useHidratado } from "@/lib/store";
import type { DadosState } from "@/lib/store";
import { calcularCMV, calcularRendimento, custoDosItens, custoPorInsumo, margem } from "@/lib/domain";
import { formatBRL, formatNumero, formatPorcentagem, formatQuantidade } from "@/lib/format";
import type { CategoriaIcone } from "@/components/brand/icons";
import type { FichaTecnica, Produto } from "@/types";

function corMargem(m: number): { cls: string; dot: string; label: string } {
  if (m >= 0.6) return { cls: "text-pistache", dot: "bg-pistache", label: "Ótima" };
  if (m >= 0.4) return { cls: "text-doce-de-leite", dot: "bg-doce-de-leite", label: "Ok" };
  return { cls: "text-alerta", dot: "bg-alerta", label: "Baixa" };
}

export function FichasClient() {
  const hidratado = useHidratado();
  const banco = useDadosStore() as DadosState;
  const [aberto, setAberto] = useState<Produto | null>(null);
  // Edições locais da ficha aberta (insumoId → qtd como texto). Não persiste
  // (demo). Texto para permitir valores intermediários ("0,") ao digitar.
  const [edicoes, setEdicoes] = useState<Record<string, string>>({});

  const fichaPorProduto = useMemo(
    () => new Map(banco.fichas.map((f) => [f.produtoId, f])),
    [banco.fichas],
  );
  const insumoPorId = useMemo(() => new Map(banco.insumos.map((i) => [i.id, i])), [banco.insumos]);
  const iconePorCategoria = useMemo(
    () =>
      Object.fromEntries(banco.categorias.map((c) => [c.id, c.icone])) as Record<string, CategoriaIcone>,
    [banco.categorias],
  );

  const produtos = useMemo(
    () => banco.produtos.filter((p) => p.ativo && fichaPorProduto.has(p.id)),
    [banco.produtos, fichaPorProduto],
  );

  // Ficha aberta com as edições locais aplicadas.
  const fichaAberta: FichaTecnica | undefined = aberto ? fichaPorProduto.get(aberto.id) : undefined;
  const itensEditados = useMemo(() => {
    if (!fichaAberta) return [];
    return fichaAberta.itens.map((it) => ({
      ...it,
      qtd: edicoes[it.insumoId] != null ? Number(edicoes[it.insumoId]) || 0 : it.qtd,
    }));
  }, [fichaAberta, edicoes]);

  const cmvAberto = fichaAberta
    ? custoDosItens(itensEditados, custoPorInsumo(banco.insumos))
    : 0;
  const margemAberta = aberto ? margem(aberto.preco, cmvAberto) : 0;

  function abrir(p: Produto) {
    setEdicoes({});
    setAberto(p);
  }

  if (!hidratado) {
    return <div className="h-64 animate-pulse rounded-[20px] bg-muted" />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-3xl leading-tight">Fichas técnicas</h1>
        <p className="text-sm text-muted-foreground">
          Quanto custa cada prato e quanto sobra — e quantas porções rende cada quilo de proteína.
        </p>
      </header>

      <RendimentoCalculadora banco={banco} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {produtos.map((p) => {
          const ficha = fichaPorProduto.get(p.id)!;
          const cmv = calcularCMV(ficha, banco.insumos);
          const m = margem(p.preco, cmv);
          const cor = corMargem(m);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => abrir(p)}
              className="flex gap-3 rounded-[18px] border border-border bg-card p-3 text-left transition-colors hover:border-cereja/30"
            >
              <FotoProduto
                src={p.foto}
                alt={p.nome}
                aspecto="1:1"
                categoria={iconePorCategoria[p.categoriaId]}
                className="w-20 shrink-0"
                sizes="80px"
              />
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <p className="truncate font-medium text-foreground">{p.nome}</p>
                  <p className="text-sm text-muted-foreground">{formatBRL(p.preco)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    CMV {formatBRL(cmv)}
                  </span>
                  <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", cor.cls)}>
                    <span className={cn("size-2 rounded-full", cor.dot)} />
                    {formatPorcentagem(m, 0)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detalhe editável */}
      <Sheet open={aberto !== null} onOpenChange={(v) => !v && setAberto(null)}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {aberto && fichaAberta && (
            <>
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle className="font-display text-xl">{aberto.nome}</SheetTitle>
                <p className="text-sm text-muted-foreground">Receita e custo · toque nos valores para simular</p>
              </SheetHeader>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
                {itensEditados.map((it) => {
                  const insumo = insumoPorId.get(it.insumoId);
                  if (!insumo) return null;
                  const custo = it.qtd * insumo.custoMedio;
                  return (
                    <div
                      key={it.insumoId}
                      className="flex items-center gap-3 rounded-[14px] border border-border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{insumo.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBRL(insumo.custoMedio)}/{insumo.unidade} · {formatBRL(custo)}
                        </p>
                      </div>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={edicoes[it.insumoId] ?? String(it.qtd)}
                        onChange={(e) =>
                          setEdicoes((v) => ({ ...v, [it.insumoId]: e.target.value }))
                        }
                        className="h-11 w-24 text-right tnum"
                        aria-label={`Quantidade de ${insumo.nome}`}
                      />
                      <span className="w-8 text-xs text-muted-foreground">{insumo.unidade}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t border-border px-5 py-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <Metrica rotulo="Preço" valor={formatBRL(aberto.preco)} />
                  <Metrica rotulo="CMV" valor={formatBRL(cmvAberto)} />
                  <Metrica
                    rotulo="Margem"
                    valor={formatPorcentagem(margemAberta, 0)}
                    classe={corMargem(margemAberta).cls}
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Lucro bruto por unidade: {formatBRL(aberto.preco - cmvAberto)}
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Metrica({ rotulo, valor, classe }: { rotulo: string; valor: string; classe?: string }) {
  return (
    <div className="rounded-[14px] bg-secondary/50 py-2.5">
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className={cn("tnum font-display text-lg", classe)}>{valor}</p>
    </div>
  );
}

/** Calculadora de rendimento, pré-preenchida com a carne da última compra. */
function RendimentoCalculadora({ banco }: { banco: DadosState }) {
  const carne = banco.insumos.find((i) => i.id === "ins-carne");
  const fichaPfCarne = banco.fichas.find((f) => f.produtoId === "prod-pf-carne");
  const ultimaCarne = useMemo(() => {
    let qtd = 20;
    const compras = banco.compras
      .filter((c) => c.itens.some((it) => it.insumoId === "ins-carne"))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    const item = compras[0]?.itens.find((it) => it.insumoId === "ins-carne");
    if (item && item.qtd > 0) qtd = Math.round(item.qtd);
    return qtd;
  }, [banco.compras]);

  const [pesoCru, setPesoCru] = useState(String(ultimaCarne));
  const [fator, setFator] = useState(String(fichaPfCarne?.rendimento ?? 0.65));
  const [gramas, setGramas] = useState("120");

  const r = calcularRendimento({
    pesoCruKg: Number(pesoCru) || 0,
    fator: Number(fator) || 0,
    gramasPorPorcao: Number(gramas) || 0,
  });

  return (
    <section className="rounded-[20px] border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-cereja/10 text-cereja">
          <Calculator className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-lg leading-tight">Calculadora de rendimento</h2>
          <p className="text-xs text-muted-foreground">
            Quanto rende um quilo de proteína depois de cozida.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <div className="grid grid-cols-3 gap-3">
          <CampoNum rotulo={`Carne crua (${carne?.unidade ?? "kg"})`} valor={pesoCru} onChange={setPesoCru} />
          <CampoNum rotulo="Fator de cocção" valor={fator} onChange={setFator} step="0.01" />
          <CampoNum rotulo="Porção (g)" valor={gramas} onChange={setGramas} />
        </div>

        <div className="flex items-center justify-center gap-4 rounded-[16px] bg-secondary/50 px-5 py-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Rende</p>
            <p className="font-display text-2xl tnum">{formatNumero(r.pesoProntoKg, 1)} kg</p>
          </div>
          <span className="text-2xl text-muted-foreground">→</span>
          <div>
            <p className="text-xs text-muted-foreground">Porções</p>
            <p className="font-display text-3xl tnum text-cereja">{r.porcoes}</p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {formatQuantidade(Number(pesoCru) || 0, carne?.unidade ?? "kg")} crua × fator{" "}
        {formatNumero(Number(fator) || 0, 2)} = {formatNumero(r.pesoProntoKg, 1)} kg prontos →{" "}
        <span className="font-medium text-foreground">
          {r.porcoes} porções de {formatNumero(Number(gramas) || 0)} g
        </span>
        .
      </p>
    </section>
  );
}

function CampoNum({
  rotulo,
  valor,
  onChange,
  step,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  const ajustar = (delta: number) => {
    const n = Number(valor) || 0;
    const s = Number(step) || 1;
    onChange(String(Number((n + delta * s).toFixed(2))));
  };
  return (
    <div>
      <label className="text-xs text-muted-foreground">{rotulo}</label>
      <div className="mt-1 flex items-center gap-1">
        <button
          type="button"
          aria-label="Diminuir"
          onClick={() => ajustar(-1)}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
        >
          <Minus className="size-4" />
        </button>
        <Input
          type="number"
          inputMode="decimal"
          step={step ?? "any"}
          min={0}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 flex-1 text-center tnum"
        />
        <button
          type="button"
          aria-label="Aumentar"
          onClick={() => ajustar(1)}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
