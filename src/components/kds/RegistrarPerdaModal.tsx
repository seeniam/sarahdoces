"use client";

import { useState } from "react";
import { Camera, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";
import { ROTULO_MOTIVO_PERDA } from "@/lib/domain";
import { novoId, agoraISO } from "@/lib/id";
import { formatBRL } from "@/lib/format";
import type { Insumo, LojaId, MotivoPerda, Perda, Produto, UsuarioId } from "@/types";

// Motivos de registro manual (o automático "cancelado_apos_preparo" fica de fora).
const MOTIVOS: MotivoPerda[] = [
  "queimou",
  "caiu",
  "estragou",
  "azedou",
  "vencido",
  "preparado_a_mais",
  "consumo_equipe",
  "quebrou",
];

type Alvo = "produto" | "insumo";

export function RegistrarPerdaModal({
  aberto,
  onOpenChange,
  lojaId,
  usuarioId,
  produtos,
  insumos,
  onRegistrar,
}: {
  aberto: boolean;
  onOpenChange: (o: boolean) => void;
  lojaId: LojaId;
  usuarioId: UsuarioId;
  produtos: Produto[];
  insumos: Insumo[];
  onRegistrar: (perda: Perda, custo: number) => void;
}) {
  const [alvo, setAlvo] = useState<Alvo>("produto");
  const [produtoId, setProdutoId] = useState("");
  const [insumoId, setInsumoId] = useState("");
  const [qtd, setQtd] = useState(1);
  const [motivo, setMotivo] = useState<MotivoPerda | null>(null);
  const [comFoto, setComFoto] = useState(false);

  const produto = produtos.find((p) => p.id === produtoId);
  const insumo = insumos.find((i) => i.id === insumoId);
  const custoUnit = alvo === "produto" ? (produto?.custo ?? 0) : (insumo?.custoMedio ?? 0);
  const custo = Number((custoUnit * qtd).toFixed(2));
  const temAlvo = alvo === "produto" ? !!produto : !!insumo;
  const pode = temAlvo && qtd > 0 && !!motivo;

  function limpar() {
    setAlvo("produto");
    setProdutoId("");
    setInsumoId("");
    setQtd(1);
    setMotivo(null);
    setComFoto(false);
  }

  function confirmar() {
    if (!pode || !motivo) return;
    const perda: Perda = {
      id: novoId("perda"),
      lojaId,
      produtoId: alvo === "produto" ? produtoId : undefined,
      insumoId: alvo === "insumo" ? insumoId : undefined,
      qtd,
      motivo,
      custo,
      usuarioId,
      data: agoraISO(),
      foto: comFoto ? "mock" : null,
    };
    onRegistrar(perda, custo);
    limpar();
    onOpenChange(false);
  }

  const selectCls =
    "h-14 w-full rounded-[12px] border border-border bg-card px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <Dialog
      open={aberto}
      onOpenChange={(o) => {
        if (!o) limpar();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Registrar perda</DialogTitle>
          <DialogDescription>
            O que foi perdido vira baixa e aparece no painel por motivo.
          </DialogDescription>
        </DialogHeader>

        {/* Produto ou insumo */}
        <div className="grid grid-cols-2 gap-2">
          {(["produto", "insumo"] as Alvo[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAlvo(a)}
              className={cn(
                "h-14 rounded-[12px] border text-sm font-medium capitalize transition-colors",
                alvo === a
                  ? "border-cereja bg-acucar/60 text-cereja"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {a}
            </button>
          ))}
        </div>

        {alvo === "produto" ? (
          <select
            className={selectCls}
            value={produtoId}
            onChange={(e) => setProdutoId(e.target.value)}
          >
            <option value="">Escolha o produto…</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        ) : (
          <select
            className={selectCls}
            value={insumoId}
            onChange={(e) => setInsumoId(e.target.value)}
          >
            <option value="">Escolha o insumo…</option>
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome} ({i.unidade})
              </option>
            ))}
          </select>
        )}

        {/* Quantidade */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-foreground">Quantidade</label>
          <Input
            type="number"
            min={0}
            step="any"
            value={qtd}
            onChange={(e) => setQtd(Math.max(0, Number(e.target.value) || 0))}
            className="h-14 w-28 text-lg tnum"
          />
          <span className="ml-auto text-sm text-muted-foreground">
            Custo: <span className="font-semibold text-foreground tnum">{formatBRL(custo)}</span>
          </span>
        </div>

        {/* Motivo em botões grandes */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MOTIVOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMotivo(m)}
              className={cn(
                "min-h-14 rounded-[12px] border px-2 text-sm font-medium transition-colors",
                motivo === m
                  ? "border-cereja bg-cereja text-white"
                  : "border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {ROTULO_MOTIVO_PERDA[m]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setComFoto((v) => !v)}
          className={cn(
            "flex h-14 items-center justify-center gap-2 rounded-[12px] border text-sm font-medium transition-colors",
            comFoto
              ? "border-pistache bg-pistache/10 text-pistache"
              : "border-dashed border-border text-muted-foreground hover:bg-muted",
          )}
        >
          {comFoto ? <Check className="size-4" /> : <Camera className="size-4" />}
          {comFoto ? "Foto anexada (demonstração)" : "Anexar foto (opcional)"}
        </button>

        <Button size="lg" className="h-14" disabled={!pode} onClick={confirmar}>
          Registrar perda
        </Button>
      </DialogContent>
    </Dialog>
  );
}
