"use client";

import { useMemo, useState } from "react";
import { Camera, Check, Minus, Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FotoProduto } from "@/components/shared/FotoProduto";
import { cn } from "cn";
import { ROTULO_MOTIVO_PERDA } from "@/lib/domain";
import { novoId, agoraISO } from "@/lib/id";
import { formatBRL } from "@/lib/format";
import type { CategoriaIcone } from "@/components/brand/icons";
import type {
  Insumo,
  LojaId,
  MotivoPerda,
  Perda,
  Produto,
  UsuarioId,
} from "@/types";

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
const UNIDADE_DECIMAL = new Set(["kg", "L"]);

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function RegistrarPerdaModal({
  aberto,
  onOpenChange,
  lojaId,
  usuarioId,
  produtos,
  insumos,
  iconePorCategoria,
  onRegistrar,
}: {
  aberto: boolean;
  onOpenChange: (o: boolean) => void;
  lojaId: LojaId;
  usuarioId: UsuarioId;
  produtos: Produto[];
  insumos: Insumo[];
  iconePorCategoria: Record<string, CategoriaIcone>;
  onRegistrar: (perda: Perda, custo: number) => void;
}) {
  const [alvo, setAlvo] = useState<Alvo>("produto");
  const [produtoId, setProdutoId] = useState("");
  const [insumoId, setInsumoId] = useState("");
  const [qtd, setQtd] = useState(1);
  const [motivo, setMotivo] = useState<MotivoPerda | null>(null);
  const [comFoto, setComFoto] = useState(false);
  const [busca, setBusca] = useState("");

  const produto = produtos.find((p) => p.id === produtoId);
  const insumo = insumos.find((i) => i.id === insumoId);
  const decimal = alvo === "insumo" && !!insumo && UNIDADE_DECIMAL.has(insumo.unidade);
  const passo = decimal ? 0.1 : 1;

  const custoUnit = alvo === "produto" ? (produto?.custo ?? 0) : (insumo?.custoMedio ?? 0);
  const custo = Number((custoUnit * qtd).toFixed(2));
  const temAlvo = alvo === "produto" ? !!produto : !!insumo;
  const pode = temAlvo && qtd > 0 && !!motivo;

  const q = normalizar(busca.trim());
  const produtosFiltrados = useMemo(
    () => (q ? produtos.filter((p) => normalizar(p.nome).includes(q)) : produtos),
    [produtos, q],
  );
  const insumosFiltrados = useMemo(
    () => (q ? insumos.filter((i) => normalizar(i.nome).includes(q)) : insumos),
    [insumos, q],
  );

  function limpar() {
    setAlvo("produto");
    setProdutoId("");
    setInsumoId("");
    setQtd(1);
    setMotivo(null);
    setComFoto(false);
    setBusca("");
  }

  function trocarAlvo(a: Alvo) {
    setAlvo(a);
    setBusca("");
    setQtd(a === "insumo" ? 1 : 1);
  }

  function ajustarQtd(delta: number) {
    setQtd((v) => {
      const n = Math.max(0, Number((v + delta).toFixed(2)));
      return n;
    });
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

  return (
    <Dialog
      open={aberto}
      onOpenChange={(o) => {
        if (!o) limpar();
        onOpenChange(o);
      }}
    >
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-xl">
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
              onClick={() => trocarAlvo(a)}
              className={cn(
                "h-12 rounded-[12px] border text-sm font-medium capitalize transition-colors",
                alvo === a
                  ? "border-cereja bg-acucar/60 text-cereja"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={alvo === "produto" ? "Buscar produto…" : "Buscar insumo…"}
            className="h-11 pl-9"
          />
        </div>

        {/* Seleção (scroll) */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {alvo === "produto" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {produtosFiltrados.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProdutoId(p.id)}
                  className={cn(
                    "flex items-center gap-2 overflow-hidden rounded-[12px] border p-2 text-left transition-colors",
                    produtoId === p.id
                      ? "border-cereja bg-acucar/50"
                      : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <div className="size-10 shrink-0">
                    <FotoProduto
                      src={p.foto}
                      alt={p.nome}
                      aspecto="1:1"
                      categoria={iconePorCategoria[p.categoriaId]}
                      sizes="40px"
                    />
                  </div>
                  <span className="min-w-0 flex-1 text-sm font-medium leading-tight">
                    {p.nome}
                  </span>
                </button>
              ))}
              {produtosFiltrados.length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                  Nenhum produto.
                </p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {insumosFiltrados.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => setInsumoId(i.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-2 py-2.5 text-left text-sm transition-colors",
                      insumoId === i.id
                        ? "bg-acucar/50 font-medium text-cereja"
                        : "hover:bg-muted",
                    )}
                  >
                    <span className="min-w-0 truncate">{i.nome}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {i.unidade}
                    </span>
                  </button>
                </li>
              ))}
              {insumosFiltrados.length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum insumo.
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Quantidade (stepper) + custo */}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Diminuir"
              onClick={() => ajustarQtd(-passo)}
              className="grid size-14 place-items-center rounded-[12px] border border-border bg-card hover:bg-muted"
            >
              <Minus className="size-5" />
            </button>
            <span className="w-16 text-center font-display text-2xl tnum">
              {decimal ? qtd.toFixed(1).replace(".", ",") : qtd}
            </span>
            <button
              type="button"
              aria-label="Aumentar"
              onClick={() => ajustarQtd(passo)}
              className="grid size-14 place-items-center rounded-[12px] border border-border bg-card hover:bg-muted"
            >
              <Plus className="size-5" />
            </button>
            {alvo === "insumo" && insumo && (
              <span className="text-sm text-muted-foreground">{insumo.unidade}</span>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            Custo:{" "}
            <span className="font-semibold text-foreground tnum">{formatBRL(custo)}</span>
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

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setComFoto((v) => !v)}
            className={cn(
              "flex h-14 flex-1 items-center justify-center gap-2 rounded-[12px] border text-sm font-medium transition-colors",
              comFoto
                ? "border-pistache bg-pistache/10 text-pistache"
                : "border-dashed border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {comFoto ? <Check className="size-4" /> : <Camera className="size-4" />}
            {comFoto ? "Foto anexada" : "Anexar foto"}
          </button>
          <Button
            size="lg"
            className="h-14 flex-1"
            disabled={!pode}
            onClick={confirmar}
          >
            Registrar perda
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
