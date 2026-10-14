"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, ArrowLeftRight, Plus, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstadoVazio } from "@/components/shared/EstadoVazio";
import { EstoqueNav } from "../EstoqueNav";
import { useDadosStore, useSessaoStore, useHidratado } from "@/lib/store";
import type { DadosState } from "@/lib/store";
import { novoId } from "@/lib/id";
import { formatData, formatQuantidade } from "@/lib/format";
import type { LojaId, Transferencia } from "@/types";

interface ItemForm {
  key: string;
  insumoId: string;
  qtd: string;
}
const itemVazio = (): ItemForm => ({
  key: Math.random().toString(36).slice(2),
  insumoId: "",
  qtd: "",
});

export function TransferenciasClient() {
  const hidratado = useHidratado();
  const banco = useDadosStore() as DadosState;
  const registrarTransferencia = useDadosStore((s) => s.registrarTransferencia);
  const usuarioId = useSessaoStore((s) => s.usuarioId);

  const lojas = banco.lojas;
  const [origem, setOrigem] = useState<LojaId>("loja-1");
  const destino = lojas.find((l) => l.id !== origem)?.id ?? "loja-2";
  const [itens, setItens] = useState<ItemForm[]>([itemVazio()]);

  const insumoPorId = useMemo(() => new Map(banco.insumos.map((i) => [i.id, i])), [banco.insumos]);
  const nomeCurto = (id: LojaId) =>
    lojas.find((l) => l.id === id)?.nome.replace(/^Loja \d+\s*[—-]\s*/, "") ?? "";
  const corDe = (id: LojaId) => (lojas.find((l) => l.id === id)?.cor === "loja-1" ? "cereja" : "azulejo");

  const historico = useMemo(
    () =>
      [...banco.transferencias].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
      ),
    [banco.transferencias],
  );

  function salvar() {
    const validos = itens
      .filter((it) => it.insumoId && Number(it.qtd) > 0)
      .map((it) => ({ insumoId: it.insumoId, qtd: Number(it.qtd) }));
    if (validos.length === 0) {
      toast.error("Adicione ao menos um insumo com quantidade.");
      return;
    }
    const transf: Transferencia = {
      id: novoId("transf"),
      origemId: origem,
      destinoId: destino,
      itens: validos,
      usuarioId: usuarioId ?? "u-marta",
      data: new Date().toISOString(),
    };
    registrarTransferencia(transf);
    setItens([itemVazio()]);
    toast.success(`Transferência de ${nomeCurto(origem)} para ${nomeCurto(destino)} registrada.`);
  }

  if (!hidratado) {
    return <div className="h-64 animate-pulse rounded-[20px] bg-muted" />;
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="font-display text-3xl leading-tight">Transferências</h1>
        <p className="text-sm text-muted-foreground">
          Mande insumos de uma loja para a outra. Sai de uma, entra na outra.
        </p>
      </header>

      <EstoqueNav />

      <div className="rounded-[18px] border border-border bg-card p-4 sm:p-5">
        {/* Origem → destino */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">De</label>
            <Select
              value={origem}
              onValueChange={(v) => setOrigem(v as LojaId)}
              items={Object.fromEntries(lojas.map((l) => [l.id, l.nome]))}
            >
              <SelectTrigger
                className={cn(
                  "mt-1 border-2",
                  corDe(origem) === "cereja" ? "border-cereja/40" : "border-azulejo/40",
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lojas.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Inverter lojas"
            className="mt-5 shrink-0"
            onClick={() => setOrigem(destino)}
          >
            <ArrowLeftRight className="size-4" />
          </Button>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Para</label>
            <div
              className={cn(
                "mt-1 flex h-9 items-center gap-2 rounded-lg border-2 px-3 text-sm font-medium",
                corDe(destino) === "cereja"
                  ? "border-cereja/40 text-cereja"
                  : "border-azulejo/40 text-azulejo",
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  corDe(destino) === "cereja" ? "bg-cereja" : "bg-azulejo",
                )}
              />
              {nomeCurto(destino)}
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="mt-4 space-y-2">
          {itens.map((it) => {
            const insumo = insumoPorId.get(it.insumoId);
            return (
              <div key={it.key} className="flex items-center gap-2">
                <Select
                  value={it.insumoId}
                  onValueChange={(v) =>
                    setItens((a) => a.map((x) => (x.key === it.key ? { ...x, insumoId: v ?? "" } : x)))
                  }
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
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={it.qtd}
                  onChange={(e) =>
                    setItens((a) => a.map((x) => (x.key === it.key ? { ...x, qtd: e.target.value } : x)))
                  }
                  placeholder={`Qtd${insumo ? ` (${insumo.unidade})` : ""}`}
                  aria-label={`Quantidade${insumo ? ` em ${insumo.unidade}` : ""}`}
                  className="w-32"
                />
                {itens.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remover"
                    onClick={() => setItens((a) => a.filter((x) => x.key !== it.key))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            );
          })}
          <Button variant="outline" className="w-full" onClick={() => setItens((a) => [...a, itemVazio()])}>
            <Plus className="size-4" />
            Adicionar insumo
          </Button>
        </div>

        <Button
          onClick={salvar}
          className="mt-4 h-12 w-full bg-cereja text-white hover:bg-cereja-calda"
        >
          Registrar transferência
        </Button>
      </div>

      {/* Histórico */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Histórico
        </h2>
        {historico.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma transferência ainda"
            descricao="Quando uma loja socorrer a outra, o movimento aparece aqui."
          />
        ) : (
          <ul className="space-y-2">
            {historico.map((t) => (
              <li
                key={t.id}
                className="rounded-[16px] border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className={cn(corDe(t.origemId) === "cereja" ? "text-cereja" : "text-azulejo")}>
                      {nomeCurto(t.origemId)}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                    <span className={cn(corDe(t.destinoId) === "cereja" ? "text-cereja" : "text-azulejo")}>
                      {nomeCurto(t.destinoId)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatData(t.data)}</span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t.itens
                    .map((i) => `${formatQuantidade(i.qtd, insumoPorId.get(i.insumoId)?.unidade ?? "un")} ${insumoPorId.get(i.insumoId)?.nome ?? ""}`)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
