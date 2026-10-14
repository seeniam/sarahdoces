"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Receipt, Repeat, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EstadoVazio } from "@/components/shared/EstadoVazio";
import { EstoqueNav } from "../EstoqueNav";
import { LojaSegmented } from "../LojaSegmented";
import { useDadosStore, useSessaoStore, useHidratado } from "@/lib/store";
import type { DadosState } from "@/lib/store";
import { novoId } from "@/lib/id";
import { formatBRL, formatData, pluralizar } from "@/lib/format";
import type { Compra, Fornecedor, LojaId } from "@/types";

const FORNECEDORES: Fornecedor[] = [
  "Mateus",
  "Atacadão",
  "Açougue Bom Corte",
  "Hortifruti",
];

interface ItemForm {
  key: string;
  insumoId: string;
  qtd: string;
  valor: string;
}

function itemVazio(): ItemForm {
  return { key: Math.random().toString(36).slice(2), insumoId: "", qtd: "", valor: "" };
}

export function ComprasClient() {
  const hidratado = useHidratado();
  const banco = useDadosStore() as DadosState;
  const registrarCompra = useDadosStore((s) => s.registrarCompra);
  const usuarioId = useSessaoStore((s) => s.usuarioId);
  const lojaAtiva = useSessaoStore((s) => s.lojaAtiva);

  const [loja, setLoja] = useState<LojaId>(lojaAtiva === "todas" ? "loja-1" : lojaAtiva);
  const [aberto, setAberto] = useState(false);
  const [fornecedor, setFornecedor] = useState<Fornecedor>("Mateus");
  const [cupom, setCupom] = useState(false);
  const [itens, setItens] = useState<ItemForm[]>([itemVazio()]);

  const nomeInsumo = useMemo(
    () => new Map(banco.insumos.map((i) => [i.id, i])),
    [banco.insumos],
  );
  const nomeUsuario = useMemo(
    () => new Map(banco.usuarios.map((u) => [u.id, u.nome.split(" ")[0]])),
    [banco.usuarios],
  );

  const compras = useMemo(
    () =>
      banco.compras
        .filter((c) => c.lojaId === loja)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [banco.compras, loja],
  );

  // Só soma linhas válidas (mesmo critério do salvar), para o total exibido
  // bater com o que será lançado.
  const total = itens.reduce(
    (s, it) =>
      it.insumoId && Number(it.qtd) > 0 && Number(it.valor) > 0 ? s + Number(it.valor) : s,
    0,
  );

  function alterarItem(key: string, campo: keyof ItemForm, valor: string) {
    setItens((atual) =>
      atual.map((it) => (it.key === key ? { ...it, [campo]: valor } : it)),
    );
  }

  function repetirUltimaMateus() {
    const ultima = banco.compras
      .filter((c) => c.lojaId === loja && c.fornecedor === "Mateus")
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
    if (!ultima) {
      toast.info("Sem compra anterior do Mateus nesta loja.");
      return;
    }
    setFornecedor("Mateus");
    setCupom(false);
    setItens(
      ultima.itens.map((it) => ({
        key: Math.random().toString(36).slice(2),
        insumoId: it.insumoId,
        qtd: String(it.qtd),
        valor: String(it.valor),
      })),
    );
    setAberto(true); // abre a folha já com os itens repetidos
    toast.success("Compra do Mateus carregada — confira os valores.");
  }

  function abrir() {
    setFornecedor("Mateus");
    setCupom(false);
    setItens([itemVazio()]);
    setAberto(true);
  }

  function salvar() {
    const validos = itens
      .filter((it) => it.insumoId && Number(it.qtd) > 0 && Number(it.valor) > 0)
      .map((it) => ({
        insumoId: it.insumoId,
        qtd: Number(it.qtd),
        valor: Number(it.valor),
      }));
    if (validos.length === 0) {
      toast.error("Adicione ao menos um item com quantidade e valor.");
      return;
    }
    const compra: Compra = {
      id: novoId("cmp"),
      lojaId: loja,
      fornecedor,
      data: new Date().toISOString(),
      itens: validos,
      total: Number(validos.reduce((s, it) => s + it.valor, 0).toFixed(2)),
      fotoCupom: cupom ? "mock" : null,
      usuarioId: usuarioId ?? "u-marta",
    };
    registrarCompra(compra);
    setAberto(false);
    toast.success(
      `Compra lançada: entrou no estoque e no financeiro (${formatBRL(compra.total)}).`,
    );
  }

  if (!hidratado) {
    return <div className="h-64 animate-pulse rounded-[20px] bg-muted" />;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl leading-tight">Compras</h1>
          <p className="text-sm text-muted-foreground">
            Cada nota entra no estoque, atualiza o custo médio e lança a saída no financeiro.
          </p>
        </div>
        <LojaSegmented lojas={banco.lojas} valor={loja} onChange={setLoja} />
      </header>

      <EstoqueNav />

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={abrir} className="bg-cereja text-white hover:bg-cereja-calda">
          <Plus className="size-4" />
          Nova compra
        </Button>
        <Button variant="outline" onClick={repetirUltimaMateus}>
          <Repeat className="size-4" />
          Repetir última do Mateus
        </Button>
      </div>

      {compras.length === 0 ? (
        <EstadoVazio
          titulo="Nenhuma compra registrada"
          descricao="Lance a primeira nota para alimentar o estoque desta loja."
          acao={
            <Button onClick={abrir} className="bg-cereja text-white hover:bg-cereja-calda">
              <Plus className="size-4" />
              Nova compra
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {compras.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-[16px] border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{c.fornecedor}</p>
                <p className="text-xs text-muted-foreground">
                  {formatData(c.data)} · {pluralizar(c.itens.length, "item", "itens")} ·{" "}
                  {nomeUsuario.get(c.usuarioId) ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {c.fotoCupom && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Receipt className="size-3.5" />
                    cupom
                  </span>
                )}
                <span className="tnum font-display text-lg">{formatBRL(c.total)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Nova compra */}
      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="font-display text-xl">Nova compra</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {banco.lojas.find((l) => l.id === loja)?.nome}
            </p>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Fornecedor</label>
              <Select value={fornecedor} onValueChange={(v) => setFornecedor(v as Fornecedor)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORNECEDORES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Itens</label>
              {itens.map((it) => {
                const insumo = nomeInsumo.get(it.insumoId);
                return (
                  <div key={it.key} className="rounded-[14px] border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={it.insumoId}
                        onValueChange={(v) => alterarItem(it.key, "insumoId", v ?? "")}
                        items={Object.fromEntries(banco.insumos.map((i) => [i.id, i.nome]))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Insumo" />
                        </SelectTrigger>
                        <SelectContent>
                          {banco.insumos.map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {itens.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remover item"
                          onClick={() => setItens((a) => a.filter((x) => x.key !== it.key))}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          value={it.qtd}
                          onChange={(e) => alterarItem(it.key, "qtd", e.target.value)}
                          placeholder={`Qtd${insumo ? ` (${insumo.unidade})` : ""}`}
                          aria-label={`Quantidade${insumo ? ` em ${insumo.unidade}` : ""}`}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          value={it.valor}
                          onChange={(e) => alterarItem(it.key, "valor", e.target.value)}
                          placeholder="Valor R$"
                          aria-label="Valor em reais"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setItens((a) => [...a, itemVazio()])}
              >
                <Plus className="size-4" />
                Adicionar item
              </Button>
            </div>

            {/* Foto do cupom (mock) */}
            <button
              type="button"
              onClick={() => setCupom((v) => !v)}
              className="flex w-full items-center gap-3 rounded-[14px] border border-dashed border-border px-4 py-3 text-left text-sm transition-colors hover:bg-secondary/40"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-secondary text-muted-foreground">
                <Receipt className="size-5" />
              </span>
              <span className="flex-1">
                {cupom ? "Cupom anexado (simulado)" : "Anexar foto do cupom"}
              </span>
              {cupom && <X className="size-4 text-muted-foreground" />}
            </button>
          </div>

          <div className="border-t border-border px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total da compra</span>
              <span className="tnum font-display text-2xl">{formatBRL(total)}</span>
            </div>
            <Button
              onClick={salvar}
              className="h-12 w-full bg-cereja text-white hover:bg-cereja-calda"
            >
              Lançar compra
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
